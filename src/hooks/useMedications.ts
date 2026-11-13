import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { INITIAL_MEDICATIONS } from '../data/seedHealthData';
import {
  DayOfWeekCode,
  LocalPushNotificationItem,
  MedicationSchedule,
  UserMedicalProfile,
  WorkoutEntry,
  WorkoutSchedule,
} from '../types/health';
import {
  addMinutesToTimeStr,
  calculateMedicationAdherence,
} from '../utils/healthCalculations';
import {
  readStorageJson,
  setStorageItemDebounced,
  STORAGE_KEYS,
} from '../utils/storage';
import {
  saveMedicationToFirestore,
  saveWorkoutToFirestore,
  syncUserProfileToFirestore,
} from '../services/firebaseService';
import {
  getCurrentTimeHHMM,
  useScheduleNotifications,
} from './useScheduleNotifications';
import {
  cancelAlarmNotificationTag,
  stopAlarmRingtoneLoop,
  subscribeToSwAlarmActions,
} from '../services/mobileAlarmService';

interface UseMedicationsParams {
  isAuthenticated: boolean;
  profile: UserMedicalProfile;
  waterIntakeMl: number;
  cloudUser: User | null;
  currentDayCode: DayOfWeekCode;
  workoutSchedules: WorkoutSchedule[];
  setWorkoutSchedules: React.Dispatch<React.SetStateAction<WorkoutSchedule[]>>;
  setWorkouts: React.Dispatch<React.SetStateAction<WorkoutEntry[]>>;
  onUpdateWorkoutSchedule: (
    id: string,
    updates: Partial<Pick<WorkoutSchedule, 'timeSlot' | 'daysOfWeek' | 'reminderEnabled' | 'snoozedUntil'>>
  ) => void;
  onMedicationToggled?: (med: MedicationSchedule, takenCount: number, totalCount: number) => void;
}

export function useMedications({
  isAuthenticated, profile, waterIntakeMl, cloudUser, currentDayCode,
  workoutSchedules, setWorkoutSchedules, setWorkouts, onUpdateWorkoutSchedule, onMedicationToggled,
}: UseMedicationsParams) {
  const [medications, setMedications] = useState<MedicationSchedule[]>(() =>
    readStorageJson<MedicationSchedule[]>(STORAGE_KEYS.MEDS, INITIAL_MEDICATIONS)
  );

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.MEDS, medications);
  }, [medications]);

  const medAdherence = calculateMedicationAdherence(medications);
  const {
    notificationSettings, setNotificationSettings, notifiedSignaturesToday, setNotifiedSignaturesToday,
    notificationHistory, setNotificationHistory, notifEval, workoutNotifEval, activePushNotifications,
    handleRequestBrowserNotificationPermission, handleTriggerTestPush, handleTriggerTestWorkoutPush,
  } = useScheduleNotifications({ isAuthenticated, profile, medications, workoutSchedules, currentDayCode });

  const handleToggleMedication = (id: string) => {
    const timeStr = getCurrentTimeHHMM();
    stopAlarmRingtoneLoop();
    void cancelAlarmNotificationTag(`vitapulse-med-${id}`);
    const target = medications.find((m) => m.id === id);
    if (!target) return;
    const nextTaken = !target.takenToday;
    const updatedMed: MedicationSchedule = {
      ...target,
      takenToday: nextTaken,
      takenAt: nextTaken ? timeStr : undefined,
      snoozedUntil: nextTaken ? undefined : target.snoozedUntil,
      remainingPills: nextTaken ? Math.max(0, target.remainingPills - 1) : target.remainingPills + 1,
    };
    const nextMeds = medications.map((m) => (m.id === id ? updatedMed : m));
    setMedications(nextMeds);
    if (cloudUser) {
      syncUserProfileToFirestore(cloudUser.uid, profile, waterIntakeMl)
        .then(() => saveMedicationToFirestore(cloudUser.uid, updatedMed))
        .catch(() => {});
    }
    const takenCount = nextMeds.filter((m) => m.takenToday).length;
    onMedicationToggled?.(updatedMed, takenCount, nextMeds.length);
    setNotificationHistory((prev) =>
      prev.map((item) =>
        item.medicationId === id && item.status === 'active' ? { ...item, status: 'confirmed' } : item
      )
    );
  };

  const handleAddMedication = (medData: Omit<MedicationSchedule, 'id'>) => {
    const newMed: MedicationSchedule = { ...medData, id: `med_${Date.now()}` };
    setMedications((prev) => [...prev, newMed]);
    if (cloudUser) {
      syncUserProfileToFirestore(cloudUser.uid, profile, waterIntakeMl)
        .then(() => saveMedicationToFirestore(cloudUser.uid, newMed))
        .catch(() => {});
    }
  };

  const handleAddMultipleMedications = (medsList: Array<Omit<MedicationSchedule, 'id'>>) => {
    const created: MedicationSchedule[] = medsList.map((m, idx) => ({
      ...m,
      id: `med_ai_${Date.now()}_${idx}`,
    }));
    setMedications((prev) => [...created, ...prev]);
    if (cloudUser) {
      syncUserProfileToFirestore(cloudUser.uid, profile, waterIntakeMl)
        .then(() => Promise.all(created.map((item) => saveMedicationToFirestore(cloudUser.uid, item))))
        .catch(() => {});
    }
  };

  const handleUpdateMedicationReminder = (
    id: string,
    updates: Partial<Pick<MedicationSchedule, 'timeSlot' | 'reminderEnabled' | 'snoozedUntil'>>
  ) => {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...updates };
        if (cloudUser) saveMedicationToFirestore(cloudUser.uid, updated).catch(() => {});
        return updated;
      })
    );
  };

  const handleToggleWorkoutScheduleComplete = (id: string) => {
    const timeStr = getCurrentTimeHHMM();
    stopAlarmRingtoneLoop();
    void cancelAlarmNotificationTag(`vitapulse-workout-${id}`);
    const target = workoutSchedules.find((s) => s.id === id);
    if (!target) return;
    const nextCompleted = !target.completedToday;
    setWorkoutSchedules((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              completedToday: nextCompleted,
              completedAt: nextCompleted ? timeStr : undefined,
              snoozedUntil: nextCompleted ? undefined : s.snoozedUntil,
            }
          : s
      )
    );
    if (nextCompleted) {
      const loggedWorkout: WorkoutEntry = {
        id: `work_sched_${id}_${Date.now()}`,
        date: '2026-11-10',
        time: timeStr,
        activityName: target.activityName,
        category: target.category,
        durationMinutes: target.durationMinutes,
        caloriesBurned: target.targetCalories,
        avgHeartRate: target.intensityLabel === 'Nhẹ nhàng' ? 96 : 118,
      };
      setWorkouts((prev) => [loggedWorkout, ...prev]);
      if (cloudUser) saveWorkoutToFirestore(cloudUser.uid, loggedWorkout).catch(() => {});
    }
    setNotificationHistory((prev) =>
      prev.map((item) =>
        (item.workoutScheduleId === id || item.medicationId === id) && item.status === 'active'
          ? { ...item, status: 'confirmed' }
          : item
      )
    );
  };

  const handleConfirmPushNotification = (item: LocalPushNotificationItem) => {
    stopAlarmRingtoneLoop();
    const tag =
      item.kind === 'workout'
        ? `vitapulse-workout-${item.workoutScheduleId || item.medicationId}`
        : `vitapulse-med-${item.medicationId}`;
    void cancelAlarmNotificationTag(tag);

    if (item.kind === 'workout') {
      const schedId = item.workoutScheduleId || item.medicationId;
      const target = workoutSchedules.find((s) => s.id === schedId);
      if (target && !target.completedToday) handleToggleWorkoutScheduleComplete(schedId);
    } else {
      const med = medications.find((m) => m.id === item.medicationId);
      if (med && !med.takenToday) handleToggleMedication(med.id);
    }
    setNotificationHistory((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, status: 'confirmed' } : n))
    );
  };

  const handleSnoozePushNotification = (item: LocalPushNotificationItem) => {
    stopAlarmRingtoneLoop();
    const tag =
      item.kind === 'workout'
        ? `vitapulse-workout-${item.workoutScheduleId || item.medicationId}`
        : `vitapulse-med-${item.medicationId}`;
    void cancelAlarmNotificationTag(tag);

    const snoozeUntilStr = addMinutesToTimeStr(
      getCurrentTimeHHMM(),
      notificationSettings.snoozeMinutes
    );
    if (item.kind === 'workout') {
      onUpdateWorkoutSchedule(item.workoutScheduleId || item.medicationId, {
        snoozedUntil: snoozeUntilStr,
      });
    } else {
      handleUpdateMedicationReminder(item.medicationId, { snoozedUntil: snoozeUntilStr });
    }
    setNotificationHistory((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, status: 'snoozed' } : n))
    );
  };

  const handleDismissPushNotification = (notificationId: string) => {
    stopAlarmRingtoneLoop();
    setNotificationHistory((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, status: 'dismissed' } : n))
    );
  };

  useEffect(() => {
    return subscribeToSwAlarmActions((msg) => {
      stopAlarmRingtoneLoop();
      const targetItem = msg.payload as LocalPushNotificationItem;
      if (!targetItem || !targetItem.medicationId) return;
      if (msg.action === 'confirm') {
        handleConfirmPushNotification(targetItem);
      } else if (msg.action === 'snooze') {
        handleSnoozePushNotification(targetItem);
      } else if (msg.action === 'dismiss' && targetItem.id) {
        handleDismissPushNotification(targetItem.id);
      }
    });
  });

  return {
    medications,
    setMedications,
    notificationSettings,
    setNotificationSettings,
    notifiedSignaturesToday,
    setNotifiedSignaturesToday,
    notificationHistory,
    setNotificationHistory,
    medAdherence,
    notifEval,
    workoutNotifEval,
    activePushNotifications,
    handleToggleMedication,
    handleAddMedication,
    handleAddMultipleMedications,
    handleUpdateMedicationReminder,
    handleRequestBrowserNotificationPermission,
    handleTriggerTestPush,
    handleTriggerTestWorkoutPush,
    handleToggleWorkoutScheduleComplete,
    handleConfirmPushNotification,
    handleSnoozePushNotification,
    handleDismissPushNotification,
  };
}

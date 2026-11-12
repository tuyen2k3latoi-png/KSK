import React, { useEffect, useState } from 'react';
import {
  DayOfWeekCode,
  LocalPushNotificationItem,
  MedicationNotificationSettings,
  MedicationSchedule,
  UserMedicalProfile,
  WorkoutSchedule,
} from '../types/health';
import {
  buildMedicationPushPayload,
  buildWorkoutPushPayload,
  evaluateMedicationScheduleNotifications,
  evaluateWorkoutScheduleNotifications,
  formatRecurringDaysLabel,
} from '../utils/healthCalculations';
import {
  readStorageJson,
  setStorageItemDebounced,
  STORAGE_KEYS,
} from '../utils/storage';
import {
  dispatchBrowserLocalNotification,
  playMedicationReminderChime,
} from '../components/MedicationPushBanner';

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

interface UseScheduleNotificationsParams {
  isAuthenticated: boolean;
  profile: UserMedicalProfile;
  medications: MedicationSchedule[];
  workoutSchedules: WorkoutSchedule[];
  currentDayCode: DayOfWeekCode;
}

export function useScheduleNotifications({
  isAuthenticated,
  profile,
  medications,
  workoutSchedules,
  currentDayCode,
}: UseScheduleNotificationsParams) {
  const [notificationSettings, setNotificationSettings] =
    useState<MedicationNotificationSettings>(() => {
      const browserPerm: MedicationNotificationSettings['browserPermission'] =
        typeof window !== 'undefined' && 'Notification' in window
          ? (Notification.permission as 'default' | 'granted' | 'denied')
          : 'unsupported';
      const saved = readStorageJson<MedicationNotificationSettings | null>(
        STORAGE_KEYS.NOTIF_SETTINGS,
        null
      );
      if (saved) return { ...saved, browserPermission: browserPerm };
      return {
        enabled: true,
        soundEnabled: true,
        leadMinutes: 5,
        snoozeMinutes: 10,
        browserPermission: browserPerm,
      };
    });

  const [notifiedSignaturesToday, setNotifiedSignaturesToday] = useState<string[]>(() =>
    readStorageJson<string[]>(STORAGE_KEYS.NOTIF_SIGS, [])
  );

  const [notificationHistory, setNotificationHistory] = useState<LocalPushNotificationItem[]>(() =>
    readStorageJson<LocalPushNotificationItem[]>(STORAGE_KEYS.NOTIF_HISTORY, [])
  );

  const [currentTimeStr, setCurrentTimeStr] = useState<string>(getCurrentTimeHHMM);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.NOTIF_SETTINGS, notificationSettings);
  }, [notificationSettings]);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.NOTIF_SIGS, notifiedSignaturesToday);
  }, [notifiedSignaturesToday]);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.NOTIF_HISTORY, notificationHistory);
  }, [notificationHistory]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTimeStr(getCurrentTimeHHMM());
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const notifEval = evaluateMedicationScheduleNotifications({
    medications,
    currentTimeStr,
    leadMinutes: notificationSettings.leadMinutes,
    notifiedSignaturesToday,
  });

  const workoutNotifEval = evaluateWorkoutScheduleNotifications({
    schedules: workoutSchedules,
    currentDayCode,
    currentTimeStr,
    leadMinutes: notificationSettings.leadMinutes,
    notifiedSignaturesToday,
  });

  const activePushNotifications = notificationHistory.filter((n) => n.status === 'active');

  const emitLocalPushItem = (item: LocalPushNotificationItem) => {
    if (notificationSettings.soundEnabled) playMedicationReminderChime();
    dispatchBrowserLocalNotification(item);
    setNotificationHistory((prev) => [item, ...prev.filter((p) => p.status !== 'active')].slice(0, 20));
  };

  useEffect(() => {
    if (!isAuthenticated || !notificationSettings.enabled) return;
    if (
      notifEval.dueNowMedications.length === 0 &&
      workoutNotifEval.dueNowWorkouts.length === 0
    ) {
      return;
    }

    const newSigs: string[] = [];
    const newItems: LocalPushNotificationItem[] = [];

    for (const med of notifEval.dueNowMedications) {
      const sig = med.snoozedUntil ? `${med.id}@snooze-${med.snoozedUntil}` : `${med.id}@${med.timeSlot}`;
      newSigs.push(sig);
      const payload = buildMedicationPushPayload(med, profile.fullName, currentTimeStr);
      const item: LocalPushNotificationItem = {
        id: `push_${med.id}_${Date.now()}`,
        kind: 'medication',
        medicationId: med.id,
        medicationName: med.medicationName,
        dosage: med.dosage,
        timeSlot: med.timeSlot,
        mealInstruction: med.mealInstruction,
        purpose: med.purpose,
        title: payload.title,
        body: payload.body,
        triggeredAt: currentTimeStr,
        isTest: false,
        status: 'active',
      };
      newItems.push(item);
      dispatchBrowserLocalNotification(item);
    }

    for (const sched of workoutNotifEval.dueNowWorkouts) {
      const sig = sched.snoozedUntil
        ? `workout-${sched.id}@snooze-${sched.snoozedUntil}`
        : `workout-${sched.id}@${sched.timeSlot}`;
      newSigs.push(sig);
      const payload = buildWorkoutPushPayload(sched, profile.fullName, currentTimeStr);
      const item: LocalPushNotificationItem = {
        id: `push_workout_${sched.id}_${Date.now()}`,
        kind: 'workout',
        medicationId: sched.id,
        workoutScheduleId: sched.id,
        medicationName: sched.activityName,
        dosage: `${sched.durationMinutes} phút`,
        timeSlot: sched.timeSlot,
        mealInstruction: `${sched.category} · ${formatRecurringDaysLabel(sched.daysOfWeek)}`,
        purpose: `Cường độ ${sched.intensityLabel} · Tiêu hao ~${sched.targetCalories} kcal`,
        activityCategory: sched.category,
        durationMinutes: sched.durationMinutes,
        targetCalories: sched.targetCalories,
        title: payload.title,
        body: payload.body,
        triggeredAt: currentTimeStr,
        isTest: false,
        status: 'active',
      };
      newItems.push(item);
      dispatchBrowserLocalNotification(item);
    }

    if (newItems.length > 0) {
      if (notificationSettings.soundEnabled) playMedicationReminderChime();
      setNotifiedSignaturesToday((prev) => Array.from(new Set([...prev, ...newSigs])));
      setNotificationHistory((prev) => [...newItems, ...prev].slice(0, 20));
    }
  }, [
    isAuthenticated,
    notificationSettings.enabled,
    notificationSettings.soundEnabled,
    notifEval.dueNowMedications,
    workoutNotifEval.dueNowWorkouts,
    currentTimeStr,
    profile.fullName,
  ]);

  const handleRequestBrowserNotificationPermission = async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setNotificationSettings((prev) => ({ ...prev, browserPermission: 'unsupported' }));
        return;
      }
      const perm = await Notification.requestPermission();
      setNotificationSettings((prev) => ({
        ...prev,
        browserPermission: perm as 'default' | 'granted' | 'denied',
      }));
    } catch {
      // Ignore permission errors
    }
  };

  const handleTriggerTestPush = (targetMed?: MedicationSchedule) => {
    const chosen =
      targetMed || notifEval.nextDose?.medication || medications.find((m) => !m.takenToday) || medications[0];
    if (!chosen) return;
    const nowStr = getCurrentTimeHHMM();
    const payload = buildMedicationPushPayload(chosen, profile.fullName, nowStr);
    emitLocalPushItem({
      id: `push_test_${chosen.id}_${Date.now()}`,
      medicationId: chosen.id,
      medicationName: chosen.medicationName,
      dosage: chosen.dosage,
      timeSlot: chosen.timeSlot,
      mealInstruction: chosen.mealInstruction,
      purpose: chosen.purpose,
      title: payload.title,
      body: payload.body,
      triggeredAt: nowStr,
      isTest: true,
      status: 'active',
    });
  };

  const handleTriggerTestWorkoutPush = (targetSchedule?: WorkoutSchedule) => {
    const chosen =
      targetSchedule ||
      workoutNotifEval.nextWorkout?.schedule ||
      workoutSchedules.find((s) => !s.completedToday) ||
      workoutSchedules[0];
    if (!chosen) return;
    const nowStr = getCurrentTimeHHMM();
    const payload = buildWorkoutPushPayload(chosen, profile.fullName, nowStr);
    emitLocalPushItem({
      id: `push_test_workout_${chosen.id}_${Date.now()}`,
      kind: 'workout',
      medicationId: chosen.id,
      workoutScheduleId: chosen.id,
      medicationName: chosen.activityName,
      dosage: `${chosen.durationMinutes} phút`,
      timeSlot: chosen.timeSlot,
      mealInstruction: `${chosen.category} · ${formatRecurringDaysLabel(chosen.daysOfWeek)}`,
      purpose: `Cường độ ${chosen.intensityLabel} · Tiêu hao ~${chosen.targetCalories} kcal`,
      activityCategory: chosen.category,
      durationMinutes: chosen.durationMinutes,
      targetCalories: chosen.targetCalories,
      title: payload.title,
      body: payload.body,
      triggeredAt: nowStr,
      isTest: true,
      status: 'active',
    });
  };

  return {
    notificationSettings,
    setNotificationSettings,
    notifiedSignaturesToday,
    setNotifiedSignaturesToday,
    notificationHistory,
    setNotificationHistory,
    notifEval,
    workoutNotifEval,
    activePushNotifications,
    handleRequestBrowserNotificationPermission,
    handleTriggerTestPush,
    handleTriggerTestWorkoutPush,
  };
}

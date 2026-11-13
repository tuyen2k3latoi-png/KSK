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
  evaluateMedicationScheduleNotifications,
  evaluateWorkoutScheduleNotifications,
} from '../utils/healthCalculations';
import {
  readStorageJson,
  setStorageItemDebounced,
  STORAGE_KEYS,
} from '../utils/storage';
import {
  buildScheduledAlarmDescriptors,
  createMedicationNotificationItem,
  createWorkoutNotificationItem,
  dispatchPhoneAlarmNotification,
  getMobileNotificationCapabilities,
  requestPhoneNotificationPermission,
  startAlarmRingtoneLoop,
  stopAlarmRingtoneLoop,
  syncAlarmsWithServiceWorker,
  unlockAlarmAudio,
} from '../services/mobileAlarmService';

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
  const [notificationSettings, setNotificationSettingsState] =
    useState<MedicationNotificationSettings>(() => {
      const caps = getMobileNotificationCapabilities();
      const saved = readStorageJson<MedicationNotificationSettings | null>(
        STORAGE_KEYS.NOTIF_SETTINGS,
        null
      );
      if (saved) return { ...saved, browserPermission: caps.permission };
      return {
        enabled: true,
        soundEnabled: true,
        leadMinutes: 5,
        snoozeMinutes: 10,
        browserPermission: caps.permission,
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
    const timer = window.setInterval(() => setCurrentTimeStr(getCurrentTimeHHMM()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    syncAlarmsWithServiceWorker(
      buildScheduledAlarmDescriptors({
        medications,
        workoutSchedules,
        currentDayCode,
        settings: notificationSettings,
        fullName: profile.fullName,
      })
    );
  }, [
    isAuthenticated,
    medications,
    workoutSchedules,
    currentDayCode,
    notificationSettings,
    profile.fullName,
  ]);

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

  useEffect(() => {
    if (activePushNotifications.length === 0) stopAlarmRingtoneLoop();
  }, [activePushNotifications.length]);

  const setNotificationSettings: React.Dispatch<
    React.SetStateAction<MedicationNotificationSettings>
  > = (valueOrUpdater) => {
    setNotificationSettingsState((prev) => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      if (next.enabled || next.soundEnabled) void unlockAlarmAudio();
      if (!prev.enabled && next.enabled && next.browserPermission === 'default') {
        requestPhoneNotificationPermission().then((perm) => {
          setNotificationSettingsState((curr) => ({ ...curr, browserPermission: perm }));
        });
      }
      return next;
    });
  };

  const emitLocalPushItem = async (item: LocalPushNotificationItem) => {
    await unlockAlarmAudio();
    if (notificationSettings.browserPermission === 'default') {
      const perm = await requestPhoneNotificationPermission();
      setNotificationSettingsState((prev) => ({ ...prev, browserPermission: perm }));
    }
    startAlarmRingtoneLoop(notificationSettings.soundEnabled);
    dispatchPhoneAlarmNotification(
      item,
      notificationSettings.snoozeMinutes,
      notificationSettings.soundEnabled
    );
    setNotificationHistory((prev) =>
      [item, ...prev.filter((p) => p.status !== 'active')].slice(0, 20)
    );
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
      newSigs.push(med.snoozedUntil ? `${med.id}@snooze-${med.snoozedUntil}` : `${med.id}@${med.timeSlot}`);
      const item = createMedicationNotificationItem({
        med,
        fullName: profile.fullName,
        timeStr: currentTimeStr,
        isTest: false,
      });
      newItems.push(item);
      dispatchPhoneAlarmNotification(item, notificationSettings.snoozeMinutes, notificationSettings.soundEnabled);
    }

    for (const sched of workoutNotifEval.dueNowWorkouts) {
      newSigs.push(
        sched.snoozedUntil ? `workout-${sched.id}@snooze-${sched.snoozedUntil}` : `workout-${sched.id}@${sched.timeSlot}`
      );
      const item = createWorkoutNotificationItem({
        sched,
        fullName: profile.fullName,
        timeStr: currentTimeStr,
        isTest: false,
      });
      newItems.push(item);
      dispatchPhoneAlarmNotification(item, notificationSettings.snoozeMinutes, notificationSettings.soundEnabled);
    }

    if (newItems.length > 0) {
      startAlarmRingtoneLoop(notificationSettings.soundEnabled);
      setNotifiedSignaturesToday((prev) => Array.from(new Set([...prev, ...newSigs])));
      setNotificationHistory((prev) => [...newItems, ...prev].slice(0, 20));
    }
  }, [
    isAuthenticated,
    notificationSettings.enabled,
    notificationSettings.soundEnabled,
    notificationSettings.snoozeMinutes,
    notifEval.dueNowMedications,
    workoutNotifEval.dueNowWorkouts,
    currentTimeStr,
    profile.fullName,
  ]);

  const handleRequestBrowserNotificationPermission = async () => {
    const perm = await requestPhoneNotificationPermission();
    setNotificationSettingsState((prev) => ({
      ...prev,
      enabled: perm === 'granted' ? true : prev.enabled,
      browserPermission: perm,
    }));
  };

  const handleTriggerTestPush = (targetMed?: MedicationSchedule) => {
    const chosen =
      targetMed || notifEval.nextDose?.medication || medications.find((m) => !m.takenToday) || medications[0];
    if (!chosen) return;
    void emitLocalPushItem(
      createMedicationNotificationItem({
        med: chosen,
        fullName: profile.fullName,
        timeStr: getCurrentTimeHHMM(),
        isTest: true,
      })
    );
  };

  const handleTriggerTestWorkoutPush = (targetSchedule?: WorkoutSchedule) => {
    const chosen =
      targetSchedule ||
      workoutNotifEval.nextWorkout?.schedule ||
      workoutSchedules.find((s) => !s.completedToday) ||
      workoutSchedules[0];
    if (!chosen) return;
    void emitLocalPushItem(
      createWorkoutNotificationItem({
        sched: chosen,
        fullName: profile.fullName,
        timeStr: getCurrentTimeHHMM(),
        isTest: true,
      })
    );
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

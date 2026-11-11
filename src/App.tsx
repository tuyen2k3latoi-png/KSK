/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  CITIZEN_VNEID_ACCOUNTS,
  INITIAL_BHYT_VISITS,
  INITIAL_MEAL_ENTRIES,
  INITIAL_MEDICAL_PROFILE,
  INITIAL_MEDICATIONS,
  INITIAL_VITAL_RECORDS,
  INITIAL_WORKOUT_ENTRIES,
  INITIAL_WORKOUT_SCHEDULES,
} from './data/seedHealthData';
import {
  BhytVisitRecord,
  CitizenHealthAccount,
  LocalPushNotificationItem,
  MealEntry,
  MedicationNotificationSettings,
  MedicationSchedule,
  UserMedicalProfile,
  VitalRecord,
  WorkoutEntry,
  WorkoutSchedule,
} from './types/health';
import {
  addMinutesToTimeStr,
  buildMedicationPushPayload,
  buildWorkoutPushPayload,
  calculateBMI,
  calculateDailyCalorieSummary,
  calculateHealthScore,
  calculateMedicationAdherence,
  calculateWorkoutScheduleAdherence,
  classifyBMI,
  classifyBloodGlucose,
  classifyBloodPressure,
  evaluateHeartRate,
  evaluateMedicationScheduleNotifications,
  evaluateWorkoutScheduleNotifications,
  formatRecurringDaysLabel,
  getVietnameseDayCode,
  maskSensitiveIdentifier,
  PriorityMetricCardId,
  resolvePriorityDashboardConfig,
} from './utils/healthCalculations';
import {
  clearAllAppStorage,
  FontSizeMode,
  PrivacyConsentRecord,
  readStorageJson,
  readStorageString,
  setStorageItemDebounced,
  STORAGE_KEYS,
  writeStorageIfChanged,
} from './utils/storage';
import { VitalsBarChartPanel } from './components/VitalsBarChartPanel';
import { LogVitalModal } from './components/LogVitalModal';
import { NutritionActivityView } from './components/NutritionActivityView';
import { MedicationCareView } from './components/MedicationCareView';
import { ClinicalAnalyticsView } from './components/ClinicalAnalyticsView';
import { UserGuideView } from './components/UserGuideView';
import { ConnectedEcosystemPanel } from './components/ConnectedEcosystemPanel';
import { VneidBhytPanel } from './components/VneidBhytPanel';
import { VneidWelcomeLoginScreen } from './components/VneidWelcomeLoginScreen';
import {
  dispatchBrowserLocalNotification,
  MedicationPushBanner,
  playMedicationReminderChime,
} from './components/MedicationPushBanner';
import {
  OfflineIndicator,
  PWAInstallBanner,
  PWAInstallButton,
} from './components/PWAInstallButton';
import { PlayStoreComplianceModal } from './components/PlayStoreComplianceModal';
import { User } from 'firebase/auth';
import {
  deleteAllUserDataFromFirestore,
  deleteVitalFromFirestore,
  initAuth,
  saveMealToFirestore,
  saveMedicationToFirestore,
  saveVitalToFirestore,
  saveWorkoutToFirestore,
  subscribeToUserHealthCloud,
  syncFullHealthDatasetToFirestore,
  syncUserProfileToFirestore,
} from './services/firebaseService';
import {
  Activity,
  AlertTriangle,
  BellRing,
  Bluetooth,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Droplets,
  Dumbbell,
  Eye,
  EyeOff,
  FileHeart,
  FileSpreadsheet,
  Footprints,
  Heart,
  Info,
  Lock,
  LogOut,
  Moon,
  PhoneCall,
  Pill,
  Scale,
  ShieldCheck,
  Thermometer,
  Type,
  UserCog,
  Utensils,
} from 'lucide-react';

type ActiveModule = 'dashboard' | 'nutrition' | 'medications' | 'records' | 'guide';
type RecordsSubTab = 'bhyt' | 'history' | 'devices';

function getCurrentTimeHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function App() {
  // Entry Login Gate: shows the dedicated outer login screen first,
  // and hides it completely once the user logs in (also supports ?autostart=1).
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search.includes('autostart=1')) {
        return true;
      }
      return sessionStorage.getItem(STORAGE_KEYS.AUTH_STATE) === 'true';
    } catch {
      return false;
    }
  });

  // First-time Health Data Processing Consent under Nghị định 13/2023/NĐ-CP
  const [nd13Consent, setNd13Consent] = useState<PrivacyConsentRecord | null>(() =>
    readStorageJson<PrivacyConsentRecord | null>(STORAGE_KEYS.PRIVACY_CONSENT, null)
  );

  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [recordsSubTab, setRecordsSubTab] = useState<RecordsSubTab>('bhyt');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [showHeaderBhytFull, setShowHeaderBhytFull] = useState(false);
  const [showScoreInfoPopover, setShowScoreInfoPopover] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [fontSizeMode, setFontSizeMode] = useState<FontSizeMode>(() => {
    const saved = readStorageString(STORAGE_KEYS.FONT_SIZE_MODE, 'normal');
    return saved === 'large' || saved === 'xlarge' ? saved : 'normal';
  });
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [hasCalendarToken, setHasCalendarToken] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(getCurrentTimeHHMM);

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
      if (saved) {
        return { ...saved, browserPermission: browserPerm };
      }
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

  const [currentAccountId, setCurrentAccountId] = useState<string>(() =>
    readStorageString(STORAGE_KEYS.ACCOUNT_ID, 'citizen-nguyen-minh-quan')
  );

  const [bhytVisits, setBhytVisits] = useState<BhytVisitRecord[]>(() =>
    readStorageJson<BhytVisitRecord[]>(STORAGE_KEYS.BHYT_VISITS, INITIAL_BHYT_VISITS)
  );

  const [profile, setProfile] = useState<UserMedicalProfile>(() =>
    readStorageJson<UserMedicalProfile>(STORAGE_KEYS.PROFILE, INITIAL_MEDICAL_PROFILE)
  );

  const [vitals, setVitals] = useState<VitalRecord[]>(() =>
    readStorageJson<VitalRecord[]>(STORAGE_KEYS.VITALS, INITIAL_VITAL_RECORDS)
  );

  const [meals, setMeals] = useState<MealEntry[]>(() =>
    readStorageJson<MealEntry[]>(STORAGE_KEYS.MEALS, INITIAL_MEAL_ENTRIES)
  );

  const [workouts, setWorkouts] = useState<WorkoutEntry[]>(() =>
    readStorageJson<WorkoutEntry[]>(STORAGE_KEYS.WORKOUTS, INITIAL_WORKOUT_ENTRIES)
  );

  const [workoutSchedules, setWorkoutSchedules] = useState<WorkoutSchedule[]>(() =>
    readStorageJson<WorkoutSchedule[]>(
      STORAGE_KEYS.WORKOUT_SCHEDULES,
      INITIAL_WORKOUT_SCHEDULES
    )
  );

  const [medications, setMedications] = useState<MedicationSchedule[]>(() =>
    readStorageJson<MedicationSchedule[]>(STORAGE_KEYS.MEDS, INITIAL_MEDICATIONS)
  );

  const [waterIntakeMl, setWaterIntakeMl] = useState<number>(() => {
    const saved = readStorageString(STORAGE_KEYS.WATER, '');
    return saved !== '' ? Number(saved) : 1750;
  });

  // Granular debounced storage writes: only writes the specific key that changed
  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.ACCOUNT_ID, currentAccountId);
  }, [currentAccountId]);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.PROFILE, profile);
  }, [profile]);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.BHYT_VISITS, bhytVisits);
  }, [bhytVisits]);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.VITALS, vitals);
  }, [vitals]);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.MEALS, meals);
  }, [meals]);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.WORKOUTS, workouts);
  }, [workouts]);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.WORKOUT_SCHEDULES, workoutSchedules);
  }, [workoutSchedules]);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.MEDS, medications);
  }, [medications]);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.WATER, String(waterIntakeMl));
  }, [waterIntakeMl]);

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
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-font-scale', fontSizeMode);
    }
    setStorageItemDebounced(STORAGE_KEYS.FONT_SIZE_MODE, fontSizeMode);
  }, [fontSizeMode]);

  // Initialize Firebase Auth & Real-time Firestore Cloud Listener
  useEffect(() => {
    const unsubAuth = initAuth((user, hasToken) => {
      setCloudUser(user);
      setHasCalendarToken(hasToken);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!cloudUser) return;
    const unsubCloud = subscribeToUserHealthCloud(cloudUser.uid, {
      onVitals: (cloudVitals) => {
        if (cloudVitals.length > 0) setVitals(cloudVitals);
      },
      onMeals: (cloudMeals) => {
        if (cloudMeals.length > 0) setMeals(cloudMeals);
      },
      onMedications: (cloudMeds) => {
        if (cloudMeds.length > 0) setMedications(cloudMeds);
      },
      onWaterIntake: (waterMl) => {
        setWaterIntakeMl(waterMl);
      },
    });
    return () => unsubCloud();
  }, [cloudUser]);

  const latestVital: VitalRecord = vitals[0] || INITIAL_VITAL_RECORDS[0];
  const bmi = calculateBMI(latestVital.weightKg, profile.heightCm);
  const bmiEval = classifyBMI(bmi);
  const bpEval = classifyBloodPressure(latestVital.systolic, latestVital.diastolic);
  const gluEval = classifyBloodGlucose(latestVital.bloodGlucose, latestVital.glucoseContext);
  const hrEval = evaluateHeartRate(latestVital.heartRate);
  const medAdherence = calculateMedicationAdherence(medications);
  const healthScore = calculateHealthScore(latestVital, bmi, medAdherence.adherencePercent);
  const calorieSummary = calculateDailyCalorieSummary(meals, workouts, profile.dailyCalorieGoal);
  const priorityDashboardConfig = resolvePriorityDashboardConfig(
    profile.chronicConditions,
    bhytVisits
  );

  const currentDayCode = getVietnameseDayCode();
  const workoutSchedAdherence = calculateWorkoutScheduleAdherence(workoutSchedules, currentDayCode);

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

  // Background clock ticker (every 15 seconds) to check medication & workout schedules
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTimeStr(getCurrentTimeHHMM());
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  // Automatically dispatch local push notifications when a scheduled medication OR workout is due
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
      const sig = med.snoozedUntil
        ? `${med.id}@snooze-${med.snoozedUntil}`
        : `${med.id}@${med.timeSlot}`;
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
      if (notificationSettings.soundEnabled) {
        playMedicationReminderChime();
      }
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

  // Handlers
  const handleLoginWithAccount = (account: CitizenHealthAccount) => {
    setCurrentAccountId(account.accountId);
    setProfile(account.profile);
    setBhytVisits(account.bhytVisits);
    setVitals(account.vitals);
    setMeals(account.meals);
    setWorkouts(account.workouts);
    setWorkoutSchedules(account.workoutSchedules || INITIAL_WORKOUT_SCHEDULES);
    setMedications(account.medications);
    setWaterIntakeMl(account.waterIntakeMl);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'true');
    } catch {
      // Ignore
    }

    if (cloudUser) {
      syncFullHealthDatasetToFirestore({
        userId: cloudUser.uid,
        profile: account.profile,
        waterIntakeMl: account.waterIntakeMl,
        vitals: account.vitals,
        meals: account.meals,
        workouts: account.workouts,
        medications: account.medications,
      }).catch(() => {});
    }
  };

  const handleLogoutToWelcomeScreen = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    } catch {
      // Ignore
    }
  };

  const handleAddVitalRecord = (newRecordData: Omit<VitalRecord, 'id'>) => {
    const newRecord: VitalRecord = {
      ...newRecordData,
      id: `vital_${Date.now()}`,
    };
    const updatedProfile = { ...profile, weightKg: newRecord.weightKg };
    setVitals((prev) => [newRecord, ...prev]);
    setProfile(updatedProfile);
    if (cloudUser) {
      syncUserProfileToFirestore(cloudUser.uid, updatedProfile, waterIntakeMl)
        .then(() => saveVitalToFirestore(cloudUser.uid, newRecord))
        .catch(() => {});
    }
  };

  const handleDeleteVitalRecord = (id: string) => {
    setVitals((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
    if (cloudUser) {
      deleteVitalFromFirestore(cloudUser.uid, id).catch(() => {});
    }
  };

  const handleAddWater = (amountMl: number) => {
    setWaterIntakeMl((prev) => {
      const next = Math.min(5000, prev + amountMl);
      if (cloudUser) {
        syncUserProfileToFirestore(cloudUser.uid, profile, next).catch(() => {});
      }
      return next;
    });
  };

  const handleResetWater = () => {
    setWaterIntakeMl(0);
    if (cloudUser) {
      syncUserProfileToFirestore(cloudUser.uid, profile, 0).catch(() => {});
    }
  };

  const handleAddMeal = (mealData: Omit<MealEntry, 'id'>) => {
    const newMeal: MealEntry = { ...mealData, id: `meal_${Date.now()}` };
    setMeals((prev) => [newMeal, ...prev]);
    if (cloudUser) {
      syncUserProfileToFirestore(cloudUser.uid, profile, waterIntakeMl)
        .then(() => saveMealToFirestore(cloudUser.uid, newMeal))
        .catch(() => {});
    }
  };

  const handleDeleteMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddWorkout = (workoutData: Omit<WorkoutEntry, 'id'>) => {
    const newWorkout: WorkoutEntry = { ...workoutData, id: `work_${Date.now()}` };
    setWorkouts((prev) => [newWorkout, ...prev]);
    if (cloudUser) {
      syncUserProfileToFirestore(cloudUser.uid, profile, waterIntakeMl)
        .then(() => saveWorkoutToFirestore(cloudUser.uid, newWorkout))
        .catch(() => {});
    }
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const handleToggleMedication = (id: string) => {
    const timeStr = getCurrentTimeHHMM();
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const nextTaken = !m.takenToday;
        const updatedMed: MedicationSchedule = {
          ...m,
          takenToday: nextTaken,
          takenAt: nextTaken ? timeStr : undefined,
          snoozedUntil: nextTaken ? undefined : m.snoozedUntil,
          remainingPills: nextTaken
            ? Math.max(0, m.remainingPills - 1)
            : m.remainingPills + 1,
        };
        if (cloudUser) {
          syncUserProfileToFirestore(cloudUser.uid, profile, waterIntakeMl)
            .then(() => saveMedicationToFirestore(cloudUser.uid, updatedMed))
            .catch(() => {});
        }
        return updatedMed;
      })
    );
    setNotificationHistory((prev) =>
      prev.map((item) =>
        item.medicationId === id && item.status === 'active'
          ? { ...item, status: 'confirmed' }
          : item
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

  const handleUpdateMedicationReminder = (
    id: string,
    updates: Partial<Pick<MedicationSchedule, 'timeSlot' | 'reminderEnabled' | 'snoozedUntil'>>
  ) => {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...updates };
        if (cloudUser) {
          saveMedicationToFirestore(cloudUser.uid, updated).catch(() => {});
        }
        return updated;
      })
    );
  };

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
      // Ignore permission errors in iframe environments
    }
  };

  const handleTriggerTestPush = (targetMed?: MedicationSchedule) => {
    const chosen =
      targetMed ||
      notifEval.nextDose?.medication ||
      medications.find((m) => !m.takenToday) ||
      medications[0];
    if (!chosen) return;

    const nowStr = getCurrentTimeHHMM();
    const payload = buildMedicationPushPayload(chosen, profile.fullName, nowStr);
    const item: LocalPushNotificationItem = {
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
    };

    if (notificationSettings.soundEnabled) {
      playMedicationReminderChime();
    }
    dispatchBrowserLocalNotification(item);
    setNotificationHistory((prev) => [item, ...prev.filter((p) => p.status !== 'active')].slice(0, 20));
  };

  const handleToggleWorkoutScheduleComplete = (id: string) => {
    const timeStr = getCurrentTimeHHMM();
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
      if (cloudUser) {
        saveWorkoutToFirestore(cloudUser.uid, loggedWorkout).catch(() => {});
      }
    }

    setNotificationHistory((prev) =>
      prev.map((item) =>
        (item.workoutScheduleId === id || item.medicationId === id) && item.status === 'active'
          ? { ...item, status: 'confirmed' }
          : item
      )
    );
  };

  const handleAddWorkoutSchedule = (scheduleData: Omit<WorkoutSchedule, 'id'>) => {
    const newSched: WorkoutSchedule = { ...scheduleData, id: `wsched_${Date.now()}` };
    setWorkoutSchedules((prev) => [...prev, newSched]);
  };

  const handleUpdateWorkoutSchedule = (
    id: string,
    updates: Partial<
      Pick<WorkoutSchedule, 'timeSlot' | 'daysOfWeek' | 'reminderEnabled' | 'snoozedUntil'>
    >
  ) => {
    setWorkoutSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleDeleteWorkoutSchedule = (id: string) => {
    setWorkoutSchedules((prev) => prev.filter((s) => s.id !== id));
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
    const item: LocalPushNotificationItem = {
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
    };

    if (notificationSettings.soundEnabled) {
      playMedicationReminderChime();
    }
    dispatchBrowserLocalNotification(item);
    setNotificationHistory((prev) =>
      [item, ...prev.filter((p) => p.status !== 'active')].slice(0, 20)
    );
  };

  const handleConfirmPushNotification = (item: LocalPushNotificationItem) => {
    const timeStr = getCurrentTimeHHMM();

    if (item.kind === 'workout') {
      const schedId = item.workoutScheduleId || item.medicationId;
      const target = workoutSchedules.find((s) => s.id === schedId);
      setWorkoutSchedules((prev) =>
        prev.map((s) =>
          s.id === schedId
            ? {
                ...s,
                completedToday: true,
                completedAt: timeStr,
                snoozedUntil: undefined,
              }
            : s
        )
      );
      if (target && !target.completedToday) {
        const loggedWorkout: WorkoutEntry = {
          id: `work_push_${schedId}_${Date.now()}`,
          date: '2026-11-10',
          time: timeStr,
          activityName: target.activityName,
          category: target.category,
          durationMinutes: target.durationMinutes,
          caloriesBurned: target.targetCalories,
          avgHeartRate: target.intensityLabel === 'Nhẹ nhàng' ? 96 : 118,
        };
        setWorkouts((prev) => [loggedWorkout, ...prev]);
        if (cloudUser) {
          saveWorkoutToFirestore(cloudUser.uid, loggedWorkout).catch(() => {});
        }
      }
      setNotificationHistory((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, status: 'confirmed' } : n))
      );
      return;
    }

    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== item.medicationId) return m;
        if (m.takenToday) return { ...m, snoozedUntil: undefined };
        const updatedMed: MedicationSchedule = {
          ...m,
          takenToday: true,
          takenAt: timeStr,
          snoozedUntil: undefined,
          remainingPills: Math.max(0, m.remainingPills - 1),
        };
        if (cloudUser) {
          saveMedicationToFirestore(cloudUser.uid, updatedMed).catch(() => {});
        }
        return updatedMed;
      })
    );
    setNotificationHistory((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, status: 'confirmed' } : n))
    );
  };

  const handleSnoozePushNotification = (item: LocalPushNotificationItem) => {
    const nowStr = getCurrentTimeHHMM();
    const snoozeUntilStr = addMinutesToTimeStr(nowStr, notificationSettings.snoozeMinutes);
    if (item.kind === 'workout') {
      handleUpdateWorkoutSchedule(item.workoutScheduleId || item.medicationId, {
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
    setNotificationHistory((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, status: 'dismissed' } : n))
    );
  };

  const handleApplyVisitToTracker = (visit: BhytVisitRecord) => {
    const newVital: VitalRecord = {
      id: `vital_bhyt_${Date.now()}`,
      date: visit.visitDate,
      time: '08:30',
      systolic: visit.recordedVitals.systolic,
      diastolic: visit.recordedVitals.diastolic,
      heartRate: visit.recordedVitals.heartRate,
      spo2: 98,
      bloodGlucose: visit.recordedVitals.bloodGlucose,
      glucoseContext: 'fasting',
      temperatureC: 36.6,
      weightKg: visit.recordedVitals.weightKg,
      sleepHours: 7.2,
      steps: 6500,
      deviceSource: 'Máy đo Omron',
      notes: `Khám BHYT tại ${visit.hospitalName} (${visit.icdCode}: ${visit.diagnosisSummary})`,
    };

    setVitals((prev) => [newVital, ...prev]);

    if (visit.prescribedMedications.length > 0) {
      setMedications((prev) => {
        const existingNames = new Set(prev.map((m) => m.medicationName.toLowerCase()));
        const added: MedicationSchedule[] = visit.prescribedMedications
          .filter((pm) => !existingNames.has(pm.medicationName.toLowerCase()))
          .map((pm, idx) => ({
            id: `med_bhyt_${Date.now()}_${idx}`,
            medicationName: pm.medicationName,
            dosage: pm.dosage,
            purpose: pm.purpose,
            frequency: 'Hàng ngày',
            timeSlot: pm.timeSlot,
            mealInstruction: pm.mealInstruction,
            takenToday: false,
            remainingPills: pm.daysSupply,
            totalPills: pm.daysSupply,
            reminderEnabled: true,
          }));
        return [...added, ...prev];
      });
    }
  };

  const handleAddBhytVisit = (visitData: Omit<BhytVisitRecord, 'id'>) => {
    const newVisit: BhytVisitRecord = {
      ...visitData,
      id: `bhyt_visit_${Date.now()}`,
    };
    setBhytVisits((prev) => [newVisit, ...prev]);
    const condLabel = `${visitData.diagnosisSummary} (Mã ${visitData.icdCode})`;
    if (!profile.chronicConditions.some((c) => c.includes(visitData.icdCode))) {
      setProfile((prev) => ({
        ...prev,
        chronicConditions: [condLabel, ...prev.chronicConditions],
      }));
    }
  };

  const handleResetSampleData = () => {
    const def = CITIZEN_VNEID_ACCOUNTS[0];
    setCurrentAccountId(def.accountId);
    setProfile(INITIAL_MEDICAL_PROFILE);
    setBhytVisits(INITIAL_BHYT_VISITS);
    setVitals(INITIAL_VITAL_RECORDS);
    setMeals(INITIAL_MEAL_ENTRIES);
    setWorkouts(INITIAL_WORKOUT_ENTRIES);
    setWorkoutSchedules(INITIAL_WORKOUT_SCHEDULES);
    setMedications(INITIAL_MEDICATIONS);
    setWaterIntakeMl(1750);
    setNotifiedSignaturesToday([]);
    setNotificationHistory([]);
  };

  const handleAcceptNd13Consent = () => {
    const record: PrivacyConsentRecord = {
      accepted: true,
      acceptedAt: new Date().toISOString(),
      version: 'nd13-2023-v1',
    };
    setNd13Consent(record);
    writeStorageIfChanged(STORAGE_KEYS.PRIVACY_CONSENT, record);
  };

  const handleWithdrawNd13Consent = () => {
    setNd13Consent(null);
    writeStorageIfChanged(STORAGE_KEYS.PRIVACY_CONSENT, {
      accepted: false,
      acceptedAt: '',
      version: 'nd13-2023-v1',
    });
    setIsComplianceModalOpen(false);
  };

  const handleExportAllUserData = () => {
    const fullExportPayload = {
      exportedAt: new Date().toISOString(),
      regulation: 'Nghị định 13/2023/NĐ-CP - Quyền truy cập và xuất dữ liệu cá nhân',
      accountId: currentAccountId,
      isDemoProfile: Boolean(profile.isDemo ?? profile.bhytCard?.isDemo),
      profile,
      bhytVisits,
      vitals,
      meals,
      workouts,
      workoutSchedules,
      medications,
      waterIntakeMl,
      notificationSettings,
    };
    const jsonString = JSON.stringify(fullExportPayload, null, 2);
    try {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vitapulse-du-lieu-ca-nhan-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Ignore blob download errors in headless environments
    }
  };

  const handleDeleteAllUserData = async () => {
    clearAllAppStorage();
    if (cloudUser) {
      try {
        await deleteAllUserDataFromFirestore(cloudUser.uid);
      } catch {
        // Ignore cloud deletion errors when offline
      }
      setCloudUser(null);
      setHasCalendarToken(false);
    }
    setNd13Consent(null);
    handleResetSampleData();
    setIsAuthenticated(false);
  };

  const isDemoMode = Boolean(profile.isDemo ?? profile.bhytCard?.isDemo);
  const rawBhytCode = profile.bhytCard?.bhytCode || 'DN4700000000201';
  const displayedHeaderBhyt = showHeaderBhytFull
    ? rawBhytCode
    : maskSensitiveIdentifier(rawBhytCode, 'bhyt');

  const renderMetricCardById = (cardId: PriorityMetricCardId, idx: number) => {
    const isTopPriority = idx < 2;
    const priorityBadge = isTopPriority ? (
      <span className="px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold shrink-0">
        Ưu tiên #{idx + 1}
      </span>
    ) : null;

    switch (cardId) {
      case 'bp':
        return (
          <div
            key="bp"
            data-testid="metric-card-bp"
            className={`bg-white border rounded-xl p-3.5 flex flex-col justify-between ${
              isTopPriority ? 'border-teal-300 ring-1 ring-teal-500/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Huyết áp Động mạch</span>
              <div className="flex items-center gap-1.5">
                {priorityBadge}
                <Activity className="w-4 h-4 text-teal-600 shrink-0" />
              </div>
            </div>
            <div className="my-1.5">
              <span
                data-testid="latest-bp-value"
                className="text-xl sm:text-2xl font-bold text-slate-900 font-mono-tabular"
              >
                {latestVital.systolic}/{latestVital.diastolic}
              </span>
              <span className="text-xs text-slate-500 ml-1">mmHg</span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span
                className={`font-semibold ${
                  bpEval.status === 'normal'
                    ? 'text-emerald-700'
                    : bpEval.status === 'elevated' || bpEval.status === 'warning'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {bpEval.label}
              </span>{' '}
              · &le; 120/80
            </div>
          </div>
        );

      case 'hr_spo2':
        return (
          <div
            key="hr_spo2"
            data-testid="metric-card-hr_spo2"
            className={`bg-white border rounded-xl p-3.5 flex flex-col justify-between ${
              isTopPriority ? 'border-teal-300 ring-1 ring-teal-500/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Nhịp tim &amp; Oxy</span>
              <div className="flex items-center gap-1.5">
                {priorityBadge}
                <Heart className="w-4 h-4 text-rose-600 shrink-0" />
              </div>
            </div>
            <div className="my-1.5 flex items-baseline gap-2">
              <div>
                <span
                  data-testid="latest-hr-value"
                  className="text-xl sm:text-2xl font-bold text-slate-900 font-mono-tabular"
                >
                  {latestVital.heartRate}
                </span>
                <span className="text-xs text-slate-500 ml-0.5">bpm</span>
              </div>
              <span className="text-slate-300">|</span>
              <div>
                <span className="text-base sm:text-xl font-bold text-teal-700 font-mono-tabular">
                  {latestVital.spo2}%
                </span>
              </div>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span className="font-semibold text-emerald-700">{hrEval.label}</span>
            </div>
          </div>
        );

      case 'glucose':
        return (
          <div
            key="glucose"
            data-testid="metric-card-glucose"
            className={`bg-white border rounded-xl p-3.5 flex flex-col justify-between ${
              isTopPriority ? 'border-teal-300 ring-1 ring-teal-500/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Đường huyết</span>
              <div className="flex items-center gap-1.5">
                {priorityBadge}
                <Thermometer className="w-4 h-4 text-amber-600 shrink-0" />
              </div>
            </div>
            <div className="my-1.5">
              <span
                data-testid="latest-glucose-value"
                className="text-xl sm:text-2xl font-bold text-slate-900 font-mono-tabular"
              >
                {latestVital.bloodGlucose}
              </span>
              <span className="text-xs text-slate-500 ml-1">mg/dL</span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span
                className={`font-semibold ${
                  gluEval.status === 'normal'
                    ? 'text-emerald-700'
                    : gluEval.status === 'warning'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {gluEval.label}
              </span>
            </div>
          </div>
        );

      case 'weight_bmi':
        return (
          <div
            key="weight_bmi"
            data-testid="metric-card-weight_bmi"
            className={`bg-white border rounded-xl p-3.5 flex flex-col justify-between ${
              isTopPriority ? 'border-teal-300 ring-1 ring-teal-500/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Cân nặng &amp; BMI</span>
              <div className="flex items-center gap-1.5">
                {priorityBadge}
                <Scale className="w-4 h-4 text-indigo-600 shrink-0" />
              </div>
            </div>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <div className="whitespace-nowrap">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono-tabular">
                  {latestVital.weightKg}
                </span>
                <span className="text-xs text-slate-500 ml-0.5">kg</span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="text-base font-bold text-indigo-700 font-mono-tabular whitespace-nowrap">
                BMI {bmi}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-800">{bmiEval.label}</span>
            </div>
          </div>
        );

      case 'sleep_temp':
        return (
          <div
            key="sleep_temp"
            data-testid="metric-card-sleep_temp"
            className={`bg-white border rounded-xl p-3.5 flex flex-col justify-between ${
              isTopPriority ? 'border-teal-300 ring-1 ring-teal-500/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Giấc ngủ &amp; Thân nhiệt</span>
              <div className="flex items-center gap-1.5">
                {priorityBadge}
                <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
              </div>
            </div>
            <div className="my-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono-tabular">
                {latestVital.sleepHours}
              </span>
              <span className="text-xs text-slate-500 ml-1">
                / {profile.dailySleepGoalHours} giờ
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 pt-2 border-t border-slate-100">
              Thân nhiệt:{' '}
              <span className="font-mono-tabular font-semibold text-slate-800">
                {latestVital.temperatureC} °C
              </span>
            </div>
          </div>
        );

      case 'steps_water':
        return (
          <div
            key="steps_water"
            data-testid="metric-card-steps_water"
            className={`bg-white border rounded-xl p-3.5 flex flex-col justify-between ${
              isTopPriority ? 'border-teal-300 ring-1 ring-teal-500/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Bước chân &amp; Nước</span>
              <div className="flex items-center gap-1.5">
                {priorityBadge}
                <Footprints className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
            </div>
            <div className="my-1.5 flex items-center justify-between gap-1">
              <span className="text-lg sm:text-2xl font-bold text-slate-900 font-mono-tabular">
                {latestVital.steps.toLocaleString('vi-VN')}
              </span>
              <button
                type="button"
                onClick={() => handleAddWater(250)}
                className="px-2 py-1 rounded-md bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-[11px] font-semibold font-mono-tabular transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                +250ml
              </button>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 pt-2 border-t border-slate-100 font-mono-tabular">
              Nước: {waterIntakeMl}ml · {calorieSummary.netCalories} kcal
            </div>
          </div>
        );

      case 'nutrition_meds':
      default:
        return (
          <div
            key="nutrition_meds"
            data-testid="metric-card-nutrition_meds"
            className={`bg-white border rounded-xl p-3.5 flex flex-col justify-between ${
              isTopPriority ? 'border-teal-300 ring-1 ring-teal-500/20' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Ăn uống, Thuốc &amp; Nước</span>
              <div className="flex items-center gap-1.5">
                {priorityBadge}
                <Utensils className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
            </div>
            <div className="my-1.5 flex items-center justify-between gap-1">
              <span className="text-base sm:text-xl font-bold text-slate-900 font-mono-tabular">
                Thuốc {medAdherence.adherencePercent}% · {calorieSummary.totalIntake} kcal
              </span>
              <button
                type="button"
                onClick={() => handleAddWater(250)}
                className="px-2 py-1 rounded-md bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-[11px] font-semibold font-mono-tabular transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                +250ml
              </button>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 pt-2 border-t border-slate-100 font-mono-tabular">
              Đã uống {medAdherence.takenCount}/{medAdherence.totalCount} cữ · Đạm {calorieSummary.proteinG}g
            </div>
          </div>
        );
    }
  };

  // First-time Health Data Processing Consent Banner/Modal (Nghị định 13/2023/NĐ-CP)
  const nd13ConsentDialog = !nd13Consent?.accepted ? (
    <div
      role="region"
      aria-label="Xác nhận đồng ý xử lý dữ liệu sức khỏe theo Nghị định 13/2023/NĐ-CP"
      data-testid="nd13-privacy-consent-modal"
      className="bg-amber-50 border-b border-amber-300 px-4 sm:px-6 py-3.5 text-xs sm:text-sm text-slate-900"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <Lock className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              Thông báo Xử lý Dữ liệu Sức khỏe Cá nhân (Theo Nghị định 13/2023/NĐ-CP)
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong>1. Nơi lưu trữ:</strong> Dữ liệu huyết áp, đường huyết, đơn thuốc và mã BHYT tự nhập được lưu cục bộ trên trình duyệt thiết bị của bạn (<code>localStorage</code>) và chỉ đồng bộ lên phân vùng riêng tư <code>Google Cloud Firestore</code> khi bạn chủ động đăng nhập Google.{' '}
            <strong>2. Mục đích:</strong> Giúp bạn và gia đình tự theo dõi biểu đồ sức khỏe và nhận thông báo nhắc uống thuốc hàng ngày.{' '}
            <strong>3. Quyền của bạn:</strong> Bạn có quyền xuất dữ liệu, rút lại sự đồng ý hoặc xóa toàn bộ dữ liệu bất cứ lúc nào tại mục <em>Cài đặt &gt; Quyền riêng tư</em>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAcceptNd13Consent}
            data-testid="accept-nd13-consent-btn"
            className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap shadow-xs"
          >
            Tôi đã hiểu và đồng ý
          </button>
          <button
            type="button"
            onClick={() => setIsComplianceModalOpen(true)}
            className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            Xem chi tiết quyền riêng tư
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // OUTER ENTRY SCREEN: When not yet logged in, display the dedicated Login Screen.
  if (!isAuthenticated) {
    return (
      <>
        <OfflineIndicator />
        {nd13ConsentDialog}
        <VneidWelcomeLoginScreen
          onLoginSuccess={handleLoginWithAccount}
          cloudUser={cloudUser}
          onGoogleAuthSuccess={(u, hasToken) => {
            setCloudUser(u);
            setHasCalendarToken(hasToken);
          }}
          onOpenComplianceModal={() => setIsComplianceModalOpen(true)}
          fontSizeMode={fontSizeMode}
          onChangeFontSizeMode={setFontSizeMode}
        />
        <PlayStoreComplianceModal
          isOpen={isComplianceModalOpen}
          onClose={() => setIsComplianceModalOpen(false)}
          onDeleteAllUserData={handleDeleteAllUserData}
          onExportAllUserData={handleExportAllUserData}
          nd13ConsentAcceptedAt={nd13Consent?.accepted ? nd13Consent.acceptedAt : null}
          onWithdrawNd13Consent={handleWithdrawNd13Consent}
        />
      </>
    );
  }

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-8">
      <OfflineIndicator />
      {nd13ConsentDialog}

      {/* Floating Local Push Notification Banner for Medication Reminders */}
      <MedicationPushBanner
        activeNotifications={activePushNotifications}
        snoozeMinutes={notificationSettings.snoozeMinutes}
        soundEnabled={notificationSettings.soundEnabled}
        onConfirmTaken={handleConfirmPushNotification}
        onSnooze={handleSnoozePushNotification}
        onDismiss={handleDismissPushNotification}
      />

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 sm:px-6 py-2.5 sm:py-3 pt-safe flex items-center justify-between gap-3 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveModule('dashboard');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          VitaPulse Health
        </a>

        {/* Zone 2: 5 clean single-line text navigation links */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => setActiveModule('dashboard')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeModule === 'dashboard'
                ? 'text-teal-700 font-semibold underline underline-offset-8 decoration-2 decoration-teal-600'
                : 'hover:text-slate-900'
            }`}
          >
            Tổng quan Sức khỏe
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('nutrition')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeModule === 'nutrition'
                ? 'text-teal-700 font-semibold underline underline-offset-8 decoration-2 decoration-teal-600'
                : 'hover:text-slate-900'
            }`}
          >
            Ăn uống &amp; Vận động
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('medications')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeModule === 'medications'
                ? 'text-teal-700 font-semibold underline underline-offset-8 decoration-2 decoration-teal-600'
                : 'hover:text-slate-900'
            }`}
          >
            Tủ thuốc &amp; Hồ sơ
          </button>
          <button
            type="button"
            data-testid="nav-records-bhyt-btn"
            onClick={() => setActiveModule('records')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeModule === 'records'
                ? 'text-teal-700 font-semibold underline underline-offset-8 decoration-2 decoration-teal-600'
                : 'hover:text-slate-900'
            }`}
          >
            Sổ Khám &amp; BHYT
          </button>
          <button
            type="button"
            data-testid="nav-user-guide-btn"
            onClick={() => setActiveModule('guide')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeModule === 'guide'
                ? 'text-teal-700 font-semibold underline underline-offset-8 decoration-2 decoration-teal-600'
                : 'hover:text-slate-900'
            }`}
          >
            Hướng dẫn Sử dụng
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="min-h-[38px] sm:min-h-[40px] px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Ghi nhận Chỉ số
          </button>
        </div>
      </header>

      {/* Main Self-Adapting Content Container */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3.5 sm:pt-5 space-y-4 sm:space-y-5 flex-1 min-w-0">
        {/* Dismissible PWA Install Banner ("Cài App" chuyển thành banner có thể tắt) */}
        <PWAInstallBanner />

        {/* Compact Patient Identity & Diagnosed Conditions Bar with Demo/Real Badge, Masked BHYT, Font Size Switcher & Unified Profile Menu */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
              {isDemoMode ? (
                <span
                  data-testid="header-demo-badge"
                  className="inline-flex items-center gap-1 font-bold text-amber-950 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded"
                >
                  HỒ SƠ DEMO
                </span>
              ) : (
                <span
                  data-testid="header-personal-badge"
                  className="inline-flex items-center gap-1 font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded"
                >
                  HỒ SƠ CỦA TÔI
                </span>
              )}

              <span className="inline-flex flex-wrap items-center gap-1.5 font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded font-mono-tabular break-all">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span data-testid="header-bhyt-code" className="break-all">
                  BHYT: {displayedHeaderBhyt}
                </span>
                <button
                  type="button"
                  onClick={() => setShowHeaderBhytFull((prev) => !prev)}
                  data-testid="header-toggle-bhyt-mask-btn"
                  className="ml-1 px-1.5 py-0.5 rounded bg-white border border-teal-300 text-xs font-semibold text-teal-900 hover:bg-teal-100 inline-flex items-center gap-1 cursor-pointer"
                >
                  {showHeaderBhytFull ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Ẩn</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Hiện</span>
                    </>
                  )}
                </button>
              </span>

              <strong
                data-testid="active-patient-name"
                className="text-base font-bold text-slate-900 break-words"
              >
                {profile.fullName} ({2026 - profile.birthYear} tuổi)
              </strong>
              <span aria-hidden="true">·</span>
              <span className="break-words">Nhóm máu {profile.bloodType}</span>
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
              <span className="hidden sm:inline break-words">{profile.hospitalName}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Bệnh lý đang theo dõi:
              </span>
              {profile.chronicConditions.map((cond) => (
                <span
                  key={cond}
                  data-testid="header-condition-tag"
                  className="text-xs font-semibold text-rose-950 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded break-words"
                >
                  {cond}
                </span>
              ))}
              <span className="text-xs text-slate-600 break-words">
                (Tự nhập mã thẻ BHYT để lưu trữ cá nhân – không kết nối cơ quan BHXH/VNeID)
              </span>
            </div>
          </div>

          {/* Right Controls: Font Size Switcher ("Cỡ chữ: Vừa / Lớn / Rất lớn") + Unified Profile Menu */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Font Size Control */}
            <div
              data-testid="font-size-switcher"
              className="flex flex-wrap items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1"
            >
              <span className="text-xs font-semibold text-slate-800 px-2 inline-flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span>Cỡ chữ:</span>
              </span>
              {(
                [
                  { id: 'normal', label: 'Vừa' },
                  { id: 'large', label: 'Lớn' },
                  { id: 'xlarge', label: 'Rất lớn' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFontSizeMode(opt.id)}
                  data-testid={`font-size-${opt.id}-btn`}
                  aria-pressed={fontSizeMode === opt.id}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    fontSizeMode === opt.id
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'text-slate-800 hover:bg-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Unified Profile Menu (merges Xem Thẻ BHYT, Cài App, Quyền riêng tư, Đổi hồ sơ) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                aria-expanded={isProfileMenuOpen}
                data-testid="profile-menu-btn"
                className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-bold text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <UserCog className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Menu Hồ sơ</span>
                <ChevronDown
                  className={`w-4 h-4 text-teal-700 transition-transform ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProfileMenuOpen && (
                <div
                  data-testid="profile-menu-dropdown"
                  className="mt-2 sm:absolute sm:right-0 sm:z-40 w-full sm:w-72 rounded-xl bg-white border border-slate-200 shadow-lg p-2 space-y-1.5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModule('records');
                      setRecordsSubTab('bhyt');
                      setIsProfileMenuOpen(false);
                    }}
                    data-testid="quick-open-bhyt-btn"
                    className="w-full min-h-[40px] px-3 py-2 text-left text-xs sm:text-sm font-semibold text-teal-900 bg-teal-50/70 hover:bg-teal-100 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileHeart className="w-4 h-4 text-teal-700 shrink-0" />
                    <span className="break-words">
                      Xem Thẻ BHYT &amp; Bệnh án ({bhytVisits.length})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsComplianceModalOpen(true);
                      setIsProfileMenuOpen(false);
                    }}
                    data-testid="header-open-privacy-settings-btn"
                    className="w-full min-h-[40px] px-3 py-2 text-left text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-slate-700 shrink-0" />
                    <span className="break-words">Cài đặt &gt; Quyền riêng tư</span>
                  </button>

                  <div className="px-1 py-0.5">
                    <PWAInstallButton compact />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogoutToWelcomeScreen();
                    }}
                    data-testid="switch-account-logout-btn"
                    className="w-full min-h-[40px] px-3 py-2 text-left text-xs sm:text-sm font-semibold text-rose-900 bg-rose-50/70 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-700 shrink-0" />
                    <span className="break-words">Đổi hồ sơ khác</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODULE 1: COMPACT 2-ROW DASHBOARD & VITALS OVERVIEW */}
        {activeModule === 'dashboard' && (
          <div className="space-y-4 sm:space-y-5">
            {/* Condition-Based Priority Banner (ICD-10 Driven) */}
            <div
              data-testid="priority-dashboard-banner"
              className="bg-teal-50/80 border border-teal-200 rounded-xl px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-teal-950"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  <strong data-testid="priority-dashboard-title">
                    {priorityDashboardConfig.priorityBannerTitle}:
                  </strong>{' '}
                  {priorityDashboardConfig.priorityReason}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-teal-800 shrink-0">
                Không phải chẩn đoán y khoa
              </span>
            </div>

            {/* ROW 1: Reference Composite Index (4 cols) + 6 Condition-Prioritized Biometric Cards (8 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span
                        data-testid="reference-composite-index-title"
                        className="text-xs sm:text-sm font-bold text-slate-800"
                      >
                        Chỉ số tổng hợp tham khảo
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowScoreInfoPopover((prev) => !prev)}
                        aria-label="Giải thích cách tính Chỉ số tổng hợp tham khảo"
                        data-testid="health-score-info-btn"
                        className="w-5 h-5 rounded-full bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-800 inline-flex items-center justify-center cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Không phải chẩn đoán y khoa
                    </span>
                  </div>

                  {showScoreInfoPopover && (
                    <div
                      data-testid="health-score-info-popover"
                      className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 leading-relaxed"
                    >
                      <p className="font-bold text-slate-900">
                        Cách tính Chỉ số tổng hợp tham khảo (Thang 100):
                      </p>
                      <p>
                        Tổng hợp từ 6 yếu tố theo dõi hàng ngày: Huyết áp, Đường huyết, Nhịp tim &amp; SpO2, BMI, Giấc ngủ và Tỷ lệ tuân thủ uống thuốc.
                      </p>
                      <p className="text-teal-900 font-medium">
                        • Quy tắc an toàn (Cap Rule): Chỉ số <strong>không bao giờ vào mức &ldquo;Tối ưu&rdquo;</strong> nếu tỷ lệ uống thuốc dưới 80% hoặc có bất kỳ chỉ số sinh tồn nào ở mức <em>Cần lưu ý / Cần chú ý ngay</em>.
                      </p>
                      <p className="text-rose-800 font-semibold">
                        • Lưu ý: Chỉ số này chỉ giúp bạn tự theo dõi thói quen hàng ngày, tuyệt đối không phải chẩn đoán y khoa.
                      </p>
                    </div>
                  )}

                  <div className="py-3.5 flex items-center gap-4">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#E2E8F0"
                          strokeWidth="9"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke={
                            healthScore.status === 'normal'
                              ? '#0D9488'
                              : healthScore.status === 'elevated' ||
                                healthScore.status === 'warning'
                              ? '#D97706'
                              : '#DC2626'
                          }
                          strokeWidth="9"
                          strokeDasharray={`${(healthScore.score / 100) * 264} 264`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          data-testid="health-score-value"
                          className="text-xl font-bold text-slate-900 font-mono-tabular"
                        >
                          {healthScore.score}
                        </span>
                        <span className="text-[10px] text-slate-500">tham khảo</span>
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div
                        data-testid="health-score-grade"
                        className="text-sm sm:text-base font-bold text-slate-900"
                      >
                        Mức tham khảo: {healthScore.grade}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {bpEval.recommendation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Neutral Status Summary & Emergency 115 Guidance when Critical */}
                <div className="space-y-2">
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      bpEval.status === 'normal' && healthScore.status === 'normal'
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : bpEval.status === 'critical' ||
                          gluEval.status === 'critical' ||
                          healthScore.status === 'critical'
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}
                  >
                    {bpEval.status === 'normal' && healthScore.status === 'normal' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong className="font-semibold">{bpEval.label}:</strong> Đo lúc{' '}
                      {latestVital.time} đạt{' '}
                      <span className="font-mono-tabular font-semibold">
                        {latestVital.systolic}/{latestVital.diastolic} mmHg
                      </span>
                      . Tuân thủ thuốc:{' '}
                      <span className="font-mono-tabular font-semibold">
                        {medAdherence.adherencePercent}%
                      </span>
                      .
                    </div>
                  </div>

                  {(bpEval.status === 'critical' ||
                    gluEval.status === 'critical' ||
                    healthScore.status === 'critical') && (
                    <div
                      role="alert"
                      data-testid="emergency-115-guidance"
                      className="p-3 rounded-xl bg-rose-600 text-white text-xs space-y-1 shadow-xs"
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <PhoneCall className="w-4 h-4 shrink-0" />
                        <span>Cần chú ý ngay — Hướng dẫn khi nào gọi cấp cứu 115:</span>
                      </div>
                      <p className="leading-relaxed">
                        Nếu chỉ số huyết áp &ge; 180/120 mmHg hoặc đi kèm đau tức ngực, khó thở, đau đầu dữ dội, tê yếu tay chân, nói khó: hãy nghỉ ngơi ngay và gọi số cấp cứu <strong>115</strong> hoặc nhờ người thân đưa đến bệnh viện gần nhất.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right 8 Columns: 6 Key Biometric Cards Ordered by Profile's ICD Condition */}
              <div
                data-testid="priority-metrics-grid"
                className="lg:col-span-8 grid grid-cols-1 min-[360px]:grid-cols-2 xl:grid-cols-3 gap-3"
              >
                {priorityDashboardConfig.orderedCardIds.map((cardId, idx) =>
                  renderMetricCardById(cardId, idx)
                )}
              </div>
            </div>

            {/* ROW 2: Balanced Side-by-Side 12-Col Layout (Left 7 cols: 7-Day Chart | Right 5 cols: Today's Meds & Nutrition) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left 7 Cols: Recharts 7-Day Vital Signs Bar Chart */}
              <div className="lg:col-span-7">
                <VitalsBarChartPanel records={vitals} />
              </div>

              {/* Right 5 Cols: Today's Medication Checklist & Daily Nutrition Summary */}
              <div className="lg:col-span-5 space-y-4">
                {/* Quick Medication Checklist with Local Push Notification Status */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                          Lịch Nhắc Uống Thuốc Hôm Nay
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            notificationSettings.enabled
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {notificationSettings.enabled ? 'Chuông nhắc: Bật' : 'Chuông: Tắt'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Đã uống {medAdherence.takenCount}/{medAdherence.totalCount} cữ (
                        {medAdherence.adherencePercent}%)
                        {notifEval.nextDose
                          ? ` · Sắp tới: ${notifEval.nextDose.medication.timeSlot} (${notifEval.nextDose.countdownLabel})`
                          : ' · Đã uống đủ hôm nay'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        data-testid="dashboard-test-push-btn"
                        onClick={() => handleTriggerTestPush()}
                        title="Gửi thử thông báo đẩy nhắc uống thuốc"
                        className="min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                      >
                        <BellRing className="w-3.5 h-3.5 text-teal-600" />
                        <span>Báo thử</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModule('medications')}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Cài đặt →
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 mt-1">
                    {medications.map((med) => (
                      <div
                        key={med.id}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium break-words ${
                              med.takenToday ? 'line-through text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {med.medicationName}
                          </p>
                          <p className="text-xs text-slate-600 font-mono-tabular break-words">
                            {med.timeSlot} · {med.dosage} · {med.mealInstruction}
                            {med.snoozedUntil && !med.takenToday
                              ? ` · Hoãn tới ${med.snoozedUntil}`
                              : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleMedication(med.id)}
                          className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            med.takenToday
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-teal-600 text-white hover:bg-teal-700'
                          }`}
                        >
                          {med.takenToday ? 'Đã uống' : 'Xác nhận'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Recurring Workout Schedule & Push Reminder Card */}
                <div
                  data-testid="dashboard-workout-schedule-card"
                  className="bg-white border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Dumbbell className="w-4 h-4 text-indigo-600 shrink-0" />
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                          Lịch Tập Luyện Định Kỳ Hôm Nay
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-bold">
                          {workoutSchedAdherence.completedCount}/
                          {workoutSchedAdherence.totalScheduledToday} bài (
                          {workoutSchedAdherence.adherencePercent}%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {workoutNotifEval.nextWorkout
                          ? `Sắp tới: ${workoutNotifEval.nextWorkout.schedule.timeSlot} — ${workoutNotifEval.nextWorkout.schedule.activityName} (${workoutNotifEval.nextWorkout.countdownLabel})`
                          : 'Đã hoàn thành lịch tập định kỳ hôm nay'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        data-testid="dashboard-test-workout-push-btn"
                        onClick={() => handleTriggerTestWorkoutPush()}
                        title="Gửi thử thông báo đẩy nhắc tập luyện"
                        className="min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                      >
                        <BellRing className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Báo thử tập</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModule('nutrition')}
                        className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Lên lịch →
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 mt-1">
                    {workoutSchedAdherence.todaySchedules.map((sched) => (
                      <div
                        key={sched.id}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium break-words ${
                              sched.completedToday ? 'line-through text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {sched.activityName}
                          </p>
                          <p className="text-xs text-slate-600 font-mono-tabular break-words">
                            {sched.timeSlot} · {sched.durationMinutes} phút · -{sched.targetCalories}{' '}
                            kcal · {formatRecurringDaysLabel(sched.daysOfWeek)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleWorkoutScheduleComplete(sched.id)}
                          className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            sched.completedToday
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {sched.completedToday ? 'Đã tập' : 'Hoàn thành'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compact Nutrition & Hydration Box */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Dinh dưỡng &amp; Nước uống Hôm nay
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModule('nutrition')}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Ghi bữa ăn →
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                      <p className="text-xs text-slate-600">Nạp vào</p>
                      <p className="text-base font-bold text-slate-900 font-mono-tabular">
                        {calorieSummary.totalIntake} kcal
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                      <p className="text-xs text-slate-600">Tập luyện</p>
                      <p
                        data-testid="dashboard-burned-calories"
                        className="text-base font-bold text-teal-700 font-mono-tabular"
                      >
                        -{calorieSummary.totalBurned} kcal
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                      <p className="text-xs text-slate-600">Nước uống</p>
                      <p className="text-base font-bold text-sky-700 font-mono-tabular">
                        {waterIntakeMl} ml
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600">
                      Đạm: <strong>{calorieSummary.proteinG}g</strong> · Tinh bột:{' '}
                      <strong>{calorieSummary.carbsG}g</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddWater(250)}
                      className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Droplets className="w-3.5 h-3.5" />
                      +250 ml nước
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: NUTRITION, HYDRATION & WORKOUTS */}
        {activeModule === 'nutrition' && (
          <NutritionActivityView
            profile={profile}
            meals={meals}
            workouts={workouts}
            workoutSchedules={workoutSchedules}
            currentDayCode={currentDayCode}
            nextWorkoutInfo={workoutNotifEval.nextWorkout}
            notificationSettings={notificationSettings}
            waterIntakeMl={waterIntakeMl}
            onAddWater={handleAddWater}
            onResetWater={handleResetWater}
            onAddMeal={handleAddMeal}
            onDeleteMeal={handleDeleteMeal}
            onAddWorkout={handleAddWorkout}
            onDeleteWorkout={handleDeleteWorkout}
            onToggleWorkoutScheduleComplete={handleToggleWorkoutScheduleComplete}
            onAddWorkoutSchedule={handleAddWorkoutSchedule}
            onUpdateWorkoutSchedule={handleUpdateWorkoutSchedule}
            onDeleteWorkoutSchedule={handleDeleteWorkoutSchedule}
            onTriggerTestWorkoutPush={handleTriggerTestWorkoutPush}
          />
        )}

        {/* MODULE 3: MEDICATIONS & PERSONAL MEDICAL PROFILE */}
        {activeModule === 'medications' && (
          <MedicationCareView
            medications={medications}
            profile={profile}
            notificationSettings={notificationSettings}
            nextDoseInfo={notifEval.nextDose}
            notificationHistory={notificationHistory}
            onToggleMedication={handleToggleMedication}
            onAddMedication={handleAddMedication}
            onUpdateMedicationReminder={handleUpdateMedicationReminder}
            onUpdateNotificationSettings={setNotificationSettings}
            onRequestBrowserPermission={handleRequestBrowserNotificationPermission}
            onTriggerTestPush={handleTriggerTestPush}
            onUpdateProfile={setProfile}
          />
        )}

        {/* MODULE 4: ORGANIZED BHYT MEDICAL RECORDS, OFFLINE EXPORT & DEVICE CONNECTIONS */}
        {activeModule === 'records' && (
          <div className="space-y-4">
            {/* Clean Segmented Sub-Tab Bar so the page stays compact and organized */}
            <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRecordsSubTab('bhyt')}
                data-testid="records-subtab-bhyt"
                className={`flex-1 min-w-[200px] min-h-[42px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  recordsSubTab === 'bhyt'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileHeart className="w-4 h-4 shrink-0" />
                <span>1. Thẻ BHYT &amp; Bệnh án Đã Khám ({bhytVisits.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRecordsSubTab('history')}
                data-testid="records-subtab-history"
                className={`flex-1 min-w-[200px] min-h-[42px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  recordsSubTab === 'history'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>2. Nhật ký Đo &amp; Tải File Lưu trữ (CSV/JSON)</span>
              </button>
              <button
                type="button"
                onClick={() => setRecordsSubTab('devices')}
                data-testid="records-subtab-devices"
                className={`flex-1 min-w-[200px] min-h-[42px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  recordsSubTab === 'devices'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Bluetooth className="w-4 h-4 shrink-0" />
                <span>3. Máy đo Bluetooth &amp; Lịch Tái khám</span>
              </button>
            </div>

            {recordsSubTab === 'bhyt' && (
              <VneidBhytPanel
                profile={profile}
                bhytVisits={bhytVisits}
                onOpenVneidLogin={handleLogoutToWelcomeScreen}
                onApplyVisitToTracker={handleApplyVisitToTracker}
                onAddBhytVisit={handleAddBhytVisit}
              />
            )}

            {recordsSubTab === 'history' && (
              <ClinicalAnalyticsView
                records={vitals}
                meals={meals}
                onDeleteRecord={handleDeleteVitalRecord}
                onResetSampleData={handleResetSampleData}
                onOpenLogModal={() => setIsLogModalOpen(true)}
              />
            )}

            {recordsSubTab === 'devices' && (
              <ConnectedEcosystemPanel
                user={cloudUser}
                hasCalendarToken={hasCalendarToken}
                onAuthSuccess={(u, hasToken) => {
                  setCloudUser(u);
                  setHasCalendarToken(hasToken);
                }}
                onSignOut={() => {
                  setCloudUser(null);
                  setHasCalendarToken(false);
                }}
                profile={profile}
                waterIntakeMl={waterIntakeMl}
                vitals={vitals}
                meals={meals}
                workouts={workouts}
                medications={medications}
                onRecordBleVital={handleAddVitalRecord}
              />
            )}
          </div>
        )}

        {/* MODULE 5: USER GUIDE FOR MIDDLE-AGED & EVERYDAY USERS */}
        {activeModule === 'guide' && (
          <UserGuideView
            profile={profile}
            onOpenLogModal={() => setIsLogModalOpen(true)}
            onNavigateModule={(mod) => setActiveModule(mod)}
          />
        )}
      </main>

      {/* Mobile Viewport Fixed Bottom Tab Bar */}
      <nav
        aria-label="Điều hướng di động"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center min-h-[58px] py-1 pb-safe"
      >
        <button
          type="button"
          onClick={() => setActiveModule('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[44px] px-0.5 ${
            activeModule === 'dashboard' ? 'text-teal-700 font-semibold' : 'text-slate-600'
          }`}
        >
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="text-xs mt-0.5 leading-tight text-center break-words">Sức khỏe</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveModule('nutrition')}
          className={`flex flex-col items-center justify-center min-h-[44px] px-0.5 ${
            activeModule === 'nutrition' ? 'text-teal-700 font-semibold' : 'text-slate-600'
          }`}
        >
          <Utensils className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="text-xs mt-0.5 leading-tight text-center break-words">Ăn &amp; Tập</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveModule('medications')}
          className={`flex flex-col items-center justify-center min-h-[44px] px-0.5 ${
            activeModule === 'medications' ? 'text-teal-700 font-semibold' : 'text-slate-600'
          }`}
        >
          <Pill className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="text-xs mt-0.5 leading-tight text-center break-words">Tủ thuốc</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveModule('records')}
          className={`flex flex-col items-center justify-center min-h-[44px] px-0.5 ${
            activeModule === 'records' ? 'text-teal-700 font-semibold' : 'text-slate-600'
          }`}
        >
          <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="text-xs mt-0.5 leading-tight text-center break-words">Sổ BHYT</span>
        </button>
        <button
          type="button"
          data-testid="mobile-nav-guide-btn"
          onClick={() => setActiveModule('guide')}
          className={`flex flex-col items-center justify-center min-h-[44px] px-0.5 ${
            activeModule === 'guide' ? 'text-teal-700 font-semibold' : 'text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="text-xs mt-0.5 leading-tight text-center break-words">Hướng dẫn</span>
        </button>
      </nav>

      {/* Quiet Footer with Google Play Medical Disclaimer & Privacy Policy */}
      <footer className="max-w-7xl w-full mx-auto px-3.5 sm:px-6 pt-5 pb-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200/80 mt-5">
        <div className="text-center sm:text-left">
          VitaPulse Health — Sổ Tự Theo dõi Sức khỏe Cá nhân (Không thay thế chẩn đoán y khoa)
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            data-testid="footer-open-compliance-btn"
            onClick={() => setIsComplianceModalOpen(true)}
            className="text-teal-700 hover:text-teal-800 font-semibold underline underline-offset-4 cursor-pointer"
          >
            Chính sách Bảo mật, Miễn trừ Y khoa &amp; Chuẩn CH Play
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setActiveModule('guide')}
            className="hover:text-slate-900 underline underline-offset-4 cursor-pointer"
          >
            Xem Hướng dẫn Sử dụng
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={handleResetSampleData}
            className="hover:text-slate-900 underline underline-offset-4 cursor-pointer"
          >
            Khôi phục dữ liệu mẫu
          </button>
        </div>
      </footer>

      {/* Log Vital Sign Modal */}
      <LogVitalModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleAddVitalRecord}
        defaultWeightKg={latestVital.weightKg}
      />

      {/* Google Play Store Compliance, Medical Disclaimer & Data Deletion Modal */}
      <PlayStoreComplianceModal
        isOpen={isComplianceModalOpen}
        onClose={() => setIsComplianceModalOpen(false)}
        onDeleteAllUserData={handleDeleteAllUserData}
        onExportAllUserData={handleExportAllUserData}
        nd13ConsentAcceptedAt={nd13Consent?.accepted ? nd13Consent.acceptedAt : null}
        onWithdrawNd13Consent={handleWithdrawNd13Consent}
      />
    </div>
  );
}

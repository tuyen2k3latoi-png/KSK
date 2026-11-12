import { useEffect } from 'react';
import {
  CITIZEN_VNEID_ACCOUNTS,
  INITIAL_BHYT_VISITS,
  INITIAL_MEAL_ENTRIES,
  INITIAL_MEDICAL_PROFILE,
  INITIAL_MEDICATIONS,
  INITIAL_VITAL_RECORDS,
  INITIAL_WORKOUT_ENTRIES,
  INITIAL_WORKOUT_SCHEDULES,
} from '../data/seedHealthData';
import {
  BhytVisitRecord,
  CitizenHealthAccount,
  MedicationSchedule,
  VitalRecord,
} from '../types/health';
import { clearAllAppStorage, STORAGE_KEYS } from '../utils/storage';
import {
  deleteAllUserDataFromFirestore,
  subscribeToUserHealthCloud,
  syncFullHealthDatasetToFirestore,
} from '../services/firebaseService';
import { useProfile } from './useProfile';
import { useVitals } from './useVitals';
import { useMedications } from './useMedications';

interface UseAccountActionsParams {
  profileState: ReturnType<typeof useProfile>;
  vitalsState: ReturnType<typeof useVitals>;
  medsState: ReturnType<typeof useMedications>;
}

export function useAccountActions({
  profileState,
  vitalsState,
  medsState,
}: UseAccountActionsParams) {
  const {
    currentAccountId,
    setCurrentAccountId,
    profile,
    setProfile,
    bhytVisits,
    setBhytVisits,
    isDemoMode,
    cloudUser,
    setCloudUser,
    setHasCalendarToken,
    setNd13Consent,
    setIsAuthenticated,
  } = profileState;

  const {
    vitals,
    setVitals,
    meals,
    setMeals,
    workouts,
    setWorkouts,
    workoutSchedules,
    setWorkoutSchedules,
    waterIntakeMl,
    setWaterIntakeMl,
  } = vitalsState;

  const {
    medications,
    setMedications,
    notificationSettings,
    setNotifiedSignaturesToday,
    setNotificationHistory,
  } = medsState;

  useEffect(() => {
    if (!cloudUser || isDemoMode) return;
    const unsubCloud = subscribeToUserHealthCloud(cloudUser.uid, {
      onVitals: (cloudVitals) => cloudVitals.length > 0 && setVitals(cloudVitals),
      onMeals: (cloudMeals) => cloudMeals.length > 0 && setMeals(cloudMeals),
      onMedications: (cloudMeds) => cloudMeds.length > 0 && setMedications(cloudMeds),
      onWaterIntake: (waterMl) => setWaterIntakeMl(waterMl),
    });
    return () => unsubCloud();
  }, [cloudUser, isDemoMode, setVitals, setMeals, setMedications, setWaterIntakeMl]);

  const handleLoginWithAccount = (account: CitizenHealthAccount) => {
    const isDemoAccount = Boolean(account.isDemo ?? account.profile.isDemo);
    setCurrentAccountId(account.accountId);
    setProfile({
      ...account.profile,
      isDemo: isDemoAccount,
    });
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
      localStorage.setItem('vitapulse_is_demo', isDemoAccount ? 'true' : 'false');
    } catch {
      // Ignore
    }
    if (cloudUser && !isDemoAccount) {
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

  const handleExportAllUserData = () => {
    const fullExportPayload = {
      exportedAt: new Date().toISOString(),
      regulation: 'Nghị định 13/2023/NĐ-CP - Quyền truy cập và xuất dữ liệu cá nhân',
      accountId: currentAccountId,
      isDemoProfile: isDemoMode,
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
    try {
      const blob = new Blob([JSON.stringify(fullExportPayload, null, 2)], {
        type: 'application/json;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vitapulse-du-lieu-ca-nhan-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Ignore in headless environments
    }
  };

  const handleDeleteAllUserData = async () => {
    clearAllAppStorage();
    if (cloudUser) {
      try {
        await deleteAllUserDataFromFirestore(cloudUser.uid);
      } catch {
        // Ignore cloud deletion errors offline
      }
      setCloudUser(null);
      setHasCalendarToken(false);
    }
    setNd13Consent(null);
    handleResetSampleData();
    setIsAuthenticated(false);
  };

  return {
    handleLoginWithAccount,
    handleApplyVisitToTracker,
    handleResetSampleData,
    handleExportAllUserData,
    handleDeleteAllUserData,
  };
}

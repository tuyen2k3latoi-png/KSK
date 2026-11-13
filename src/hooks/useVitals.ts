import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  INITIAL_MEAL_ENTRIES,
  INITIAL_VITAL_RECORDS,
  INITIAL_WORKOUT_ENTRIES,
  INITIAL_WORKOUT_SCHEDULES,
} from '../data/seedHealthData';
import {
  BhytVisitRecord,
  MealEntry,
  UserMedicalProfile,
  VitalRecord,
  WorkoutEntry,
  WorkoutSchedule,
} from '../types/health';
import {
  calculateBMI,
  calculateDailyCalorieSummary,
  calculateWorkoutScheduleAdherence,
  classifyBMI,
  classifyBloodGlucose,
  classifyBloodPressure,
  evaluateHeartRate,
  getVietnameseDayCode,
  resolvePriorityDashboardConfig,
} from '../utils/healthCalculations';
import {
  readStorageJson,
  readStorageString,
  setStorageItemDebounced,
  STORAGE_KEYS,
} from '../utils/storage';
import {
  deleteVitalFromFirestore,
  saveMealToFirestore,
  saveVitalToFirestore,
  saveWorkoutToFirestore,
  syncUserProfileToFirestore,
} from '../services/firebaseService';

interface UseVitalsParams {
  profile: UserMedicalProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserMedicalProfile>>;
  bhytVisits: BhytVisitRecord[];
  cloudUser: User | null;
  onVitalRecorded?: (record: VitalRecord) => void;
}

export function useVitals({
  profile,
  setProfile,
  bhytVisits,
  cloudUser,
  onVitalRecorded,
}: UseVitalsParams) {
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

  const [waterIntakeMl, setWaterIntakeMl] = useState<number>(() => {
    const saved = readStorageString(STORAGE_KEYS.WATER, '');
    return saved !== '' ? Number(saved) : 1750;
  });

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
    setStorageItemDebounced(STORAGE_KEYS.WATER, String(waterIntakeMl));
  }, [waterIntakeMl]);

  const latestVital: VitalRecord = vitals[0] || INITIAL_VITAL_RECORDS[0];
  const bmi = calculateBMI(latestVital.weightKg, profile.heightCm);
  const bmiEval = classifyBMI(bmi);
  const bpEval = classifyBloodPressure(latestVital.systolic, latestVital.diastolic);
  const gluEval = classifyBloodGlucose(latestVital.bloodGlucose, latestVital.glucoseContext);
  const hrEval = evaluateHeartRate(latestVital.heartRate);
  const calorieSummary = calculateDailyCalorieSummary(meals, workouts, profile.dailyCalorieGoal);
  const priorityDashboardConfig = resolvePriorityDashboardConfig(
    profile.chronicConditions,
    bhytVisits
  );
  const currentDayCode = getVietnameseDayCode();
  const workoutSchedAdherence = calculateWorkoutScheduleAdherence(
    workoutSchedules,
    currentDayCode
  );

  const handleAddVitalRecord = (newRecordData: Omit<VitalRecord, 'id'>) => {
    const newRecord: VitalRecord = {
      ...newRecordData,
      id: `vital_${Date.now()}`,
    };
    const updatedProfile = { ...profile, weightKg: newRecord.weightKg };
    setVitals((prev) => [newRecord, ...prev]);
    setProfile(updatedProfile);
    onVitalRecorded?.(newRecord);
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

  return {
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
    latestVital,
    bmi,
    bmiEval,
    bpEval,
    gluEval,
    hrEval,
    calorieSummary,
    priorityDashboardConfig,
    currentDayCode,
    workoutSchedAdherence,
    handleAddVitalRecord,
    handleDeleteVitalRecord,
    handleAddWater,
    handleResetWater,
    handleAddMeal,
    handleDeleteMeal,
    handleAddWorkout,
    handleDeleteWorkout,
    handleAddWorkoutSchedule,
    handleUpdateWorkoutSchedule,
    handleDeleteWorkoutSchedule,
  };
}

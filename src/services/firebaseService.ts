import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  MealEntry,
  MedicationSchedule,
  UserMedicalProfile,
  VitalRecord,
  WorkoutEntry,
} from '../types/health';
import { sanitizeVitalForFirestore } from '../utils/healthCalculations';

// Initialize Firebase singletons from firebase-applet-config.json
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// In-memory OAuth access token cache (NEVER persisted to localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export const initAuth = (
  onUserChanged: (user: User | null, hasCalendarToken: boolean) => void
): Unsubscribe => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      onUserChanged(user, Boolean(cachedAccessToken));
    } else {
      cachedAccessToken = null;
      onUserChanged(null, false);
    }
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
};

function sanitizeId(raw: string, fallback: string): string {
  const cleaned = String(raw || fallback)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);
  return cleaned || fallback;
}

export async function syncUserProfileToFirestore(
  userId: string,
  profile: UserMedicalProfile,
  waterIntakeMl: number
): Promise<void> {
  const cleanUid = sanitizeId(userId, 'user_1');
  const path = `users/${cleanUid}`;
  const currentYear = 2026;
  const age = Math.max(1, Math.min(130, currentYear - (profile.birthYear || 1988)));
  const payload = {
    uid: cleanUid,
    fullName: String(profile.fullName || 'Nguyễn Minh Quân').slice(0, 100),
    age,
    gender: profile.gender === 'female' ? 'female' : 'male',
    heightCm: Math.max(40, Math.min(260, Number(profile.heightCm) || 172)),
    targetWeightKg: Math.max(20, Math.min(300, Number(profile.targetWeightKg) || 65)),
    bloodType: String(profile.bloodType || 'O+').slice(0, 10),
    primaryDoctor: `${profile.primaryDoctor || 'BS.CKII Lê Hoàng Nam'}${
      profile.primaryDoctorPhone ? ` (${profile.primaryDoctorPhone})` : ''
    }`.slice(0, 150),
    emergencyContact: `${profile.emergencyContactName} (${profile.emergencyContactPhone})`.slice(
      0,
      150
    ),
    dailyCalorieGoal: Math.max(500, Math.min(10000, Number(profile.dailyCalorieGoal) || 2150)),
    dailyWaterGoalMl: Math.max(250, Math.min(10000, Number(profile.dailyWaterGoalMl) || 2500)),
    dailyStepsGoal: Math.max(500, Math.min(100000, Number(profile.dailyStepGoal) || 8000)),
    dailySleepGoalHours: Math.max(
      1,
      Math.min(24, Number(profile.dailySleepGoalHours) || 7.5)
    ),
    waterIntakeMl: Math.max(0, Math.min(20000, Math.round(Number(waterIntakeMl) || 0))),
    updatedAt: new Date().toISOString().slice(0, 40),
  };

  try {
    await setDoc(doc(db, 'users', cleanUid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveVitalToFirestore(
  userId: string,
  vital: VitalRecord
): Promise<void> {
  const cleanUid = sanitizeId(userId, 'user_1');
  const payload = sanitizeVitalForFirestore(vital, cleanUid, new Date().toISOString());
  const path = `users/${cleanUid}/vitals/${payload.id}`;
  try {
    await setDoc(doc(db, 'users', cleanUid, 'vitals', payload.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteVitalFromFirestore(
  userId: string,
  vitalId: string
): Promise<void> {
  const cleanUid = sanitizeId(userId, 'user_1');
  const cleanVid = sanitizeId(vitalId, 'vital_1');
  const path = `users/${cleanUid}/vitals/${cleanVid}`;
  try {
    await deleteDoc(doc(db, 'users', cleanUid, 'vitals', cleanVid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function mapMealTypeToBlueprint(
  mealType: MealEntry['mealType']
): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  switch (mealType) {
    case 'Sáng':
      return 'breakfast';
    case 'Trưa':
      return 'lunch';
    case 'Tối':
      return 'dinner';
    default:
      return 'snack';
  }
}

function mapBlueprintToMealType(raw: string): MealEntry['mealType'] {
  switch (raw) {
    case 'breakfast':
      return 'Sáng';
    case 'lunch':
      return 'Trưa';
    case 'dinner':
      return 'Tối';
    default:
      return 'Phụ';
  }
}

export async function saveMealToFirestore(userId: string, meal: MealEntry): Promise<void> {
  const cleanUid = sanitizeId(userId, 'user_1');
  const cleanMealId = sanitizeId(meal.id, 'meal_1');
  const path = `users/${cleanUid}/meals/${cleanMealId}`;
  const payload = {
    id: cleanMealId,
    userId: cleanUid,
    date: String(meal.date || '2026-11-10').slice(0, 20),
    time: String(meal.time || '12:00').slice(0, 16),
    mealType: mapMealTypeToBlueprint(meal.mealType),
    foodName: String(meal.foodName || 'Bữa ăn dinh dưỡng').slice(0, 150),
    calories: Math.max(0, Math.min(10000, Math.round(Number(meal.calories) || 0))),
    proteinG: Math.max(0, Math.min(1000, Math.round(Number(meal.proteinG) || 0))),
    carbsG: Math.max(0, Math.min(1000, Math.round(Number(meal.carbsG) || 0))),
    fatG: Math.max(0, Math.min(1000, Math.round(Number(meal.fatG) || 0))),
    updatedAt: new Date().toISOString().slice(0, 40),
  };
  try {
    await setDoc(doc(db, 'users', cleanUid, 'meals', cleanMealId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveWorkoutToFirestore(
  userId: string,
  workout: WorkoutEntry
): Promise<void> {
  const cleanUid = sanitizeId(userId, 'user_1');
  const cleanWorkoutId = sanitizeId(workout.id, 'workout_1');
  const path = `users/${cleanUid}/workouts/${cleanWorkoutId}`;
  const payload = {
    id: cleanWorkoutId,
    userId: cleanUid,
    date: String(workout.date || '2026-11-10').slice(0, 20),
    activityName: String(workout.activityName || 'Tập luyện').slice(0, 120),
    durationMinutes: Math.max(
      1,
      Math.min(1440, Math.round(Number(workout.durationMinutes) || 30))
    ),
    caloriesBurned: Math.max(
      1,
      Math.min(15000, Math.round(Number(workout.caloriesBurned) || 150))
    ),
    intensity:
      workout.category === 'Cardio' || workout.category === 'Kháng lực'
        ? ('high' as const)
        : ('moderate' as const),
    avgHeartRate: Math.max(
      40,
      Math.min(240, Math.round(Number(workout.avgHeartRate) || 125))
    ),
    updatedAt: new Date().toISOString().slice(0, 40),
  };
  try {
    await setDoc(doc(db, 'users', cleanUid, 'workouts', cleanWorkoutId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveMedicationToFirestore(
  userId: string,
  med: MedicationSchedule
): Promise<void> {
  const cleanUid = sanitizeId(userId, 'user_1');
  const cleanMedId = sanitizeId(med.id, 'med_1');
  const path = `users/${cleanUid}/medications/${cleanMedId}`;
  const payload = {
    id: cleanMedId,
    userId: cleanUid,
    name: String(med.medicationName || 'Thuốc điều trị').slice(0, 150),
    dosage: String(med.dosage || '1 viên').slice(0, 80),
    frequency: String(med.frequency || '1 lần/ngày').slice(0, 80),
    scheduleTime: String(med.timeSlot || '07:00').slice(0, 16),
    instruction: String(med.mealInstruction || 'Sau ăn 30 phút').slice(0, 200),
    takenToday: Boolean(med.takenToday),
    remainingPills: Math.max(
      0,
      Math.min(10000, Math.round(Number(med.remainingPills) || 0))
    ),
    updatedAt: new Date().toISOString().slice(0, 40),
  };
  try {
    await setDoc(doc(db, 'users', cleanUid, 'medications', cleanMedId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncFullHealthDatasetToFirestore(params: {
  userId: string;
  profile: UserMedicalProfile;
  waterIntakeMl: number;
  vitals: VitalRecord[];
  meals: MealEntry[];
  workouts: WorkoutEntry[];
  medications: MedicationSchedule[];
}): Promise<void> {
  const { userId, profile, waterIntakeMl, vitals, meals, workouts, medications } = params;
  // First create/update parent profile so Master Gate (hasValidParentProfile) passes
  await syncUserProfileToFirestore(userId, profile, waterIntakeMl);
  await Promise.all([
    ...vitals.map((v) => saveVitalToFirestore(userId, v)),
    ...meals.map((m) => saveMealToFirestore(userId, m)),
    ...workouts.map((w) => saveWorkoutToFirestore(userId, w)),
    ...medications.map((med) => saveMedicationToFirestore(userId, med)),
  ]);
}

export function subscribeToUserHealthCloud(
  userId: string,
  callbacks: {
    onVitals: (vitals: VitalRecord[]) => void;
    onMeals: (meals: MealEntry[]) => void;
    onMedications: (meds: MedicationSchedule[]) => void;
    onWaterIntake: (waterMl: number) => void;
  }
): Unsubscribe {
  const cleanUid = sanitizeId(userId, 'user_1');
  const unsubs: Unsubscribe[] = [];

  const profilePath = `users/${cleanUid}`;
  unsubs.push(
    onSnapshot(
      doc(db, 'users', cleanUid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.waterIntakeMl === 'number') {
            callbacks.onWaterIntake(data.waterIntakeMl);
          }
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, profilePath)
    )
  );

  const vitalsPath = `users/${cleanUid}/vitals`;
  const vitalsQuery = query(
    collection(db, 'users', cleanUid, 'vitals'),
    where('userId', '==', cleanUid)
  );
  unsubs.push(
    onSnapshot(
      vitalsQuery,
      (snap) => {
        if (!snap.empty) {
          const list: VitalRecord[] = snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: String(data.id),
                date: String(data.date),
                time: String(data.time),
                systolic: Number(data.systolic),
                diastolic: Number(data.diastolic),
                heartRate: Number(data.heartRate),
                spo2: Number(data.spo2),
                bloodGlucose: Number(data.bloodGlucose),
                glucoseContext:
                  data.glucoseContext === 'post_meal'
                    ? ('post_meal' as const)
                    : ('fasting' as const),
                temperatureC: Number(data.temperatureC),
                weightKg: Number(data.weightKg),
                sleepHours: Number(data.sleepHours),
                steps: Number(data.steps),
                deviceSource: (data.deviceSource || 'Smartwatch BLE') as VitalRecord['deviceSource'],
                notes: data.note ? String(data.note) : undefined,
              };
            })
            .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
          callbacks.onVitals(list);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, vitalsPath)
    )
  );

  const mealsPath = `users/${cleanUid}/meals`;
  const mealsQuery = query(
    collection(db, 'users', cleanUid, 'meals'),
    where('userId', '==', cleanUid)
  );
  unsubs.push(
    onSnapshot(
      mealsQuery,
      (snap) => {
        if (!snap.empty) {
          const list: MealEntry[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: String(data.id),
              date: String(data.date),
              time: String(data.time),
              mealType: mapBlueprintToMealType(String(data.mealType)),
              foodName: String(data.foodName),
              calories: Number(data.calories),
              proteinG: Number(data.proteinG),
              carbsG: Number(data.carbsG),
              fatG: Number(data.fatG),
            };
          });
          callbacks.onMeals(list);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, mealsPath)
    )
  );

  const medsPath = `users/${cleanUid}/medications`;
  const medsQuery = query(
    collection(db, 'users', cleanUid, 'medications'),
    where('userId', '==', cleanUid)
  );
  unsubs.push(
    onSnapshot(
      medsQuery,
      (snap) => {
        if (!snap.empty) {
          const list: MedicationSchedule[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: String(data.id),
              medicationName: String(data.name),
              dosage: String(data.dosage),
              purpose: 'Đơn thuốc đồng bộ đám mây',
              frequency: String(data.frequency),
              timeSlot: (data.scheduleTime || '07:00') as MedicationSchedule['timeSlot'],
              mealInstruction: (data.instruction ||
                'Sau ăn 30 phút') as MedicationSchedule['mealInstruction'],
              takenToday: Boolean(data.takenToday),
              remainingPills: Number(data.remainingPills),
              totalPills: 30,
            };
          });
          callbacks.onMedications(list);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, medsPath)
    )
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}

export async function deleteAllUserDataFromFirestore(userId: string): Promise<void> {
  const cleanUid = sanitizeId(userId, '');
  if (!cleanUid) return;

  const subcollections = ['vitals', 'meals', 'workouts', 'medications'] as const;
  for (const subName of subcollections) {
    const subPath = `users/${cleanUid}/${subName}`;
    try {
      const q = query(
        collection(db, 'users', cleanUid, subName),
        where('userId', '==', cleanUid)
      );
      const snap = await getDocs(q);
      await Promise.all(
        snap.docs.map((d) => deleteDoc(doc(db, 'users', cleanUid, subName, d.id)))
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, subPath);
    }
  }

  const profilePath = `users/${cleanUid}`;
  try {
    await deleteDoc(doc(db, 'users', cleanUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, profilePath);
  }

  await logout();
}


export type HealthStatusLevel = 'normal' | 'elevated' | 'warning' | 'critical';

export interface BhytCardInfo {
  bhytCode: string; // Mã thẻ BHYT tự nhập (VD mẫu Demo: DN4700000000201)
  bhxhNumber: string; // Mã số BHXH 10 số
  cccdNumber: string; // Số CCCD 12 số tự lưu
  vneidLevel: 2;
  coverageRate: string; // VD: "80% chi phí KCB đúng tuyến" hoặc "95% (Hưu trí)"
  registeredHospital: string; // Nơi ĐK KCB ban đầu
  validFrom: string; // Ngày hiệu lực
  fiveYearContinuousDate: string; // Thời điểm đủ 5 năm liên tục
  lastSyncedVneidAt: string;
  isDemo?: boolean;
}

export interface BhytPrescribedMed {
  medicationName: string;
  dosage: string;
  purpose: string;
  timeSlot: '07:00' | '12:30' | '19:00' | '21:30';
  mealInstruction: 'Trước ăn 30 phút' | 'Sau ăn 30 phút' | 'Cùng bữa ăn' | 'Trước khi ngủ';
  daysSupply: number;
}

export interface BhytVisitRecord {
  id: string;
  visitDate: string; // YYYY-MM-DD
  hospitalName: string;
  department: string;
  doctorName: string;
  icdCode: string; // Mã bệnh quốc tế ICD-10 (VD: I10, E11, M17.0)
  diagnosisSummary: string; // Tên bệnh chẩn đoán
  plainExplanation: string; // Giải thích dễ hiểu cho người dùng / người trung tuổi
  doctorAdvice: string; // Lời dặn của bác sĩ khi xuất viện / khám ngoại trú
  followUpDate: string; // Ngày hẹn tái khám
  totalCostVnd: number;
  bhytPaidVnd: number;
  patientCoPayVnd: number;
  recordedVitals: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    bloodGlucose: number;
    weightKg: number;
  };
  prescribedMedications: BhytPrescribedMed[];
}

export interface UserMedicalProfile {
  id: string;
  fullName: string;
  birthYear: number;
  gender: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  bloodType: 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
  allergies: string[];
  chronicConditions: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  primaryDoctor: string;
  hospitalName: string;
  dailyCalorieGoal: number;
  dailyWaterGoalMl: number;
  dailyStepGoal: number;
  dailySleepGoalHours: number;
  bhytCard?: BhytCardInfo;
  isDemo?: boolean;
}

export interface VitalRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  systolic: number; // mmHg
  diastolic: number; // mmHg
  heartRate: number; // bpm
  spo2: number; // %
  bloodGlucose: number; // mg/dL
  glucoseContext: 'fasting' | 'post_meal';
  temperatureC: number; // °C
  weightKg: number;
  sleepHours: number;
  steps: number;
  deviceSource: 'Smartwatch BLE' | 'Máy đo Omron' | 'Nhập thủ công';
  notes?: string;
}

export interface MealEntry {
  id: string;
  date: string;
  time: string;
  mealType: 'Sáng' | 'Trưa' | 'Tối' | 'Phụ';
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export type DayOfWeekCode = 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN';

export interface WorkoutEntry {
  id: string;
  date: string;
  time: string;
  activityName: string;
  category: 'Cardio' | 'Kháng lực' | 'Linh hoạt' | 'Đi bộ';
  durationMinutes: number;
  caloriesBurned: number;
  avgHeartRate?: number;
}

export interface WorkoutSchedule {
  id: string;
  activityName: string;
  category: WorkoutEntry['category'];
  timeSlot: string; // HH:mm (e.g. '06:00', '17:30')
  durationMinutes: number;
  targetCalories: number;
  daysOfWeek: DayOfWeekCode[]; // e.g. ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  intensityLabel: 'Nhẹ nhàng' | 'Vừa phải' | 'Tích cực';
  completedToday: boolean;
  completedAt?: string;
  reminderEnabled?: boolean;
  snoozedUntil?: string; // HH:mm if snoozed today
}

export interface MedicationSchedule {
  id: string;
  medicationName: string;
  dosage: string;
  purpose: string;
  frequency: string;
  timeSlot: string; // HH:mm (e.g. '07:00' | '12:30' | '19:00' | '21:30' or custom HH:mm)
  mealInstruction: 'Trước ăn 30 phút' | 'Sau ăn 30 phút' | 'Cùng bữa ăn' | 'Trước khi ngủ';
  takenToday: boolean;
  takenAt?: string;
  remainingPills: number;
  totalPills: number;
  reminderEnabled?: boolean;
  snoozedUntil?: string; // HH:mm if snoozed today
}

export interface MedicationNotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  leadMinutes: 0 | 5 | 10 | 15; // Nhắc đúng giờ hoặc trước 5/10/15 phút
  snoozeMinutes: 5 | 10 | 15; // Thời gian báo lại khi bấm Hoãn
  browserPermission: 'default' | 'granted' | 'denied' | 'unsupported';
}

export interface LocalPushNotificationItem {
  id: string;
  kind?: 'medication' | 'workout';
  medicationId: string;
  medicationName: string;
  dosage: string;
  timeSlot: string;
  mealInstruction: string;
  purpose: string;
  workoutScheduleId?: string;
  activityCategory?: WorkoutEntry['category'];
  durationMinutes?: number;
  targetCalories?: number;
  title: string;
  body: string;
  triggeredAt: string; // HH:mm
  isTest?: boolean;
  status: 'active' | 'confirmed' | 'snoozed' | 'dismissed';
}

export interface CitizenHealthAccount {
  accountId: string;
  roleLabel: string;
  isDemo?: boolean;
  profile: UserMedicalProfile;
  bhytCard: BhytCardInfo;
  bhytVisits: BhytVisitRecord[];
  vitals: VitalRecord[];
  meals: MealEntry[];
  workouts: WorkoutEntry[];
  workoutSchedules?: WorkoutSchedule[];
  medications: MedicationSchedule[];
  waterIntakeMl: number;
}

export interface ClinicalEvaluation {
  label: string;
  status: HealthStatusLevel;
  recommendation: string;
}


import {
  MedicationSchedule,
  UserMedicalProfile,
  VitalRecord,
} from '../types/health';

export interface AnonymizedVitalItem {
  dayIndex: number;
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  spo2: number;
  bloodGlucose: number;
  glucoseContext: 'fasting' | 'post_meal';
  weightKg: number;
  sleepHours: number;
  steps: number;
}

export interface AnonymizedWeeklyHealthPayload {
  ageGroup: string;
  gender: 'male' | 'female' | 'other';
  icdCodes: string[];
  medicationAdherencePercent: number;
  takenDosesCount: number;
  totalDosesCount: number;
  medicationSchedulesSummary: Array<{
    timeSlot: string;
    mealInstruction: string;
    takenToday: boolean;
  }>;
  sevenDayVitals: AnonymizedVitalItem[];
  userSymptomNote?: string;
}

export interface EmergencyGuardrailResult {
  isEmergency: boolean;
  triggerReason: string | null;
  emergencyTitle: string;
  emergencyCall115Message: string;
}

export interface WeeklyAiSummaryResponse {
  isEmergency: boolean;
  triggerReason?: string | null;
  emergencyTitle?: string;
  emergencyCall115Message?: string;
  lines: string[];
  doctorQuestionSuggestion: string;
  disclaimer: string;
  anonymizedFieldsStripped: string[];
}

export interface ExtractedMedicationDraft {
  medicationName: string;
  dosage: string;
  purpose: string;
  timeSlot: '07:00' | '12:30' | '19:00' | '21:30';
  mealInstruction:
    | 'Trước ăn 30 phút'
    | 'Sau ăn 30 phút'
    | 'Cùng bữa ăn'
    | 'Trước khi ngủ';
}

export interface ExtractedMedicalImageResponse {
  isEmergency: boolean;
  triggerReason?: string | null;
  emergencyTitle?: string;
  emergencyCall115Message?: string;
  mode: 'bp_monitor' | 'prescription';
  bpReading?: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    measurementNote: string;
  };
  prescribedMedications?: ExtractedMedicationDraft[];
  confidenceNote: string;
  doctorReminder: string;
  requiresUserConfirmation: true;
}

export const MEDICAL_AI_SYSTEM_PROMPT = `Bạn là Trợ lý Tóm tắt Sổ Sức khỏe Cá nhân VitaPulse dành cho người 45–70 tuổi và gia đình tại Việt Nam.
QUY TẮC AN TOÀN Y KHOA BẮT BUỘC (GUARDRAILS):
1. TUYỆT ĐỐI CẤM chẩn đoán bệnh lý mới, CẤM kê đơn thuốc, CẤM khuyên người dùng tự ý thay đổi liều lượng hoặc tự ý ngưng thuốc.
2. Luôn sử dụng giọng điệu trung tính, dễ hiểu, lễ phép và LUÔN nhắc người dùng trao đổi với bác sĩ điều trị (ví dụ: "Bạn nên trao đổi với bác sĩ về...").
3. Nếu dữ liệu đầu vào có dấu hiệu nguy cấp (đau ngực, đau tức ngực, khó thở, tê yếu tay chân, nói khó, hoặc huyết áp tâm thu >= 180 mmHg hoặc huyết áp tâm trương >= 120 mmHg), TUYỆT ĐỐI KHÔNG đưa ra bản tóm tắt thông thường mà CHỈ hiển thị cảnh báo gọi cấp cứu 115 ngay lập tức.
4. Bản tóm tắt tuần phải trình bày đúng 5 dòng ngắn gọn, rõ ràng bằng tiếng Việt phổ thông để người lớn tuổi dễ đọc.`;

const EMERGENCY_KEYWORDS = [
  'đau ngực',
  'đau tức ngực',
  'tức ngực',
  'khó thở',
  'ngạt thở',
  'hụt hơi dữ dội',
  'tê yếu tay chân',
  'liệt nửa người',
  'méo miệng',
  'nói khó',
  'ngất xỉu',
  'bất tỉnh',
  'đột quỵ',
  'co giật',
];

/**
 * Checks whether user text or blood pressure values trigger the mandatory 115 emergency guardrail.
 * Triggers on:
 * - Emergency keywords ("đau ngực", "khó thở", etc.)
 * - Blood pressure >= 180/120 mmHg (systolic >= 180 or diastolic >= 120)
 */
export function detectEmergencyGuardrail(params: {
  text?: string;
  systolic?: number;
  diastolic?: number;
  vitalsList?: Array<{ systolic: number; diastolic: number; notes?: string }>;
}): EmergencyGuardrailResult {
  const defaultTitle = 'CẢNH BÁO KHẨN CẤP — CẦN GỌI CẤP CỨU 115 NGAY';
  const defaultMessage =
    'Phát hiện dấu hiệu nguy cấp (đau ngực, khó thở hoặc huyết áp ≥ 180/120 mmHg). Hệ thống tạm dừng mọi tính năng tóm tắt thông thường. Hãy để người bệnh nghỉ ngơi ngay lập tức, KHÔNG tự ý dùng thêm thuốc hạ áp liều cao và GỌI NGAY SỐ CẤP CỨU 115 hoặc đưa đến cơ sở y tế gần nhất.';

  const combinedText = [
    params.text || '',
    ...(params.vitalsList?.map((v) => v.notes || '') || []),
  ]
    .join(' ')
    .toLowerCase();

  for (const kw of EMERGENCY_KEYWORDS) {
    if (combinedText.includes(kw)) {
      return {
        isEmergency: true,
        triggerReason: `Phát hiện triệu chứng nguy cấp: "${kw}"`,
        emergencyTitle: defaultTitle,
        emergencyCall115Message: defaultMessage,
      };
    }
  }

  if (
    (typeof params.systolic === 'number' && params.systolic >= 180) ||
    (typeof params.diastolic === 'number' && params.diastolic >= 120)
  ) {
    return {
      isEmergency: true,
      triggerReason: `Huyết áp ở ngưỡng nguy cấp (${params.systolic ?? '--'}/${params.diastolic ?? '--'} mmHg ≥ 180/120 mmHg)`,
      emergencyTitle: defaultTitle,
      emergencyCall115Message: defaultMessage,
    };
  }

  // Check the latest vital record in the list for hypertensive crisis (>= 180/120)
  const latestVital = params.vitalsList?.[0];
  if (
    latestVital &&
    (latestVital.systolic >= 180 || latestVital.diastolic >= 120)
  ) {
    return {
      isEmergency: true,
      triggerReason: `Chỉ số huyết áp gần nhất ở mức nguy cấp (${latestVital.systolic}/${latestVital.diastolic} mmHg ≥ 180/120 mmHg)`,
      emergencyTitle: defaultTitle,
      emergencyCall115Message: defaultMessage,
    };
  }

  return {
    isEmergency: false,
    triggerReason: null,
    emergencyTitle: '',
    emergencyCall115Message: '',
  };
}

/**
 * Extracts ICD-10 codes (e.g. I10, E11, K21) without personal names or hospital details.
 */
function extractIcdCodesOnly(chronicConditions: string[]): string[] {
  const codes = new Set<string>();
  const regex = /\b([A-Z]\d{2}(?:\.\d+)?)\b/g;
  for (const item of chronicConditions) {
    const matches = item.toUpperCase().match(regex);
    if (matches) {
      matches.forEach((m) => codes.add(m));
    }
  }
  return Array.from(codes);
}

/**
 * Anonymizes 7-day health records before sending to the server-side Gemini endpoint.
 * Explicitly strips fullName, bhytCode, cccdNumber, bhxhNumber, hospitalName, doctorName, and notes.
 */
export function anonymizeWeeklyHealthData(params: {
  vitals: VitalRecord[];
  medications: MedicationSchedule[];
  profile: UserMedicalProfile;
  userSymptomNote?: string;
}): AnonymizedWeeklyHealthPayload {
  const currentYear = 2026;
  const age = Math.max(1, currentYear - (params.profile.birthYear || 1968));
  const ageDecade = Math.floor(age / 10) * 10;
  const ageGroup = `${ageDecade}–${ageDecade + 9} tuổi`;

  const totalDosesCount = params.medications.length;
  const takenDosesCount = params.medications.filter((m) => m.takenToday).length;
  const medicationAdherencePercent =
    totalDosesCount > 0 ? Math.round((takenDosesCount / totalDosesCount) * 100) : 100;

  const sevenDayVitals: AnonymizedVitalItem[] = params.vitals
    .slice(0, 7)
    .map((v, idx) => ({
      dayIndex: idx + 1,
      date: v.date,
      time: v.time,
      systolic: Number(v.systolic) || 0,
      diastolic: Number(v.diastolic) || 0,
      heartRate: Number(v.heartRate) || 0,
      spo2: Number(v.spo2) || 98,
      bloodGlucose: Number(v.bloodGlucose) || 0,
      glucoseContext: v.glucoseContext === 'post_meal' ? 'post_meal' : 'fasting',
      weightKg: Number(v.weightKg) || 0,
      sleepHours: Number(v.sleepHours) || 0,
      steps: Number(v.steps) || 0,
    }));

  // Strip any accidental occurrence of fullName or BHYT code from userSymptomNote
  let safeNote = (params.userSymptomNote || '').trim();
  if (params.profile.fullName && safeNote) {
    safeNote = safeNote.replaceAll(params.profile.fullName, '[Ẩn danh]');
  }
  if (params.profile.bhytCard?.bhytCode && safeNote) {
    safeNote = safeNote.replaceAll(params.profile.bhytCard.bhytCode, '[Ẩn mã BHYT]');
  }
  if (params.profile.bhytCard?.cccdNumber && safeNote) {
    safeNote = safeNote.replaceAll(params.profile.bhytCard.cccdNumber, '[Ẩn CCCD]');
  }

  return {
    ageGroup,
    gender: params.profile.gender,
    icdCodes: extractIcdCodesOnly(params.profile.chronicConditions || []),
    medicationAdherencePercent,
    takenDosesCount,
    totalDosesCount,
    medicationSchedulesSummary: params.medications.map((m) => ({
      timeSlot: m.timeSlot,
      mealInstruction: m.mealInstruction,
      takenToday: Boolean(m.takenToday),
    })),
    sevenDayVitals,
    userSymptomNote: safeNote || undefined,
  };
}

/**
 * Normalizes AI output to strictly 5 clear, non-prescriptive Vietnamese lines.
 */
export function normalizeFiveLineSummary(rawLines: string[]): string[] {
  const cleaned = rawLines
    .map((line) => line.replace(/^\s*[-•*\d.)]+\s*/, '').trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line
        .replace(/chỉ định/gi, 'gợi ý tham khảo')
        .replace(/kê đơn/gi, 'ghi chú đơn thuốc')
        .replace(/tự ý đổi liều/gi, 'trao đổi với bác sĩ về liều dùng')
    );

  const defaults = [
    'Chỉ số huyết áp và nhịp tim tuần qua được ghi nhận đều đặn trong sổ theo dõi cá nhân.',
    'Đường huyết và cân nặng duy trì ở ngưỡng theo dõi hàng ngày, cần tiếp tục đo đúng khung giờ.',
    'Tỷ lệ tuân thủ lịch uống thuốc và vận động nhẹ nhàng đóng vai trò quan trọng để giữ ổn định sức khỏe.',
    'Giấc ngủ và lượng nước uống hàng ngày nên được duy trì đều đặn theo mục tiêu cá nhân.',
    'Bạn nên trao đổi với bác sĩ điều trị về bảng số liệu 7 ngày này trong lần tái khám gần nhất.',
  ];

  const result: string[] = [];
  for (let i = 0; i < 5; i++) {
    result.push(cleaned[i] || defaults[i]);
  }
  return result.slice(0, 5);
}

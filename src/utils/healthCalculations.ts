import {
  BhytVisitRecord,
  ClinicalEvaluation,
  DayOfWeekCode,
  HealthStatusLevel,
  MealEntry,
  MedicationSchedule,
  VitalRecord,
  WorkoutEntry,
  WorkoutSchedule,
} from '../types/health';

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function classifyBMI(bmi: number): ClinicalEvaluation {
  if (bmi <= 0) {
    return {
      label: 'Chưa xác định',
      status: 'warning',
      recommendation: 'Bạn nên cập nhật chiều cao và cân nặng hợp lệ để tính chỉ số tham khảo.',
    };
  }
  if (bmi < 18.5) {
    return {
      label: 'Thiếu cân',
      status: 'elevated',
      recommendation:
        'Bạn nên trao đổi với bác sĩ hoặc chuyên gia dinh dưỡng về chế độ ăn giàu đạm và năng lượng phù hợp.',
    };
  }
  if (bmi < 23.0) {
    return {
      label: 'Bình thường (Chuẩn châu Á)',
      status: 'normal',
      recommendation: 'Bạn có thể duy trì chế độ ăn uống cân bằng và vận động nhẹ nhàng mỗi ngày.',
    };
  }
  if (bmi < 25.0) {
    return {
      label: 'Thừa cân nhẹ (Tiền béo phì)',
      status: 'elevated',
      recommendation:
        'Bạn nên trao đổi với bác sĩ về việc giảm tinh bột tinh chế và tăng vận động phù hợp thể trạng.',
    };
  }
  if (bmi < 30.0) {
    return {
      label: 'Béo phì độ I',
      status: 'warning',
      recommendation:
        'Bạn nên trao đổi với bác sĩ về kế hoạch kiểm soát cân nặng và kiểm tra mỡ máu định kỳ.',
    };
  }
  return {
    label: 'Béo phì độ II — Cần chú ý ngay',
    status: 'critical',
    recommendation:
      'Cần chú ý ngay: Bạn nên trao đổi với bác sĩ chuyên khoa dinh dưỡng để được tư vấn kiểm soát cân nặng an toàn. Nếu có khó thở khi nằm hoặc đau ngực, hãy gọi cấp cứu 115.',
  };
}

export function classifyBloodPressure(systolic: number, diastolic: number): ClinicalEvaluation {
  if (systolic >= 180 || diastolic >= 120) {
    return {
      label: 'Cần chú ý ngay (Huyết áp rất cao)',
      status: 'critical',
      recommendation:
        'Cần chú ý ngay: Bạn nên nghỉ ngơi tại chỗ và liên hệ cơ sở y tế. Nếu kèm đau ngực, khó thở, đau đầu dữ dội, mờ mắt hoặc tê yếu tay chân, hãy gọi cấp cứu 115 ngay.',
    };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      label: 'Cần chú ý ngay (Tăng huyết áp Độ 2)',
      status: 'critical',
      recommendation:
        'Cần chú ý ngay: Bạn nên trao đổi sớm với bác sĩ về chỉ số huyết áp này và giảm ăn mặn. Nếu huyết áp ≥ 180/120 mmHg hoặc kèm đau ngực, khó thở, hãy gọi cấp cứu 115.',
    };
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return {
      label: 'Tăng huyết áp Độ 1',
      status: 'warning',
      recommendation:
        'Bạn nên trao đổi với bác sĩ về việc theo dõi huyết áp sáng - tối và giảm lượng muối trong bữa ăn.',
    };
  }
  if (systolic > 120 && systolic <= 129 && diastolic < 80) {
    return {
      label: 'Huyết áp bình thường cao',
      status: 'elevated',
      recommendation:
        'Bạn nên trao đổi với bác sĩ về lối sống lành mạnh, ngủ đủ giấc và hạn chế căng thẳng.',
    };
  }
  if (systolic < 90 || diastolic < 60) {
    return {
      label: 'Huyết áp thấp',
      status: 'elevated',
      recommendation:
        'Bạn nên uống đủ nước, tránh đứng dậy đột ngột và trao đổi với bác sĩ nếu hay chóng mặt.',
    };
  }
  return {
    label: 'Huyết áp tối ưu',
    status: 'normal',
    recommendation:
      'Chỉ số huyết áp tham khảo đang ổn định. Bạn nên duy trì thói quen sinh hoạt lành mạnh và trao đổi với bác sĩ khi tái khám định kỳ.',
  };
}

export function classifyBloodGlucose(
  glucoseMgDl: number,
  context: 'fasting' | 'post_meal'
): ClinicalEvaluation {
  if (glucoseMgDl < 70) {
    return {
      label: 'Cần chú ý ngay (Hạ đường huyết)',
      status: 'critical',
      recommendation:
        'Cần chú ý ngay: Bạn nên bổ sung nước đường hoặc sữa ngọt, đo lại sau 15 phút và trao đổi với bác sĩ. Nếu lơ mơ, vã mồ hôi lạnh nhiều hoặc ngất xỉu, hãy gọi cấp cứu 115.',
    };
  }
  if (context === 'fasting') {
    if (glucoseMgDl <= 99) {
      return {
        label: 'Đường huyết lúc đói bình thường',
        status: 'normal',
        recommendation:
          'Chỉ số đường huyết lúc đói tham khảo trong ngưỡng bình thường. Bạn nên duy trì chế độ ăn cân đối.',
      };
    }
    if (glucoseMgDl <= 125) {
      return {
        label: 'Tiền đái tháo đường (Lúc đói)',
        status: 'warning',
        recommendation:
          'Bạn nên trao đổi với bác sĩ về việc xét nghiệm HbA1c định kỳ và hạn chế thực phẩm nhiều đường đơn.',
      };
    }
    return {
      label: 'Cần chú ý ngay (Đường huyết lúc đói cao)',
      status: 'critical',
      recommendation:
        'Cần chú ý ngay: Bạn nên trao đổi sớm với bác sĩ nội tiết về chỉ số đường huyết này. Nếu kèm khát nước dữ dội, nôn ói, thở nhanh sâu hoặc lơ mơ, hãy gọi cấp cứu 115.',
    };
  } else {
    if (glucoseMgDl < 140) {
      return {
        label: 'Đường huyết sau ăn bình thường',
        status: 'normal',
        recommendation: 'Chỉ số đường huyết sau ăn tham khảo đang ổn định.',
      };
    }
    if (glucoseMgDl <= 199) {
      return {
        label: 'Rối loạn dung nạp Glucose',
        status: 'warning',
        recommendation:
          'Bạn nên trao đổi với bác sĩ về chế độ ăn giảm tinh bột trắng và đi bộ nhẹ nhàng sau bữa ăn.',
      };
    }
    return {
      label: 'Cần chú ý ngay (Đường huyết sau ăn cao)',
      status: 'critical',
      recommendation:
        'Cần chú ý ngay: Bạn nên trao đổi với bác sĩ về khẩu phần ăn và lịch dùng thuốc hiện tại. Nếu kèm mệt lả, khó thở hoặc lơ mơ, hãy gọi cấp cứu 115.',
    };
  }
}

export function evaluateHeartRate(bpm: number): ClinicalEvaluation {
  if (bpm < 50) {
    return {
      label: 'Nhịp tim chậm',
      status: 'elevated',
      recommendation:
        'Bạn nên trao đổi với bác sĩ nếu nhịp tim chậm kèm cảm giác chóng mặt hoặc mệt mỏi.',
    };
  }
  if (bpm <= 90) {
    return {
      label: 'Nhịp tim nghỉ ngơi chuẩn',
      status: 'normal',
      recommendation: 'Nhịp tim nghỉ ngơi tham khảo ổn định.',
    };
  }
  if (bpm <= 105) {
    return {
      label: 'Nhịp tim hơi nhanh',
      status: 'elevated',
      recommendation:
        'Bạn nên nghỉ ngơi, hít thở sâu, hạn chế trà/cà phê đậm và trao đổi với bác sĩ nếu kéo dài.',
    };
  }
  return {
    label: 'Nhịp tim nhanh',
    status: 'warning',
    recommendation:
      'Bạn nên nghỉ ngơi tại chỗ và trao đổi với bác sĩ. Nếu kèm đau tức ngực hoặc khó thở, hãy gọi cấp cứu 115.',
  };
}

export function evaluateSpO2(spo2: number): ClinicalEvaluation {
  if (spo2 >= 96) {
    return {
      label: 'Bão hòa Oxy tối ưu',
      status: 'normal',
      recommendation: 'Độ bão hòa oxy trong máu tham khảo ở mức tốt.',
    };
  }
  if (spo2 >= 93) {
    return {
      label: 'Bão hòa Oxy giảm nhẹ',
      status: 'elevated',
      recommendation:
        'Bạn nên ngồi thẳng hít thở sâu nơi thoáng khí và trao đổi với bác sĩ nếu chỉ số không cải thiện.',
    };
  }
  return {
    label: 'Cần chú ý ngay (SpO2 thấp)',
    status: 'critical',
    recommendation:
      'Cần chú ý ngay: Bạn nên trao đổi ngay với nhân viên y tế. Nếu kèm khó thở, tím tái môi hoặc đau ngực, hãy gọi cấp cứu 115 ngay.',
  };
}

/**
 * Tính "Chỉ số tổng hợp tham khảo" (không phải chẩn đoán y khoa).
 * Quy tắc "Cap" (Giới hạn trần an toàn):
 * - KHÔNG ĐƯỢC vào mức "Tối ưu" nếu tuân thủ thuốc < 80% HOẶC có bất kỳ chỉ số nào ở mức warning / critical.
 * - Nếu có chỉ số ở mức critical: điểm tối đa bị giới hạn (cap) ở 74 và hiển thị "Cần chú ý ngay" nếu < 60 (hoặc cảnh báo rõ).
 * - Nếu có chỉ số ở mức warning hoặc tuân thủ thuốc < 80%: điểm tối đa bị giới hạn (cap) ở 84 (mức "Khá tốt", không vào "Tối ưu").
 */
export function calculateHealthScore(
  latest: VitalRecord,
  bmi: number,
  adherencePercent: number
): {
  score: number;
  grade: string;
  status: HealthStatusLevel;
  cappedByReason?: string;
} {
  let score = 100;

  const bp = classifyBloodPressure(latest.systolic, latest.diastolic);
  if (bp.status === 'elevated') score -= 6;
  if (bp.status === 'warning') score -= 14;
  if (bp.status === 'critical') score -= 26;

  const glucose = classifyBloodGlucose(latest.bloodGlucose, latest.glucoseContext);
  if (glucose.status === 'warning') score -= 10;
  if (glucose.status === 'critical') score -= 20;

  const hr = evaluateHeartRate(latest.heartRate);
  if (hr.status === 'elevated') score -= 5;
  if (hr.status === 'warning') score -= 12;

  const spo2Eval = evaluateSpO2(latest.spo2);
  if (spo2Eval.status === 'elevated') score -= 8;
  if (spo2Eval.status === 'critical') score -= 22;

  const bmiEval = classifyBMI(bmi);
  if (bmiEval.status === 'elevated') score -= 4;
  if (bmiEval.status === 'warning') score -= 8;
  if (bmiEval.status === 'critical') score -= 14;

  if (latest.sleepHours < 6.5) score -= 6;
  if (latest.steps < 5000) score -= 4;
  if (adherencePercent < 80) score -= 5;

  const evaluations = [bp, glucose, hr, spo2Eval, bmiEval];
  const hasCriticalMetric = evaluations.some((e) => e.status === 'critical');
  const hasWarningMetric = evaluations.some((e) => e.status === 'warning');
  const hasLowAdherence = adherencePercent < 80;

  let cappedScore = Math.max(25, Math.min(100, Math.round(score)));
  let cappedByReason: string | undefined;

  if (hasCriticalMetric) {
    // Không bao giờ được vào "Tối ưu" hoặc "Khá tốt" khi có chỉ số critical
    cappedScore = Math.min(cappedScore, 59);
    cappedByReason = 'Giới hạn do có chỉ số sinh tồn ở mức Cần chú ý ngay';
  } else if (hasWarningMetric) {
    // Không được vào "Tối ưu" (>= 88) khi có chỉ số warning
    cappedScore = Math.min(cappedScore, 84);
    cappedByReason = 'Giới hạn không vào mức Tối ưu do có chỉ số Cần lưu ý';
  } else if (hasLowAdherence) {
    // Không được vào "Tối ưu" (>= 88) khi tuân thủ thuốc < 80%
    cappedScore = Math.min(cappedScore, 84);
    cappedByReason = 'Giới hạn không vào mức Tối ưu do tỷ lệ uống thuốc dưới 80%';
  }

  if (cappedScore >= 88 && !hasWarningMetric && !hasCriticalMetric && !hasLowAdherence) {
    return { score: cappedScore, grade: 'Tối ưu', status: 'normal' };
  }
  if (cappedScore >= 75) {
    return {
      score: cappedScore,
      grade: 'Khá tốt',
      status: 'elevated',
      cappedByReason,
    };
  }
  if (cappedScore >= 60) {
    return {
      score: cappedScore,
      grade: 'Cần lưu ý',
      status: 'warning',
      cappedByReason,
    };
  }
  return {
    score: cappedScore,
    grade: 'Cần chú ý ngay',
    status: 'critical',
    cappedByReason,
  };
}

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: 'male' | 'female'
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

export function calculateDailyCalorieSummary(
  meals: MealEntry[],
  workouts: WorkoutEntry[],
  calorieGoal: number
): {
  totalIntake: number;
  totalBurned: number;
  netCalories: number;
  remainingCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
} {
  const totalIntake = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalBurned = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const proteinG = meals.reduce((sum, m) => sum + m.proteinG, 0);
  const carbsG = meals.reduce((sum, m) => sum + m.carbsG, 0);
  const fatG = meals.reduce((sum, m) => sum + m.fatG, 0);
  const netCalories = totalIntake - totalBurned;
  const remainingCalories = calorieGoal - netCalories;

  return {
    totalIntake,
    totalBurned,
    netCalories,
    remainingCalories,
    proteinG,
    carbsG,
    fatG,
  };
}

export function calculateMedicationAdherence(medications: MedicationSchedule[]): {
  takenCount: number;
  totalCount: number;
  adherencePercent: number;
} {
  if (medications.length === 0) {
    return { takenCount: 0, totalCount: 0, adherencePercent: 100 };
  }
  const takenCount = medications.filter((m) => m.takenToday).length;
  const totalCount = medications.length;
  const adherencePercent = Math.round((takenCount / totalCount) * 100);
  return { takenCount, totalCount, adherencePercent };
}

export function validateVitalEntry(input: {
  systolic: number;
  diastolic: number;
  heartRate: number;
  spo2: number;
  bloodGlucose: number;
  weightKg: number;
  sleepHours: number;
}): { valid: boolean; error?: string } {
  if (
    !Number.isFinite(input.systolic) ||
    input.systolic < 60 ||
    input.systolic > 250
  ) {
    return { valid: false, error: 'Huyết áp tâm thu phải nằm trong khoảng 60 – 250 mmHg.' };
  }
  if (
    !Number.isFinite(input.diastolic) ||
    input.diastolic < 40 ||
    input.diastolic > 160
  ) {
    return { valid: false, error: 'Huyết áp tâm trương phải nằm trong khoảng 40 – 160 mmHg.' };
  }
  if (input.diastolic >= input.systolic) {
    return { valid: false, error: 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.' };
  }
  if (!Number.isFinite(input.heartRate) || input.heartRate < 35 || input.heartRate > 220) {
    return { valid: false, error: 'Nhịp tim phải nằm trong khoảng 35 – 220 bpm.' };
  }
  if (!Number.isFinite(input.spo2) || input.spo2 < 70 || input.spo2 > 100) {
    return { valid: false, error: 'Chỉ số SpO2 phải nằm trong khoảng 70% – 100%.' };
  }
  if (
    !Number.isFinite(input.bloodGlucose) ||
    input.bloodGlucose < 40 ||
    input.bloodGlucose > 500
  ) {
    return { valid: false, error: 'Đường huyết phải nằm trong khoảng 40 – 500 mg/dL.' };
  }
  if (!Number.isFinite(input.weightKg) || input.weightKg < 25 || input.weightKg > 250) {
    return { valid: false, error: 'Cân nặng phải nằm trong khoảng 25 – 250 kg.' };
  }
  if (!Number.isFinite(input.sleepHours) || input.sleepHours < 0 || input.sleepHours > 24) {
    return { valid: false, error: 'Thời lượng giấc ngủ phải từ 0 – 24 giờ.' };
  }
  return { valid: true };
}

function escapeCsvCell(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function serializeVitalsToCsv(vitals: VitalRecord[]): string {
  const headers = [
    'ID',
    'Ngay',
    'Gio',
    'HuyetAp_TamThu_mmHg',
    'HuyetAp_TamTruong_mmHg',
    'NhipTim_bpm',
    'SpO2_Percent',
    'DuongHuyet_mgdL',
    'BoiCanh_DuongHuyet',
    'ThanNhiet_C',
    'CanNang_kg',
    'GiacNgu_gio',
    'BuocChan',
    'NguonThietBi',
    'GhiChu',
  ];

  const rows = vitals.map((r) =>
    [
      escapeCsvCell(r.id),
      escapeCsvCell(r.date),
      escapeCsvCell(r.time),
      escapeCsvCell(r.systolic),
      escapeCsvCell(r.diastolic),
      escapeCsvCell(r.heartRate),
      escapeCsvCell(r.spo2),
      escapeCsvCell(r.bloodGlucose),
      escapeCsvCell(r.glucoseContext),
      escapeCsvCell(r.temperatureC),
      escapeCsvCell(r.weightKg),
      escapeCsvCell(r.sleepHours),
      escapeCsvCell(r.steps),
      escapeCsvCell(r.deviceSource),
      escapeCsvCell(r.notes || ''),
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function serializeMealsToCsv(meals: MealEntry[]): string {
  const headers = [
    'ID',
    'Ngay',
    'Gio',
    'BuaAn',
    'TenMonAn',
    'Calories_kcal',
    'Protein_g',
    'Carbs_g',
    'Fat_g',
  ];

  const rows = meals.map((m) =>
    [
      escapeCsvCell(m.id),
      escapeCsvCell(m.date),
      escapeCsvCell(m.time),
      escapeCsvCell(m.mealType),
      escapeCsvCell(m.foodName),
      escapeCsvCell(m.calories),
      escapeCsvCell(m.proteinG),
      escapeCsvCell(m.carbsG),
      escapeCsvCell(m.fatG),
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function serializeCombinedHealthToCsv(
  vitals: VitalRecord[],
  meals: MealEntry[]
): string {
  const headers = [
    'PhanLoaiDuLieu',
    'ID',
    'Ngay',
    'Gio',
    'MoTaChinh',
    'ChiSo_1',
    'ChiSo_2',
    'ChiSo_3',
    'ChiSo_4',
    'GhiChu_Nguon',
  ];

  const vitalRows = vitals.map((v) =>
    [
      'VITALS',
      escapeCsvCell(v.id),
      escapeCsvCell(v.date),
      escapeCsvCell(v.time),
      escapeCsvCell(`HA ${v.systolic}/${v.diastolic} mmHg`),
      escapeCsvCell(`Tim ${v.heartRate} bpm`),
      escapeCsvCell(`SpO2 ${v.spo2}%`),
      escapeCsvCell(`Duong ${v.bloodGlucose} mg/dL`),
      escapeCsvCell(`Can nang ${v.weightKg} kg`),
      escapeCsvCell(`${v.deviceSource}${v.notes ? ` - ${v.notes}` : ''}`),
    ].join(',')
  );

  const mealRows = meals.map((m) =>
    [
      'MEALS',
      escapeCsvCell(m.id),
      escapeCsvCell(m.date),
      escapeCsvCell(m.time),
      escapeCsvCell(`${m.mealType}: ${m.foodName}`),
      escapeCsvCell(`${m.calories} kcal`),
      escapeCsvCell(`Dam ${m.proteinG}g`),
      escapeCsvCell(`Carb ${m.carbsG}g`),
      escapeCsvCell(`Beo ${m.fatG}g`),
      escapeCsvCell('Nhat ky dinh duong'),
    ].join(',')
  );

  return [headers.join(','), ...vitalRows, ...mealRows].join('\n');
}

export function serializeHealthDataToJson(
  vitals: VitalRecord[],
  meals: MealEntry[],
  scope: 'all' | 'vitals' | 'meals' = 'all'
): string {
  const payload: Record<string, unknown> = {
    system: 'VitaPulse Personal Health Tracking System',
    exportedAt: '2026-11-10T08:20:00Z',
    scope,
    summary: {
      vitalsCount: scope === 'meals' ? 0 : vitals.length,
      mealsCount: scope === 'vitals' ? 0 : meals.length,
      totalMealCalories:
        scope === 'vitals' ? 0 : meals.reduce((sum, item) => sum + item.calories, 0),
    },
  };

  if (scope === 'all' || scope === 'vitals') {
    payload.vitals = vitals;
  }
  if (scope === 'all' || scope === 'meals') {
    payload.meals = meals;
  }

  return JSON.stringify(payload, null, 2);
}

export function triggerOfflineFileDownload(
  content: string,
  filename: string,
  mimeType: 'text/csv;charset=utf-8;' | 'application/json;charset=utf-8;'
): void {
  const bom = mimeType.startsWith('text/csv') ? '\uFEFF' : '';
  const blob = new Blob([bom + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type MobileDevicePresetId =
  | 'compact_se'
  | 'standard_phone'
  | 'large_max'
  | 'foldable_tablet'
  | 'adaptive_fluid';

export interface MobileDevicePreset {
  id: MobileDevicePresetId;
  name: string;
  shortLabel: string;
  widthPx: number;
  heightPx: number;
  aspectRatioLabel: string;
  gridCols: 1 | 2 | 3;
  hasDynamicIsland: boolean;
  description: string;
}

export const MOBILE_DEVICE_PRESETS: MobileDevicePreset[] = [
  {
    id: 'compact_se',
    name: 'Màn hình Nhỏ (iPhone SE / Android Compact)',
    shortLabel: 'Nhỏ (320px)',
    widthPx: 320,
    heightPx: 568,
    aspectRatioLabel: '16:9',
    gridCols: 1,
    hasDynamicIsland: false,
    description: 'Tối ưu 1 cột dọc cho điện thoại cỡ nhỏ 4.7" (320×568px), cỡ chữ rõ ràng, không tràn ngang.',
  },
  {
    id: 'standard_phone',
    name: 'Tiêu chuẩn (iPhone 16 / Galaxy S25)',
    shortLabel: 'Chuẩn (390px)',
    widthPx: 390,
    heightPx: 640,
    aspectRatioLabel: '19.5:9',
    gridCols: 2,
    hasDynamicIsland: true,
    description: 'Bố cục 2 cột chuẩn công thái học ngón cái (390×844px) phổ biến trên 80% thiết bị di động.',
  },
  {
    id: 'large_max',
    name: 'Màn hình Lớn (Pro Max / Ultra)',
    shortLabel: 'Lớn (430px)',
    widthPx: 430,
    heightPx: 680,
    aspectRatioLabel: '20:9',
    gridCols: 2,
    hasDynamicIsland: true,
    description: 'Không gian rộng rãi cho điện thoại 6.7"–6.9" (430×932px), hiển thị đầy đủ chỉ số phụ.',
  },
  {
    id: 'foldable_tablet',
    name: 'Màn hình Gập mở / Mini Tablet (Fold / iPad Mini)',
    shortLabel: 'Màn gập (620px)',
    widthPx: 620,
    heightPx: 660,
    aspectRatioLabel: '4:3',
    gridCols: 3,
    hasDynamicIsland: false,
    description: 'Tự động dàn 3 cột thông minh khi mở màn hình gập (Galaxy Z Fold / Tablet 620px+).',
  },
  {
    id: 'adaptive_fluid',
    name: 'Tự động Co giãn Toàn khung (Fluid 100% WebView/PWA)',
    shortLabel: 'Tự động (100%)',
    widthPx: 0, // Fluid 100%
    heightPx: 660,
    aspectRatioLabel: 'Auto',
    gridCols: 3,
    hasDynamicIsland: false,
    description: 'Chế độ WebView / PWA tự động lấp đầy 100% chiều rộng thiết bị thực tế của người dùng.',
  },
];

export function resolveDeviceFrameMetrics(
  presetId: MobileDevicePresetId,
  orientation: 'portrait' | 'landscape' = 'portrait'
): {
  preset: MobileDevicePreset;
  effectiveWidthPx: number;
  effectiveHeightPx: number;
  vitalsGridCols: 1 | 2 | 3;
  isFluid: boolean;
} {
  const preset =
    MOBILE_DEVICE_PRESETS.find((p) => p.id === presetId) || MOBILE_DEVICE_PRESETS[1];

  if (preset.id === 'adaptive_fluid') {
    return {
      preset,
      effectiveWidthPx: 0,
      effectiveHeightPx: 660,
      vitalsGridCols: 3,
      isFluid: true,
    };
  }

  const effectiveWidthPx = orientation === 'portrait' ? preset.widthPx : preset.heightPx;
  const effectiveHeightPx = orientation === 'portrait' ? preset.heightPx : Math.max(420, preset.widthPx);

  let vitalsGridCols: 1 | 2 | 3 = preset.gridCols;
  if (effectiveWidthPx <= 340) {
    vitalsGridCols = 1;
  } else if (effectiveWidthPx >= 560) {
    vitalsGridCols = 3;
  } else {
    vitalsGridCols = 2;
  }

  return {
    preset,
    effectiveWidthPx,
    effectiveHeightPx,
    vitalsGridCols,
    isFluid: false,
  };
}

/**
 * Decodes a 16-bit IEEE 11073-20601 SFLOAT value used in Bluetooth SIG GATT
 * Medical Profiles (e.g., 0x1810 Blood Pressure Service / 0x2A35 Characteristic).
 */
export function decodeIEEE11073SFloat(raw16Bit: number): number {
  const uint16 = raw16Bit & 0xffff;
  // Special IEEE 11073 reserved values (NaN, NRes, +INFINITY, -INFINITY)
  if (uint16 === 0x07ff || uint16 === 0x0800 || uint16 === 0x07fe || uint16 === 0x0802) {
    return NaN;
  }
  let mantissa = uint16 & 0x0fff;
  if ((mantissa & 0x0800) !== 0) {
    mantissa = -((0x0fff + 1) - mantissa);
  }
  let exponent = (uint16 >> 12) & 0x0f;
  if ((exponent & 0x08) !== 0) {
    exponent = -((0x0f + 1) - exponent);
  }
  return Math.round(mantissa * Math.pow(10, exponent) * 10) / 10;
}

/**
 * Parses a standard Bluetooth SIG Heart Rate Measurement (0x2A37) packet.
 * Bit 0 of flags: 0 = UINT8 HR value, 1 = UINT16 HR value.
 * Bit 1-2 of flags: Sensor contact status.
 * Bit 3 of flags: Energy Expended field present (UINT16 in kJ).
 */
export function parseBleHeartRatePacket(bytes: Uint8Array): {
  heartRate: number;
  contactDetected: boolean;
  energyExpendedKJ?: number;
} {
  if (!bytes || bytes.length < 2) {
    throw new Error('Gói dữ liệu BLE Nhịp tim (0x2A37) không hợp lệ (quá ngắn).');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const flags = view.getUint8(0);
  const is16Bit = (flags & 0x01) !== 0;
  const contactSupported = (flags & 0x04) !== 0;
  const contactDetected = contactSupported ? (flags & 0x02) !== 0 : true;
  const hasEnergyExpended = (flags & 0x08) !== 0;

  let offset = 1;
  let heartRate: number;
  if (is16Bit) {
    if (bytes.length < 3) {
      throw new Error('Gói dữ liệu BLE Nhịp tim 16-bit bị thiếu byte.');
    }
    heartRate = view.getUint16(offset, true);
    offset += 2;
  } else {
    heartRate = view.getUint8(offset);
    offset += 1;
  }

  let energyExpendedKJ: number | undefined;
  if (hasEnergyExpended && bytes.length >= offset + 2) {
    energyExpendedKJ = view.getUint16(offset, true);
  }

  return {
    heartRate: Math.max(30, Math.min(240, heartRate)),
    contactDetected,
    energyExpendedKJ,
  };
}

/**
 * Parses a standard Bluetooth SIG Blood Pressure Measurement (0x2A35) packet.
 * Byte 0: Flags (Bit 0: 0=mmHg, 1=kPa; Bit 1: Timestamp present; Bit 2: Pulse Rate present)
 * Bytes 1-2: Systolic (SFLOAT)
 * Bytes 3-4: Diastolic (SFLOAT)
 * Bytes 5-6: Mean Arterial Pressure (SFLOAT)
 */
export function parseBleBloodPressurePacket(bytes: Uint8Array): {
  systolic: number;
  diastolic: number;
  meanArterialPressure: number;
  pulseRate?: number;
  unit: 'mmHg' | 'kPa';
} {
  if (!bytes || bytes.length < 7) {
    throw new Error('Gói dữ liệu BLE Huyết áp (0x2A35) không hợp lệ (cần tối thiểu 7 byte).');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const flags = view.getUint8(0);
  const isKpa = (flags & 0x01) !== 0;
  const hasTimestamp = (flags & 0x02) !== 0;
  const hasPulseRate = (flags & 0x04) !== 0;

  const rawSys = decodeIEEE11073SFloat(view.getUint16(1, true));
  const rawDia = decodeIEEE11073SFloat(view.getUint16(3, true));
  const rawMap = decodeIEEE11073SFloat(view.getUint16(5, true));

  // Convert kPa to mmHg if device reports in kPa (1 kPa ≈ 7.50062 mmHg)
  const factor = isKpa ? 7.50062 : 1;
  const systolic = Math.round(rawSys * factor);
  const diastolic = Math.round(rawDia * factor);
  const meanArterialPressure = Math.round(rawMap * factor);

  let offset = 7;
  if (hasTimestamp) {
    offset += 7; // IEEE 11073 DateTime is 7 bytes
  }

  let pulseRate: number | undefined;
  if (hasPulseRate && bytes.length >= offset + 2) {
    const rawPulse = decodeIEEE11073SFloat(view.getUint16(offset, true));
    if (Number.isFinite(rawPulse)) {
      pulseRate = Math.round(rawPulse);
    }
  }

  return {
    systolic: Math.max(60, Math.min(260, systolic)),
    diastolic: Math.max(35, Math.min(160, diastolic)),
    meanArterialPressure,
    pulseRate,
    unit: isKpa ? 'kPa' : 'mmHg',
  };
}

/**
 * Formats a Google Calendar API Event resource for a doctor checkup or medication reminder.
 */
export function buildGoogleCalendarEventPayload(params: {
  summary: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  timeZone?: string;
}): {
  summary: string;
  location: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  reminders: {
    useDefault: boolean;
    overrides: Array<{ method: 'popup' | 'email'; minutes: number }>;
  };
} {
  const tz = params.timeZone || 'Asia/Ho_Chi_Minh';
  const [hoursStr, minutesStr] = params.time.split(':');
  const startHours = Number(hoursStr) || 8;
  const startMinutes = Number(minutesStr) || 0;

  const totalEndMinutes = startHours * 60 + startMinutes + Math.max(5, params.durationMinutes);
  const endHours = Math.floor(totalEndMinutes / 60) % 24;
  const endMinutes = totalEndMinutes % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const startIso = `${params.date}T${pad(startHours)}:${pad(startMinutes)}:00`;
  const endIso = `${params.date}T${pad(endHours)}:${pad(endMinutes)}:00`;

  return {
    summary: params.summary.trim().slice(0, 150),
    location: params.location.trim().slice(0, 150),
    description: params.description.trim().slice(0, 500),
    start: {
      dateTime: startIso,
      timeZone: tz,
    },
    end: {
      dateTime: endIso,
      timeZone: tz,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'email', minutes: 60 },
      ],
    },
  };
}

/**
 * Defensive sanitizer that guarantees any VitalRecord written to Firestore
 * strictly adheres to firebase-blueprint.json & firestore.rules constraints.
 */
export function sanitizeVitalForFirestore(
  vital: VitalRecord,
  userId: string,
  updatedAtIso: string
): {
  id: string;
  userId: string;
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  spo2: number;
  bloodGlucose: number;
  glucoseContext: 'fasting' | 'post_meal';
  weightKg: number;
  temperatureC: number;
  sleepHours: number;
  steps: number;
  deviceSource: string;
  note: string;
  updatedAt: string;
} {
  const cleanId = vital.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128) || 'vital_1';
  const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return {
    id: cleanId,
    userId: cleanUserId,
    date: String(vital.date || '2026-11-10').slice(0, 20),
    time: String(vital.time || '07:00').slice(0, 16),
    systolic: Math.max(60, Math.min(260, Math.round(Number(vital.systolic) || 120))),
    diastolic: Math.max(35, Math.min(160, Math.round(Number(vital.diastolic) || 80))),
    heartRate: Math.max(30, Math.min(240, Math.round(Number(vital.heartRate) || 70))),
    spo2: Math.max(50, Math.min(100, Math.round(Number(vital.spo2) || 98))),
    bloodGlucose: Math.max(30, Math.min(600, Math.round(Number(vital.bloodGlucose) || 95))),
    glucoseContext: vital.glucoseContext === 'post_meal' ? 'post_meal' : 'fasting',
    weightKg: Math.max(20, Math.min(300, Number(vital.weightKg) || 65)),
    temperatureC: Math.max(34, Math.min(43, Number(vital.temperatureC) || 36.6)),
    sleepHours: Math.max(0, Math.min(24, Number(vital.sleepHours) || 7)),
    steps: Math.max(0, Math.min(150000, Math.round(Number(vital.steps) || 0))),
    deviceSource: String(vital.deviceSource || 'Nhập thủ công').slice(0, 80),
    note: String(vital.notes || '').slice(0, 500),
    updatedAt: String(updatedAtIso).slice(0, 40),
  };
}

export interface SevenDayVitalBarItem {
  id: string;
  dateLabel: string;
  fullDate: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  spo2: number;
  bloodGlucose: number;
  weightKg: number;
  sleepHours: number;
  steps: number;
  deviceSource: string;
}

export interface SevenDayVitalsBarSummary {
  items: SevenDayVitalBarItem[];
  averages: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    spo2: number;
    bloodGlucose: number;
    weightKg: number;
    sleepHours: number;
    steps: number;
  };
}

/**
 * Prepares the last 7 chronological vital sign records and computes 7-day clinical averages
 * for the Recharts 7-Day Bar Chart Dashboard Panel.
 */
export function prepareSevenDayVitalsBarData(
  vitals: VitalRecord[]
): SevenDayVitalsBarSummary {
  const sorted = [...vitals]
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(-7);

  const items: SevenDayVitalBarItem[] = sorted.map((v) => ({
    id: v.id,
    dateLabel: v.date.length >= 5 ? v.date.slice(5) : v.date,
    fullDate: `${v.date} (${v.time})`,
    systolic: v.systolic,
    diastolic: v.diastolic,
    heartRate: v.heartRate,
    spo2: v.spo2,
    bloodGlucose: v.bloodGlucose,
    weightKg: v.weightKg,
    sleepHours: v.sleepHours,
    steps: v.steps,
    deviceSource: v.deviceSource,
  }));

  const count = items.length || 1;
  const sum = items.reduce(
    (acc, item) => ({
      systolic: acc.systolic + item.systolic,
      diastolic: acc.diastolic + item.diastolic,
      heartRate: acc.heartRate + item.heartRate,
      spo2: acc.spo2 + item.spo2,
      bloodGlucose: acc.bloodGlucose + item.bloodGlucose,
      weightKg: acc.weightKg + item.weightKg,
      sleepHours: acc.sleepHours + item.sleepHours,
      steps: acc.steps + item.steps,
    }),
    {
      systolic: 0,
      diastolic: 0,
      heartRate: 0,
      spo2: 0,
      bloodGlucose: 0,
      weightKg: 0,
      sleepHours: 0,
      steps: 0,
    }
  );

  return {
    items,
    averages: {
      systolic: Math.round(sum.systolic / count),
      diastolic: Math.round(sum.diastolic / count),
      heartRate: Math.round(sum.heartRate / count),
      spo2: Math.round((sum.spo2 / count) * 10) / 10,
      bloodGlucose: Math.round(sum.bloodGlucose / count),
      weightKg: Math.round((sum.weightKg / count) * 10) / 10,
      sleepHours: Math.round((sum.sleepHours / count) * 10) / 10,
      steps: Math.round(sum.steps / count),
    },
  };
}

export interface VneidBhytValidationResult {
  valid: boolean;
  type?: 'CCCD_12' | 'BHYT_15' | 'BHXH_10';
  normalizedCode?: string;
  derivedBhytCode?: string;
  derivedCccdNumber?: string;
  error?: string;
}

/**
 * Validates a citizen's VNeID / BHYT login identifier:
 * - 12-digit Citizen ID (Số CCCD gắn chip 12 chữ số, VD: 079068004512)
 * - 15-character BHYT card code (Mã thẻ BHYT 15 ký tự, VD: DN4790123849201)
 * - 10-digit Social Insurance code (Mã số BHXH 10 chữ số, VD: 7901238492)
 */
export function validateVneidOrBhytInput(rawInput: string): VneidBhytValidationResult {
  const cleaned = String(rawInput || '')
    .trim()
    .replace(/[\s\-_.]/g, '')
    .toUpperCase();

  if (!cleaned) {
    return {
      valid: false,
      error: 'Vui lòng nhập Số Căn cước công dân (12 số) hoặc Mã thẻ BHYT (15 ký tự).',
    };
  }

  if (/^\d{12}$/.test(cleaned)) {
    const suffix10 = cleaned.slice(-10);
    return {
      valid: true,
      type: 'CCCD_12',
      normalizedCode: cleaned,
      derivedCccdNumber: cleaned,
      derivedBhytCode: `DN479${suffix10}`,
    };
  }

  if (/^[A-Z]{2}[1-5]\d{12}$/.test(cleaned)) {
    const suffix10 = cleaned.slice(-10);
    return {
      valid: true,
      type: 'BHYT_15',
      normalizedCode: cleaned,
      derivedBhytCode: cleaned,
      derivedCccdNumber: `07${suffix10}`,
    };
  }

  if (/^\d{10}$/.test(cleaned)) {
    return {
      valid: true,
      type: 'BHXH_10',
      normalizedCode: cleaned,
      derivedBhytCode: `DN479${cleaned}`,
      derivedCccdNumber: `07${cleaned}`,
    };
  }

  return {
    valid: false,
    error:
      'Mã định danh chưa đúng định dạng. Vui lòng nhập đúng 12 chữ số CCCD (VD: 079068004512) hoặc 15 ký tự thẻ BHYT (VD: DN4790123849201).',
  };
}

export interface BhytVisitHistorySummary {
  totalVisits: number;
  totalCostVnd: number;
  totalBhytCoveredVnd: number;
  totalPatientCoPayVnd: number;
  coverageSavedPercent: number;
  diagnosedConditions: Array<{
    icdCode: string;
    diagnosisSummary: string;
    plainExplanation: string;
    lastVisitDate: string;
    hospitalName: string;
  }>;
  nextFollowUpDate: string | null;
}

/**
 * Summarizes a patient's BHYT hospital visit history synced via VNeID.
 */
export function summarizeBhytVisitHistory(visits: BhytVisitRecord[]): BhytVisitHistorySummary {
  const sorted = [...visits].sort((a, b) => b.visitDate.localeCompare(a.visitDate));

  let totalCostVnd = 0;
  let totalBhytCoveredVnd = 0;
  let totalPatientCoPayVnd = 0;
  const conditionMap = new Map<
    string,
    {
      icdCode: string;
      diagnosisSummary: string;
      plainExplanation: string;
      lastVisitDate: string;
      hospitalName: string;
    }
  >();

  for (const v of sorted) {
    totalCostVnd += v.totalCostVnd;
    totalBhytCoveredVnd += v.bhytPaidVnd;
    totalPatientCoPayVnd += v.patientCoPayVnd;
    if (!conditionMap.has(v.icdCode)) {
      conditionMap.set(v.icdCode, {
        icdCode: v.icdCode,
        diagnosisSummary: v.diagnosisSummary,
        plainExplanation: v.plainExplanation,
        lastVisitDate: v.visitDate,
        hospitalName: v.hospitalName,
      });
    }
  }

  const coverageSavedPercent =
    totalCostVnd > 0 ? Math.round((totalBhytCoveredVnd / totalCostVnd) * 100) : 80;

  return {
    totalVisits: sorted.length,
    totalCostVnd,
    totalBhytCoveredVnd,
    totalPatientCoPayVnd,
    coverageSavedPercent,
    diagnosedConditions: Array.from(conditionMap.values()),
    nextFollowUpDate: sorted[0]?.followUpDate || null,
  };
}

/**
 * Converts a "HH:mm" time string into minutes from midnight (0 - 1439).
 */
export function parseTimeMinutes(timeStr: string): number {
  const cleaned = String(timeStr || '07:00').trim();
  const [hStr, mStr] = cleaned.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return 7 * 60;
  }
  return h * 60 + m;
}

/**
 * Adds `deltaMinutes` to a "HH:mm" string and returns the wrapped "HH:mm" string.
 */
export function addMinutesToTimeStr(timeStr: string, deltaMinutes: number): string {
  const base = parseTimeMinutes(timeStr);
  const total = (((base + Math.round(deltaMinutes)) % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Builds a friendly Vietnamese local push notification payload for a scheduled medication.
 */
export function buildMedicationPushPayload(
  med: MedicationSchedule,
  patientName?: string,
  triggeredAtTime?: string
): {
  title: string;
  body: string;
  tag: string;
  triggeredAt: string;
} {
  const prefixName = patientName ? `${patientName} ơi, đ` : 'Đ';
  const title = `🔔 Đến giờ uống thuốc (${med.timeSlot}): ${med.medicationName}`;
  const body = `${prefixName}ến cữ uống ${med.dosage} ${med.medicationName} (${med.mealInstruction}) — Công dụng: ${med.purpose}.`;
  return {
    title,
    body,
    tag: `vitapulse-med-${med.id}-${med.timeSlot}`,
    triggeredAt: triggeredAtTime || med.timeSlot,
  };
}

export interface NextMedicationDoseInfo {
  medication: MedicationSchedule;
  effectiveTriggerTime: string; // HH:mm considering leadMinutes or snoozedUntil
  minutesUntilDue: number;
  countdownLabel: string;
  isOverdueToday: boolean;
}

export interface MedicationNotificationEvaluation {
  dueNowMedications: MedicationSchedule[];
  nextDose: NextMedicationDoseInfo | null;
  pendingCount: number;
}

/**
 * Evaluates all daily medication schedules against the current local time ("HH:mm")
 * and returns:
 * 1. Medications that should trigger a local push notification right now
 *    (within the window [scheduledTime - leadMinutes, scheduledTime + 30 min],
 *     or matching `snoozedUntil` within [snoozedUntil, snoozedUntil + 15 min],
 *     excluding already-taken or already-notified items).
 * 2. The next upcoming untaken medication dose and human-friendly countdown string.
 */
export function evaluateMedicationScheduleNotifications(params: {
  medications: MedicationSchedule[];
  currentTimeStr: string; // HH:mm
  leadMinutes: number; // 0, 5, 10, 15
  notifiedSignaturesToday: string[]; // e.g. ["med-1@07:00", "med-2@snooze-07:15"]
}): MedicationNotificationEvaluation {
  const { medications, currentTimeStr, leadMinutes, notifiedSignaturesToday } = params;
  const nowMinutes = parseTimeMinutes(currentTimeStr);
  const notifiedSet = new Set(notifiedSignaturesToday);

  const untakenEnabled = medications.filter(
    (m) => !m.takenToday && m.reminderEnabled !== false
  );

  const dueNowMedications: MedicationSchedule[] = [];
  const candidates: NextMedicationDoseInfo[] = [];

  for (const med of untakenEnabled) {
    const slotMinutes = parseTimeMinutes(med.timeSlot);
    const triggerMinutes = Math.max(0, slotMinutes - Math.max(0, leadMinutes));
    const triggerTimeStr = addMinutesToTimeStr(med.timeSlot, -Math.max(0, leadMinutes));

    // Check if snoozed
    if (med.snoozedUntil) {
      const snoozeMin = parseTimeMinutes(med.snoozedUntil);
      const snoozeSig = `${med.id}@snooze-${med.snoozedUntil}`;
      const diffSnooze = nowMinutes - snoozeMin;
      if (diffSnooze >= 0 && diffSnooze <= 20 && !notifiedSet.has(snoozeSig)) {
        dueNowMedications.push(med);
      }
    } else {
      const stdSig = `${med.id}@${med.timeSlot}`;
      const diffStd = nowMinutes - triggerMinutes;
      // Trigger if current time is between [triggerMinutes, slotMinutes + 30]
      if (
        nowMinutes >= triggerMinutes &&
        nowMinutes <= slotMinutes + 30 &&
        !notifiedSet.has(stdSig)
      ) {
        dueNowMedications.push(med);
      }
    }

    // Calculate countdown to this dose
    const targetMin = med.snoozedUntil
      ? parseTimeMinutes(med.snoozedUntil)
      : slotMinutes;
    const effectiveTime = med.snoozedUntil || triggerTimeStr;
    let minutesUntilDue = targetMin - nowMinutes;
    let isOverdueToday = false;

    if (minutesUntilDue < 0) {
      if (minutesUntilDue >= -60) {
        // Recently due within the last hour
        isOverdueToday = true;
      } else {
        // Wrap to tomorrow's schedule if already passed more than 60 mins ago
        minutesUntilDue += 1440;
      }
    }

    let countdownLabel = '';
    if (isOverdueToday) {
      const overdueMins = Math.abs(minutesUntilDue);
      countdownLabel =
        overdueMins === 0
          ? 'Đang đến giờ uống ngay bây giờ'
          : `Đã tới giờ cách đây ${overdueMins} phút`;
    } else if (minutesUntilDue === 0) {
      countdownLabel = 'Đang đến giờ uống ngay bây giờ';
    } else if (minutesUntilDue < 60) {
      countdownLabel = `Còn ${minutesUntilDue} phút nữa`;
    } else {
      const hrs = Math.floor(minutesUntilDue / 60);
      const mins = minutesUntilDue % 60;
      countdownLabel =
        mins > 0 ? `Còn ${hrs} giờ ${mins} phút nữa` : `Còn ${hrs} giờ nữa`;
    }

    candidates.push({
      medication: med,
      effectiveTriggerTime: effectiveTime,
      minutesUntilDue,
      countdownLabel,
      isOverdueToday,
    });
  }

  candidates.sort((a, b) => {
    if (a.isOverdueToday && !b.isOverdueToday) return -1;
    if (!a.isOverdueToday && b.isOverdueToday) return 1;
    return a.minutesUntilDue - b.minutesUntilDue;
  });

  return {
    dueNowMedications,
    nextDose: candidates[0] || null,
    pendingCount: untakenEnabled.length,
  };
}

export const ALL_DAYS_OF_WEEK: DayOfWeekCode[] = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * Returns the Vietnamese day-of-week code ('T2' .. 'T7', 'CN') for a Date or ISO date string.
 */
export function getVietnameseDayCode(dateInput?: Date | string): DayOfWeekCode {
  const d =
    dateInput instanceof Date
      ? dateInput
      : typeof dateInput === 'string' && dateInput.trim()
      ? new Date(dateInput)
      : new Date();
  const jsDay = Number.isNaN(d.getTime()) ? new Date().getDay() : d.getDay();
  // JS getDay(): 0 = Sunday ('CN'), 1 = Monday ('T2') .. 6 = Saturday ('T7')
  const map: Record<number, DayOfWeekCode> = {
    0: 'CN',
    1: 'T2',
    2: 'T3',
    3: 'T4',
    4: 'T5',
    5: 'T6',
    6: 'T7',
  };
  return map[jsDay] || 'T2';
}

/**
 * Formats an array of DayOfWeekCode into a clean Vietnamese human-readable recurring schedule label.
 */
export function formatRecurringDaysLabel(days: DayOfWeekCode[]): string {
  if (!days || days.length === 0) return 'Chưa chọn ngày';
  const unique = ALL_DAYS_OF_WEEK.filter((d) => days.includes(d));
  if (unique.length === 7) return 'Hàng ngày (T2 – CN)';
  if (
    unique.length === 5 &&
    ['T2', 'T3', 'T4', 'T5', 'T6'].every((d) => unique.includes(d as DayOfWeekCode))
  ) {
    return 'Thứ 2 – Thứ 6';
  }
  if (unique.length === 2 && unique.includes('T7') && unique.includes('CN')) {
    return 'Cuối tuần (T7, CN)';
  }
  return unique.join(', ');
}

/**
 * Calculates adherence for recurring workouts scheduled on `currentDayCode`.
 */
export function calculateWorkoutScheduleAdherence(
  schedules: WorkoutSchedule[],
  currentDayCode: DayOfWeekCode
): {
  completedCount: number;
  totalScheduledToday: number;
  adherencePercent: number;
  todaySchedules: WorkoutSchedule[];
} {
  const todaySchedules = schedules.filter((s) => s.daysOfWeek.includes(currentDayCode));
  if (todaySchedules.length === 0) {
    return {
      completedCount: 0,
      totalScheduledToday: 0,
      adherencePercent: 100,
      todaySchedules: [],
    };
  }
  const completedCount = todaySchedules.filter((s) => s.completedToday).length;
  const totalScheduledToday = todaySchedules.length;
  const adherencePercent = Math.round((completedCount / totalScheduledToday) * 100);
  return {
    completedCount,
    totalScheduledToday,
    adherencePercent,
    todaySchedules,
  };
}

/**
 * Builds a friendly Vietnamese local push notification payload for a scheduled recurring workout.
 */
export function buildWorkoutPushPayload(
  schedule: WorkoutSchedule,
  patientName?: string,
  triggeredAtTime?: string
): {
  title: string;
  body: string;
  tag: string;
  triggeredAt: string;
} {
  const prefixName = patientName ? `${patientName} ơi, đ` : 'Đ';
  const title = `🏃 Đến giờ tập luyện (${schedule.timeSlot}): ${schedule.activityName}`;
  const body = `${prefixName}ến khung giờ tập ${schedule.activityName} (${schedule.durationMinutes} phút · Mức ${schedule.intensityLabel} · Tiêu hao ~${schedule.targetCalories} kcal).`;
  return {
    title,
    body,
    tag: `vitapulse-workout-${schedule.id}-${schedule.timeSlot}`,
    triggeredAt: triggeredAtTime || schedule.timeSlot,
  };
}

export interface NextWorkoutSessionInfo {
  schedule: WorkoutSchedule;
  effectiveTriggerTime: string;
  minutesUntilDue: number;
  countdownLabel: string;
  isOverdueToday: boolean;
}

export interface WorkoutNotificationEvaluation {
  dueNowWorkouts: WorkoutSchedule[];
  nextWorkout: NextWorkoutSessionInfo | null;
  pendingTodayCount: number;
}

/**
 * Evaluates all recurring workout schedules against the current day of week and current local time ("HH:mm")
 * and returns:
 * 1. Workouts scheduled for today that should trigger a local push reminder right now
 *    (within [scheduledTime - leadMinutes, scheduledTime + 30 min], or matching `snoozedUntil`).
 * 2. The next upcoming uncompleted workout session scheduled for today with a human-friendly countdown string.
 */
export function evaluateWorkoutScheduleNotifications(params: {
  schedules: WorkoutSchedule[];
  currentDayCode: DayOfWeekCode;
  currentTimeStr: string; // HH:mm
  leadMinutes: number; // 0, 5, 10, 15
  notifiedSignaturesToday: string[]; // e.g. ["workout-wsched-1@06:00"]
}): WorkoutNotificationEvaluation {
  const {
    schedules,
    currentDayCode,
    currentTimeStr,
    leadMinutes,
    notifiedSignaturesToday,
  } = params;
  const nowMinutes = parseTimeMinutes(currentTimeStr);
  const notifiedSet = new Set(notifiedSignaturesToday);

  const uncompletedTodayEnabled = schedules.filter(
    (s) =>
      s.daysOfWeek.includes(currentDayCode) &&
      !s.completedToday &&
      s.reminderEnabled !== false
  );

  const dueNowWorkouts: WorkoutSchedule[] = [];
  const candidates: NextWorkoutSessionInfo[] = [];

  for (const sched of uncompletedTodayEnabled) {
    const slotMinutes = parseTimeMinutes(sched.timeSlot);
    const triggerMinutes = Math.max(0, slotMinutes - Math.max(0, leadMinutes));
    const triggerTimeStr = addMinutesToTimeStr(sched.timeSlot, -Math.max(0, leadMinutes));

    if (sched.snoozedUntil) {
      const snoozeMin = parseTimeMinutes(sched.snoozedUntil);
      const snoozeSig = `workout-${sched.id}@snooze-${sched.snoozedUntil}`;
      const diffSnooze = nowMinutes - snoozeMin;
      if (diffSnooze >= 0 && diffSnooze <= 20 && !notifiedSet.has(snoozeSig)) {
        dueNowWorkouts.push(sched);
      }
    } else {
      const stdSig = `workout-${sched.id}@${sched.timeSlot}`;
      if (
        nowMinutes >= triggerMinutes &&
        nowMinutes <= slotMinutes + 30 &&
        !notifiedSet.has(stdSig)
      ) {
        dueNowWorkouts.push(sched);
      }
    }

    const targetMin = sched.snoozedUntil
      ? parseTimeMinutes(sched.snoozedUntil)
      : slotMinutes;
    const effectiveTime = sched.snoozedUntil || triggerTimeStr;
    let minutesUntilDue = targetMin - nowMinutes;
    let isOverdueToday = false;

    if (minutesUntilDue < 0) {
      if (minutesUntilDue >= -60) {
        isOverdueToday = true;
      } else {
        minutesUntilDue += 1440;
      }
    }

    let countdownLabel = '';
    if (isOverdueToday) {
      const overdueMins = Math.abs(minutesUntilDue);
      countdownLabel =
        overdueMins === 0
          ? 'Đang đến giờ tập ngay bây giờ'
          : `Đã tới giờ tập cách đây ${overdueMins} phút`;
    } else if (minutesUntilDue === 0) {
      countdownLabel = 'Đang đến giờ tập ngay bây giờ';
    } else if (minutesUntilDue < 60) {
      countdownLabel = `Còn ${minutesUntilDue} phút nữa`;
    } else {
      const hrs = Math.floor(minutesUntilDue / 60);
      const mins = minutesUntilDue % 60;
      countdownLabel =
        mins > 0 ? `Còn ${hrs} giờ ${mins} phút nữa` : `Còn ${hrs} giờ nữa`;
    }

    candidates.push({
      schedule: sched,
      effectiveTriggerTime: effectiveTime,
      minutesUntilDue,
      countdownLabel,
      isOverdueToday,
    });
  }

  candidates.sort((a, b) => {
    if (a.isOverdueToday && !b.isOverdueToday) return -1;
    if (!a.isOverdueToday && b.isOverdueToday) return 1;
    return a.minutesUntilDue - b.minutesUntilDue;
  });

  return {
    dueNowWorkouts,
    nextWorkout: candidates[0] || null,
    pendingTodayCount: uncompletedTodayEnabled.length,
  };
}

/**
 * Che bớt chuỗi Mã thẻ BHYT (VD: DN4700000000201 -> DN47•••••••201)
 * hoặc Số CCCD (VD: 079000000001 -> 0790•••••001) khi hiển thị.
 */
export function maskSensitiveIdentifier(
  rawCode: string,
  type: 'bhyt' | 'cccd' = 'bhyt'
): string {
  const cleaned = String(rawCode || '').trim();
  if (!cleaned || cleaned.length <= 7) {
    return cleaned || 'Chưa cập nhật';
  }
  const prefix = cleaned.slice(0, 4);
  const suffix = cleaned.slice(-3);
  const dots = type === 'bhyt' ? '•••••••' : '•••••';
  return `${prefix}${dots}${suffix}`;
}

export type DashboardMetricCardId =
  | 'bp'
  | 'hr_spo2'
  | 'glucose'
  | 'weight_bmi'
  | 'sleep_temp'
  | 'steps_water'
  | 'nutrition_meds';

export type PriorityMetricCardId = DashboardMetricCardId;

export type PriorityFocusGroup =
  | 'blood_pressure'
  | 'blood_glucose'
  | 'digestive_metabolic'
  | 'general';

export interface PriorityDashboardConfig {
  focusGroup: PriorityFocusGroup;
  conditionGroup: PriorityFocusGroup;
  matchedIcdCode: string;
  bannerTitle: string;
  priorityBannerTitle: string;
  bannerDescription: string;
  priorityReason: string;
  orderedCardIds: DashboardMetricCardId[];
}

/**
 * Dựa vào mã ICD của hồ sơ (chronicConditions & bhytVisits) để chọn thẻ chỉ số ưu tiên ở đầu Tổng quan:
 * - I10 -> Huyết áp (bp đứng đầu)
 * - E11 -> Đường huyết (glucose đứng đầu)
 * - K21 / K76 -> Ăn uống, cân nặng, thuốc (nutrition_meds & weight_bmi đứng đầu)
 */
export function resolvePriorityDashboardConfig(
  chronicConditions: string[],
  bhytVisits: BhytVisitRecord[] = []
): PriorityDashboardConfig {
  const combinedText = [
    ...(chronicConditions || []),
    ...(bhytVisits || []).map((v) => `${v.icdCode} ${v.diagnosisSummary}`),
  ]
    .join(' ')
    .toUpperCase();

  const firstCondition = (chronicConditions?.[0] || bhytVisits?.[0]?.icdCode || '').toUpperCase();

  if (
    firstCondition.includes('E11') ||
    (!firstCondition.includes('I10') && combinedText.includes('E11'))
  ) {
    const title = 'Ưu tiên theo dõi Đường huyết & Cân nặng (Mã E11)';
    const desc =
      'Hồ sơ có ghi nhận Đái tháo đường (E11) — Thẻ Đường huyết và Cân nặng/BMI được ưu tiên hiển thị đầu tiên.';
    return {
      focusGroup: 'blood_glucose',
      conditionGroup: 'blood_glucose',
      matchedIcdCode: 'E11',
      bannerTitle: title,
      priorityBannerTitle: title,
      bannerDescription: desc,
      priorityReason: desc,
      orderedCardIds: ['glucose', 'weight_bmi', 'bp', 'hr_spo2', 'steps_water', 'sleep_temp'],
    };
  }

  if (
    firstCondition.includes('K21') ||
    firstCondition.includes('K76') ||
    combinedText.includes('K21') ||
    combinedText.includes('K76')
  ) {
    const title = 'Ưu tiên theo dõi Ăn uống, Cân nặng & Thuốc (Mã K21/K76)';
    const desc =
      'Hồ sơ có ghi nhận Dạ dày / Gan nhiễm mỡ (K21/K76) — Thẻ Ăn uống, Cân nặng & Lịch uống thuốc được ưu tiên hiển thị đầu tiên.';
    return {
      focusGroup: 'digestive_metabolic',
      conditionGroup: 'digestive_metabolic',
      matchedIcdCode: combinedText.includes('K21') ? 'K21/K76' : 'K76',
      bannerTitle: title,
      priorityBannerTitle: title,
      bannerDescription: desc,
      priorityReason: desc,
      orderedCardIds: [
        'nutrition_meds',
        'weight_bmi',
        'steps_water',
        'bp',
        'glucose',
        'sleep_temp',
      ],
    };
  }

  if (firstCondition.includes('I10') || combinedText.includes('I10')) {
    const title = 'Ưu tiên theo dõi Huyết áp & Nhịp tim (Mã I10)';
    const desc =
      'Hồ sơ có ghi nhận Tăng huyết áp (I10) — Thẻ Huyết áp Động mạch và Nhịp tim được ưu tiên hiển thị đầu tiên.';
    return {
      focusGroup: 'blood_pressure',
      conditionGroup: 'blood_pressure',
      matchedIcdCode: 'I10',
      bannerTitle: title,
      priorityBannerTitle: title,
      bannerDescription: desc,
      priorityReason: desc,
      orderedCardIds: ['bp', 'hr_spo2', 'glucose', 'weight_bmi', 'sleep_temp', 'steps_water'],
    };
  }

  const title = 'Theo dõi Chỉ số Sinh tồn Tổng quát';
  const desc =
    'Hiển thị đầy đủ các chỉ số huyết áp, nhịp tim, đường huyết, cân nặng và vận động hàng ngày.';
  return {
    focusGroup: 'general',
    conditionGroup: 'general',
    matchedIcdCode: 'CHUNG',
    bannerTitle: title,
    priorityBannerTitle: title,
    bannerDescription: desc,
    priorityReason: desc,
    orderedCardIds: ['bp', 'hr_spo2', 'glucose', 'weight_bmi', 'sleep_temp', 'steps_water'],
  };
}






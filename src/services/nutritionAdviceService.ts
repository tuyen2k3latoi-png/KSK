import { HealthStatusLevel, VitalRecord } from '../types/health';
import { classifyBloodGlucose, classifyBloodPressure } from '../utils/healthCalculations';
import {
  BP_HIGH_AVOID,
  BP_HIGH_EAT,
  BP_LOW_AVOID,
  BP_LOW_EAT,
  BP_NORMAL_AVOID,
  BP_NORMAL_EAT,
  GLU_HIGH_AVOID,
  GLU_HIGH_EAT,
  GLU_HYPO_AVOID,
  GLU_HYPO_EAT,
  GLU_NORMAL_AVOID,
  GLU_NORMAL_EAT,
} from '../data/nutritionGuidancePresets';

export type NutritionAdviceCategory = 'bp' | 'glucose' | 'both';
export type NutritionFilterTab = 'all' | 'bp' | 'glucose';

export interface NutritionFoodItem {
  id: string;
  name: string;
  reason: string;
  portionTip: string;
  category: NutritionAdviceCategory;
  priority: number;
}

export interface DashboardNutritionGuidance {
  hasRecordedVitals: boolean;
  recordedAtLabel: string;
  bpSummary: { status: HealthStatusLevel; label: string; valueText: string };
  glucoseSummary: { status: HealthStatusLevel; label: string; valueText: string; contextLabel: string };
  focusTitle: string;
  overallAdvice: string;
  foodsToEat: NutritionFoodItem[];
  foodsToAvoid: NutritionFoodItem[];
}

function getBloodPressureDirection(
  systolic: number,
  diastolic: number,
  status: HealthStatusLevel
): 'high' | 'low' | 'normal' {
  if (systolic < 90 || diastolic < 60) return 'low';
  if (status === 'normal') return 'normal';
  return 'high';
}

function getGlucoseDirection(
  glucoseMgDl: number,
  status: HealthStatusLevel
): 'hypo' | 'high' | 'normal' {
  if (glucoseMgDl < 70) return 'hypo';
  if (status === 'normal') return 'normal';
  return 'high';
}

function mergeUniqueFoods(items: NutritionFoodItem[]): NutritionFoodItem[] {
  const seen = new Map<string, NutritionFoodItem>();
  for (const item of items) {
    const existing = seen.get(item.id);
    if (!existing || item.priority < existing.priority) {
      seen.set(item.id, item);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.priority - b.priority);
}

function resolveFocusAndAdvice(
  bpDir: 'high' | 'low' | 'normal',
  gluDir: 'hypo' | 'high' | 'normal'
): { focusTitle: string; overallAdvice: string } {
  if (bpDir === 'high' && gluDir === 'high') {
    return {
      focusTitle: 'Ưu tiên giảm muối & giảm đường tinh bột',
      overallAdvice:
        'Cả huyết áp và đường huyết đều đang cao hơn mục tiêu: hãy ăn nhạt dưới 5g muối/ngày, thay cơm trắng bằng gạo lứt/rau xanh và tránh đồ muối mặn, nước ngọt.',
    };
  }
  if (bpDir === 'high' && gluDir === 'hypo') {
    return {
      focusTitle: 'Xử trí hạ đường huyết & ăn nhạt bảo vệ mạch',
      overallAdvice:
        'Đường huyết đang thấp dưới 70 mg/dL nên cần bổ sung ngay 15g đường nhanh; đồng thời các bữa chính vẫn giữ ăn nhạt, nhiều rau xanh để ổn định huyết áp.',
    };
  }
  if (gluDir === 'hypo') {
    return {
      focusTitle: 'Cần bổ sung đường nhanh & chia nhỏ bữa ăn',
      overallAdvice:
        'Đường huyết đang xuống thấp dưới 70 mg/dL: hãy uống ngay nửa ly nước đường ấm hoặc nước cam, đo lại sau 15 phút và không bỏ bữa.',
    };
  }
  if (bpDir === 'high') {
    return {
      focusTitle: 'Ưu tiên ăn nhạt, tăng rau giàu kali',
      overallAdvice:
        'Huyết áp hiện cao hơn ngưỡng tối ưu: hãy giảm mắm muối, tránh dưa cà muối/đồ hộp và tăng cường rau lá xanh đậm, cá hấp.',
    };
  }
  if (gluDir === 'high') {
    return {
      focusTitle: 'Ưu tiên tinh bột chậm & thực phẩm ít đường',
      overallAdvice:
        'Đường huyết đang cao hơn mục tiêu: hãy ăn rau trước khi ăn cơm, giảm cơm trắng/xôi/đồ ngọt và chọn trái cây ít ngọt như ổi, bưởi.',
    };
  }
  if (bpDir === 'low') {
    return {
      focusTitle: 'Ưu tiên ăn đủ bữa, uống đủ nước ấm',
      overallAdvice:
        'Huyết áp hơi thấp: nên chia nhỏ bữa ăn ấm dễ tiêu, uống đủ nước và tránh đứng dậy đột ngột.',
    };
  }
  return {
    focusTitle: 'Duy trì thực đơn cân bằng',
    overallAdvice:
      'Huyết áp và đường huyết đang ở ngưỡng tốt. Tiếp tục ăn nhiều rau xanh, cá hấp, nêm nhạt và hạn chế đồ ngọt.',
  };
}

/**
 * Tạo gợi ý thực phẩm Nên ăn / Nên tránh dựa trên chỉ số huyết áp và đường huyết đã ghi nhận.
 */
export function buildDashboardNutritionGuidance(params: {
  vitals: VitalRecord[];
  latestVital?: VitalRecord | null;
}): DashboardNutritionGuidance {
  const hasRecordedVitals = params.vitals.length > 0;
  const activeVital = params.latestVital || params.vitals[0] || null;

  if (!activeVital) {
    return {
      hasRecordedVitals: false,
      recordedAtLabel: 'Chưa có dữ liệu đo',
      bpSummary: { status: 'normal', label: 'Chưa đo', valueText: '--/-- mmHg' },
      glucoseSummary: {
        status: 'normal',
        label: 'Chưa đo',
        valueText: '-- mg/dL',
        contextLabel: 'Chưa rõ thời điểm',
      },
      focusTitle: 'Thực đơn cân bằng gợi ý ban đầu',
      overallAdvice:
        'Hãy ghi nhận chỉ số huyết áp và đường huyết đầu tiên để hệ thống điều chỉnh gợi ý thực phẩm sát với thể trạng của bạn.',
      foodsToEat: [...BP_NORMAL_EAT, ...GLU_NORMAL_EAT],
      foodsToAvoid: [...BP_NORMAL_AVOID, ...GLU_NORMAL_AVOID],
    };
  }

  const bpEval = classifyBloodPressure(activeVital.systolic, activeVital.diastolic);
  const gluEval = classifyBloodGlucose(activeVital.bloodGlucose, activeVital.glucoseContext);
  const bpDir = getBloodPressureDirection(activeVital.systolic, activeVital.diastolic, bpEval.status);
  const gluDir = getGlucoseDirection(activeVital.bloodGlucose, gluEval.status);

  const bpEat = bpDir === 'high' ? BP_HIGH_EAT : bpDir === 'low' ? BP_LOW_EAT : BP_NORMAL_EAT;
  const bpAvoid = bpDir === 'high' ? BP_HIGH_AVOID : bpDir === 'low' ? BP_LOW_AVOID : BP_NORMAL_AVOID;
  const gluEat = gluDir === 'hypo' ? GLU_HYPO_EAT : gluDir === 'high' ? GLU_HIGH_EAT : GLU_NORMAL_EAT;
  const gluAvoid = gluDir === 'hypo' ? GLU_HYPO_AVOID : gluDir === 'high' ? GLU_HIGH_AVOID : GLU_NORMAL_AVOID;

  const { focusTitle, overallAdvice } = resolveFocusAndAdvice(bpDir, gluDir);

  return {
    hasRecordedVitals,
    recordedAtLabel: `${activeVital.time} · ${activeVital.date}`,
    bpSummary: {
      status: bpEval.status,
      label: bpEval.label,
      valueText: `${activeVital.systolic}/${activeVital.diastolic} mmHg`,
    },
    glucoseSummary: {
      status: gluEval.status,
      label: gluEval.label,
      valueText: `${activeVital.bloodGlucose} mg/dL`,
      contextLabel: activeVital.glucoseContext === 'fasting' ? 'Lúc đói' : 'Sau ăn',
    },
    focusTitle,
    overallAdvice,
    foodsToEat: mergeUniqueFoods([...bpEat, ...gluEat]),
    foodsToAvoid: mergeUniqueFoods([...bpAvoid, ...gluAvoid]),
  };
}

export function filterNutritionFoodItems(
  items: NutritionFoodItem[],
  tab: NutritionFilterTab
): NutritionFoodItem[] {
  if (tab === 'all') return items;
  return items.filter((item) => item.category === tab || item.category === 'both');
}

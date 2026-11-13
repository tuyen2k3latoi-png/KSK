import { HealthStatusLevel, MedicationSchedule, VitalRecord } from '../types/health';
import { EmergencyAlertEvaluation } from './emergencyService';

export function parseMinimalModeFlag(raw?: string | null): boolean {
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
}

function parseTimeSlotMinutes(timeSlot: string): number {
  const [hStr, mStr] = (timeSlot || '00:00').split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export interface MinimalModeMedicationOverview {
  takenCount: number;
  totalCount: number;
  remainingCount: number;
  orderedMedications: MedicationSchedule[];
}

/**
 * Sắp xếp thuốc cho Chế độ tối giản:
 * - Thuốc chưa uống lên đầu (theo thứ tự giờ uống tăng dần)
 * - Thuốc đã uống xếp phía dưới để người cao tuổi dễ kiểm tra lại
 */
export function selectMinimalModeMedications(
  medications: MedicationSchedule[]
): MinimalModeMedicationOverview {
  const sorted = [...medications].sort((a, b) => {
    if (a.takenToday !== b.takenToday) {
      return a.takenToday ? 1 : -1;
    }
    return parseTimeSlotMinutes(a.timeSlot) - parseTimeSlotMinutes(b.timeSlot);
  });

  const takenCount = medications.filter((m) => m.takenToday).length;
  const totalCount = medications.length;

  return {
    takenCount,
    totalCount,
    remainingCount: Math.max(0, totalCount - takenCount),
    orderedMedications: sorted,
  };
}

export interface MinimalModeHealthSummary {
  bpText: string;
  bpLabel: string;
  bpStatus: HealthStatusLevel;
  bpRecommendation: string;
  heartRate: number;
  spo2: number;
  measuredTime: string;
  isAlarming: boolean;
  alarmReasons: string[];
  medOverview: MinimalModeMedicationOverview;
}

export function buildMinimalModeSummary(params: {
  latestVital: VitalRecord;
  bpEval: {
    status: HealthStatusLevel;
    label: string;
    recommendation: string;
  };
  medications: MedicationSchedule[];
  emergencyAlert: EmergencyAlertEvaluation;
}): MinimalModeHealthSummary {
  const { latestVital, bpEval, medications, emergencyAlert } = params;
  return {
    bpText: `${latestVital.systolic}/${latestVital.diastolic}`,
    bpLabel: bpEval.label,
    bpStatus: bpEval.status,
    bpRecommendation: bpEval.recommendation,
    heartRate: latestVital.heartRate,
    spo2: latestVital.spo2,
    measuredTime: latestVital.time,
    isAlarming: emergencyAlert.isAlarming,
    alarmReasons: emergencyAlert.reasons,
    medOverview: selectMinimalModeMedications(medications),
  };
}

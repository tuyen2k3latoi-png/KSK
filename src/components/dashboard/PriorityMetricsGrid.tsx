import React, { useState } from 'react';
import {
  Activity,
  ChevronDown,
  Footprints,
  Heart,
  Moon,
  Scale,
  Thermometer,
  Utensils,
} from 'lucide-react';
import { HealthStatusLevel, UserMedicalProfile, VitalRecord } from '../../types/health';
import { computeVitalTrend } from '../../utils/formatters';
import { PriorityMetricCardId } from '../../utils/healthCalculations';
import { StatTile } from '../ui/Primitives';

interface PriorityMetricsGridProps {
  orderedCardIds: PriorityMetricCardId[];
  vitals?: VitalRecord[];
  latestVital: VitalRecord;
  profile: UserMedicalProfile;
  bmi: number;
  bmiEval: { label: string };
  bpEval: { status: HealthStatusLevel; label: string };
  gluEval: { status: HealthStatusLevel; label: string };
  hrEval: { label: string };
  waterIntakeMl: number;
  medAdherence: { takenCount: number; totalCount: number; adherencePercent: number };
  calorieSummary: { totalIntake: number; netCalories: number; proteinG: number };
  onAddWater: (amountMl: number) => void;
}

export const PriorityMetricsGrid: React.FC<PriorityMetricsGridProps> = ({
  orderedCardIds,
  vitals = [],
  latestVital,
  profile,
  bmi,
  bmiEval,
  bpEval,
  gluEval,
  hrEval,
  waterIntakeMl,
  medAdherence,
  calorieSummary,
  onAddWater,
}) => {
  const [showMoreMetrics, setShowMoreMetrics] = useState(false);

  const recordsForTrend = vitals.length > 0 ? vitals : [latestVital];
  const bpTrend = computeVitalTrend(recordsForTrend, (v) => v.systolic, 2);
  const gluTrend = computeVitalTrend(recordsForTrend, (v) => v.bloodGlucose, 3);
  const hrTrend = computeVitalTrend(recordsForTrend, (v) => v.heartRate, 2);
  const stepsTrend = computeVitalTrend(recordsForTrend, (v) => v.steps, 300);
  const sleepTrend = computeVitalTrend(recordsForTrend, (v) => v.sleepHours, 0.3);
  const weightTrend = computeVitalTrend(recordsForTrend, (v) => v.weightKg, 0.3);

  const renderMetricTile = (cardId: PriorityMetricCardId, idx: number) => {
    const priorityBadge = idx < 2 ? `Ưu tiên #${idx + 1}` : undefined;

    switch (cardId) {
      case 'bp':
        return (
          <StatTile
            key="bp"
            testId="metric-card-bp"
            title="Huyết áp"
            priorityBadge={priorityBadge}
            icon={<Activity className="w-5 h-5 text-[#0F766E]" />}
            valueNode={
              <span data-testid="latest-bp-value">
                {latestVital.systolic}/{latestVital.diastolic}
              </span>
            }
            unit="mmHg"
            status={bpEval.status}
            statusLabel={bpEval.label}
            trend={bpTrend}
            footerNode="Ngưỡng tham khảo: ≤ 120/80 mmHg"
          />
        );

      case 'glucose':
        return (
          <StatTile
            key="glucose"
            testId="metric-card-glucose"
            title="Đường huyết"
            priorityBadge={priorityBadge}
            icon={<Thermometer className="w-5 h-5 text-[#F59E0B]" />}
            valueNode={
              <span data-testid="latest-glucose-value">{latestVital.bloodGlucose}</span>
            }
            unit="mg/dL"
            status={gluEval.status}
            statusLabel={gluEval.label}
            trend={gluTrend}
            footerNode={
              latestVital.glucoseContext === 'fasting'
                ? 'Đo lúc đói (Chuẩn < 100 mg/dL)'
                : 'Đo sau ăn 2 giờ (< 140 mg/dL)'
            }
          />
        );

      case 'hr_spo2':
        return (
          <StatTile
            key="hr_spo2"
            testId="metric-card-hr_spo2"
            title="Nhịp tim & Oxy máu"
            priorityBadge={priorityBadge}
            icon={<Heart className="w-5 h-5 text-[#DC2626]" />}
            valueNode={
              <span>
                <span data-testid="latest-hr-value">{latestVital.heartRate}</span>
                <span className="text-base font-semibold text-stone-500 mx-1">bpm ·</span>
                <span className="text-[#0F766E]">{latestVital.spo2}%</span>
              </span>
            }
            status="normal"
            statusLabel={hrEval.label}
            trend={hrTrend}
            footerNode="SpO2 bình thường từ 95% – 100%"
          />
        );

      case 'steps_water':
        return (
          <StatTile
            key="steps_water"
            testId="metric-card-steps_water"
            title="Bước chân hôm nay"
            priorityBadge={priorityBadge}
            icon={<Footprints className="w-5 h-5 text-[#0F766E]" />}
            valueNode={<span>{latestVital.steps.toLocaleString('vi-VN')}</span>}
            unit="bước"
            status={latestVital.steps >= 5000 ? 'normal' : 'warning'}
            statusLabel={latestVital.steps >= 5000 ? 'Vận động tốt' : 'Cần đi bộ thêm'}
            trend={stepsTrend}
            actionNode={
              <button
                type="button"
                onClick={() => onAddWater(250)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#0F766E]/10 hover:bg-[#0F766E]/20 text-[#0B5F57] text-sm font-bold transition-colors cursor-pointer"
              >
                +250 ml nước
              </button>
            }
            footerNode={`Đã uống ${waterIntakeMl} ml nước · Tiêu hao ${calorieSummary.netCalories} kcal`}
          />
        );

      case 'sleep_temp':
        return (
          <StatTile
            key="sleep_temp"
            testId="metric-card-sleep_temp"
            title="Giấc ngủ đêm qua"
            priorityBadge={priorityBadge}
            icon={<Moon className="w-5 h-5 text-[#0F766E]" />}
            valueNode={<span>{latestVital.sleepHours}</span>}
            unit={`/ ${profile.dailySleepGoalHours} giờ`}
            status={latestVital.sleepHours >= 6.5 ? 'normal' : 'warning'}
            statusLabel={latestVital.sleepHours >= 6.5 ? 'Ngủ đủ giấc' : 'Ngủ hơi ít'}
            trend={sleepTrend}
            footerNode={`Thân nhiệt: ${latestVital.temperatureC} °C`}
          />
        );

      case 'weight_bmi':
        return (
          <StatTile
            key="weight_bmi"
            testId="metric-card-weight_bmi"
            title="Cân nặng & BMI"
            priorityBadge={priorityBadge}
            icon={<Scale className="w-5 h-5 text-[#0F766E]" />}
            valueNode={
              <span>
                {latestVital.weightKg}{' '}
                <span className="text-base font-semibold text-stone-500">kg</span> ·{' '}
                <span className="text-xl text-[#0B5F57]">BMI {bmi}</span>
              </span>
            }
            status="normal"
            statusLabel={bmiEval.label}
            trend={weightTrend}
            footerNode="Theo chuẩn thể trạng người châu Á"
          />
        );

      case 'nutrition_meds':
      default:
        return (
          <StatTile
            key="nutrition_meds"
            testId="metric-card-nutrition_meds"
            title="Thuốc & Dinh dưỡng"
            priorityBadge={priorityBadge}
            icon={<Utensils className="w-5 h-5 text-[#0F766E]" />}
            valueNode={<span>{medAdherence.adherencePercent}%</span>}
            unit="tuân thủ thuốc"
            status={medAdherence.adherencePercent >= 80 ? 'normal' : 'warning'}
            statusLabel={`Đã uống ${medAdherence.takenCount}/${medAdherence.totalCount} cữ`}
            footerNode={`Nạp ${calorieSummary.totalIntake} kcal · Đạm ${calorieSummary.proteinG}g`}
          />
        );
    }
  };

  const primaryFourSet = new Set<PriorityMetricCardId>([
    'bp',
    'glucose',
    'steps_water',
    'sleep_temp',
  ]);

  return (
    <section aria-label="Lưới 2x2 các chỉ số sức khỏe chính" className="space-y-3">
      <div
        data-testid="priority-metrics-grid"
        className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-4"
      >
        {orderedCardIds.map((cardId, idx) => (
          <div
            key={cardId}
            className={
              primaryFourSet.has(cardId) || showMoreMetrics ? 'contents' : 'sr-only'
            }
          >
            {renderMetricTile(cardId, idx)}
          </div>
        ))}
      </div>

      {orderedCardIds.length > 4 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowMoreMetrics((prev) => !prev)}
            data-testid="toggle-more-metrics-btn"
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200/90 text-sm font-bold text-[#0B5F57] inline-flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
          >
            <span>
              {showMoreMetrics
                ? 'Thu gọn chỉ hiển thị 4 chỉ số chính (2×2)'
                : 'Xem thêm Nhịp tim, Cân nặng & Dinh dưỡng'}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showMoreMetrics ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      )}
    </section>
  );
};

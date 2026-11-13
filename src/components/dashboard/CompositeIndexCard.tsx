import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  PhoneCall,
} from 'lucide-react';
import { HealthStatusLevel, VitalRecord } from '../../types/health';
import { formatTime24h } from '../../utils/formatters';
import { Card, Chip } from '../ui/Primitives';

interface CompositeIndexCardProps {
  latestVital: VitalRecord;
  healthScore: {
    score: number;
    grade: string;
    status: HealthStatusLevel;
  };
  bpEval: {
    status: HealthStatusLevel;
    label: string;
    recommendation: string;
  };
  gluEval: {
    status: HealthStatusLevel;
    label: string;
  };
  medAdherencePercent: number;
  onOpenEmergencyCall?: () => void;
}

/**
 * Thẻ "Chỉ số tổng hợp tham khảo":
 * - Vòng tròn điểm rõ nét (tabular-nums, không dùng font monospace)
 * - Trạng thái kèm icon + chữ
 * - 1 câu nhận xét ngắn gọn dễ hiểu cho người 45–70 tuổi
 */
export const CompositeIndexCard: React.FC<CompositeIndexCardProps> = ({
  latestVital,
  healthScore,
  bpEval,
  gluEval,
  medAdherencePercent,
  onOpenEmergencyCall,
}) => {
  const [showScoreInfoPopover, setShowScoreInfoPopover] = useState(false);

  const ringStrokeColor =
    healthScore.status === 'normal'
      ? '#0F766E'
      : healthScore.status === 'elevated' || healthScore.status === 'warning'
      ? '#F59E0B'
      : '#DC2626';

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <h2
            data-testid="reference-composite-index-title"
            className="text-lg sm:text-xl font-bold text-[#1F2937]"
          >
            Điểm sức khỏe hôm nay
          </h2>
          <button
            type="button"
            onClick={() => setShowScoreInfoPopover((prev) => !prev)}
            aria-label="Cách tính điểm sức khỏe"
            data-testid="health-score-info-btn"
            className="min-w-[40px] min-h-[40px] rounded-xl bg-[#FAF7F2] hover:bg-[#0F766E]/10 border border-stone-200 text-[#0B5F57] inline-flex items-center justify-center cursor-pointer transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
        {onOpenEmergencyCall && (
          <button
            type="button"
            onClick={onOpenEmergencyCall}
            data-testid="home-emergency-call-btn"
            className="min-h-[42px] px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-[#DC2626] text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <PhoneCall className="w-4 h-4 shrink-0" />
            <span>Gọi khẩn cấp</span>
          </button>
        )}
      </div>

      {showScoreInfoPopover && (
        <div
          data-testid="health-score-info-popover"
          className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-sm text-[#1F2937] space-y-1.5 leading-relaxed"
        >
          <p className="font-bold text-[#0B5F57]">
            Tính từ 6 yếu tố: Huyết áp, Đường huyết, Nhịp tim &amp; SpO2, BMI, Giấc ngủ và Uống thuốc.
          </p>
          <p className="text-stone-700">
            • Nếu uống thuốc dưới 80% hoặc có chỉ số cao, điểm sẽ nhắc cần lưu ý. Chỉ dùng để theo dõi hằng ngày.
          </p>
        </div>
      )}

      {/* Vòng tròn điểm + 1 câu nhận xét ngắn gọn */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 py-1">
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="43"
                fill="none"
                stroke="#E7E5E4"
                strokeWidth="8.5"
              />
              <circle
                cx="50"
                cy="50"
                r="43"
                fill="none"
                stroke={ringStrokeColor}
                strokeWidth="8.5"
                strokeDasharray={`${(healthScore.score / 100) * 270} 270`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                data-testid="health-score-value"
                className="text-2xl font-extrabold text-[#1F2937] tabular-nums leading-none"
              >
                {healthScore.score}
              </span>
              <span className="text-xs font-bold text-stone-500 mt-1">
                thang 100
              </span>
            </div>
          </div>

          <div className="space-y-1.5 sm:hidden">
            <div data-testid="health-score-grade">
              <Chip
                label={`Mức tham khảo: ${healthScore.grade}`}
                variant={healthScore.status}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 min-w-0 flex-1">
          <div className="hidden sm:block" data-testid="health-score-grade">
            <Chip
              label={`Mức tham khảo: ${healthScore.grade}`}
              variant={healthScore.status}
            />
          </div>

          <p className="text-base font-medium text-[#1F2937] leading-relaxed">
            {bpEval.recommendation}
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
            <span className="inline-flex items-center gap-1.5">
              {bpEval.status === 'normal' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
              )}
              <span>
                Đo lúc <strong className="tabular-nums text-[#1F2937]">{formatTime24h(latestVital.time)}</strong>:{' '}
                <strong className="tabular-nums text-[#1F2937]">
                  {latestVital.systolic}/{latestVital.diastolic} mmHg
                </strong>{' '}
                ({bpEval.label})
              </span>
            </span>
            <span>·</span>
            <span>
              Uống thuốc hôm nay:{' '}
              <strong className="tabular-nums text-[#0B5F57]">
                {medAdherencePercent}%
              </strong>
            </span>
          </div>
        </div>
      </div>

      {(bpEval.status === 'critical' ||
        gluEval.status === 'critical' ||
        healthScore.status === 'critical') && (
        <div
          role="alert"
          data-testid="emergency-115-guidance"
          className="p-4 rounded-2xl bg-[#DC2626] text-white text-sm sm:text-base space-y-2.5 shadow-sm"
        >
          <div className="font-bold flex items-center gap-2 text-base">
            <PhoneCall className="w-5 h-5 shrink-0" />
            <span>Cần chú ý ngay — Hướng dẫn khi nào gọi cấp cứu 115:</span>
          </div>
          <p className="leading-relaxed">
            Nếu chỉ số huyết áp &ge; 180/120 mmHg hoặc đi kèm đau tức ngực, khó thở, đau đầu dữ dội, tê yếu tay chân: hãy nghỉ ngơi ngay và gọi số cấp cứu <strong>115</strong> hoặc nhờ người thân đưa đến cơ sở y tế gần nhất.
          </p>
          {onOpenEmergencyCall && (
            <button
              type="button"
              onClick={onOpenEmergencyCall}
              data-testid="alert-emergency-call-btn"
              className="min-h-[48px] px-4 py-2 rounded-xl bg-white hover:bg-red-50 text-[#DC2626] text-base font-extrabold inline-flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <PhoneCall className="w-5 h-5 shrink-0" />
              <span>Gọi ngay Bác sĩ / Người thân / 115</span>
            </button>
          )}
        </div>
      )}
    </Card>
  );
};

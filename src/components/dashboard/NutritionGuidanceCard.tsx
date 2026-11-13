import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Droplet,
  PlusCircle,
  Utensils,
} from 'lucide-react';
import { HealthStatusLevel, VitalRecord } from '../../types/health';
import {
  buildDashboardNutritionGuidance,
  filterNutritionFoodItems,
  NutritionFilterTab,
} from '../../services/nutritionAdviceService';
import { ActiveModule } from '../layout/AppTopHeaderAndNav';
import { Card, SectionHeader } from '../ui/Primitives';

interface NutritionGuidanceCardProps {
  vitals: VitalRecord[];
  latestVital: VitalRecord;
  onNavigateModule: (module: ActiveModule) => void;
  onOpenLogModal: () => void;
}

const FILTER_TABS: Array<{ id: NutritionFilterTab; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'bp', label: 'Huyết áp' },
  { id: 'glucose', label: 'Đường huyết' },
];

function getStatusTextStyle(status: HealthStatusLevel): {
  textColor: string;
  Icon: React.ComponentType<{ className?: string }>;
} {
  if (status === 'critical') {
    return { textColor: 'text-[#DC2626]', Icon: AlertTriangle };
  }
  if (status === 'warning' || status === 'elevated') {
    return { textColor: 'text-amber-800', Icon: AlertTriangle };
  }
  return { textColor: 'text-emerald-800', Icon: CheckCircle2 };
}

export const NutritionGuidanceCard: React.FC<NutritionGuidanceCardProps> = ({
  vitals,
  latestVital,
  onNavigateModule,
  onOpenLogModal,
}) => {
  const [activeTab, setActiveTab] = useState<NutritionFilterTab>('all');

  const guidance = useMemo(
    () => buildDashboardNutritionGuidance({ vitals, latestVital }),
    [vitals, latestVital]
  );

  const visibleEatItems = useMemo(
    () => filterNutritionFoodItems(guidance.foodsToEat, activeTab).slice(0, 4),
    [guidance.foodsToEat, activeTab]
  );

  const visibleAvoidItems = useMemo(
    () => filterNutritionFoodItems(guidance.foodsToAvoid, activeTab).slice(0, 4),
    [guidance.foodsToAvoid, activeTab]
  );

  const hasCriticalAlert =
    guidance.bpSummary.status === 'critical' || guidance.glucoseSummary.status === 'critical';
  const bpStatusMeta = getStatusTextStyle(guidance.bpSummary.status);
  const gluStatusMeta = getStatusTextStyle(guidance.glucoseSummary.status);

  return (
    <Card
      testId="dashboard-nutrition-guidance-card"
      as="section"
      ariaLabel="Gợi ý thực phẩm theo chỉ số"
      className="space-y-4"
    >
      <SectionHeader
        title="Gợi ý thực phẩm theo chỉ số"
        subtitle={guidance.focusTitle}
        icon={<Utensils className="w-6 h-6" />}
        action={
          <div
            role="tablist"
            aria-label="Lọc gợi ý thực phẩm theo chỉ số"
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#FAF7F2] border border-stone-200/90"
          >
            {FILTER_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  data-testid={`nutrition-filter-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#0F766E] text-white shadow-2xs'
                      : 'text-stone-700 hover:bg-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        }
      />

      {/* Dải tóm tắt chỉ số huyết áp & đường huyết dạng văn bản rõ nét */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2 pb-3 border-b border-stone-200/80 text-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <Activity className="w-4 h-4 text-[#0F766E] shrink-0" />
          <span className="text-stone-600 font-medium">Huyết áp:</span>
          <strong data-testid="nutrition-guidance-bp-value" className="tabular-nums text-[#1F2937]">
            {guidance.bpSummary.valueText}
          </strong>
          <span aria-hidden="true" className="text-stone-400">·</span>
          <span className={`inline-flex items-center gap-1 font-bold ${bpStatusMeta.textColor}`}>
            <bpStatusMeta.Icon className="w-4 h-4 shrink-0" />
            <span>{guidance.bpSummary.label}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Droplet className="w-4 h-4 text-[#D97706] shrink-0" />
          <span className="text-stone-600 font-medium">
            Đường huyết ({guidance.glucoseSummary.contextLabel}):
          </span>
          <strong data-testid="nutrition-guidance-glucose-value" className="tabular-nums text-[#1F2937]">
            {guidance.glucoseSummary.valueText}
          </strong>
          <span aria-hidden="true" className="text-stone-400">·</span>
          <span className={`inline-flex items-center gap-1 font-bold ${gluStatusMeta.textColor}`}>
            <gluStatusMeta.Icon className="w-4 h-4 shrink-0" />
            <span>{guidance.glucoseSummary.label}</span>
          </span>
        </div>
      </div>

      <p data-testid="nutrition-guidance-summary" className="text-base text-[#1F2937] leading-relaxed font-medium">
        {guidance.overallAdvice}
      </p>

      {/* Hai cột gợi ý Nên ăn / Nên tránh với đường chia nhẹ nhàng, không lồng thẻ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
        <div data-testid="nutrition-eat-list" className="rounded-2xl bg-emerald-50/55 p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-200/70">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <h3 className="text-base font-extrabold text-emerald-950">Thực phẩm nên ăn</h3>
          </div>
          <ul className="divide-y divide-emerald-200/50">
            {visibleEatItems.map((item) => (
              <li key={item.id} className="py-2.5 first:pt-0 last:pb-0 text-sm leading-relaxed space-y-0.5">
                <p className="font-bold text-[#1F2937]">{item.name}</p>
                <p className="text-stone-700">{item.reason}</p>
                <p className="text-xs font-semibold text-[#0B5F57]">Gợi ý: {item.portionTip}</p>
              </li>
            ))}
          </ul>
        </div>

        <div
          data-testid="nutrition-avoid-list"
          className={`rounded-2xl p-4 space-y-3 ${
            hasCriticalAlert ? 'bg-red-50/65' : 'bg-amber-50/65'
          }`}
        >
          <div
            className={`flex items-center gap-2 pb-2 border-b ${
              hasCriticalAlert ? 'border-red-200/75' : 'border-amber-200/75'
            }`}
          >
            <Ban className={`w-5 h-5 shrink-0 ${hasCriticalAlert ? 'text-[#DC2626]' : 'text-[#D97706]'}`} />
            <h3 className={`text-base font-extrabold ${hasCriticalAlert ? 'text-red-950' : 'text-amber-950'}`}>
              Thực phẩm nên tránh / hạn chế
            </h3>
          </div>
          <ul className={`divide-y ${hasCriticalAlert ? 'divide-red-200/50' : 'divide-amber-200/50'}`}>
            {visibleAvoidItems.map((item) => (
              <li key={item.id} className="py-2.5 first:pt-0 last:pb-0 text-sm leading-relaxed space-y-0.5">
                <p className="font-bold text-[#1F2937]">{item.name}</p>
                <p className="text-stone-700">{item.reason}</p>
                <p className={`text-xs font-semibold ${hasCriticalAlert ? 'text-[#DC2626]' : 'text-amber-900'}`}>
                  Lưu ý: {item.portionTip}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Chân thẻ: Ghi chú thời điểm đo + Thao tác nhanh */}
      <div className="pt-3 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-stone-600 tabular-nums">
          Cập nhật theo lần đo lúc {guidance.recordedAtLabel} · Trao đổi bác sĩ nếu có chế độ ăn bệnh lý riêng.
        </p>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="nutrition-log-vital-btn"
            onClick={onOpenLogModal}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-stone-100 border border-stone-300 text-sm font-bold text-[#0B5F57] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-[#0F766E] shrink-0" />
            <span>Cập nhật chỉ số</span>
          </button>
          <button
            type="button"
            data-testid="nutrition-open-diary-btn"
            onClick={() => onNavigateModule('nutrition')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
          >
            <span>Nhật ký Ăn &amp; Tập →</span>
          </button>
        </div>
      </div>
    </Card>
  );
};

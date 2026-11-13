import React from 'react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  LayoutGrid,
  PhoneCall,
  Pill,
  Plus,
} from 'lucide-react';
import { HealthStatusLevel, MedicationSchedule, UserMedicalProfile, VitalRecord } from '../../types/health';
import { EmergencyAlertEvaluation } from '../../services/emergencyService';
import { buildMinimalModeSummary } from '../../services/minimalModeService';
import { buildVietnameseGreeting, formatTime24h } from '../../utils/formatters';
import { Card, Chip } from '../ui/Primitives';

interface MinimalDashboardViewProps {
  profile: UserMedicalProfile;
  latestVital: VitalRecord;
  bpEval: {
    status: HealthStatusLevel;
    label: string;
    recommendation: string;
  };
  medications: MedicationSchedule[];
  nextDoseInfo: {
    medication: MedicationSchedule;
    countdownLabel: string;
  } | null;
  emergencyAlert: EmergencyAlertEvaluation;
  onToggleMedication: (id: string) => void;
  onOpenLogModal: () => void;
  onOpenEmergencyCall: () => void;
  onExitMinimalMode: () => void;
}

export const MinimalDashboardView: React.FC<MinimalDashboardViewProps> = ({
  profile,
  latestVital,
  bpEval,
  medications,
  nextDoseInfo,
  emergencyAlert,
  onToggleMedication,
  onOpenLogModal,
  onOpenEmergencyCall,
  onExitMinimalMode,
}) => {
  const greeting = buildVietnameseGreeting({
    fullName: profile.fullName,
    gender: profile.gender,
    birthYear: profile.birthYear,
  });

  const summary = buildMinimalModeSummary({
    latestVital,
    bpEval,
    medications,
    emergencyAlert,
  });

  const { medOverview } = summary;

  return (
    <div data-testid="minimal-dashboard-view" className="max-w-2xl mx-auto space-y-5">
      {/* Lời chào ngắn gọn + nút thoát Chế độ tối giản */}
      <section className="bg-gradient-to-br from-[#0B5F57] to-[#0F766E] rounded-[24px] p-5 text-white shadow-[0_12px_30px_-8px_rgba(11,95,87,0.38)] space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-100">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{greeting.todayFormatted}</span>
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
              {greeting.greetingTitle}
            </h1>
          </div>
          <button
            type="button"
            onClick={onExitMinimalMode}
            data-testid="exit-minimal-mode-btn"
            className="min-h-[46px] px-4 py-2 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>Chế độ đầy đủ</span>
          </button>
        </div>
        <p className="text-sm sm:text-base text-teal-50 font-medium">
          Chế độ xem tối giản — Chỉ hiển thị Huyết áp &amp; Thuốc hôm nay với nút lớn dễ chạm.
        </p>
      </section>

      {/* Cảnh báo khẩn cấp nếu chỉ số báo động */}
      {summary.isAlarming && (
        <div
          role="alert"
          data-testid="minimal-emergency-alert-banner"
          className="p-5 rounded-[24px] bg-[#DC2626] text-white space-y-3 shadow-md"
        >
          <div className="flex items-center gap-2.5 text-lg font-extrabold">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <span>Chỉ số sức khỏe đang báo động</span>
          </div>
          <p className="text-base leading-relaxed text-red-50">
            {summary.alarmReasons.length > 0
              ? summary.alarmReasons.join(' · ')
              : `Huyết áp đo lúc ${formatTime24h(summary.measuredTime)}: ${summary.bpText} mmHg`}
          </p>
          <button
            type="button"
            onClick={onOpenEmergencyCall}
            data-testid="minimal-alert-call-btn"
            className="w-full min-h-[58px] px-5 py-3 rounded-2xl bg-white hover:bg-red-50 text-[#DC2626] text-lg font-extrabold inline-flex items-center justify-center gap-2.5 shadow-sm cursor-pointer transition-colors"
          >
            <PhoneCall className="w-6 h-6 shrink-0" />
            <span>Gọi ngay Bác sĩ / Người thân / 115</span>
          </button>
        </div>
      )}

      {/* 1. Thẻ Huyết áp hôm nay (Chữ đại + Nút lớn) */}
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0F766E]/12 text-[#0B5F57] flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1F2937]">Huyết áp hôm nay</h2>
              <p className="text-sm text-stone-600">
                Đo lúc <strong className="tabular-nums text-[#1F2937]">{formatTime24h(summary.measuredTime)}</strong>
              </p>
            </div>
          </div>
          <Chip label={summary.bpLabel} variant={summary.bpStatus} />
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-stone-200/90 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-stone-600 mb-1">Chỉ số gần nhất</p>
            <div className="flex items-baseline gap-2">
              <span
                data-testid="minimal-bp-value"
                className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1F2937] tabular-nums"
              >
                {summary.bpText}
              </span>
              <span className="text-lg font-bold text-stone-600">mmHg</span>
            </div>
          </div>
          <div className="text-base font-semibold text-stone-700 tabular-nums">
            Nhịp tim: <strong className="text-[#0B5F57]">{summary.heartRate} bpm</strong> · Oxy:{' '}
            <strong className="text-[#0B5F57]">{summary.spo2}%</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onOpenLogModal}
            data-testid="minimal-log-vital-btn"
            className="w-full min-h-[58px] px-5 py-3.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-lg font-extrabold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-6 h-6 stroke-[2.5] shrink-0" />
            <span>Đo huyết áp mới</span>
          </button>
          <button
            type="button"
            onClick={onOpenEmergencyCall}
            data-testid="minimal-emergency-call-btn"
            className={`w-full min-h-[58px] px-5 py-3.5 rounded-2xl border text-lg font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              summary.isAlarming
                ? 'bg-[#DC2626] hover:bg-red-700 border-red-700 text-white'
                : 'bg-red-50 hover:bg-red-100 border-red-200 text-[#DC2626]'
            }`}
          >
            <PhoneCall className="w-5 h-5 shrink-0" />
            <span>Gọi khẩn cấp</span>
          </button>
        </div>
      </Card>

      {/* 2. Thẻ Thuốc hôm nay (Danh sách rõ + Nút lớn 1 chạm) */}
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0F766E]/12 text-[#0B5F57] flex items-center justify-center shrink-0">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1F2937]">Thuốc hôm nay</h2>
              <p className="text-sm text-stone-600">
                {nextDoseInfo
                  ? `Cữ sắp tới: ${formatTime24h(nextDoseInfo.medication.timeSlot)} (${nextDoseInfo.countdownLabel})`
                  : 'Đã hoàn thành các cữ nhắc hôm nay'}
              </p>
            </div>
          </div>
          <span
            data-testid="minimal-med-progress"
            className="px-3.5 py-1.5 rounded-xl bg-[#0F766E]/12 text-[#0B5F57] text-base font-extrabold tabular-nums"
          >
            {medOverview.takenCount} / {medOverview.totalCount} cữ
          </span>
        </div>

        <div className="space-y-3">
          {medOverview.orderedMedications.map((med) => (
            <div
              key={med.id}
              data-testid={`minimal-med-card-${med.id}`}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                med.takenToday
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-[#FAF7F2] border-stone-200'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-white border border-stone-200 text-base font-extrabold text-[#0B5F57] tabular-nums">
                    {formatTime24h(med.timeSlot)}
                  </span>
                  <span className="text-sm font-semibold text-stone-600 truncate">
                    {med.mealInstruction}
                  </span>
                </div>
                <p className="text-lg font-extrabold text-[#1F2937] leading-snug">
                  {med.medicationName}
                </p>
                <p className="text-base text-stone-700">{med.dosage} · {med.purpose}</p>
              </div>

              <button
                type="button"
                onClick={() => onToggleMedication(med.id)}
                data-testid={`minimal-med-toggle-${med.id}`}
                aria-pressed={med.takenToday}
                className={`min-h-[56px] px-5 py-3 rounded-2xl text-base font-extrabold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  med.takenToday
                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                    : 'bg-[#0F766E] hover:bg-[#0B5F57] text-white shadow-sm'
                }`}
              >
                {med.takenToday ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Đã uống xong</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 stroke-[2.5] shrink-0" />
                    <span>Đánh dấu đã uống</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

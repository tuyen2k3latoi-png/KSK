import React, { useState } from 'react';
import { Activity, BellRing, CheckCircle2, ChevronDown, Droplets, Dumbbell, Pill } from 'lucide-react';
import { MedicationNotificationSettings, MedicationSchedule, WorkoutSchedule } from '../../types/health';
import { formatTime24h } from '../../utils/formatters';
import { formatRecurringDaysLabel } from '../../utils/healthCalculations';
import { ActiveModule } from '../layout/AppTopHeaderAndNav';
import { Card, SectionHeader } from '../ui/Primitives';

interface DashboardDailyChecklistsProps {
  medications: MedicationSchedule[];
  medAdherence: { takenCount: number; totalCount: number; adherencePercent: number };
  notificationSettings: MedicationNotificationSettings;
  nextDoseInfo: { medication: MedicationSchedule; countdownLabel: string } | null;
  workoutSchedAdherence: {
    completedCount: number;
    totalScheduledToday: number;
    adherencePercent: number;
    todaySchedules: WorkoutSchedule[];
  };
  nextWorkoutInfo: { schedule: WorkoutSchedule; countdownLabel: string } | null;
  calorieSummary: { totalIntake: number; totalBurned: number; proteinG: number; carbsG: number };
  waterIntakeMl: number;
  onToggleMedication: (id: string) => void;
  onTriggerTestPush: () => void;
  onToggleWorkoutScheduleComplete: (id: string) => void;
  onTriggerTestWorkoutPush: () => void;
  onAddWater: (amountMl: number) => void;
  onNavigateModule: (module: ActiveModule) => void;
  onOpenLogModal?: () => void;
}

/**
 * Thẻ "Việc cần làm hôm nay":
 * - Cữ thuốc sắp tới (dùng chữ thân thiện "Nhắc lại sau" thay cho "Hoãn")
 * - Nhắc đo huyết áp & uống nước (+250 ml)
 * - Bài tập trong lịch hôm nay
 * - Không lồng thẻ quá 2 cấp; dùng đường kẻ mảnh chia nhóm; hỗ trợ "Xem thêm"
 */
export const DashboardDailyChecklists: React.FC<DashboardDailyChecklistsProps> = ({
  medications,
  medAdherence,
  notificationSettings,
  nextDoseInfo,
  workoutSchedAdherence,
  nextWorkoutInfo,
  calorieSummary,
  waterIntakeMl,
  onToggleMedication,
  onTriggerTestPush,
  onToggleWorkoutScheduleComplete,
  onTriggerTestWorkoutPush,
  onAddWater,
  onNavigateModule,
  onOpenLogModal,
}) => {
  const [showAllMeds, setShowAllMeds] = useState(false);

  const visibleMeds = showAllMeds ? medications : medications.slice(0, 3);
  const hiddenMedsCount = Math.max(0, medications.length - 3);

  return (
    <Card testId="today-tasks-card" className="space-y-5">
      <SectionHeader
        title="Việc cần làm hôm nay"
        subtitle={
          nextDoseInfo
            ? `Cữ thuốc tiếp theo lúc ${formatTime24h(nextDoseInfo.medication.timeSlot)} (${nextDoseInfo.countdownLabel})`
            : 'Bạn đã hoàn thành các cữ thuốc trong ngày'
        }
        icon={<CheckCircle2 className="w-6 h-6" />}
        action={
          <span
            className={`px-3 py-1 rounded-xl text-sm font-bold border ${
              notificationSettings.enabled
                ? 'bg-[#0F766E]/10 text-[#0B5F57] border-[#0F766E]/25'
                : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}
          >
            {notificationSettings.enabled ? 'Chuông nhắc: Đang bật' : 'Chuông nhắc: Đang tắt'}
          </span>
        }
      />

      {/* NHÓM 1: CỮ THUỐC HÔM NAY */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-[#0F766E] shrink-0" />
            <h3 className="text-base font-bold text-[#1F2937]">
              1. Lịch uống thuốc ({medAdherence.takenCount}/{medAdherence.totalCount} cữ ·{' '}
              <span className="tabular-nums">{medAdherence.adherencePercent}%</span>)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="dashboard-test-push-btn"
              onClick={onTriggerTestPush}
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-bold text-[#0B5F57] bg-[#FAF7F2] hover:bg-[#0F766E]/10 border border-stone-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <BellRing className="w-4 h-4 text-[#0F766E]" />
              <span>Báo thử</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('medications')}
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-bold text-[#0F766E] hover:underline cursor-pointer"
            >
              Mở tủ thuốc →
            </button>
          </div>
        </div>

        <div className="divide-y divide-stone-100">
          {visibleMeds.map((med) => (
            <div
              key={med.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p
                  className={`text-base font-bold break-words ${
                    med.takenToday ? 'line-through text-stone-400' : 'text-[#1F2937]'
                  }`}
                >
                  {med.medicationName}
                </p>
                <p className="text-sm text-stone-600 tabular-nums break-words">
                  Giờ uống: <strong className="text-[#0B5F57]">{formatTime24h(med.timeSlot)}</strong> ·{' '}
                  {med.dosage} · {med.mealInstruction}
                  {med.snoozedUntil && !med.takenToday
                    ? ` · Nhắc lại sau lúc ${formatTime24h(med.snoozedUntil)}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleMedication(med.id)}
                className={`min-h-[48px] px-4 py-2 rounded-2xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  med.takenToday
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-[#0F766E] text-white hover:bg-[#0B5F57]'
                }`}
              >
                {med.takenToday ? '✓ Đã uống' : 'Xác nhận đã uống'}
              </button>
            </div>
          ))}
        </div>

        {hiddenMedsCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAllMeds((prev) => !prev)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-stone-100 text-sm font-bold text-[#0B5F57] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>
              {showAllMeds ? 'Thu gọn danh sách thuốc' : `Xem thêm ${hiddenMedsCount} thuốc khác`}
            </span>
            <ChevronDown className={`w-4 h-4 ${showAllMeds ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* ĐƯỜNG KẺ MẢNH CHIA NHÓM 2: BÀI TẬP TRONG LỊCH */}
      <div
        data-testid="dashboard-workout-schedule-card"
        className="pt-4 border-t border-stone-200/80 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#0F766E] shrink-0" />
            <h3 className="text-base font-bold text-[#1F2937]">
              2. Lịch vận động hôm nay ({workoutSchedAdherence.completedCount}/
              {workoutSchedAdherence.totalScheduledToday} bài ·{' '}
              <span className="tabular-nums">{workoutSchedAdherence.adherencePercent}%</span>)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="dashboard-test-workout-push-btn"
              onClick={onTriggerTestWorkoutPush}
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-bold text-[#0B5F57] bg-[#FAF7F2] hover:bg-[#0F766E]/10 border border-stone-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <BellRing className="w-4 h-4 text-[#0F766E]" />
              <span>Báo thử tập</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('nutrition')}
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-bold text-[#0F766E] hover:underline cursor-pointer"
            >
              Xem lịch tập →
            </button>
          </div>
        </div>

        <p className="text-sm text-stone-600">
          {nextWorkoutInfo
            ? `Sắp tới lúc ${formatTime24h(nextWorkoutInfo.schedule.timeSlot)}: ${nextWorkoutInfo.schedule.activityName} (${nextWorkoutInfo.countdownLabel})`
            : 'Đã hoàn thành lịch tập định kỳ hôm nay'}
        </p>

        <div className="divide-y divide-stone-100">
          {workoutSchedAdherence.todaySchedules.map((sched) => (
            <div
              key={sched.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p
                  className={`text-base font-bold break-words ${
                    sched.completedToday ? 'line-through text-stone-400' : 'text-[#1F2937]'
                  }`}
                >
                  {sched.activityName}
                </p>
                <p className="text-sm text-stone-600 tabular-nums break-words">
                  {formatTime24h(sched.timeSlot)} · {sched.durationMinutes} phút · Tiêu hao{' '}
                  {sched.targetCalories} kcal · {formatRecurringDaysLabel(sched.daysOfWeek)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleWorkoutScheduleComplete(sched.id)}
                className={`min-h-[48px] px-4 py-2 rounded-2xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  sched.completedToday
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-[#0F766E] text-white hover:bg-[#0B5F57]'
                }`}
              >
                {sched.completedToday ? '✓ Đã tập' : 'Hoàn thành bài tập'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ĐƯỜNG KẺ MẢNH CHIA NHÓM 3: NHẮC ĐO HUYẾT ÁP, DINH DƯỠNG & UỐNG NƯỚC */}
      <div className="pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-base font-bold text-[#1F2937]">
            3. Nhắc đo huyết áp, bữa ăn &amp; uống nước
          </p>
          <p className="text-sm text-stone-600 tabular-nums">
            Đã nạp <strong>{calorieSummary.totalIntake} kcal</strong> · Tập luyện{' '}
            <strong data-testid="dashboard-burned-calories" className="text-[#0F766E]">
              -{calorieSummary.totalBurned} kcal
            </strong>{' '}
            · Đã uống <strong>{waterIntakeMl} ml</strong> nước (Đạm {calorieSummary.proteinG}g · Tinh bột {calorieSummary.carbsG}g)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onOpenLogModal && (
            <button
              type="button"
              onClick={onOpenLogModal}
              className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#0F766E]/10 border border-stone-300 text-sm font-bold text-[#0B5F57] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Activity className="w-4 h-4 text-[#0F766E]" />
              <span>Đo huyết áp ngay</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onAddWater(250)}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Droplets className="w-4 h-4" />
            <span>+250 ml nước</span>
          </button>
        </div>
      </div>
    </Card>
  );
};

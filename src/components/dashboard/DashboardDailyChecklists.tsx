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
  const [showTestReminders, setShowTestReminders] = useState(false);

  const visibleMeds = showAllMeds ? medications : medications.slice(0, 3);
  const hiddenMedsCount = Math.max(0, medications.length - 3);

  return (
    <Card testId="today-tasks-card" className="space-y-4">
      <SectionHeader
        title="Việc cần làm hôm nay"
        subtitle={
          nextDoseInfo
            ? `Thuốc tiếp theo lúc ${formatTime24h(nextDoseInfo.medication.timeSlot)} (${nextDoseInfo.countdownLabel})`
            : 'Đã uống hết thuốc hôm nay'
        }
        icon={<CheckCircle2 className="w-6 h-6" />}
        action={
          <button
            type="button"
            onClick={() => setShowTestReminders((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border cursor-pointer transition-colors ${
              notificationSettings.enabled
                ? 'bg-[#0F766E]/10 text-[#0B5F57] border-[#0F766E]/25'
                : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}
          >
            {notificationSettings.enabled ? 'Chuông nhắc: Bật' : 'Chuông nhắc: Tắt'}
          </button>
        }
      />

      {showTestReminders && (
        <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-stone-700">Thử chuông nhắc trên màn hình:</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="dashboard-test-push-btn"
              onClick={onTriggerTestPush}
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-bold text-[#0B5F57] bg-white hover:bg-[#0F766E]/10 border border-stone-200 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <BellRing className="w-4 h-4 text-[#0F766E]" />
              <span>Thử nhắc thuốc</span>
            </button>
            <button
              type="button"
              data-testid="dashboard-test-workout-push-btn"
              onClick={onTriggerTestWorkoutPush}
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-bold text-[#0B5F57] bg-white hover:bg-[#0F766E]/10 border border-stone-200 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <BellRing className="w-4 h-4 text-[#0F766E]" />
              <span>Thử nhắc tập</span>
            </button>
          </div>
        </div>
      )}

      {/* NHÓM 1: UỐNG THUỐC HÔM NAY */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-[#0F766E] shrink-0" />
            <h3 className="text-base font-bold text-[#1F2937]">
              Uống thuốc ({medAdherence.takenCount}/{medAdherence.totalCount})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateModule('medications')}
            className="min-h-[40px] px-2.5 py-1 rounded-xl text-sm font-bold text-[#0F766E] hover:underline cursor-pointer"
          >
            Tủ thuốc →
          </button>
        </div>

        <div className="divide-y divide-stone-100">
          {visibleMeds.map((med) => (
            <div
              key={med.id}
              className="py-2.5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p
                  className={`text-base font-bold break-words ${
                    med.takenToday ? 'line-through text-stone-400' : 'text-[#1F2937]'
                  }`}
                >
                  {med.medicationName}
                </p>
                <p className="text-sm text-stone-600 tabular-nums">
                  <strong className="text-[#0B5F57]">{formatTime24h(med.timeSlot)}</strong> · {med.dosage} · {med.mealInstruction}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleMedication(med.id)}
                className={`min-h-[46px] px-4 py-2 rounded-2xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  med.takenToday
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-[#0F766E] text-white hover:bg-[#0B5F57]'
                }`}
              >
                {med.takenToday ? '✓ Đã uống' : 'Đã uống'}
              </button>
            </div>
          ))}
        </div>

        {hiddenMedsCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAllMeds((prev) => !prev)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-stone-100 text-sm font-bold text-[#0B5F57] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>{showAllMeds ? 'Thu gọn' : `Xem thêm ${hiddenMedsCount} thuốc`}</span>
            <ChevronDown className={`w-4 h-4 ${showAllMeds ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* NHÓM 2: VẬN ĐỘNG HÔM NAY */}
      <div
        data-testid="dashboard-workout-schedule-card"
        className="pt-3.5 border-t border-stone-200/80 space-y-2"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#0F766E] shrink-0" />
            <h3 className="text-base font-bold text-[#1F2937]">
              Vận động hôm nay ({workoutSchedAdherence.completedCount}/{workoutSchedAdherence.totalScheduledToday})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateModule('nutrition')}
            className="min-h-[40px] px-2.5 py-1 rounded-xl text-sm font-bold text-[#0F766E] hover:underline cursor-pointer"
          >
            Ăn &amp; Tập →
          </button>
        </div>

        {nextWorkoutInfo && (
          <p className="text-sm text-stone-600">
            Sắp tới: <strong className="text-[#0B5F57] tabular-nums">{formatTime24h(nextWorkoutInfo.schedule.timeSlot)}</strong> · {nextWorkoutInfo.schedule.activityName}
          </p>
        )}

        <div className="divide-y divide-stone-100">
          {workoutSchedAdherence.todaySchedules.map((sched) => (
            <div
              key={sched.id}
              className="py-2.5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p
                  className={`text-base font-bold break-words ${
                    sched.completedToday ? 'line-through text-stone-400' : 'text-[#1F2937]'
                  }`}
                >
                  {sched.activityName}
                </p>
                <p className="text-sm text-stone-600 tabular-nums">
                  {formatTime24h(sched.timeSlot)} · {sched.durationMinutes} phút · {formatRecurringDaysLabel(sched.daysOfWeek)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleWorkoutScheduleComplete(sched.id)}
                className={`min-h-[46px] px-4 py-2 rounded-2xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  sched.completedToday
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-[#0F766E] text-white hover:bg-[#0B5F57]'
                }`}
              >
                {sched.completedToday ? '✓ Đã tập' : 'Đã tập'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* NHÓM 3: ĐO HUYẾT ÁP & UỐNG NƯỚC */}
      <div className="pt-3.5 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-base font-bold text-[#1F2937]">
            Đo huyết áp &amp; Uống nước
          </p>
          <p className="text-sm text-stone-600 tabular-nums">
            Đã uống <strong>{waterIntakeMl} ml</strong> · Tập <strong data-testid="dashboard-burned-calories" className="text-[#0F766E]">-{calorieSummary.totalBurned} kcal</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenLogModal && (
            <button
              type="button"
              onClick={onOpenLogModal}
              className="min-h-[48px] px-4 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-[#0F766E]/10 border border-stone-300 text-sm font-bold text-[#0B5F57] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Activity className="w-4 h-4 text-[#0F766E]" />
              <span>Đo huyết áp</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onAddWater(250)}
            className="min-h-[48px] px-4 py-2 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Droplets className="w-4 h-4" />
            <span>+250 ml nước</span>
          </button>
        </div>
      </div>
    </Card>
  );
};

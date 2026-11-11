import React, { useState } from 'react';
import {
  DayOfWeekCode,
  MealEntry,
  MedicationNotificationSettings,
  UserMedicalProfile,
  WorkoutEntry,
  WorkoutSchedule,
} from '../types/health';
import {
  ALL_DAYS_OF_WEEK,
  calculateBMR,
  calculateDailyCalorieSummary,
  calculateWorkoutScheduleAdherence,
  formatRecurringDaysLabel,
  NextWorkoutSessionInfo,
  serializeHealthDataToJson,
  serializeMealsToCsv,
  triggerOfflineFileDownload,
} from '../utils/healthCalculations';
import {
  Bell,
  BellOff,
  BellRing,
  CalendarCheck,
  Check,
  Clock,
  Download,
  Droplets,
  Dumbbell,
  FileJson,
  Flame,
  Plus,
  Trash2,
  Utensils,
} from 'lucide-react';

interface NutritionActivityViewProps {
  profile: UserMedicalProfile;
  meals: MealEntry[];
  workouts: WorkoutEntry[];
  workoutSchedules: WorkoutSchedule[];
  currentDayCode: DayOfWeekCode;
  nextWorkoutInfo: NextWorkoutSessionInfo | null;
  notificationSettings: MedicationNotificationSettings;
  waterIntakeMl: number;
  onAddWater: (amountMl: number) => void;
  onResetWater: () => void;
  onAddMeal: (meal: Omit<MealEntry, 'id'>) => void;
  onDeleteMeal: (id: string) => void;
  onAddWorkout: (workout: Omit<WorkoutEntry, 'id'>) => void;
  onDeleteWorkout: (id: string) => void;
  onToggleWorkoutScheduleComplete: (id: string) => void;
  onAddWorkoutSchedule: (schedule: Omit<WorkoutSchedule, 'id'>) => void;
  onUpdateWorkoutSchedule: (
    id: string,
    updates: Partial<
      Pick<WorkoutSchedule, 'timeSlot' | 'daysOfWeek' | 'reminderEnabled' | 'snoozedUntil'>
    >
  ) => void;
  onDeleteWorkoutSchedule: (id: string) => void;
  onTriggerTestWorkoutPush: (schedule?: WorkoutSchedule) => void;
}

const WORKOUT_TIME_PRESETS = [
  { label: '06:00 (Sáng sớm)', value: '06:00' },
  { label: '07:30 (Sáng)', value: '07:30' },
  { label: '16:30 (Chiều)', value: '16:30' },
  { label: '17:30 (Chiều mát)', value: '17:30' },
];

const DAY_LABELS: Record<DayOfWeekCode, string> = {
  T2: 'Thứ 2',
  T3: 'Thứ 3',
  T4: 'Thứ 4',
  T5: 'Thứ 5',
  T6: 'Thứ 6',
  T7: 'Thứ 7',
  CN: 'Chủ Nhật',
};

export const NutritionActivityView: React.FC<NutritionActivityViewProps> = ({
  profile,
  meals,
  workouts,
  workoutSchedules,
  currentDayCode,
  nextWorkoutInfo,
  notificationSettings,
  waterIntakeMl,
  onAddWater,
  onResetWater,
  onAddMeal,
  onDeleteMeal,
  onAddWorkout,
  onDeleteWorkout,
  onToggleWorkoutScheduleComplete,
  onAddWorkoutSchedule,
  onUpdateWorkoutSchedule,
  onDeleteWorkoutSchedule,
  onTriggerTestWorkoutPush,
}) => {
  // Meal form state
  const [mealType, setMealType] = useState<MealEntry['mealType']>('Tối');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [mealError, setMealError] = useState<string | null>(null);

  // Workout log form state
  const [activityName, setActivityName] = useState('');
  const [category, setCategory] = useState<WorkoutEntry['category']>('Cardio');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [workoutError, setWorkoutError] = useState<string | null>(null);
  const [mealExportNotice, setMealExportNotice] = useState<string | null>(null);

  // Recurring workout schedule form state
  const [schedName, setSchedName] = useState('');
  const [schedCategory, setSchedCategory] = useState<WorkoutEntry['category']>('Đi bộ');
  const [schedIntensity, setSchedIntensity] =
    useState<WorkoutSchedule['intensityLabel']>('Vừa phải');
  const [schedTimeSlot, setSchedTimeSlot] = useState('06:00');
  const [schedDuration, setSchedDuration] = useState('30');
  const [schedCalories, setSchedCalories] = useState('180');
  const [schedDays, setSchedDays] = useState<DayOfWeekCode[]>([
    'T2',
    'T3',
    'T4',
    'T5',
    'T6',
    'T7',
    'CN',
  ]);
  const [schedError, setSchedError] = useState<string | null>(null);

  const handleExportMealsCsv = () => {
    const csv = serializeMealsToCsv(meals);
    const filename = `vitapulse_meals_${new Date().toISOString().slice(0, 10)}.csv`;
    triggerOfflineFileDownload(csv, filename, 'text/csv;charset=utf-8;');
    setMealExportNotice(`Đã xuất ${meals.length} bữa ăn ra tệp ${filename}`);
  };

  const handleExportMealsJson = () => {
    const json = serializeHealthDataToJson([], meals, 'meals');
    const filename = `vitapulse_meals_${new Date().toISOString().slice(0, 10)}.json`;
    triggerOfflineFileDownload(json, filename, 'application/json;charset=utf-8;');
    setMealExportNotice(`Đã xuất ${meals.length} bữa ăn ra tệp ${filename}`);
  };

  const summary = calculateDailyCalorieSummary(meals, workouts, profile.dailyCalorieGoal);
  const age = 2026 - profile.birthYear;
  const bmr = calculateBMR(profile.weightKg, profile.heightCm, age, profile.gender);
  const waterPercent = Math.min(100, Math.round((waterIntakeMl / profile.dailyWaterGoalMl) * 100));
  const workoutAdherence = calculateWorkoutScheduleAdherence(workoutSchedules, currentDayCode);

  const handleToggleFormDay = (day: DayOfWeekCode) => {
    setSchedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddWorkoutScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedName.trim()) {
      setSchedError('Vui lòng nhập tên bài tập muốn lên lịch định kỳ.');
      return;
    }
    const dur = Number(schedDuration);
    const cal = Number(schedCalories);
    if (!Number.isFinite(dur) || dur < 5 || dur > 300) {
      setSchedError('Thời lượng bài tập định kỳ phải từ 5 – 300 phút.');
      return;
    }
    if (!Number.isFinite(cal) || cal < 10 || cal > 2500) {
      setSchedError('Mục tiêu calo tiêu hao phải từ 10 – 2500 kcal.');
      return;
    }
    if (schedDays.length === 0) {
      setSchedError('Vui lòng chọn ít nhất 1 ngày tập trong tuần.');
      return;
    }
    setSchedError(null);

    onAddWorkoutSchedule({
      activityName: schedName.trim(),
      category: schedCategory,
      intensityLabel: schedIntensity,
      timeSlot: schedTimeSlot || '06:00',
      durationMinutes: Math.round(dur),
      targetCalories: Math.round(cal),
      daysOfWeek: ALL_DAYS_OF_WEEK.filter((d) => schedDays.includes(d)),
      completedToday: false,
      reminderEnabled: true,
    });

    setSchedName('');
  };

  const handleAddMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) {
      setMealError('Vui lòng nhập tên món ăn hoặc thực phẩm.');
      return;
    }
    const cal = Number(calories);
    if (!Number.isFinite(cal) || cal <= 0 || cal > 3500) {
      setMealError('Lượng calo món ăn phải từ 1 – 3500 kcal.');
      return;
    }
    setMealError(null);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    onAddMeal({
      date: '2026-11-10',
      time: timeStr,
      mealType,
      foodName: foodName.trim(),
      calories: Math.round(cal),
      proteinG: Math.max(0, Math.round(Number(proteinG) || 0)),
      carbsG: Math.max(0, Math.round(Number(carbsG) || 0)),
      fatG: Math.max(0, Math.round(Number(fatG) || 0)),
    });

    setFoodName('');
    setCalories('');
    setProteinG('');
    setCarbsG('');
    setFatG('');
  };

  const handleAddWorkoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim()) {
      setWorkoutError('Vui lòng nhập tên bài tập hoặc hoạt động thể chất.');
      return;
    }
    const dur = Number(durationMinutes);
    const burned = Number(caloriesBurned);
    if (!Number.isFinite(dur) || dur <= 0 || dur > 480) {
      setWorkoutError('Thời lượng tập luyện phải từ 1 – 480 phút.');
      return;
    }
    if (!Number.isFinite(burned) || burned <= 0 || burned > 3000) {
      setWorkoutError('Calo tiêu hao phải từ 1 – 3000 kcal.');
      return;
    }
    setWorkoutError(null);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    onAddWorkout({
      date: '2026-11-10',
      time: timeStr,
      activityName: activityName.trim(),
      category,
      durationMinutes: Math.round(dur),
      caloriesBurned: Math.round(burned),
      avgHeartRate: 128,
    });

    setActivityName('');
    setDurationMinutes('');
    setCaloriesBurned('');
  };

  return (
    <div className="space-y-6">
      {/* Top Energy Balance & Hydration Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calorie & Macro Balance Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Cân bằng Năng lượng &amp; Đa lượng Dinh dưỡng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chuyển hóa cơ bản (BMR):{' '}
                  <span className="font-mono-tabular font-medium text-slate-700">
                    {bmr} kcal/ngày
                  </span>{' '}
                  · Mục tiêu tiêu chuẩn:{' '}
                  <span className="font-mono-tabular font-medium text-slate-700">
                    {profile.dailyCalorieGoal} kcal
                  </span>
                </p>
              </div>
              <Flame className="w-5 h-5 text-amber-600 shrink-0" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
              <div>
                <p className="text-xs text-slate-500">Nạp vào (Thực phẩm)</p>
                <p className="text-2xl font-bold text-slate-900 font-mono-tabular mt-1">
                  {summary.totalIntake}{' '}
                  <span className="text-xs font-normal text-slate-500">kcal</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tiêu hao (Vận động)</p>
                <p
                  data-testid="total-burned-calories"
                  className="text-2xl font-bold text-teal-700 font-mono-tabular mt-1"
                >
                  {summary.totalBurned}{' '}
                  <span className="text-xs font-normal text-slate-500">kcal</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Calo Thực (Net)</p>
                <p className="text-2xl font-bold text-slate-900 font-mono-tabular mt-1">
                  {summary.netCalories}{' '}
                  <span className="text-xs font-normal text-slate-500">kcal</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Quỹ Calo Còn lại</p>
                <p
                  className={`text-2xl font-bold font-mono-tabular mt-1 ${
                    summary.remainingCalories >= 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {summary.remainingCalories}{' '}
                  <span className="text-xs font-normal text-slate-500">kcal</span>
                </p>
              </div>
            </div>
          </div>

          {/* Macro Distribution Progress Bars */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">Đạm (Protein)</span>
                <span className="font-mono-tabular text-slate-600">{summary.proteinG}g / 135g</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((summary.proteinG / 135) * 100))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">Tinh bột (Carbs)</span>
                <span className="font-mono-tabular text-slate-600">{summary.carbsG}g / 220g</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((summary.carbsG / 220) * 100))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">Chất béo (Fat)</span>
                <span className="font-mono-tabular text-slate-600">{summary.fatG}g / 65g</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((summary.fatG / 65) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hydration Interactive Tracker */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Bù Nước &amp; Điện giải</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mục tiêu khuyến nghị: 35ml / kg cân nặng
                </p>
              </div>
              <Droplets className="w-5 h-5 text-sky-600 shrink-0" />
            </div>

            <div className="py-4 flex items-baseline justify-between">
              <div>
                <span
                  data-testid="water-intake-value"
                  className="text-3xl font-bold text-slate-900 font-mono-tabular"
                >
                  {waterIntakeMl}
                </span>
                <span className="text-sm text-slate-500 font-mono-tabular">
                  {' '}
                  / {profile.dailyWaterGoalMl} ml
                </span>
              </div>
              <span className="text-sm font-semibold text-sky-700 font-mono-tabular">
                Đạt {waterPercent}%
              </span>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-sky-600 rounded-full transition-all duration-200"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onAddWater(250)}
              className="flex-1 min-h-[40px] px-3 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              +250 ml (1 cốc)
            </button>
            <button
              type="button"
              onClick={() => onAddWater(500)}
              className="flex-1 min-h-[40px] px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              +500 ml (1 bình)
            </button>
            <button
              type="button"
              onClick={onResetWater}
              className="min-h-[40px] px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* RECURRING WORKOUT SCHEDULER & LOCAL PUSH REMINDER PANEL */}
      <section
        aria-label="Lịch tập luyện định kỳ và chuông nhắc nhở đúng giờ"
        data-testid="recurring-workout-schedule-panel"
        className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Lịch Tập Luyện Định Kỳ &amp; Chuông Nhắc Vận Động Đúng Giờ
                </h3>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold">
                  Hôm nay: {DAY_LABELS[currentDayCode]}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Lên lịch tập cố định theo các thứ trong tuần và tự động nhận thông báo đẩy + chuông
                nhắc khi đến khung giờ tập
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="text-right font-mono-tabular">
              <span className="text-xs text-slate-500">Hoàn thành hôm nay: </span>
              <strong
                data-testid="workout-schedule-adherence-percent"
                className="text-base font-bold text-indigo-700"
              >
                {workoutAdherence.adherencePercent}%
              </strong>{' '}
              <span className="text-xs text-slate-500">
                ({workoutAdherence.completedCount}/{workoutAdherence.totalScheduledToday} bài)
              </span>
            </div>

            <button
              type="button"
              data-testid="trigger-test-workout-push-btn"
              onClick={() => onTriggerTestWorkoutPush()}
              className="min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Gửi thử Thông báo Nhắc Tập</span>
            </button>
          </div>
        </div>

        {/* Next Upcoming Scheduled Workout Banner */}
        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {nextWorkoutInfo ? (
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-indigo-950">
                  Bài tập sắp tới trong hôm nay ({DAY_LABELS[currentDayCode]}):
                </span>
                <span
                  data-testid="next-workout-countdown"
                  className="px-2 py-0.5 rounded bg-white border border-indigo-200 text-indigo-800 text-xs font-bold font-mono-tabular"
                >
                  {nextWorkoutInfo.countdownLabel}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900">
                {nextWorkoutInfo.schedule.activityName} ({nextWorkoutInfo.schedule.durationMinutes}{' '}
                phút · ~{nextWorkoutInfo.schedule.targetCalories} kcal) — Khung giờ:{' '}
                <span className="font-mono-tabular text-indigo-800">
                  {nextWorkoutInfo.schedule.timeSlot}
                </span>
              </p>
            </div>
          ) : (
            <div className="text-xs sm:text-sm font-semibold text-emerald-800">
              Tuyệt vời! Cô/chú đã hoàn thành tất cả các bài tập định kỳ trong ngày hôm nay.
            </div>
          )}

          <div className="text-xs text-indigo-900 font-medium shrink-0">
            Chuông báo trước:{' '}
            <strong className="font-mono-tabular">{notificationSettings.leadMinutes} phút</strong>
          </div>
        </div>

        {/* List of Recurring Workout Schedules */}
        <div className="divide-y divide-slate-100">
          {workoutSchedules.map((sched) => {
            const isScheduledToday = sched.daysOfWeek.includes(currentDayCode);
            const isReminderOn = sched.reminderEnabled !== false;
            return (
              <div
                key={sched.id}
                data-testid={`workout-schedule-row-${sched.id}`}
                className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      sched.completedToday
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isScheduledToday
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <Dumbbell className="w-5 h-5" />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`text-sm font-semibold ${
                          sched.completedToday ? 'text-slate-500 line-through' : 'text-slate-900'
                        }`}
                      >
                        {sched.activityName}
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {sched.category} · Mức {sched.intensityLabel}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isScheduledToday
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {formatRecurringDaysLabel(sched.daysOfWeek)}
                      </span>
                      {sched.snoozedUntil && !sched.completedToday && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold font-mono-tabular">
                          Hẹn nhắc lại lúc {sched.snoozedUntil}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono-tabular">
                      <label
                        htmlFor={`workout-time-${sched.id}`}
                        className="inline-flex items-center gap-1.5 text-slate-700 font-medium"
                      >
                        <span>Khung giờ tập:</span>
                        <input
                          id={`workout-time-${sched.id}`}
                          type="time"
                          value={sched.timeSlot}
                          onChange={(e) =>
                            onUpdateWorkoutSchedule(sched.id, {
                              timeSlot: e.target.value || '06:00',
                              snoozedUntil: undefined,
                            })
                          }
                          className="px-2 py-0.5 text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-md font-mono-tabular"
                        />
                      </label>
                      <span>·</span>
                      <span>Thời lượng: {sched.durationMinutes} phút</span>
                      <span>·</span>
                      <span className="text-teal-700 font-semibold">
                        Mục tiêu: -{sched.targetCalories} kcal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateWorkoutSchedule(sched.id, {
                        reminderEnabled: !isReminderOn,
                      })
                    }
                    aria-label={`${isReminderOn ? 'Tắt chuông nhắc tập' : 'Bật chuông nhắc tập'} ${
                      sched.activityName
                    }`}
                    className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                      isReminderOn
                        ? 'bg-indigo-50/80 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isReminderOn ? (
                      <>
                        <Bell className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Bật nhắc</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3.5 h-3.5 text-slate-400" />
                        <span>Đã tắt</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    data-testid={`test-push-workout-${sched.id}`}
                    onClick={() => onTriggerTestWorkoutPush(sched)}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Nhắc thử
                  </button>

                  <button
                    type="button"
                    data-testid={`complete-workout-sched-${sched.id}`}
                    onClick={() => onToggleWorkoutScheduleComplete(sched.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                      sched.completedToday
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {sched.completedToday ? (
                      <>
                        <Check className="w-4 h-4" />
                        Đã tập ({sched.completedAt || sched.timeSlot})
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        Hoàn thành Bài tập
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteWorkoutSchedule(sched.id)}
                    aria-label={`Xóa lịch tập ${sched.activityName}`}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form to Create a New Recurring Workout Schedule */}
        <form
          onSubmit={handleAddWorkoutScheduleSubmit}
          data-testid="add-workout-schedule-form"
          className="pt-4 border-t border-slate-100 space-y-3.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs sm:text-sm font-bold text-slate-900">
              Thêm Lịch Tập Luyện Định Kỳ Mới &amp; Hẹn Giờ Nhắc Nhở
            </div>
            <span className="text-[11px] text-slate-500">
              Tự động phát chuông và gửi thông báo đẩy vào đúng khung giờ đã chọn
            </span>
          </div>

          {schedError && (
            <p role="alert" className="text-xs text-red-600 font-medium">
              {schedError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="sched-workout-name" className="block text-xs text-slate-600 mb-1">
                Tên bài tập định kỳ
              </label>
              <input
                id="sched-workout-name"
                type="text"
                placeholder="VD: Tập vẩy tay Dịch cân kinh buổi sáng..."
                value={schedName}
                onChange={(e) => setSchedName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label htmlFor="sched-workout-category" className="block text-xs text-slate-600 mb-1">
                Nhóm vận động
              </label>
              <select
                id="sched-workout-category"
                value={schedCategory}
                onChange={(e) => setSchedCategory(e.target.value as WorkoutEntry['category'])}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Đi bộ">Đi bộ ngoài trời</option>
                <option value="Linh hoạt">Dưỡng sinh / Yoga / Giãn cơ</option>
                <option value="Cardio">Cardio / Đạp xe / Bơi</option>
                <option value="Kháng lực">Tập Kháng lực / Cơ bắp</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="sched-workout-intensity"
                className="block text-xs text-slate-600 mb-1"
              >
                Cường độ tập
              </label>
              <select
                id="sched-workout-intensity"
                value={schedIntensity}
                onChange={(e) =>
                  setSchedIntensity(e.target.value as WorkoutSchedule['intensityLabel'])
                }
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Nhẹ nhàng">Nhẹ nhàng (Dưỡng sinh)</option>
                <option value="Vừa phải">Vừa phải (Đổ mồ hôi nhẹ)</option>
                <option value="Tích cực">Tích cực (Rèn sức bền)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="sched-workout-time" className="block text-xs text-slate-600 mb-1">
                Khung giờ nhắc tập trong ngày (HH:mm)
              </label>
              <input
                id="sched-workout-time"
                type="time"
                value={schedTimeSlot}
                onChange={(e) => setSchedTimeSlot(e.target.value || '06:00')}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono-tabular font-semibold"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {WORKOUT_TIME_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setSchedTimeSlot(preset.value)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono-tabular border cursor-pointer ${
                      schedTimeSlot === preset.value
                        ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="sched-workout-duration" className="block text-xs text-slate-600 mb-1">
                Thời lượng mỗi buổi (phút)
              </label>
              <input
                id="sched-workout-duration"
                type="number"
                value={schedDuration}
                onChange={(e) => setSchedDuration(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono-tabular"
              />
            </div>

            <div>
              <label htmlFor="sched-workout-calories" className="block text-xs text-slate-600 mb-1">
                Calo tiêu hao dự kiến (kcal)
              </label>
              <input
                id="sched-workout-calories"
                type="number"
                value={schedCalories}
                onChange={(e) => setSchedCalories(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono-tabular"
              />
            </div>
          </div>

          {/* Recurring Days of Week Selector */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-700">
                Chọn các ngày tập định kỳ trong tuần:{' '}
                <strong className="text-indigo-800">{formatRecurringDaysLabel(schedDays)}</strong>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSchedDays(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'])}
                  className="px-2 py-0.5 text-[11px] font-medium bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"
                >
                  Hàng ngày (T2–CN)
                </button>
                <button
                  type="button"
                  onClick={() => setSchedDays(['T2', 'T3', 'T4', 'T5', 'T6'])}
                  className="px-2 py-0.5 text-[11px] font-medium bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"
                >
                  Thứ 2 – Thứ 6
                </button>
                <button
                  type="button"
                  onClick={() => setSchedDays(['T2', 'T4', 'T6'])}
                  className="px-2 py-0.5 text-[11px] font-medium bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"
                >
                  Cách ngày (T2, T4, T6)
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {ALL_DAYS_OF_WEEK.map((day) => {
                const selected = schedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleFormDay(day)}
                    aria-pressed={selected}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              data-testid="submit-workout-schedule-btn"
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm vào Lịch Tập Định Kỳ &amp; Bật Chuông Nhắc</span>
            </button>
          </div>
        </form>
      </section>

      {/* Two-Column Meals & Workouts Log Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meal Diary & Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-teal-600" />
              <h3 className="text-base font-semibold text-slate-900">
                Nhật ký Khẩu phần Ăn trong ngày ({meals.length} bữa)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportMealsCsv}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                Xuất CSV
              </button>
              <button
                type="button"
                onClick={handleExportMealsJson}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5 text-indigo-600" />
                Xuất JSON
              </button>
            </div>
          </div>

          {mealExportNotice && (
            <div
              role="status"
              className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800"
            >
              {mealExportNotice}
            </div>
          )}

          <form
            onSubmit={handleAddMealSubmit}
            className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80"
          >
            <div className="text-xs font-semibold text-slate-800">Thêm Khẩu phần Bữa ăn Mới</div>
            {mealError && (
              <p role="alert" className="text-xs text-red-600 font-medium">
                {mealError}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="meal-type" className="block text-xs text-slate-600 mb-1">
                  Bữa ăn
                </label>
                <select
                  id="meal-type"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealEntry['mealType'])}
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Sáng">Bữa Sáng</option>
                  <option value="Trưa">Bữa Trưa</option>
                  <option value="Tối">Bữa Tối</option>
                  <option value="Phụ">Bữa Phụ</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="food-name" className="block text-xs text-slate-600 mb-1">
                  Tên món ăn / Thực phẩm
                </label>
                <input
                  id="food-name"
                  type="text"
                  placeholder="VD: Cá hồi áp chảo & rau củ..."
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="meal-cal" className="block text-xs text-slate-600 mb-1">
                  Calo (kcal)
                </label>
                <input
                  id="meal-cal"
                  type="number"
                  placeholder="450"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono-tabular"
                />
              </div>
              <div>
                <label htmlFor="meal-pro" className="block text-xs text-slate-600 mb-1">
                  Đạm (g)
                </label>
                <input
                  id="meal-pro"
                  type="number"
                  placeholder="30"
                  value={proteinG}
                  onChange={(e) => setProteinG(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono-tabular"
                />
              </div>
              <div>
                <label htmlFor="meal-carb" className="block text-xs text-slate-600 mb-1">
                  Carb (g)
                </label>
                <input
                  id="meal-carb"
                  type="number"
                  placeholder="45"
                  value={carbsG}
                  onChange={(e) => setCarbsG(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono-tabular"
                />
              </div>
              <div>
                <label htmlFor="meal-fat" className="block text-xs text-slate-600 mb-1">
                  Béo (g)
                </label>
                <input
                  id="meal-fat"
                  type="number"
                  placeholder="12"
                  value={fatG}
                  onChange={(e) => setFatG(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono-tabular"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Ghi nhận Bữa ăn
              </button>
            </div>
          </form>

          <div className="divide-y divide-slate-100">
            {meals.map((meal) => (
              <div key={meal.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{meal.foodName}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono-tabular">
                    Bữa {meal.mealType} · {meal.time} · Đạm {meal.proteinG}g · Carb {meal.carbsG}g
                    · Béo {meal.fatG}g
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-slate-900 font-mono-tabular">
                    {meal.calories} kcal
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteMeal(meal.id)}
                    aria-label={`Xóa món ${meal.foodName}`}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workout Log & Manual Entry Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-900">
                Nhật ký Đã Tập trong ngày ({workouts.length} buổi)
              </h3>
            </div>
            <span className="text-xs text-teal-700 font-semibold font-mono-tabular">
              Tổng tiêu hao: -{summary.totalBurned} kcal
            </span>
          </div>

          <form
            onSubmit={handleAddWorkoutSubmit}
            className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80"
          >
            <div className="text-xs font-semibold text-slate-800">
              Ghi nhận nhanh Buổi tập phát sinh ngoài lịch
            </div>
            {workoutError && (
              <p role="alert" className="text-xs text-red-600 font-medium">
                {workoutError}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="workout-cat" className="block text-xs text-slate-600 mb-1">
                  Nhóm vận động
                </label>
                <select
                  id="workout-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as WorkoutEntry['category'])}
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Cardio">Cardio / Tim mạch</option>
                  <option value="Kháng lực">Tập Kháng lực / Tạ</option>
                  <option value="Linh hoạt">Yoga / Giãn cơ</option>
                  <option value="Đi bộ">Đi bộ ngoài trời</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="workout-name" className="block text-xs text-slate-600 mb-1">
                  Tên bài tập
                </label>
                <input
                  id="workout-name"
                  type="text"
                  placeholder="VD: Đạp xe nhịp độ cao 10km..."
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="workout-dur" className="block text-xs text-slate-600 mb-1">
                  Thời lượng (phút)
                </label>
                <input
                  id="workout-dur"
                  type="number"
                  placeholder="40"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono-tabular"
                />
              </div>
              <div>
                <label htmlFor="workout-burn" className="block text-xs text-slate-600 mb-1">
                  Calo tiêu hao (kcal)
                </label>
                <input
                  id="workout-burn"
                  type="number"
                  placeholder="320"
                  value={caloriesBurned}
                  onChange={(e) => setCaloriesBurned(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono-tabular"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Ghi nhận Vận động
              </button>
            </div>
          </form>

          <div className="divide-y divide-slate-100">
            {workouts.map((w) => (
              <div key={w.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{w.activityName}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono-tabular">
                    {w.category} · {w.time} · {w.durationMinutes} phút
                    {w.avgHeartRate ? ` · Nhịp tim TB ${w.avgHeartRate} bpm` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-teal-700 font-mono-tabular">
                    -{w.caloriesBurned} kcal
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteWorkout(w.id)}
                    aria-label={`Xóa bài tập ${w.activityName}`}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


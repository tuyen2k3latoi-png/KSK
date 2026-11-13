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
  calculateDailyCalorieSummary,
  calculateWorkoutScheduleAdherence,
  formatRecurringDaysLabel,
  NextWorkoutSessionInfo,
  serializeMealsToCsv,
  triggerOfflineFileDownload,
} from '../utils/healthCalculations';
import { formatTime24h } from '../utils/formatters';
import { Card, Chip, EmptyState } from './ui/Primitives';
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  ChevronDown,
  Clock,
  Download,
  Droplets,
  Dumbbell,
  Flame,
  Pencil,
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

const WORKOUT_TIME_PRESETS = ['06:00', '07:30', '16:30', '17:30'];

const DAY_LABELS: Record<DayOfWeekCode, string> = {
  T2: 'Thứ 2',
  T3: 'Thứ 3',
  T4: 'Thứ 4',
  T5: 'Thứ 5',
  T6: 'Thứ 6',
  T7: 'Thứ 7',
  CN: 'CN',
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
  const [activeSubTab, setActiveSubTab] = useState<'nutrition' | 'activity'>('nutrition');
  const [showAddMealForm, setShowAddMealForm] = useState(false);
  const [showAddWorkoutForm, setShowAddWorkoutForm] = useState(false);
  const [showAddScheduleForm, setShowAddScheduleForm] = useState(false);
  const [editingSchedId, setEditingSchedId] = useState<string | null>(null);

  // Meal form state
  const [mealType, setMealType] = useState<MealEntry['mealType']>('Tối');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [mealError, setMealError] = useState<string | null>(null);
  const [showAllMeals, setShowAllMeals] = useState(false);
  const [mealExportNotice, setMealExportNotice] = useState<string | null>(null);

  // Workout log form state
  const [activityName, setActivityName] = useState('');
  const [category, setCategory] = useState<WorkoutEntry['category']>('Cardio');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [workoutError, setWorkoutError] = useState<string | null>(null);
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);

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
    setMealExportNotice(`Đã tải ${meals.length} bữa ăn.`);
  };

  const summary = calculateDailyCalorieSummary(meals, workouts, profile.dailyCalorieGoal);
  const waterPercent = Math.min(100, Math.round((waterIntakeMl / profile.dailyWaterGoalMl) * 100));
  const cupsCount = Math.round((waterIntakeMl / 250) * 10) / 10;
  const totalWorkoutMinutes = workouts.reduce((sum, w) => sum + w.durationMinutes, 0);
  const workoutAdherence = calculateWorkoutScheduleAdherence(workoutSchedules, currentDayCode);

  const visibleMeals = showAllMeals ? meals : meals.slice(0, 4);
  const visibleWorkouts = showAllWorkouts ? workouts : workouts.slice(0, 4);

  const handleToggleFormDay = (day: DayOfWeekCode) => {
    setSchedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddWorkoutScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedName.trim()) {
      setSchedError('Vui lòng nhập tên bài tập.');
      return;
    }
    const dur = Number(schedDuration);
    const cal = Number(schedCalories);
    if (!Number.isFinite(dur) || dur < 5 || dur > 300) {
      setSchedError('Thời lượng phải từ 5 – 300 phút.');
      return;
    }
    if (!Number.isFinite(cal) || cal < 10 || cal > 2500) {
      setSchedError('Calo tiêu hao phải từ 10 – 2500 kcal.');
      return;
    }
    if (schedDays.length === 0) {
      setSchedError('Chọn ít nhất 1 ngày trong tuần.');
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
    setShowAddScheduleForm(false);
  };

  const handleAddMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) {
      setMealError('Vui lòng nhập tên món ăn.');
      return;
    }
    const cal = Number(calories);
    if (!Number.isFinite(cal) || cal <= 0 || cal > 3500) {
      setMealError('Năng lượng phải từ 1 – 3500 kcal.');
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
    setShowAddMealForm(false);
  };

  const handleAddWorkoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim()) {
      setWorkoutError('Vui lòng nhập tên bài tập.');
      return;
    }
    const dur = Number(durationMinutes);
    const burned = Number(caloriesBurned);
    if (!Number.isFinite(dur) || dur <= 0 || dur > 480) {
      setWorkoutError('Thời lượng phải từ 1 – 480 phút.');
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
    setShowAddWorkoutForm(false);
  };

  return (
    <div className="space-y-4">
      {/* 2 tab lớn: Ăn uống | Vận động */}
      <div
        role="tablist"
        aria-label="Chọn mục Ăn uống hoặc Vận động"
        className="bg-white border border-stone-200/85 rounded-[20px] p-1.5 shadow-[0_6px_24px_-6px_rgba(11,95,87,0.08)] grid grid-cols-2 gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'nutrition'}
          onClick={() => setActiveSubTab('nutrition')}
          data-testid="tab-eat-drink"
          className={`min-h-[48px] px-4 py-2 rounded-2xl text-base font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'nutrition'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'bg-[#FAF7F2] text-[#1F2937] hover:bg-stone-200/60'
          }`}
        >
          <Utensils className="w-4 h-4 shrink-0" />
          <span>Ăn uống</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'activity'}
          onClick={() => setActiveSubTab('activity')}
          data-testid="tab-workout"
          className={`min-h-[48px] px-4 py-2 rounded-2xl text-base font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'activity'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'bg-[#FAF7F2] text-[#1F2937] hover:bg-stone-200/60'
          }`}
        >
          <Dumbbell className="w-4 h-4 shrink-0" />
          <span>Vận động</span>
        </button>
      </div>

      {/* TAB 1: ĂN UỐNG & UỐNG NƯỚC */}
      {activeSubTab === 'nutrition' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Thẻ Tóm tắt Calo */}
            <Card className="lg:col-span-7 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] text-[#0F766E] border border-stone-200 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1F2937]">Năng lượng hôm nay</h2>
                    <p className="text-xs sm:text-sm text-stone-600 tabular-nums">
                      Mục tiêu {profile.dailyCalorieGoal} kcal
                    </p>
                  </div>
                </div>
                <Chip
                  label={summary.remainingCalories >= 0 ? 'Cân bằng tốt' : 'Vượt mức'}
                  variant={summary.remainingCalories >= 0 ? 'normal' : 'warning'}
                  className="shrink-0 whitespace-nowrap"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200/80">
                  <p className="text-xs font-semibold text-stone-600">Đã ăn</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tabular-nums mt-0.5">
                    {summary.totalIntake}
                    <span className="text-xs font-semibold text-stone-500"> kcal</span>
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200/80">
                  <p className="text-xs font-semibold text-stone-600">Đã tập</p>
                  <p
                    data-testid="total-burned-calories"
                    className="text-xl sm:text-2xl font-extrabold text-[#0F766E] tabular-nums mt-0.5"
                  >
                    {summary.totalBurned}
                    <span className="text-xs font-semibold text-stone-500"> kcal</span>
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200/80">
                  <p className="text-xs font-semibold text-stone-600">Còn lại</p>
                  <p
                    className={`text-xl sm:text-2xl font-extrabold tabular-nums mt-0.5 ${
                      summary.remainingCalories >= 0 ? 'text-emerald-700' : 'text-[#DC2626]'
                    }`}
                  >
                    {summary.remainingCalories}
                    <span className="text-xs font-semibold text-stone-500"> kcal</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200/80 grid grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-[#1F2937]">Đạm</span>
                    <span className="tabular-nums font-bold text-[#0B5F57]">{summary.proteinG}g</span>
                  </div>
                  <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F766E] rounded-full"
                      style={{ width: `${Math.min(100, Math.round((summary.proteinG / 135) * 100))}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-[#1F2937]">Tinh bột</span>
                    <span className="tabular-nums font-bold text-[#0B5F57]">{summary.carbsG}g</span>
                  </div>
                  <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((summary.carbsG / 220) * 100))}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-[#1F2937]">Chất béo</span>
                    <span className="tabular-nums font-bold text-amber-800">{summary.fatG}g</span>
                  </div>
                  <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F59E0B] rounded-full"
                      style={{ width: `${Math.min(100, Math.round((summary.fatG / 65) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Thẻ Uống nước */}
            <Card className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] text-[#0F766E] border border-stone-200 flex items-center justify-center shrink-0">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#1F2937]">Uống nước hôm nay</h2>
                      <p className="text-xs sm:text-sm text-stone-600 tabular-nums">
                        Khoảng {cupsCount} cốc (250 ml)
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-[#0F766E] tabular-nums">
                    {waterPercent}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2 tabular-nums">
                  <div>
                    <span
                      data-testid="water-intake-value"
                      className="text-3xl font-extrabold text-[#0B5F57]"
                    >
                      {waterIntakeMl}
                    </span>
                    <span className="text-sm font-semibold text-stone-600">
                      {' '}
                      / {profile.dailyWaterGoalMl} ml
                    </span>
                  </div>
                </div>

                <div className="w-full h-3 bg-stone-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0F766E] rounded-full transition-all duration-200"
                    style={{ width: `${waterPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-stone-200/80">
                <button
                  type="button"
                  onClick={() => onAddWater(250)}
                  className="flex-1 min-h-[48px] px-3 py-2 text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] rounded-2xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  +250 ml
                </button>
                <button
                  type="button"
                  onClick={() => onAddWater(500)}
                  className="flex-1 min-h-[48px] px-3 py-2 text-sm font-bold text-[#0B5F57] bg-[#FAF7F2] hover:bg-[#0F766E]/10 border border-[#0F766E]/35 rounded-2xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  +500 ml
                </button>
                <button
                  type="button"
                  onClick={onResetWater}
                  className="min-h-[48px] px-3 py-2 text-xs font-bold text-stone-600 hover:text-[#1F2937] hover:bg-stone-100 rounded-2xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  Đặt lại
                </button>
              </div>
            </Card>
          </div>

          {/* Danh sách Bữa ăn + nút + Thêm món */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2.5">
                <Utensils className="w-5 h-5 text-[#0F766E] shrink-0" />
                <h2 className="text-lg font-bold text-[#1F2937]">
                  Bữa ăn hôm nay ({meals.length})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportMealsCsv}
                  className="min-h-[44px] px-3 py-2 text-xs font-bold text-[#1F2937] bg-[#FAF7F2] border border-stone-300 hover:bg-stone-200/70 rounded-2xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#0F766E]" />
                  <span>Tải CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMealForm((prev) => !prev)}
                  className="min-h-[44px] px-4 py-2 text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] rounded-2xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddMealForm ? 'Đóng' : 'Thêm món'}</span>
                </button>
              </div>
            </div>

            {mealExportNotice && (
              <div
                role="status"
                className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-900"
              >
                {mealExportNotice}
              </div>
            )}

            {showAddMealForm && (
              <form
                onSubmit={handleAddMealSubmit}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3"
              >
                {mealError && (
                  <p role="alert" className="text-sm text-[#DC2626] font-bold">
                    {mealError}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="meal-type" className="block text-xs font-bold text-stone-700 mb-1">
                      Bữa
                    </label>
                    <select
                      id="meal-type"
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value as MealEntry['mealType'])}
                      className="w-full min-h-[44px] px-3 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold"
                    >
                      <option value="Sáng">Bữa Sáng</option>
                      <option value="Trưa">Bữa Trưa</option>
                      <option value="Tối">Bữa Tối</option>
                      <option value="Phụ">Bữa Phụ</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="food-name" className="block text-xs font-bold text-stone-700 mb-1">
                      Tên món ăn
                    </label>
                    <input
                      id="food-name"
                      type="text"
                      placeholder="VD: Cá hấp, canh rau, 1 bát cơm"
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label htmlFor="meal-cal" className="block text-xs font-bold text-stone-700 mb-1">
                      Calo (kcal)
                    </label>
                    <input
                      id="meal-cal"
                      type="number"
                      placeholder="450"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-1.5 text-sm border border-stone-300 rounded-2xl bg-white tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="meal-pro" className="block text-xs font-bold text-stone-700 mb-1">
                      Đạm (g)
                    </label>
                    <input
                      id="meal-pro"
                      type="number"
                      placeholder="30"
                      value={proteinG}
                      onChange={(e) => setProteinG(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-1.5 text-sm border border-stone-300 rounded-2xl bg-white tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="meal-carb" className="block text-xs font-bold text-stone-700 mb-1">
                      Tinh bột (g)
                    </label>
                    <input
                      id="meal-carb"
                      type="number"
                      placeholder="45"
                      value={carbsG}
                      onChange={(e) => setCarbsG(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-1.5 text-sm border border-stone-300 rounded-2xl bg-white tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="meal-fat" className="block text-xs font-bold text-stone-700 mb-1">
                      Béo (g)
                    </label>
                    <input
                      id="meal-fat"
                      type="number"
                      placeholder="12"
                      value={fatG}
                      onChange={(e) => setFatG(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-1.5 text-sm border border-stone-300 rounded-2xl bg-white tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="min-h-[48px] px-5 py-2 text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] rounded-2xl inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lưu món ăn</span>
                  </button>
                </div>
              </form>
            )}

            {meals.length === 0 ? (
              <EmptyState
                title="Chưa ghi bữa ăn nào"
                description="Bấm “Thêm món” để ghi lại bữa ăn hôm nay."
              />
            ) : (
              <div className="divide-y divide-stone-100">
                {visibleMeals.map((meal) => (
                  <div key={meal.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-[#1F2937]">{meal.foodName}</p>
                      <p className="text-xs sm:text-sm text-stone-600 mt-0.5 tabular-nums">
                        Bữa {meal.mealType} · {formatTime24h(meal.time)} · Đạm {meal.proteinG}g · Tinh bột{' '}
                        {meal.carbsG}g
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm sm:text-base font-extrabold text-[#0B5F57] tabular-nums">
                        {meal.calories} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteMeal(meal.id)}
                        aria-label={`Xóa món ${meal.foodName}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {meals.length > 4 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAllMeals((prev) => !prev)}
                      className="min-h-[44px] w-full rounded-2xl bg-[#FAF7F2] text-sm font-bold text-[#0B5F57] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{showAllMeals ? 'Thu gọn' : `Xem thêm ${meals.length - 4} món`}</span>
                      <ChevronDown className={`w-4 h-4 ${showAllMeals ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: VẬN ĐỘNG & LỊCH TẬP */}
      {activeSubTab === 'activity' && (
        <div className="space-y-4">
          {/* Tóm tắt Vận động */}
          <Card className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200/80">
              <p className="text-xs font-semibold text-stone-600">Thời gian tập</p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tabular-nums mt-0.5">
                {totalWorkoutMinutes}
                <span className="text-xs font-semibold text-stone-500"> phút</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200/80">
              <p className="text-xs font-semibold text-stone-600">Tiêu hao</p>
              <p
                data-testid="total-burned-calories"
                className="text-xl sm:text-2xl font-extrabold text-[#0F766E] tabular-nums mt-0.5"
              >
                {summary.totalBurned}
                <span className="text-xs font-semibold text-stone-500"> kcal</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200/80">
              <p className="text-xs font-semibold text-stone-600">Hoàn thành lịch</p>
              <p
                data-testid="workout-schedule-adherence-percent"
                className="text-xl sm:text-2xl font-extrabold text-[#0B5F57] tabular-nums mt-0.5"
              >
                {workoutAdherence.adherencePercent}%
              </p>
            </div>
          </Card>

          {/* Lịch tập định kỳ */}
          <Card
            as="section"
            ariaLabel="Lịch tập hằng ngày"
            testId="recurring-workout-schedule-panel"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1F2937]">Lịch tập hôm nay</h2>
                <span className="px-2.5 py-0.5 rounded-xl bg-[#FAF7F2] text-[#0B5F57] border border-[#0F766E]/30 text-xs font-bold">
                  {DAY_LABELS[currentDayCode]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="trigger-test-workout-push-btn"
                  onClick={() => onTriggerTestWorkoutPush()}
                  className="min-h-[44px] px-3 py-2 rounded-2xl text-xs font-bold text-[#0B5F57] bg-[#FAF7F2] border border-stone-300 hover:bg-stone-200/60 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <BellRing className="w-4 h-4" />
                  <span>Nhắc thử</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddScheduleForm((prev) => !prev)}
                  className="min-h-[44px] px-4 py-2 rounded-2xl text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddScheduleForm ? 'Đóng' : 'Thêm lịch'}</span>
                </button>
              </div>
            </div>

            {/* Bài tập sắp tới */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#0F766E]/25 flex flex-wrap items-center justify-between gap-2">
              {nextWorkoutInfo ? (
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#0B5F57]">Bài tập tiếp theo:</span>
                    <span
                      data-testid="next-workout-countdown"
                      className="px-2 py-0.5 rounded-lg bg-white border border-[#0F766E]/30 text-[#0B5F57] text-xs font-bold tabular-nums"
                    >
                      {nextWorkoutInfo.countdownLabel}
                    </span>
                  </div>
                  <p className="text-base font-bold text-[#1F2937] tabular-nums">
                    {nextWorkoutInfo.schedule.activityName} · {formatTime24h(nextWorkoutInfo.schedule.timeSlot)} ({nextWorkoutInfo.schedule.durationMinutes} phút)
                  </p>
                </div>
              ) : (
                <p className="text-sm font-bold text-emerald-800">
                  Bạn đã tập hết các bài hôm nay.
                </p>
              )}
              <span className="text-xs text-stone-600 font-semibold tabular-nums">
                Báo trước {notificationSettings.leadMinutes} phút
              </span>
            </div>

            {showAddScheduleForm && (
              <form
                onSubmit={handleAddWorkoutScheduleSubmit}
                data-testid="add-workout-schedule-form"
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3"
              >
                <div className="text-sm font-bold text-[#1F2937]">Thêm lịch tập định kỳ</div>
                {schedError && (
                  <p role="alert" className="text-sm text-[#DC2626] font-bold">
                    {schedError}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="sched-workout-name" className="block text-xs font-bold text-stone-700 mb-1">
                      Tên bài tập
                    </label>
                    <input
                      id="sched-workout-name"
                      type="text"
                      placeholder="VD: Đi bộ buổi sáng"
                      value={schedName}
                      onChange={(e) => setSchedName(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="sched-workout-category" className="block text-xs font-bold text-stone-700 mb-1">
                      Loại
                    </label>
                    <select
                      id="sched-workout-category"
                      value={schedCategory}
                      onChange={(e) => setSchedCategory(e.target.value as WorkoutEntry['category'])}
                      className="w-full min-h-[44px] px-3 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold"
                    >
                      <option value="Đi bộ">Đi bộ</option>
                      <option value="Linh hoạt">Dưỡng sinh</option>
                      <option value="Cardio">Đạp xe / Bơi</option>
                      <option value="Kháng lực">Tập nhẹ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label htmlFor="sched-workout-time" className="block text-xs font-bold text-stone-700 mb-1">
                      Giờ tập
                    </label>
                    <input
                      id="sched-workout-time"
                      type="time"
                      value={schedTimeSlot}
                      onChange={(e) => setSchedTimeSlot(e.target.value || '06:00')}
                      className="w-full min-h-[44px] px-3 py-1.5 text-sm border border-stone-300 rounded-2xl bg-white tabular-nums font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor="sched-workout-intensity" className="block text-xs font-bold text-stone-700 mb-1">
                      Mức độ
                    </label>
                    <select
                      id="sched-workout-intensity"
                      value={schedIntensity}
                      onChange={(e) =>
                        setSchedIntensity(e.target.value as WorkoutSchedule['intensityLabel'])
                      }
                      className="w-full min-h-[44px] px-2.5 py-1.5 text-sm border border-stone-300 rounded-2xl bg-white font-semibold"
                    >
                      <option value="Nhẹ nhàng">Nhẹ nhàng</option>
                      <option value="Vừa phải">Vừa phải</option>
                      <option value="Tích cực">Tích cực</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sched-workout-duration" className="block text-xs font-bold text-stone-700 mb-1">
                      Phút
                    </label>
                    <input
                      id="sched-workout-duration"
                      type="number"
                      value={schedDuration}
                      onChange={(e) => setSchedDuration(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-1.5 text-sm border border-stone-300 rounded-2xl bg-white tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="sched-workout-calories" className="block text-xs font-bold text-stone-700 mb-1">
                      Calo (kcal)
                    </label>
                    <input
                      id="sched-workout-calories"
                      type="number"
                      value={schedCalories}
                      onChange={(e) => setSchedCalories(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-1.5 text-sm border border-stone-300 rounded-2xl bg-white tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {WORKOUT_TIME_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSchedTimeSlot(preset)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold tabular-nums border cursor-pointer ${
                        schedTimeSlot === preset
                          ? 'bg-[#0F766E] text-white border-[#0F766E]'
                          : 'bg-white text-[#1F2937] border-stone-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ALL_DAYS_OF_WEEK.map((day) => {
                    const selected = schedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleFormDay(day)}
                        aria-pressed={selected}
                        className={`min-h-[40px] px-3 py-1 rounded-xl text-xs font-bold border cursor-pointer ${
                          selected
                            ? 'bg-[#0F766E] text-white border-[#0F766E]'
                            : 'bg-white text-[#1F2937] border-stone-300'
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    data-testid="submit-workout-schedule-btn"
                    className="min-h-[48px] px-5 py-2 text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] rounded-2xl inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lưu lịch tập</span>
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-stone-200/80">
              {workoutSchedules.map((sched) => {
                const isScheduledToday = sched.daysOfWeek.includes(currentDayCode);
                const isReminderOn = sched.reminderEnabled !== false;
                const isEditing = editingSchedId === sched.id;
                return (
                  <div
                    key={sched.id}
                    data-testid={`workout-schedule-row-${sched.id}`}
                    className="py-3.5 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-base font-bold ${
                              sched.completedToday ? 'text-stone-400 line-through' : 'text-[#1F2937]'
                            }`}
                          >
                            {sched.activityName}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                              isScheduledToday
                                ? 'bg-[#0F766E]/12 text-[#0B5F57]'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {formatRecurringDaysLabel(sched.daysOfWeek)}
                          </span>
                          {sched.snoozedUntil && !sched.completedToday && (
                            <Chip
                              label={`Nhắc lại ${formatTime24h(sched.snoozedUntil)}`}
                              variant="warning"
                            />
                          )}
                        </div>
                        <p className="text-sm text-stone-600 tabular-nums">
                          {formatTime24h(sched.timeSlot)} · {sched.durationMinutes} phút · -{sched.targetCalories} kcal
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingSchedId(isEditing ? null : sched.id)}
                          aria-label={`Sửa lịch ${sched.activityName}`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-[#FAF7F2] border border-stone-200 text-stone-600 hover:text-[#0B5F57] cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          data-testid={`complete-workout-sched-${sched.id}`}
                          onClick={() => onToggleWorkoutScheduleComplete(sched.id)}
                          className={`min-h-[44px] px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            sched.completedToday
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-[#0F766E] text-white hover:bg-[#0B5F57]'
                          }`}
                        >
                          {sched.completedToday ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Đã tập</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4" />
                              <span>Đã tập xong</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor={`workout-time-${sched.id}`}
                          className="inline-flex items-center gap-2 text-sm font-bold text-[#1F2937] tabular-nums"
                        >
                          <span>Giờ:</span>
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
                            className="px-2.5 py-1.5 text-sm font-bold text-[#0B5F57] bg-white border border-stone-300 rounded-xl tabular-nums"
                          />
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateWorkoutSchedule(sched.id, {
                                reminderEnabled: !isReminderOn,
                              })
                            }
                            className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer ${
                              isReminderOn
                                ? 'bg-[#0F766E]/10 text-[#0B5F57] border-[#0F766E]/30'
                                : 'bg-white text-stone-600 border-stone-300'
                            }`}
                          >
                            {isReminderOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                            <span>{isReminderOn ? 'Chuông: Bật' : 'Chuông: Tắt'}</span>
                          </button>
                          <button
                            type="button"
                            data-testid={`test-push-workout-${sched.id}`}
                            onClick={() => onTriggerTestWorkoutPush(sched)}
                            className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-stone-300 text-[#1F2937] cursor-pointer"
                          >
                            Nhắc thử
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteWorkoutSchedule(sched.id)}
                            aria-label={`Xóa lịch tập ${sched.activityName}`}
                            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-stone-500 hover:text-[#DC2626] hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Buổi tập đã ghi hôm nay */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-[#0F766E]" />
                <h2 className="text-lg font-bold text-[#1F2937]">
                  Đã tập hôm nay ({workouts.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddWorkoutForm((prev) => !prev)}
                className="min-h-[44px] px-4 py-2 text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] rounded-2xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddWorkoutForm ? 'Đóng' : 'Thêm buổi tập'}</span>
              </button>
            </div>

            {showAddWorkoutForm && (
              <form
                onSubmit={handleAddWorkoutSubmit}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3"
              >
                {workoutError && (
                  <p role="alert" className="text-sm text-[#DC2626] font-bold">
                    {workoutError}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="workout-cat" className="block text-xs font-bold text-stone-700 mb-1">
                      Loại
                    </label>
                    <select
                      id="workout-cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as WorkoutEntry['category'])}
                      className="w-full min-h-[44px] px-3 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold"
                    >
                      <option value="Cardio">Đạp xe / Tim mạch</option>
                      <option value="Kháng lực">Tập nhẹ</option>
                      <option value="Linh hoạt">Dưỡng sinh</option>
                      <option value="Đi bộ">Đi bộ</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="workout-name" className="block text-xs font-bold text-stone-700 mb-1">
                      Tên bài tập
                    </label>
                    <input
                      id="workout-name"
                      type="text"
                      placeholder="VD: Đi bộ buổi chiều"
                      value={activityName}
                      onChange={(e) => setActivityName(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="workout-dur" className="block text-xs font-bold text-stone-700 mb-1">
                      Thời lượng (phút)
                    </label>
                    <input
                      id="workout-dur"
                      type="number"
                      placeholder="30"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-1.5 text-sm border border-stone-300 rounded-2xl bg-white tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="workout-burn" className="block text-xs font-bold text-stone-700 mb-1">
                      Calo tiêu hao (kcal)
                    </label>
                    <input
                      id="workout-burn"
                      type="number"
                      placeholder="180"
                      value={caloriesBurned}
                      onChange={(e) => setCaloriesBurned(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-1.5 text-sm border border-stone-300 rounded-2xl bg-white tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="min-h-[48px] px-5 py-2 text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] rounded-2xl inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lưu buổi tập</span>
                  </button>
                </div>
              </form>
            )}

            {workouts.length === 0 ? (
              <EmptyState
                title="Chưa có buổi tập nào"
                description="Bấm “Đã tập xong” ở lịch trên hoặc “Thêm buổi tập”."
              />
            ) : (
              <div className="divide-y divide-stone-100">
                {visibleWorkouts.map((w) => (
                  <div key={w.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-[#1F2937]">{w.activityName}</p>
                      <p className="text-xs sm:text-sm text-stone-600 mt-0.5 tabular-nums">
                        {w.category} · {formatTime24h(w.time)} · {w.durationMinutes} phút
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm sm:text-base font-extrabold text-[#0F766E] tabular-nums">
                        -{w.caloriesBurned} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteWorkout(w.id)}
                        aria-label={`Xóa bài tập ${w.activityName}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:text-[#DC2626] hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {workouts.length > 4 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAllWorkouts((prev) => !prev)}
                      className="min-h-[44px] w-full rounded-2xl bg-[#FAF7F2] text-sm font-bold text-[#0B5F57] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{showAllWorkouts ? 'Thu gọn' : `Xem thêm ${workouts.length - 4} buổi`}</span>
                      <ChevronDown className={`w-4 h-4 ${showAllWorkouts ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

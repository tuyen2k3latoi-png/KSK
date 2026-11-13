import React from 'react';
import { Calendar, HeartHandshake } from 'lucide-react';
import {
  HealthStatusLevel,
  MedicationNotificationSettings,
  MedicationSchedule,
  UserMedicalProfile,
  VitalRecord,
  WorkoutSchedule,
} from '../../types/health';
import { buildVietnameseGreeting } from '../../utils/formatters';
import { PriorityDashboardConfig } from '../../utils/healthCalculations';
import { VitalsBarChartPanel } from '../VitalsBarChartPanel';
import { AiHealthAssistantPanel } from '../AiHealthAssistantPanel';
import { PWAInstallBanner } from '../PWAInstallButton';
import { CompositeIndexCard } from './CompositeIndexCard';
import { PriorityMetricsGrid } from './PriorityMetricsGrid';
import { DashboardDailyChecklists } from './DashboardDailyChecklists';
import { NutritionGuidanceCard } from './NutritionGuidanceCard';
import { ActiveModule } from '../layout/AppTopHeaderAndNav';
import { PatientIdentityBar } from '../layout/PatientIdentityBar';

interface DashboardOverviewViewProps {
  profile: UserMedicalProfile;
  vitals: VitalRecord[];
  latestVital: VitalRecord;
  medications: MedicationSchedule[];
  priorityDashboardConfig: PriorityDashboardConfig;
  healthScore: {
    score: number;
    grade: string;
    status: HealthStatusLevel;
  };
  bmi: number;
  bmiEval: { label: string };
  bpEval: {
    status: HealthStatusLevel;
    label: string;
    recommendation: string;
  };
  gluEval: { status: HealthStatusLevel; label: string };
  hrEval: { label: string };
  waterIntakeMl: number;
  medAdherence: {
    takenCount: number;
    totalCount: number;
    adherencePercent: number;
  };
  calorieSummary: {
    totalIntake: number;
    totalBurned: number;
    netCalories: number;
    proteinG: number;
    carbsG: number;
  };
  notificationSettings: MedicationNotificationSettings;
  nextDoseInfo: {
    medication: MedicationSchedule;
    countdownLabel: string;
  } | null;
  workoutSchedAdherence: {
    completedCount: number;
    totalScheduledToday: number;
    adherencePercent: number;
    todaySchedules: WorkoutSchedule[];
  };
  nextWorkoutInfo: {
    schedule: WorkoutSchedule;
    countdownLabel: string;
  } | null;
  isDemoMode?: boolean;
  displayedHeaderBhyt: string;
  showHeaderBhytFull: boolean;
  onToggleShowHeaderBhytFull: () => void;
  bhytVisitsCount: number;
  onOpenBhytRecords: () => void;
  onOpenLogModal: () => void;
  onAddWater: (amountMl: number) => void;
  onAddVitalRecord: (record: Omit<VitalRecord, 'id'>) => void;
  onAddMultipleMedications: (meds: Array<Omit<MedicationSchedule, 'id'>>) => void;
  onToggleMedication: (id: string) => void;
  onTriggerTestPush: () => void;
  onToggleWorkoutScheduleComplete: (id: string) => void;
  onTriggerTestWorkoutPush: () => void;
  onNavigateModule: (module: ActiveModule) => void;
  onOpenEmergencyCall?: () => void;
}

/**
 * Màn hình 1: SỨC KHỎE (Trang chủ) theo đúng thứ tự từ trên xuống:
 * a. Lời chào theo khung giờ ("Chào buổi sáng, chú Quân") + ngày hôm nay (dd/mm/yyyy)
 * b. Thẻ "Chỉ số tổng hợp tham khảo" (vòng tròn điểm + 1 câu nhận xét ngắn gọn)
 * c. Lưới 2×2 các ô chỉ số lớn (Huyết áp, Đường huyết/Nhịp tim, Bước chân, Giấc ngủ)
 * d. Thẻ "Việc cần làm hôm nay" (cữ thuốc sắp tới, nhắc đo huyết áp, bài tập trong lịch)
 * e. Biểu đồ 7 ngày & Trợ lý tóm tắt tuần
 * f. Thẻ hồ sơ rút gọn (đặt dưới cùng, nhấn mở chi tiết) + Banner "Cài app" tắt được 1 lần
 */
export const DashboardOverviewView: React.FC<DashboardOverviewViewProps> = ({
  profile,
  vitals,
  latestVital,
  medications,
  priorityDashboardConfig,
  healthScore,
  bmi,
  bmiEval,
  bpEval,
  gluEval,
  hrEval,
  waterIntakeMl,
  medAdherence,
  calorieSummary,
  notificationSettings,
  nextDoseInfo,
  workoutSchedAdherence,
  nextWorkoutInfo,
  isDemoMode,
  displayedHeaderBhyt,
  showHeaderBhytFull,
  onToggleShowHeaderBhytFull,
  bhytVisitsCount,
  onOpenBhytRecords,
  onOpenLogModal,
  onAddWater,
  onAddVitalRecord,
  onAddMultipleMedications,
  onToggleMedication,
  onTriggerTestPush,
  onToggleWorkoutScheduleComplete,
  onTriggerTestWorkoutPush,
  onNavigateModule,
  onOpenEmergencyCall,
}) => {
  const greeting = buildVietnameseGreeting({
    fullName: profile.fullName,
    gender: profile.gender,
    birthYear: profile.birthYear,
  });

  return (
    <div className="space-y-4">
      {/* a. Lời chào theo khung giờ + Ngày hôm nay + Ưu tiên ngắn gọn */}
      <section
        aria-label="Lời chào và ưu tiên theo dõi hôm nay"
        data-testid="priority-dashboard-banner"
        className="bg-gradient-to-br from-[#0B5F57] to-[#0F766E] rounded-[20px] p-4 sm:p-5 text-white shadow-[0_10px_28px_-8px_rgba(11,95,87,0.35)] space-y-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-100">
              <Calendar className="w-4 h-4 shrink-0" />
              <span data-testid="dashboard-today-date">{greeting.todayFormatted}</span>
            </p>
            <h1
              data-testid="dashboard-greeting-heading"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug"
            >
              {greeting.greetingTitle}
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 border border-white/25 text-xs sm:text-sm font-bold text-white">
            <HeartHandshake className="w-4 h-4 text-amber-200 shrink-0" />
            <span data-testid="priority-dashboard-title">
              {priorityDashboardConfig.priorityBannerTitle}
            </span>
          </span>
        </div>
      </section>

      {/* b. Thẻ "Chỉ số tổng hợp tham khảo" */}
      <CompositeIndexCard
        latestVital={latestVital}
        healthScore={healthScore}
        bpEval={bpEval}
        gluEval={gluEval}
        medAdherencePercent={medAdherence.adherencePercent}
        onOpenEmergencyCall={onOpenEmergencyCall}
      />

      {/* c. Lưới 2×2 các ô chỉ số lớn */}
      <PriorityMetricsGrid
        orderedCardIds={priorityDashboardConfig.orderedCardIds}
        vitals={vitals}
        latestVital={latestVital}
        profile={profile}
        bmi={bmi}
        bmiEval={bmiEval}
        bpEval={bpEval}
        gluEval={gluEval}
        hrEval={hrEval}
        waterIntakeMl={waterIntakeMl}
        medAdherence={medAdherence}
        calorieSummary={calorieSummary}
        onAddWater={onAddWater}
      />

      {/* d. Thẻ "Việc cần làm hôm nay" */}
      <DashboardDailyChecklists
        medications={medications}
        medAdherence={medAdherence}
        notificationSettings={notificationSettings}
        nextDoseInfo={nextDoseInfo}
        workoutSchedAdherence={workoutSchedAdherence}
        nextWorkoutInfo={nextWorkoutInfo}
        calorieSummary={calorieSummary}
        waterIntakeMl={waterIntakeMl}
        onToggleMedication={onToggleMedication}
        onTriggerTestPush={onTriggerTestPush}
        onToggleWorkoutScheduleComplete={onToggleWorkoutScheduleComplete}
        onTriggerTestWorkoutPush={onTriggerTestWorkoutPush}
        onAddWater={onAddWater}
        onNavigateModule={onNavigateModule}
        onOpenLogModal={onOpenLogModal}
      />

      {/* Gợi ý thực phẩm Nên ăn / Nên tránh theo huyết áp & đường huyết */}
      <NutritionGuidanceCard
        vitals={vitals}
        latestVital={latestVital}
        onNavigateModule={onNavigateModule}
        onOpenLogModal={onOpenLogModal}
      />

      {/* e. Biểu đồ 7 ngày + Trợ lý tóm tắt tuần & đọc ảnh */}
      <VitalsBarChartPanel records={vitals} />

      <AiHealthAssistantPanel
        profile={profile}
        vitals={vitals}
        medications={medications}
        onConfirmSaveVital={onAddVitalRecord}
        onConfirmSaveMedications={onAddMultipleMedications}
      />

      {/* f. Thẻ hồ sơ rút gọn (đặt dưới cùng, nhấn mở chi tiết) + Banner "Cài app" tắt được 1 lần */}
      <PatientIdentityBar
        profile={profile}
        isDemoMode={isDemoMode}
        displayedHeaderBhyt={displayedHeaderBhyt}
        showHeaderBhytFull={showHeaderBhytFull}
        onToggleShowHeaderBhytFull={onToggleShowHeaderBhytFull}
        bhytVisitsCount={bhytVisitsCount}
        onOpenBhytRecords={onOpenBhytRecords}
      />

      <PWAInstallBanner />
    </div>
  );
};

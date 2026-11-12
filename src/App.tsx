import React, { useState } from 'react';
import { calculateHealthScore } from './utils/healthCalculations';
import { useProfile } from './hooks/useProfile';
import { useVitals } from './hooks/useVitals';
import { useMedications } from './hooks/useMedications';
import { useAccountActions } from './hooks/useAccountActions';
import { LogVitalModal } from './components/LogVitalModal';
import { NutritionActivityView } from './components/NutritionActivityView';
import { MedicationCareView } from './components/MedicationCareView';
import { UserGuideView } from './components/UserGuideView';
import { VneidWelcomeLoginScreen } from './components/VneidWelcomeLoginScreen';
import { MedicationPushBanner } from './components/MedicationPushBanner';
import { OfflineIndicator } from './components/PWAInstallButton';
import { PlayStoreComplianceModal } from './components/PlayStoreComplianceModal';
import {
  ActiveModule,
  AppFooter,
  AppMobileBottomNav,
  AppTopHeader,
  DesktopSidebarNav,
  FloatingLogVitalFab,
  Nd13PrivacyConsentBanner,
  RecordsSubTab,
} from './components/layout/AppTopHeaderAndNav';
import { DashboardOverviewView } from './components/dashboard/DashboardOverviewView';
import { RecordsModuleView } from './components/records/RecordsModuleView';

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [recordsSubTab, setRecordsSubTab] = useState<RecordsSubTab>('bhyt');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);

  const profileState = useProfile();
  const vitalsState = useVitals({
    profile: profileState.profile,
    setProfile: profileState.setProfile,
    bhytVisits: profileState.bhytVisits,
    cloudUser: profileState.cloudUser,
  });

  const medsState = useMedications({
    isAuthenticated: profileState.isAuthenticated,
    profile: profileState.profile,
    waterIntakeMl: vitalsState.waterIntakeMl,
    cloudUser: profileState.cloudUser,
    currentDayCode: vitalsState.currentDayCode,
    workoutSchedules: vitalsState.workoutSchedules,
    setWorkoutSchedules: vitalsState.setWorkoutSchedules,
    setWorkouts: vitalsState.setWorkouts,
    onUpdateWorkoutSchedule: vitalsState.handleUpdateWorkoutSchedule,
  });

  const {
    handleLoginWithAccount,
    handleApplyVisitToTracker,
    handleResetSampleData,
    handleExportAllUserData,
    handleDeleteAllUserData,
  } = useAccountActions({ profileState, vitalsState, medsState });

  const healthScore = calculateHealthScore(
    vitalsState.latestVital,
    vitalsState.bmi,
    medsState.medAdherence.adherencePercent
  );

  if (!profileState.isAuthenticated) {
    return (
      <>
        <OfflineIndicator />
        <VneidWelcomeLoginScreen
          onLoginSuccess={handleLoginWithAccount}
          cloudUser={profileState.cloudUser}
          onGoogleAuthSuccess={(u, hasToken) => {
            profileState.setCloudUser(u);
            profileState.setHasCalendarToken(hasToken);
          }}
          onOpenComplianceModal={() => setIsComplianceModalOpen(true)}
          fontSizeMode={profileState.fontSizeMode}
          onChangeFontSizeMode={profileState.setFontSizeMode}
        />
        <PlayStoreComplianceModal
          isOpen={isComplianceModalOpen}
          onClose={() => setIsComplianceModalOpen(false)}
          onDeleteAllUserData={handleDeleteAllUserData}
          onExportAllUserData={handleExportAllUserData}
          nd13ConsentAcceptedAt={profileState.nd13Consent?.accepted ? profileState.nd13Consent.acceptedAt : null}
          onWithdrawNd13Consent={() => {
            profileState.handleWithdrawNd13Consent();
            setIsComplianceModalOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col bg-[#FAF7F2] text-[#1F2937] pb-28 md:pb-10">
      <OfflineIndicator />
      <Nd13PrivacyConsentBanner
        nd13Consent={profileState.nd13Consent}
        onAcceptConsent={profileState.handleAcceptNd13Consent}
        onOpenPrivacyDetails={() => setIsComplianceModalOpen(true)}
      />
      <MedicationPushBanner
        activeNotifications={medsState.activePushNotifications}
        snoozeMinutes={medsState.notificationSettings.snoozeMinutes}
        soundEnabled={medsState.notificationSettings.soundEnabled}
        onConfirmTaken={medsState.handleConfirmPushNotification}
        onSnooze={medsState.handleSnoozePushNotification}
        onDismiss={medsState.handleDismissPushNotification}
      />

      <AppTopHeader
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onOpenLogModal={() => setIsLogModalOpen(true)}
        profile={profileState.profile}
        isDemoMode={profileState.isDemoMode}
        fontSizeMode={profileState.fontSizeMode}
        onChangeFontSizeMode={profileState.setFontSizeMode}
        bhytVisitsCount={profileState.bhytVisits.length}
        onOpenBhytRecords={() => {
          setActiveModule('records');
          setRecordsSubTab('bhyt');
        }}
        onOpenPrivacySettings={() => setIsComplianceModalOpen(true)}
        onSwitchProfile={profileState.handleLogoutToWelcomeScreen}
      />

      <div className="max-w-7xl w-full mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6 flex-1 min-w-0 flex flex-col md:flex-row gap-6 items-start">
        <DesktopSidebarNav
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          onOpenLogModal={() => setIsLogModalOpen(true)}
        />

        <main className="w-full flex-1 min-w-0 space-y-4">
          {activeModule === 'dashboard' && (
            <DashboardOverviewView
              profile={profileState.profile}
              vitals={vitalsState.vitals}
              latestVital={vitalsState.latestVital}
              medications={medsState.medications}
              priorityDashboardConfig={vitalsState.priorityDashboardConfig}
              healthScore={healthScore}
              bmi={vitalsState.bmi}
              bmiEval={vitalsState.bmiEval}
              bpEval={vitalsState.bpEval}
              gluEval={vitalsState.gluEval}
              hrEval={vitalsState.hrEval}
              waterIntakeMl={vitalsState.waterIntakeMl}
              medAdherence={medsState.medAdherence}
              calorieSummary={vitalsState.calorieSummary}
              notificationSettings={medsState.notificationSettings}
              nextDoseInfo={medsState.notifEval.nextDose}
              workoutSchedAdherence={vitalsState.workoutSchedAdherence}
              nextWorkoutInfo={medsState.workoutNotifEval.nextWorkout}
              isDemoMode={profileState.isDemoMode}
              displayedHeaderBhyt={profileState.displayedHeaderBhyt}
              showHeaderBhytFull={profileState.showHeaderBhytFull}
              onToggleShowHeaderBhytFull={() =>
                profileState.setShowHeaderBhytFull((prev) => !prev)
              }
              bhytVisitsCount={profileState.bhytVisits.length}
              onOpenBhytRecords={() => {
                setActiveModule('records');
                setRecordsSubTab('bhyt');
              }}
              onOpenLogModal={() => setIsLogModalOpen(true)}
              onAddWater={vitalsState.handleAddWater}
              onAddVitalRecord={vitalsState.handleAddVitalRecord}
              onAddMultipleMedications={medsState.handleAddMultipleMedications}
              onToggleMedication={medsState.handleToggleMedication}
              onTriggerTestPush={() => medsState.handleTriggerTestPush()}
              onToggleWorkoutScheduleComplete={medsState.handleToggleWorkoutScheduleComplete}
              onTriggerTestWorkoutPush={() => medsState.handleTriggerTestWorkoutPush()}
              onNavigateModule={setActiveModule}
            />
          )}

          {activeModule === 'nutrition' && (
            <NutritionActivityView
              profile={profileState.profile}
              meals={vitalsState.meals}
              workouts={vitalsState.workouts}
              workoutSchedules={vitalsState.workoutSchedules}
              currentDayCode={vitalsState.currentDayCode}
              nextWorkoutInfo={medsState.workoutNotifEval.nextWorkout}
              notificationSettings={medsState.notificationSettings}
              waterIntakeMl={vitalsState.waterIntakeMl}
              onAddWater={vitalsState.handleAddWater}
              onResetWater={vitalsState.handleResetWater}
              onAddMeal={vitalsState.handleAddMeal}
              onDeleteMeal={vitalsState.handleDeleteMeal}
              onAddWorkout={vitalsState.handleAddWorkout}
              onDeleteWorkout={vitalsState.handleDeleteWorkout}
              onToggleWorkoutScheduleComplete={medsState.handleToggleWorkoutScheduleComplete}
              onAddWorkoutSchedule={vitalsState.handleAddWorkoutSchedule}
              onUpdateWorkoutSchedule={vitalsState.handleUpdateWorkoutSchedule}
              onDeleteWorkoutSchedule={vitalsState.handleDeleteWorkoutSchedule}
              onTriggerTestWorkoutPush={medsState.handleTriggerTestWorkoutPush}
            />
          )}

          {activeModule === 'medications' && (
            <MedicationCareView
              medications={medsState.medications}
              profile={profileState.profile}
              notificationSettings={medsState.notificationSettings}
              nextDoseInfo={medsState.notifEval.nextDose}
              notificationHistory={medsState.notificationHistory}
              onToggleMedication={medsState.handleToggleMedication}
              onAddMedication={medsState.handleAddMedication}
              onUpdateMedicationReminder={medsState.handleUpdateMedicationReminder}
              onUpdateNotificationSettings={medsState.setNotificationSettings}
              onRequestBrowserPermission={medsState.handleRequestBrowserNotificationPermission}
              onTriggerTestPush={medsState.handleTriggerTestPush}
              onUpdateProfile={profileState.setProfile}
            />
          )}

          {activeModule === 'records' && (
            <RecordsModuleView
              recordsSubTab={recordsSubTab}
              onChangeRecordsSubTab={setRecordsSubTab}
              profile={profileState.profile}
              bhytVisits={profileState.bhytVisits}
              vitals={vitalsState.vitals}
              meals={vitalsState.meals}
              workouts={vitalsState.workouts}
              medications={medsState.medications}
              waterIntakeMl={vitalsState.waterIntakeMl}
              cloudUser={profileState.cloudUser}
              hasCalendarToken={profileState.hasCalendarToken}
              onAuthSuccess={(u, hasToken) => {
                profileState.setCloudUser(u);
                profileState.setHasCalendarToken(hasToken);
              }}
              onSignOut={() => {
                profileState.setCloudUser(null);
                profileState.setHasCalendarToken(false);
              }}
              onOpenVneidLogin={profileState.handleLogoutToWelcomeScreen}
              onApplyVisitToTracker={handleApplyVisitToTracker}
              onAddBhytVisit={profileState.handleAddBhytVisit}
              onDeleteVitalRecord={vitalsState.handleDeleteVitalRecord}
              onResetSampleData={handleResetSampleData}
              onOpenLogModal={() => setIsLogModalOpen(true)}
              onAddVitalRecord={vitalsState.handleAddVitalRecord}
            />
          )}

          {activeModule === 'guide' && (
            <UserGuideView
              profile={profileState.profile}
              onOpenLogModal={() => setIsLogModalOpen(true)}
              onNavigateModule={setActiveModule}
            />
          )}
        </main>
      </div>

      {/* Nút nổi (FAB) "+" Ghi nhận chỉ số */}
      <FloatingLogVitalFab onClick={() => setIsLogModalOpen(true)} />

      {/* Thanh điều hướng dưới 5 mục (Mobile) */}
      <AppMobileBottomNav activeModule={activeModule} onSelectModule={setActiveModule} />

      <AppFooter
        onOpenComplianceModal={() => setIsComplianceModalOpen(true)}
        onNavigateGuide={() => setActiveModule('guide')}
        onResetSampleData={handleResetSampleData}
      />

      <LogVitalModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={vitalsState.handleAddVitalRecord}
        defaultWeightKg={vitalsState.latestVital.weightKg}
      />
      <PlayStoreComplianceModal
        isOpen={isComplianceModalOpen}
        onClose={() => setIsComplianceModalOpen(false)}
        onDeleteAllUserData={handleDeleteAllUserData}
        onExportAllUserData={handleExportAllUserData}
        nd13ConsentAcceptedAt={
          profileState.nd13Consent?.accepted ? profileState.nd13Consent.acceptedAt : null
        }
        onWithdrawNd13Consent={() => {
          profileState.handleWithdrawNd13Consent();
          setIsComplianceModalOpen(false);
        }}
      />
    </div>
  );
}

import React from 'react';
import { User } from 'firebase/auth';
import { Bluetooth, FileHeart, FileSpreadsheet } from 'lucide-react';
import {
  BhytVisitRecord,
  MealEntry,
  MedicationSchedule,
  UserMedicalProfile,
  VitalRecord,
  WorkoutEntry,
} from '../../types/health';
import { VneidBhytPanel } from '../VneidBhytPanel';
import { ClinicalAnalyticsView } from '../ClinicalAnalyticsView';
import { ConnectedEcosystemPanel } from '../ConnectedEcosystemPanel';
import { RecordsSubTab } from '../layout/AppTopHeaderAndNav';

interface RecordsModuleViewProps {
  recordsSubTab: RecordsSubTab;
  onChangeRecordsSubTab: (tab: RecordsSubTab) => void;
  profile: UserMedicalProfile;
  bhytVisits: BhytVisitRecord[];
  vitals: VitalRecord[];
  meals: MealEntry[];
  workouts: WorkoutEntry[];
  medications: MedicationSchedule[];
  waterIntakeMl: number;
  cloudUser: User | null;
  hasCalendarToken: boolean;
  onAuthSuccess: (user: User, hasToken: boolean) => void;
  onSignOut: () => void;
  onOpenVneidLogin: () => void;
  onApplyVisitToTracker: (visit: BhytVisitRecord) => void;
  onAddBhytVisit: (visitData: Omit<BhytVisitRecord, 'id'>) => void;
  onDeleteVitalRecord: (id: string) => void;
  onResetSampleData: () => void;
  onOpenLogModal: () => void;
  onAddVitalRecord: (record: Omit<VitalRecord, 'id'>) => void;
}

export const RecordsModuleView: React.FC<RecordsModuleViewProps> = ({
  recordsSubTab,
  onChangeRecordsSubTab,
  profile,
  bhytVisits,
  vitals,
  meals,
  workouts,
  medications,
  waterIntakeMl,
  cloudUser,
  hasCalendarToken,
  onAuthSuccess,
  onSignOut,
  onOpenVneidLogin,
  onApplyVisitToTracker,
  onAddBhytVisit,
  onDeleteVitalRecord,
  onResetSampleData,
  onOpenLogModal,
  onAddVitalRecord,
}) => {
  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Chọn mục trong Sổ BHYT và Hồ sơ"
        className="bg-white border border-stone-200/85 rounded-[20px] p-2 shadow-[0_6px_24px_-6px_rgba(11,95,87,0.08)] flex flex-wrap gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={recordsSubTab === 'bhyt'}
          onClick={() => onChangeRecordsSubTab('bhyt')}
          data-testid="records-subtab-bhyt"
          className={`flex-1 min-w-[200px] min-h-[48px] px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            recordsSubTab === 'bhyt'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'bg-[#FAF7F2] text-[#1F2937] hover:bg-stone-200/60'
          }`}
        >
          <FileHeart className="w-4 h-4 shrink-0" />
          <span>1. Thẻ BHYT &amp; Lịch sử khám ({bhytVisits.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={recordsSubTab === 'history'}
          onClick={() => onChangeRecordsSubTab('history')}
          data-testid="records-subtab-history"
          className={`flex-1 min-w-[200px] min-h-[48px] px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            recordsSubTab === 'history'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'bg-[#FAF7F2] text-[#1F2937] hover:bg-stone-200/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          <span>2. Nhật ký đo &amp; Tải sổ (CSV/JSON)</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={recordsSubTab === 'devices'}
          onClick={() => onChangeRecordsSubTab('devices')}
          data-testid="records-subtab-devices"
          className={`flex-1 min-w-[200px] min-h-[48px] px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            recordsSubTab === 'devices'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'bg-[#FAF7F2] text-[#1F2937] hover:bg-stone-200/60'
          }`}
        >
          <Bluetooth className="w-4 h-4 shrink-0" />
          <span>3. Thiết bị đo &amp; Lịch tái khám</span>
        </button>
      </div>

      {recordsSubTab === 'bhyt' && (
        <VneidBhytPanel
          profile={profile}
          bhytVisits={bhytVisits}
          onOpenVneidLogin={onOpenVneidLogin}
          onApplyVisitToTracker={onApplyVisitToTracker}
          onAddBhytVisit={onAddBhytVisit}
        />
      )}

      {recordsSubTab === 'history' && (
        <ClinicalAnalyticsView
          records={vitals}
          meals={meals}
          onDeleteRecord={onDeleteVitalRecord}
          onResetSampleData={onResetSampleData}
          onOpenLogModal={onOpenLogModal}
        />
      )}

      {recordsSubTab === 'devices' && (
        <ConnectedEcosystemPanel
          user={cloudUser}
          hasCalendarToken={hasCalendarToken}
          onAuthSuccess={onAuthSuccess}
          onSignOut={onSignOut}
          profile={profile}
          waterIntakeMl={waterIntakeMl}
          vitals={vitals}
          meals={meals}
          workouts={workouts}
          medications={medications}
          onRecordBleVital={onAddVitalRecord}
        />
      )}
    </div>
  );
};

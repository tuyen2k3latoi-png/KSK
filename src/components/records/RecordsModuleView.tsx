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
      <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChangeRecordsSubTab('bhyt')}
          data-testid="records-subtab-bhyt"
          className={`flex-1 min-w-[200px] min-h-[42px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            recordsSubTab === 'bhyt'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileHeart className="w-4 h-4 shrink-0" />
          <span>1. Thẻ BHYT &amp; Bệnh án Đã Khám ({bhytVisits.length})</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeRecordsSubTab('history')}
          data-testid="records-subtab-history"
          className={`flex-1 min-w-[200px] min-h-[42px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            recordsSubTab === 'history'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          <span>2. Nhật ký Đo &amp; Tải File Lưu trữ (CSV/JSON)</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeRecordsSubTab('devices')}
          data-testid="records-subtab-devices"
          className={`flex-1 min-w-[200px] min-h-[42px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            recordsSubTab === 'devices'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Bluetooth className="w-4 h-4 shrink-0" />
          <span>3. Máy đo Bluetooth &amp; Lịch Tái khám</span>
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

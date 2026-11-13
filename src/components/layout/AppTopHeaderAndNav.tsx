import React, { useState } from 'react';
import { ChevronDown, HeartPulse, Lock, PhoneCall } from 'lucide-react';
import { UserMedicalProfile } from '../../types/health';
import { FontSizeMode, PrivacyConsentRecord } from '../../utils/storage';
import { ProfileSettingsMenu } from './ProfileSettingsMenu';

export { BottomNav as AppMobileBottomNav, DesktopSidebarNav, FloatingLogVitalFab } from '../ui/BottomNav';

export type ActiveModule = 'dashboard' | 'nutrition' | 'medications' | 'records' | 'guide';
export type RecordsSubTab = 'bhyt' | 'history' | 'devices';

export const Nd13PrivacyConsentBanner: React.FC<{
  nd13Consent: PrivacyConsentRecord | null;
  onAcceptConsent: () => void;
  onOpenPrivacyDetails: () => void;
}> = ({ nd13Consent, onAcceptConsent, onOpenPrivacyDetails }) => {
  if (nd13Consent?.accepted) return null;

  return (
    <div
      role="region"
      aria-label="Xác nhận bảo mật dữ liệu sức khỏe"
      data-testid="nd13-privacy-consent-modal"
      className="bg-amber-50/95 border-b border-amber-300/80 px-3.5 sm:px-6 py-2.5 text-sm text-[#1F2937]"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Lock className="w-4 h-4 text-[#0F766E] shrink-0" />
          <p className="text-sm text-stone-800">
            <strong>Bảo mật:</strong> Dữ liệu lưu an toàn trên máy của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onAcceptConsent}
            data-testid="accept-nd13-consent-btn"
            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold cursor-pointer whitespace-nowrap transition-colors"
          >
            Đồng ý
          </button>
          <button
            type="button"
            onClick={onOpenPrivacyDetails}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-[#1F2937] text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors"
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  );
};

interface AppTopHeaderProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  onOpenLogModal: () => void;
  profile: UserMedicalProfile;
  isDemoMode: boolean;
  fontSizeMode: FontSizeMode;
  onChangeFontSizeMode: (mode: FontSizeMode) => void;
  bhytVisitsCount: number;
  onOpenBhytRecords: () => void;
  onOpenPrivacySettings: () => void;
  onSwitchProfile: () => void;
  onOpenEmergencyCall?: () => void;
  isEmergencyAlarming?: boolean;
  isMinimalMode?: boolean;
  onToggleMinimalMode?: () => void;
  isVoiceFeedbackEnabled?: boolean;
  onToggleVoiceFeedback?: () => void;
  onTestVoiceFeedback?: () => void;
}

export const AppTopHeader: React.FC<AppTopHeaderProps> = ({
  onSelectModule,
  profile,
  isDemoMode,
  fontSizeMode,
  onChangeFontSizeMode,
  bhytVisitsCount,
  onOpenBhytRecords,
  onOpenPrivacySettings,
  onSwitchProfile,
  onOpenEmergencyCall,
  isEmergencyAlarming = false,
  isMinimalMode = false,
  onToggleMinimalMode = () => {},
  isVoiceFeedbackEnabled = true,
  onToggleVoiceFeedback = () => {},
  onTestVoiceFeedback = () => {},
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const initials = (profile.fullName || 'VP')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/85 pt-safe shadow-[0_2px_12px_rgba(11,95,87,0.05)]">
      {isDemoMode && (
        <div
          data-testid="demo-account-top-banner"
          role="status"
          className="w-full bg-amber-100/95 border-b border-[#F59E0B]/45 px-3.5 sm:px-6 py-1 text-sm text-amber-950 flex items-center justify-between gap-2"
        >
          <span className="font-semibold truncate">
            Hồ sơ dùng thử <strong>DEMO</strong>
          </span>
          <button
            type="button"
            onClick={onSwitchProfile}
            className="min-h-[34px] px-3 py-1 rounded-xl bg-white hover:bg-amber-50 border border-amber-400 text-xs sm:text-sm font-bold text-[#0B5F57] cursor-pointer shrink-0 transition-colors"
          >
            Đăng nhập thật
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onSelectModule('dashboard')}
          className="flex items-center gap-2 sm:gap-2.5 text-left min-h-[48px] min-w-0 rounded-2xl pr-1 sm:pr-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:bg-[#0B5F57] transition-colors">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#0B5F57] truncate">
                VitaPulse
              </span>
              {isDemoMode ? (
                <span data-testid="header-demo-badge" className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold shrink-0">
                  DEMO
                </span>
              ) : (
                <span data-testid="header-personal-badge" className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-[#0F766E]/10 text-[#0B5F57] text-xs font-bold shrink-0">
                  Của tôi
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-[#1F2937] truncate max-w-[140px] sm:max-w-[260px]">
              {profile.fullName}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenEmergencyCall && (
            <button
              type="button"
              onClick={onOpenEmergencyCall}
              aria-label="Gọi khẩn cấp bác sĩ hoặc người thân"
              data-testid="header-emergency-call-btn"
              className={`min-h-[48px] px-2.5 sm:px-3.5 py-2 rounded-2xl border text-sm font-extrabold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                isEmergencyAlarming
                  ? 'bg-[#DC2626] hover:bg-red-700 border-red-700 text-white shadow-sm'
                  : 'bg-red-50 hover:bg-red-100 border-red-200 text-[#DC2626]'
              }`}
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span className="min-[430px]:hidden">Khẩn cấp</span>
              <span className="hidden min-[430px]:inline">Gọi khẩn cấp</span>
            </button>
          )}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-expanded={isMenuOpen}
              aria-label="Mở menu Hồ sơ và Cài đặt"
              data-testid="profile-menu-btn"
              className="min-h-[48px] pl-1.5 sm:pl-2 pr-2.5 sm:pr-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#0F766E]/10 border border-stone-300/90 flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer"
            >
              <span className="w-9 h-9 rounded-full bg-[#0F766E] text-white text-sm font-extrabold flex items-center justify-center shrink-0">
                {initials}
              </span>
              <span className="text-sm font-bold text-[#1F2937] hidden sm:inline">
                Tài khoản
              </span>
              <ChevronDown className={`w-4 h-4 text-stone-600 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMenuOpen && (
              <ProfileSettingsMenu
                profile={profile}
                initials={initials}
                fontSizeMode={fontSizeMode}
                onChangeFontSizeMode={onChangeFontSizeMode}
                isMinimalMode={isMinimalMode}
                onToggleMinimalMode={onToggleMinimalMode}
                isVoiceFeedbackEnabled={isVoiceFeedbackEnabled}
                onToggleVoiceFeedback={onToggleVoiceFeedback}
                onTestVoiceFeedback={onTestVoiceFeedback}
                bhytVisitsCount={bhytVisitsCount}
                onOpenBhytRecords={onOpenBhytRecords}
                onSelectModule={onSelectModule}
                onOpenPrivacySettings={onOpenPrivacySettings}
                onSwitchProfile={onSwitchProfile}
                onCloseMenu={() => setIsMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export const AppFooter: React.FC<{
  onOpenComplianceModal: () => void;
  onNavigateGuide: () => void;
  onResetSampleData: () => void;
}> = ({ onOpenComplianceModal, onNavigateGuide, onResetSampleData }) => (
  <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-6 text-sm text-stone-600 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200/80 mt-6">
    <div className="text-center sm:text-left font-medium">
      VitaPulse — Sổ theo dõi sức khỏe gia đình (Thông tin tham khảo, không thay thế bác sĩ)
    </div>
    <div className="flex flex-wrap items-center justify-center gap-4">
      <button type="button" data-testid="footer-open-compliance-btn" onClick={onOpenComplianceModal} className="text-[#0F766E] hover:text-[#0B5F57] font-bold underline underline-offset-4 cursor-pointer">
        Quyền riêng tư &amp; Miễn trừ y khoa
      </button>
      <button type="button" onClick={onNavigateGuide} className="hover:text-[#1F2937] font-semibold underline underline-offset-4 cursor-pointer">
        Hướng dẫn sử dụng
      </button>
      <button type="button" onClick={onResetSampleData} className="hover:text-[#1F2937] font-semibold underline underline-offset-4 cursor-pointer">
        Khôi phục dữ liệu mẫu
      </button>
    </div>
  </footer>
);

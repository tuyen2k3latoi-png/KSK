import React, { useState } from 'react';
import { Bell, ChevronDown, FileHeart, HeartPulse, Lock, LogOut, ShieldCheck, Type } from 'lucide-react';
import { UserMedicalProfile } from '../../types/health';
import { FontSizeMode, PrivacyConsentRecord } from '../../utils/storage';
import { PWAInstallButton } from '../PWAInstallButton';

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
      aria-label="Xác nhận đồng ý bảo mật dữ liệu sức khỏe theo Nghị định 13/2023/NĐ-CP"
      data-testid="nd13-privacy-consent-modal"
      className="bg-amber-50/95 border-b border-amber-300/80 px-4 sm:px-6 py-3.5 text-sm text-[#1F2937]"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-950 text-base">
            <Lock className="w-5 h-5 text-[#0F766E] shrink-0" />
            <span>Cam kết Bảo mật Sổ Sức khỏe Cá nhân (Nghị định 13/2023/NĐ-CP)</span>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">
            Dữ liệu huyết áp, đường huyết, đơn thuốc và mã thẻ BHYT được lưu an toàn trên điện thoại của bạn và chỉ sao lưu lên đám mây riêng tư khi bạn đăng nhập. Bạn có toàn quyền tải về hoặc xóa dữ liệu bất cứ lúc nào tại mục <strong>Quyền riêng tư</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onAcceptConsent}
            data-testid="accept-nd13-consent-btn"
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-base font-bold cursor-pointer whitespace-nowrap shadow-xs transition-colors"
          >
            Tôi đã hiểu và đồng ý
          </button>
          <button
            type="button"
            onClick={onOpenPrivacyDetails}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-300 text-[#1F2937] text-sm font-bold cursor-pointer whitespace-nowrap transition-colors"
          >
            Xem chi tiết quyền riêng tư
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
          className="w-full bg-amber-100/95 border-b border-[#F59E0B]/45 px-3.5 sm:px-6 py-1.5 text-sm text-amber-950 flex flex-wrap items-center justify-between gap-2"
        >
          <span className="font-semibold">
            Đang xem <strong>Hồ sơ dùng thử (DEMO)</strong> — Dữ liệu chưa lưu lên đám mây
          </span>
          <button
            type="button"
            onClick={onSwitchProfile}
            className="min-h-[36px] px-3 py-1 rounded-xl bg-white hover:bg-amber-50 border border-amber-400 text-sm font-bold text-[#0B5F57] cursor-pointer transition-colors"
          >
            Đăng nhập thật
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelectModule('dashboard')}
          className="flex items-center gap-2.5 text-left min-h-[48px] rounded-2xl pr-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:bg-[#0B5F57] transition-colors">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#0B5F57]">
                VitaPulse
              </span>
              {isDemoMode ? (
                <span data-testid="header-demo-badge" className="px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold">
                  DEMO
                </span>
              ) : (
                <span data-testid="header-personal-badge" className="px-2 py-0.5 rounded-lg bg-[#0F766E]/10 text-[#0B5F57] text-xs font-bold">
                  Của tôi
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-[#1F2937] truncate max-w-[180px] sm:max-w-[260px]">
              {profile.fullName}
            </p>
          </div>
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-label="Mở menu Hồ sơ và Cài đặt"
            data-testid="profile-menu-btn"
            className="min-h-[48px] pl-2 pr-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#0F766E]/10 border border-stone-300/90 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="w-9 h-9 rounded-full bg-[#0F766E] text-white text-sm font-extrabold flex items-center justify-center shrink-0">
              {initials}
            </span>
            <span className="text-sm font-bold text-[#1F2937] hidden min-[380px]:inline">
              Tài khoản
            </span>
            <ChevronDown className={`w-4 h-4 text-stone-600 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <div
              data-testid="profile-menu-dropdown"
              className="absolute right-0 mt-2 z-50 w-[300px] sm:w-[330px] rounded-[20px] bg-white border border-stone-200 shadow-[0_16px_40px_rgba(11,95,87,0.18)] p-3.5 space-y-3"
            >
              <div className="pb-2.5 border-b border-stone-100 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0F766E]/12 text-[#0B5F57] font-extrabold text-base flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-[#1F2937] truncate">{profile.fullName}</p>
                  <p className="text-sm text-stone-600">{2026 - profile.birthYear} tuổi · Nhóm máu {profile.bloodType}</p>
                </div>
              </div>

              <div data-testid="font-size-switcher" className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#1F2937]">
                  <Type className="w-4 h-4 text-[#0F766E] shrink-0" />
                  <span>Cỡ chữ hiển thị</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { id: 'normal', label: 'Vừa' },
                    { id: 'large', label: 'Lớn' },
                    { id: 'xlarge', label: 'Rất lớn' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeFontSizeMode(opt.id)}
                      data-testid={`font-size-${opt.id}-btn`}
                      aria-pressed={fontSizeMode === opt.id}
                      className={`min-h-[44px] px-2 py-1.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                        fontSizeMode === opt.id
                          ? 'bg-[#0F766E] text-white shadow-2xs'
                          : 'bg-white text-[#1F2937] border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => { onOpenBhytRecords(); setIsMenuOpen(false); }}
                  data-testid="quick-open-bhyt-btn"
                  className="w-full min-h-[48px] px-3 py-2 rounded-2xl text-left text-base font-semibold text-[#1F2937] hover:bg-[#FAF7F2] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileHeart className="w-5 h-5 text-[#0F766E] shrink-0" />
                  <span>Hồ sơ &amp; Sổ BHYT ({bhytVisitsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onSelectModule('medications'); setIsMenuOpen(false); }}
                  className="w-full min-h-[48px] px-3 py-2 rounded-2xl text-left text-base font-semibold text-[#1F2937] hover:bg-[#FAF7F2] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Bell className="w-5 h-5 text-[#0F766E] shrink-0" />
                  <span>Cài đặt thông báo nhắc thuốc</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenPrivacySettings(); setIsMenuOpen(false); }}
                  data-testid="header-open-privacy-settings-btn"
                  className="w-full min-h-[48px] px-3 py-2 rounded-2xl text-left text-base font-semibold text-[#1F2937] hover:bg-[#FAF7F2] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0" />
                  <span>Quyền riêng tư &amp; Dữ liệu</span>
                </button>
                <div className="px-1 py-1">
                  <PWAInstallButton compact />
                </div>
                <div className="pt-1.5 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); onSwitchProfile(); }}
                    data-testid="switch-account-logout-btn"
                    className="w-full min-h-[48px] px-3 py-2 rounded-2xl text-left text-base font-bold text-[#DC2626] hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-5 h-5 text-[#DC2626] shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

interface AppFooterProps {
  onOpenComplianceModal: () => void;
  onNavigateGuide: () => void;
  onResetSampleData: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  onOpenComplianceModal,
  onNavigateGuide,
  onResetSampleData,
}) => (
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

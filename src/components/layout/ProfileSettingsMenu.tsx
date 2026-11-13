import React from 'react';
import { Bell, Eye, FileHeart, LogOut, ShieldCheck, Type, Volume2 } from 'lucide-react';
import { UserMedicalProfile } from '../../types/health';
import { FontSizeMode } from '../../utils/storage';
import { ActiveModule } from './AppTopHeaderAndNav';
import { PWAInstallButton } from '../PWAInstallButton';

interface ProfileSettingsMenuProps {
  profile: UserMedicalProfile;
  initials: string;
  fontSizeMode: FontSizeMode;
  onChangeFontSizeMode: (mode: FontSizeMode) => void;
  isMinimalMode: boolean;
  onToggleMinimalMode: () => void;
  isVoiceFeedbackEnabled: boolean;
  onToggleVoiceFeedback: () => void;
  onTestVoiceFeedback: () => void;
  bhytVisitsCount: number;
  onOpenBhytRecords: () => void;
  onSelectModule: (module: ActiveModule) => void;
  onOpenPrivacySettings: () => void;
  onSwitchProfile: () => void;
  onCloseMenu: () => void;
}

export const ProfileSettingsMenu: React.FC<ProfileSettingsMenuProps> = ({
  profile,
  initials,
  fontSizeMode,
  onChangeFontSizeMode,
  isMinimalMode,
  onToggleMinimalMode,
  isVoiceFeedbackEnabled,
  onToggleVoiceFeedback,
  onTestVoiceFeedback,
  bhytVisitsCount,
  onOpenBhytRecords,
  onSelectModule,
  onOpenPrivacySettings,
  onSwitchProfile,
  onCloseMenu,
}) => (
  <div
    data-testid="profile-menu-dropdown"
    className="absolute right-0 mt-2 z-50 w-[308px] sm:w-[340px] rounded-[20px] bg-white border border-stone-200 shadow-[0_16px_40px_rgba(11,95,87,0.18)] p-3.5 space-y-3"
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

    {/* Chế độ xem tối giản cho người cao tuổi */}
    <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200/85 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 text-[#0F766E] shrink-0" />
          <span className="text-sm font-extrabold text-[#1F2937]">Chế độ xem tối giản</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isMinimalMode}
          aria-label="Bật hoặc tắt Chế độ xem tối giản"
          data-testid="minimal-mode-switch"
          onClick={() => {
            onToggleMinimalMode();
            onCloseMenu();
          }}
          className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isMinimalMode
              ? 'bg-[#0F766E] text-white shadow-2xs'
              : 'bg-white text-[#1F2937] border border-stone-300 hover:bg-stone-50'
          }`}
        >
          {isMinimalMode ? 'Đang bật' : 'Đang tắt'}
        </button>
      </div>
      <p className="text-xs text-stone-600 leading-snug">
        Chỉ giữ lại Huyết áp, Thuốc hôm nay &amp; Gọi khẩn cấp với nút bấm cỡ lớn.
      </p>
    </div>

    {/* Phản hồi giọng nói xác nhận */}
    <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200/85 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Volume2 className="w-4 h-4 text-[#0F766E] shrink-0" />
          <span className="text-sm font-extrabold text-[#1F2937]">Giọng nói xác nhận</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isVoiceFeedbackEnabled}
          aria-label="Bật hoặc tắt Giọng nói xác nhận"
          data-testid="voice-feedback-switch"
          onClick={onToggleVoiceFeedback}
          className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isVoiceFeedbackEnabled
              ? 'bg-[#0F766E] text-white shadow-2xs'
              : 'bg-white text-[#1F2937] border border-stone-300 hover:bg-stone-50'
          }`}
        >
          {isVoiceFeedbackEnabled ? 'Đang bật' : 'Đang tắt'}
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-stone-600 leading-snug">
          Đọc to xác nhận khi lưu chỉ số hoặc uống thuốc.
        </p>
        {isVoiceFeedbackEnabled && (
          <button
            type="button"
            onClick={onTestVoiceFeedback}
            data-testid="test-voice-feedback-btn"
            className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white hover:bg-stone-50 border border-stone-300 text-xs font-bold text-[#0B5F57] cursor-pointer whitespace-nowrap shrink-0"
          >
            Nghe thử
          </button>
        )}
      </div>
    </div>

    {/* Cỡ chữ hiển thị */}
    <div data-testid="font-size-switcher" className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-stone-200/80 space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-bold text-[#1F2937]">
        <Type className="w-4 h-4 text-[#0F766E] shrink-0" />
        <span>Cỡ chữ hiển thị</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {([{ id: 'normal', label: 'Vừa' }, { id: 'large', label: 'Lớn' }, { id: 'xlarge', label: 'Rất lớn' }] as const).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChangeFontSizeMode(opt.id)}
            data-testid={`font-size-${opt.id}-btn`}
            aria-pressed={fontSizeMode === opt.id}
            className={`min-h-[44px] px-2 py-1.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              fontSizeMode === opt.id ? 'bg-[#0F766E] text-white shadow-2xs' : 'bg-white text-[#1F2937] border border-stone-200 hover:bg-stone-50'
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
        onClick={() => { onOpenBhytRecords(); onCloseMenu(); }}
        data-testid="quick-open-bhyt-btn"
        className="w-full min-h-[48px] px-3 py-2 rounded-2xl text-left text-base font-semibold text-[#1F2937] hover:bg-[#FAF7F2] flex items-center gap-2.5 transition-colors cursor-pointer"
      >
        <FileHeart className="w-5 h-5 text-[#0F766E] shrink-0" />
        <span>Hồ sơ &amp; Sổ BHYT ({bhytVisitsCount})</span>
      </button>
      <button
        type="button"
        onClick={() => { onSelectModule('medications'); onCloseMenu(); }}
        className="w-full min-h-[48px] px-3 py-2 rounded-2xl text-left text-base font-semibold text-[#1F2937] hover:bg-[#FAF7F2] flex items-center gap-2.5 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5 text-[#0F766E] shrink-0" />
        <span>Cài đặt thông báo nhắc thuốc</span>
      </button>
      <button
        type="button"
        onClick={() => { onOpenPrivacySettings(); onCloseMenu(); }}
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
          onClick={() => { onCloseMenu(); onSwitchProfile(); }}
          data-testid="switch-account-logout-btn"
          className="w-full min-h-[48px] px-3 py-2 rounded-2xl text-left text-base font-bold text-[#DC2626] hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-[#DC2626] shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  </div>
);

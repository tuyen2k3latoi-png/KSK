import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  Eye,
  EyeOff,
  FileHeart,
  ShieldCheck,
} from 'lucide-react';
import { UserMedicalProfile } from '../../types/health';
import { Card } from '../ui/Primitives';

interface PatientIdentityBarProps {
  profile: UserMedicalProfile;
  isDemoMode?: boolean;
  displayedHeaderBhyt: string;
  showHeaderBhytFull: boolean;
  onToggleShowHeaderBhytFull: () => void;
  bhytVisitsCount: number;
  onOpenBhytRecords: () => void;
}

/**
 * Thẻ hồ sơ rút gọn (đặt ở cuối trang Sức khỏe, nhấn để mở chi tiết):
 * - Avatar chữ cái, họ tên, tuổi, nhóm máu
 * - Chip bệnh lý (hiển thị tối đa 2 chip + "+N")
 * - Mã BHYT đã che kèm nút mắt (không dùng font monospace)
 */
export const PatientIdentityBar: React.FC<PatientIdentityBarProps> = ({
  profile,
  displayedHeaderBhyt,
  showHeaderBhytFull,
  onToggleShowHeaderBhytFull,
  bhytVisitsCount,
  onOpenBhytRecords,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const initials = (profile.fullName || 'VP')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const visibleConditions = isExpanded
    ? profile.chronicConditions
    : profile.chronicConditions.slice(0, 2);
  const hiddenConditionsCount = Math.max(0, profile.chronicConditions.length - 2);

  return (
    <Card
      testId="compact-profile-card"
      ariaLabel="Thẻ hồ sơ sức khỏe rút gọn"
      className="space-y-3.5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Avatar chữ cái + Họ tên, tuổi, nhóm máu */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#0F766E] text-white text-lg font-extrabold flex items-center justify-center shrink-0 shadow-xs">
            {initials}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <strong
                data-testid="active-patient-name"
                className="text-lg font-bold text-[#1F2937] break-words"
              >
                {profile.fullName} ({2026 - profile.birthYear} tuổi)
              </strong>
              <span className="px-2.5 py-0.5 rounded-xl bg-[#FAF7F2] border border-stone-200 text-sm font-bold text-[#0B5F57]">
                Nhóm máu {profile.bloodType}
              </span>
            </div>

            {/* Mã thẻ BHYT đã che kèm nút mắt */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-stone-700">
              <span className="inline-flex items-center gap-1.5 font-bold text-[#0B5F57]">
                <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
                <span data-testid="header-bhyt-code" className="tabular-nums">
                  Mã BHYT: {displayedHeaderBhyt}
                </span>
              </span>
              <button
                type="button"
                onClick={onToggleShowHeaderBhytFull}
                data-testid="header-toggle-bhyt-mask-btn"
                aria-label={showHeaderBhytFull ? 'Ẩn mã thẻ BHYT' : 'Hiện đầy đủ mã thẻ BHYT'}
                className="min-h-[38px] px-2.5 py-1 rounded-xl bg-[#FAF7F2] hover:bg-[#0F766E]/10 border border-stone-300 text-sm font-bold text-[#0B5F57] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {showHeaderBhytFull ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Ẩn mã</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Hiện mã</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Nút nhấn mở chi tiết */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          data-testid="toggle-profile-card-details-btn"
          className="min-h-[48px] px-4 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-stone-100 border border-stone-200/90 text-sm font-bold text-[#1F2937] inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
        >
          <span>{isExpanded ? 'Thu gọn hồ sơ' : 'Chi tiết hồ sơ'}</span>
          <ChevronDown
            className={`w-4 h-4 text-stone-600 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Chip bệnh lý (tối đa 2 chip + "+N") */}
      <div className="pt-2.5 border-t border-stone-100 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-stone-600">Bệnh lý theo dõi:</span>
        {visibleConditions.map((cond) => (
          <span
            key={cond}
            data-testid="header-condition-tag"
            className="px-3 py-1 rounded-xl bg-amber-50 border border-[#F59E0B]/40 text-amber-950 text-sm font-bold break-words"
          >
            {cond}
          </span>
        ))}
        {!isExpanded && hiddenConditionsCount > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-sm font-bold text-[#1F2937] cursor-pointer"
          >
            +{hiddenConditionsCount}
          </button>
        )}
      </div>

      {/* Phần mở rộng chi tiết khi nhấn vào */}
      {isExpanded && (
        <div className="pt-3 border-t border-stone-100 space-y-3 text-sm text-stone-700">
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
            <span>
              Nơi đăng ký khám chữa bệnh ban đầu:{' '}
              <strong className="text-[#1F2937]">{profile.hospitalName}</strong>
            </span>
          </div>
          <p className="text-stone-600">
            Mã thẻ BHYT do bạn tự lưu để tiện tra cứu khi đi khám — ứng dụng độc lập, không kết nối trực tiếp cơ quan BHXH hay VNeID.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenBhytRecords}
              className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <FileHeart className="w-4 h-4 shrink-0" />
              <span>Mở Sổ BHYT &amp; Lịch sử khám ({bhytVisitsCount} lần)</span>
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

import React, { useState } from 'react';
import { HelpCircle, ShieldCheck, X } from 'lucide-react';

interface LoginCareHeroArtworkProps {
  className?: string;
}

/**
 * Hình nền toàn màn hình hiển thị bác sĩ nữ người Việt mặc áo blouse trắng, đeo ống nghe,
 * ân cần đo huyết áp cho cụ ông ~70 tuổi (`/images/login-care.jpg`).
 * - Ưu tiên hiển thị rõ nét khuôn mặt và cử chỉ chăm sóc ở khu vực phía trên - giữa màn hình,
 *   và phần thân/tay đo huyết áp ngay phía sau tấm kính mờ (Frosted Glass) của thẻ đăng nhập.
 * - Phần đỉnh phủ lớp gradient xanh ngọc đậm (#0B5F57) chuyển sang xanh ngọc (#0F766E) rồi trong suốt,
 *   hòa trộn tự nhiên vào ảnh mà không làm tối hay mờ khuôn mặt.
 */
export const LoginCareHeroArtwork: React.FC<LoginCareHeroArtworkProps> = ({
  className = 'relative w-full h-full',
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`overflow-hidden select-none bg-[#0B5F57] ${className}`}>
      {!imageError ? (
        <>
          <img
            src="/images/login-care.jpg"
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-bottom scale-105 blur-[3px] brightness-95"
          />
          <img
            src="/images/login-care.jpg"
            alt="Bác sĩ nữ người Việt mặc áo blouse trắng đang ân cần đo huyết áp cho cụ ông trong không gian gia đình ấm áp"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            data-testid="login-care-hero-img"
            className="absolute inset-x-0 -top-[44px] w-full h-[640px] object-cover object-top [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]"
          />
        </>
      ) : (
        <svg
          viewBox="0 0 430 932"
          role="img"
          aria-label="Hình minh họa bác sĩ nữ đang đo huyết áp cho cụ ông Việt Nam"
          data-testid="login-care-fallback-svg"
          className="absolute inset-0 w-full h-full object-cover object-top bg-[#FAF7F2]"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="vpCareSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B5F57" />
              <stop offset="22%" stopColor="#0F766E" />
              <stop offset="48%" stopColor="#D7ECE8" />
              <stop offset="100%" stopColor="#FAF7F2" />
            </linearGradient>
          </defs>
          <rect width="430" height="932" fill="url(#vpCareSky)" />
          <circle cx="80" cy="220" r="110" fill="#FFFFFF" fillOpacity="0.35" />
          {/* Bác sĩ nữ bên trái */}
          <circle cx="135" cy="235" r="38" fill="#FDE68A" />
          <path d="M95 225 C100 185, 170 185, 175 225 Z" fill="#173B3A" />
          <path d="M68 420 C68 310, 205 310, 205 420 Z" fill="#FFFFFF" stroke="#0F766E" strokeWidth="3" />
          {/* Cụ ông bên phải */}
          <circle cx="305" cy="240" r="38" fill="#FDE68A" />
          <path d="M268 228 C275 190, 335 190, 342 228 Z" fill="#E2E8F0" />
          <path d="M235 420 C235 315, 375 315, 375 420 Z" fill="#7FB8B0" />
          {/* Vòng bít huyết áp */}
          <rect x="232" y="345" width="44" height="30" rx="6" fill="#1E293B" />
        </svg>
      )}

      {/* Lớp phủ gradient xanh ngọc ở phần đỉnh (#0B5F57 -> #0F766E -> trong suốt) hòa trộn tự nhiên vào ảnh */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[135px] bg-gradient-to-b from-[#0B5F57] via-[#0F766E]/75 to-transparent pointer-events-none"
      />

      {/* Lớp phủ nhẹ ở sát mép dưới cùng để dòng chữ miễn trừ trách nhiệm luôn sắc nét */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[95px] bg-gradient-to-t from-[#0B5F57]/80 via-[#0B5F57]/35 to-transparent pointer-events-none"
      />
    </div>
  );
};

interface VneidComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoFillDemo?: () => void;
}

export const VneidComingSoonModal: React.FC<VneidComingSoonModalProps> = ({
  isOpen,
  onClose,
  onAutoFillDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vneid-coming-soon-title"
      data-testid="vneid-coming-soon-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-[26px] bg-[#FAF7F2] border border-white/80 shadow-2xl p-6 space-y-4 text-[#173B3A] vp-card-slide-up">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/15 border border-[#0F766E]/30 flex items-center justify-center text-[#0B5F57] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-block text-sm font-bold text-amber-800">
                Thông báo trung thực · Sắp ra mắt
              </span>
              <h3 id="vneid-coming-soon-title" className="text-lg font-bold text-[#173B3A]">
                Liên kết VNeID / BHXH
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thông báo VNeID"
            className="min-h-[48px] min-w-[48px] rounded-xl text-[#173B3A]/70 hover:bg-slate-200/70 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p
          data-testid="vneid-coming-soon-message"
          className="text-base text-[#173B3A] leading-relaxed bg-white p-4 rounded-2xl border border-slate-200"
        >
          Tính năng liên kết VNeID/BHXH đang được phát triển, hiện bạn có thể tự nhập mã thẻ BHYT trong Hồ sơ.
        </p>

        <p className="text-sm text-[#173B3A]/85 leading-relaxed">
          VitaPulse hoạt động độc lập để bảo vệ quyền riêng tư của gia đình bạn, hoàn toàn không tự ý truy cập hay giả lập kết nối cơ quan BHXH.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
          {onAutoFillDemo && (
            <button
              type="button"
              onClick={() => {
                onAutoFillDemo();
                onClose();
              }}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-semibold text-sm cursor-pointer transition-colors"
            >
              Điền tài khoản Demo để thử trước
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            data-testid="vneid-coming-soon-close-btn"
            className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F57] text-white font-bold text-base cursor-pointer transition-colors"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoFillDemo: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onAutoFillDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
      data-testid="forgot-password-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-[26px] bg-[#FAF7F2] border border-white/80 shadow-2xl p-6 space-y-4 text-[#173B3A] vp-card-slide-up">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/15 flex items-center justify-center text-[#0B5F57] shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 id="forgot-password-title" className="text-lg font-bold text-[#173B3A]">
              Hướng dẫn khi quên mật khẩu
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hướng dẫn quên mật khẩu"
            className="min-h-[48px] min-w-[48px] rounded-xl text-[#173B3A]/70 hover:bg-slate-200/70 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 text-base text-[#173B3A] leading-relaxed bg-white p-4 rounded-2xl border border-slate-200">
          <p>
            • Nếu bạn đang muốn xem thử ứng dụng: hãy dùng số điện thoại{' '}
            <strong className="font-mono-tabular">0123456789</strong> và mật khẩu{' '}
            <strong className="font-mono-tabular">demo@123</strong>.
          </p>
          <p>
            • Nếu bạn đã sao lưu qua Google: hãy bấm nút{' '}
            <strong>“Đăng nhập bằng Google”</strong> để mở lại sổ sức khỏe ngay mà không cần nhớ mật khẩu.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              onAutoFillDemo();
              onClose();
            }}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-semibold text-sm cursor-pointer transition-colors"
          >
            Điền tự động tài khoản Demo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F57] text-white font-bold text-base cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

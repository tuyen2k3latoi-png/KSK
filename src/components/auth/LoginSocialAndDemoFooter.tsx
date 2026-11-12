import React from 'react';
import { Eye, EyeOff, Lock, Phone, Shield } from 'lucide-react';

interface LoginFormAndActionsProps {
  phoneInput: string;
  setPhoneInput: (val: string) => void;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  errorMessage: string | null;
  demoAutofillHint: boolean;
  setDemoAutofillHint: (val: boolean) => void;
  isSubmitting: boolean;
  lockRemainingSec: number;
  isGoogleLoading: boolean;
  onLoginSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  onOpenVneidModal: () => void;
  onOpenForgotModal: () => void;
  onAutoFillDemo: () => void;
}

export const LoginSocialAndDemoFooter: React.FC<LoginFormAndActionsProps> = ({
  phoneInput,
  setPhoneInput,
  passwordInput,
  setPasswordInput,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  errorMessage,
  demoAutofillHint,
  setDemoAutofillHint,
  isSubmitting,
  lockRemainingSec,
  isGoogleLoading,
  onLoginSubmit,
  onGoogleSignIn,
  onOpenVneidModal,
  onOpenForgotModal,
  onAutoFillDemo,
}) => {
  return (
    <div className="space-y-2">
      <form onSubmit={onLoginSubmit} className="space-y-2" noValidate>
        {errorMessage && (
          <div
            role="alert"
            data-testid="login-error-alert"
            className="p-2.5 rounded-2xl bg-rose-50/95 border border-rose-300 text-xs sm:text-sm font-bold text-rose-900 shadow-xs"
          >
            {errorMessage}
          </div>
        )}
        {demoAutofillHint && !errorMessage && (
          <div
            data-testid="demo-autofill-notice"
            className="p-2 rounded-2xl bg-amber-50/95 border border-amber-300 text-xs sm:text-sm font-medium text-amber-950 shadow-xs"
          >
            Đã điền SĐT <strong>0123456789</strong> &amp; mật khẩu <strong>demo@123</strong>. Mời bạn bấm{' '}
            <strong>“Đăng nhập”</strong>!
          </div>
        )}

        <div>
          <label htmlFor="login-phone-input" className="block text-sm font-extrabold text-[#0B3B36] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] mb-0.5">
            Số điện thoại
          </label>
          <div className="relative flex items-center">
            <Phone className="w-4 h-4 text-[#0F766E] absolute left-3.5 pointer-events-none" />
            <input
              id="login-phone-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value);
                setDemoAutofillHint(false);
              }}
              placeholder="0912345678 (10 số)"
              data-testid="login-phone-input"
              className="w-full min-h-[42px] pl-10 pr-3.5 py-1.5 text-sm font-semibold tabular-nums bg-white/58 focus:bg-white/88 border border-white/85 focus:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/35 rounded-2xl text-[#0B3B36] placeholder:text-[#173B3A]/65 shadow-2xs outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password-input" className="block text-sm font-extrabold text-[#0B3B36] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] mb-0.5">
            Mật khẩu
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-[#0F766E] absolute left-3.5 pointer-events-none" />
            <input
              id="login-password-input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setDemoAutofillHint(false);
              }}
              placeholder="Nhập mật khẩu"
              data-testid="login-password-input"
              className="w-full min-h-[42px] pl-10 pr-11 py-1.5 text-sm font-semibold bg-white/58 focus:bg-white/88 border border-white/85 focus:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/35 rounded-2xl text-[#0B3B36] placeholder:text-[#173B3A]/65 shadow-2xs outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={showPassword}
              data-testid="toggle-password-visibility-btn"
              className="absolute right-1 min-h-[40px] min-w-[40px] flex items-center justify-center text-[#173B3A]/85 hover:text-[#0B5F57] rounded-xl cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="remember-login-checkbox"
            className="inline-flex items-center gap-2 min-h-[34px] text-xs font-bold text-[#0B3B36] drop-shadow-[0_1px_1px_rgba(255,255,255,0.75)] cursor-pointer select-none"
          >
            <input
              id="remember-login-checkbox"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-[#0F766E] rounded cursor-pointer shrink-0"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <button
            type="button"
            onClick={onOpenForgotModal}
            data-testid="forgot-password-link"
            className="min-h-[34px] px-1 text-xs font-extrabold text-[#0B5F57] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] underline hover:text-[#0F766E] cursor-pointer shrink-0"
          >
            Quên mật khẩu?
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || lockRemainingSec > 0}
          data-testid="login-submit-btn"
          className="w-full min-h-[46px] px-5 py-2 rounded-full bg-gradient-to-r from-[#0B5F57] to-[#0F766E] hover:from-[#094a44] hover:to-[#0B5F57] disabled:opacity-60 text-white text-base font-bold transition-all flex items-center justify-center cursor-pointer shadow-md"
        >
          {lockRemainingSec > 0
            ? `Tạm khóa (${lockRemainingSec}s)`
            : isSubmitting
              ? 'Đang đăng nhập...'
              : 'Đăng nhập'}
        </button>
      </form>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-white/65" />
        <span className="shrink-0 px-3 text-xs font-bold text-[#0B3B36] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">hoặc tiếp tục với</span>
        <div className="flex-grow border-t border-white/65" />
      </div>

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={isGoogleLoading}
          data-testid="welcome-google-login-btn"
          className="w-full min-h-[40px] px-3.5 py-1.5 rounded-full bg-white/62 hover:bg-white/88 border border-white/85 text-[#0B3B36] text-sm font-bold inline-flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
        >
          <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
            <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
          </svg>
          <span>{isGoogleLoading ? 'Đang mở Google...' : 'Đăng nhập bằng Google'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenVneidModal}
          data-testid="vneid-coming-soon-btn"
          className="w-full min-h-[40px] px-2.5 py-1.5 rounded-full bg-white/62 hover:bg-white/88 border border-white/85 text-[#0B3B36] text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
        >
          <Shield className="w-4 h-4 text-[#0F766E] shrink-0" />
          <span>Đăng nhập bằng VNeID / BHXH</span>
          <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/35 border border-[#F59E0B]/60 text-[#92400E] text-xs font-bold shrink-0">
            Sắp ra mắt
          </span>
        </button>
      </div>

      <div
        data-testid="quick-demo-box"
        className="pt-0.5 flex items-center justify-center gap-1 text-center whitespace-nowrap"
      >
        <span className="text-xs font-semibold text-[#173B3A]">Chưa có tài khoản?</span>
        <button
          type="button"
          onClick={onAutoFillDemo}
          data-testid="autofill-demo-btn"
          className="min-h-[28px] px-0.5 py-0.5 text-xs font-bold text-[#0B5F57] underline hover:text-[#0F766E] cursor-pointer"
        >
          Thử ngay tài khoản demo
        </button>
        <span
          data-testid="demo-pill-label"
          className="px-1.5 py-0.5 rounded-md bg-[#F59E0B] text-white text-xs font-extrabold tracking-wide shadow-2xs shrink-0"
        >
          DEMO
        </span>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Phone, User as UserIcon } from 'lucide-react';
import { CitizenHealthAccount } from '../../types/health';
import {
  evaluatePasswordStrength,
  registerWithPhoneFirebase,
  validateVietnamesePhone,
} from '../../services/authService';
import { PostRegisterProfileStep } from './PostRegisterProfileStep';

interface RegisterFormProps {
  onRegisterComplete: (account: CitizenHealthAccount) => void;
  onOpenComplianceModal?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegisterComplete,
  onOpenComplianceModal,
}) => {
  const [step, setStep] = useState<'register' | 'create-profile'>('register');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedConsent, setAgreedConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = evaluatePasswordStrength(password);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!fullName.trim()) return setErrorMsg('Vui lòng nhập họ và tên của bạn.');
    const phoneCheck = validateVietnamesePhone(phone);
    if (!phoneCheck.valid) return setErrorMsg(phoneCheck.error || 'Số điện thoại chưa hợp lệ.');
    if (!strength.valid) return setErrorMsg('Mật khẩu cần có tối thiểu 8 ký tự.');
    if (password !== confirmPassword)
      return setErrorMsg('Mật khẩu nhập lại chưa khớp. Vui lòng kiểm tra lại.');
    if (!agreedConsent)
      return setErrorMsg('Bạn cần đồng ý xử lý dữ liệu sức khỏe cá nhân để tạo tài khoản.');

    setIsSubmitting(true);
    try {
      const res = await registerWithPhoneFirebase({
        fullName: fullName.trim(),
        rawPhone: phoneCheck.normalizedPhone,
        password,
      });
      if (!res.success) return setErrorMsg(res.error || 'Không thể đăng ký lúc này.');
      setPassword('');
      setConfirmPassword('');
      setPhone(res.normalizedPhone);
      setStep('create-profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'create-profile') {
    return (
      <PostRegisterProfileStep
        fullName={fullName}
        phone={phone}
        onComplete={onRegisterComplete}
      />
    );
  }

  return (
    <form onSubmit={handleRegisterSubmit} data-testid="register-form" className="space-y-2.5" noValidate>
      {errorMsg && (
        <div
          role="alert"
          data-testid="register-error-alert"
          className="p-3 rounded-2xl bg-rose-50/95 border border-rose-300 text-sm font-bold text-rose-900 shadow-xs"
        >
          {errorMsg}
        </div>
      )}

      <div>
        <label htmlFor="register-fullname" className="block text-[15px] font-bold text-[#173B3A] mb-1">
          Họ và tên
        </label>
        <div className="relative flex items-center">
          <UserIcon className="w-5 h-5 text-[#0F766E] absolute left-3.5 pointer-events-none" />
          <input
            id="register-fullname"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ví dụ: Nguyễn Văn Hòa"
            data-testid="register-fullname-input"
            className="w-full min-h-[46px] pl-11 pr-3.5 py-2 text-base font-medium bg-white/75 focus:bg-white/92 border border-white/85 focus:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/35 rounded-2xl text-[#173B3A] placeholder:text-[#173B3A]/55 shadow-2xs outline-none transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor="register-phone" className="block text-[15px] font-bold text-[#173B3A] mb-1">
          Số điện thoại
        </label>
        <div className="relative flex items-center">
          <Phone className="w-5 h-5 text-[#0F766E] absolute left-3.5 pointer-events-none" />
          <input
            id="register-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678 (10 số)"
            data-testid="register-phone-input"
            className="w-full min-h-[46px] pl-11 pr-3.5 py-2 text-base font-medium tabular-nums bg-white/75 focus:bg-white/92 border border-white/85 focus:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/35 rounded-2xl text-[#173B3A] placeholder:text-[#173B3A]/55 shadow-2xs outline-none transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor="register-password" className="block text-[15px] font-bold text-[#173B3A] mb-1">
          Mật khẩu (tối thiểu 8 ký tự)
        </label>
        <div className="relative flex items-center">
          <Lock className="w-5 h-5 text-[#0F766E] absolute left-3.5 pointer-events-none" />
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu từ 8 ký tự"
            data-testid="register-password-input"
            className="w-full min-h-[46px] pl-11 pr-12 py-2 text-base font-medium bg-white/75 focus:bg-white/92 border border-white/85 focus:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/35 rounded-2xl text-[#173B3A] placeholder:text-[#173B3A]/55 shadow-2xs outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={showPassword}
            className="absolute right-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#173B3A]/80 hover:text-[#0B5F57] rounded-xl cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <div className="mt-1.5 space-y-1" data-testid="password-strength-meter">
          <div className="grid grid-cols-3 gap-1.5 h-1.5">
            {[1, 2, 3].map((lvl) => (
              <div
                key={lvl}
                className={`rounded-full transition-colors ${
                  strength.score >= lvl ? strength.barClass : 'bg-white/60'
                }`}
              />
            ))}
          </div>
          <p className={`text-sm font-semibold ${strength.textClass}`}>{strength.label}</p>
        </div>
      </div>

      <div>
        <label htmlFor="register-confirm-password" className="block text-[15px] font-bold text-[#173B3A] mb-1">
          Nhập lại mật khẩu
        </label>
        <div className="relative flex items-center">
          <Lock className="w-5 h-5 text-[#0F766E] absolute left-3.5 pointer-events-none" />
          <input
            id="register-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu vừa tạo"
            data-testid="register-confirm-password-input"
            className="w-full min-h-[46px] pl-11 pr-12 py-2 text-base font-medium bg-white/75 focus:bg-white/92 border border-white/85 focus:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/35 rounded-2xl text-[#173B3A] placeholder:text-[#173B3A]/55 shadow-2xs outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={showConfirmPassword ? 'Ẩn mật khẩu nhập lại' : 'Hiện mật khẩu nhập lại'}
            aria-pressed={showConfirmPassword}
            className="absolute right-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#173B3A]/80 hover:text-[#0B5F57] rounded-xl cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="p-2.5 rounded-2xl bg-white/70 border border-white/80">
        <label htmlFor="register-consent" className="flex items-start gap-2.5 cursor-pointer select-none min-h-[44px]">
          <input
            id="register-consent"
            type="checkbox"
            checked={agreedConsent}
            onChange={(e) => setAgreedConsent(e.target.checked)}
            data-testid="register-consent-checkbox"
            className="mt-1 w-5 h-5 accent-[#0F766E] rounded shrink-0 cursor-pointer"
          />
          <span className="text-sm font-medium text-[#173B3A] leading-snug">
            Tôi đồng ý xử lý dữ liệu sức khỏe cá nhân theo Nghị định 13/2023/NĐ-CP.{' '}
            {onOpenComplianceModal && (
              <button
                type="button"
                onClick={onOpenComplianceModal}
                className="font-bold text-[#0B5F57] underline hover:text-[#0F766E] cursor-pointer"
              >
                Xem giải thích quyền riêng tư
              </button>
            )}
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        data-testid="register-submit-btn"
        className="w-full min-h-[50px] h-[50px] px-5 rounded-full bg-gradient-to-r from-[#0B5F57] to-[#0F766E] hover:from-[#094a44] hover:to-[#0B5F57] disabled:opacity-60 text-white text-[18px] font-bold transition-all flex items-center justify-center cursor-pointer shadow-md"
      >
        <span>{isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}</span>
      </button>
    </form>
  );
};

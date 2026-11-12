import React, { useEffect, useState } from 'react';
import { HeartPulse } from 'lucide-react';
import { User } from 'firebase/auth';
import { CitizenHealthAccount } from '../types/health';
import { FontSizeMode } from '../utils/storage';
import { googleSignIn } from '../services/firebaseService';
import {
  defaultLoginRateLimiter,
  DEMO_PASSWORD,
  DEMO_PHONE,
  signInWithPhoneFirebase,
  validateVietnamesePhone,
  verifyDemoCredentials,
} from '../services/authService';
import { buildEmptyPersonalProfile } from '../utils/welcomeProfileBuilder';
import {
  ForgotPasswordModal,
  LoginCareHeroArtwork,
  VneidComingSoonModal,
} from './auth/LoginCareIllustration';
import { LoginSocialAndDemoFooter } from './auth/LoginSocialAndDemoFooter';
import { RegisterForm } from './auth/RegisterForm';

export interface LoginScreenProps {
  onLoginSuccess: (account: CitizenHealthAccount) => void;
  cloudUser?: User | null;
  onGoogleAuthSuccess?: (user: User, hasCalendarToken: boolean) => void;
  onOpenComplianceModal?: () => void;
  fontSizeMode?: FontSizeMode;
  onChangeFontSizeMode?: (mode: FontSizeMode) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGoogleAuthSuccess,
  onOpenComplianceModal,
  fontSizeMode = 'normal',
  onChangeFontSizeMode,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [demoAutofillHint, setDemoAutofillHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [lockRemainingSec, setLockRemainingSec] = useState(0);
  const [isVneidModalOpen, setIsVneidModalOpen] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  useEffect(() => {
    if (lockRemainingSec <= 0) return;
    const timer = window.setInterval(() => {
      const status = defaultLoginRateLimiter.getLockStatus();
      setLockRemainingSec(status.remainingSeconds);
      if (!status.locked) setErrorMessage(null);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockRemainingSec]);

  const handleAutoFillDemo = () => {
    setActiveTab('login');
    setPhoneInput(DEMO_PHONE);
    setPasswordInput(DEMO_PASSWORD);
    setErrorMessage(null);
    setDemoAutofillHint(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const lockStatus = defaultLoginRateLimiter.getLockStatus();
    if (lockStatus.locked) {
      setLockRemainingSec(lockStatus.remainingSeconds);
      return setErrorMessage(lockStatus.message || 'Tạm khóa đăng nhập do thử sai nhiều lần.');
    }

    const phoneCheck = validateVietnamesePhone(phoneInput);
    if (!phoneCheck.valid) return setErrorMessage(phoneCheck.error || 'Số điện thoại chưa hợp lệ.');
    if (!passwordInput) return setErrorMessage('Vui lòng nhập mật khẩu của bạn.');

    const demoCheck = verifyDemoCredentials(phoneCheck.normalizedPhone, passwordInput);
    if (demoCheck.isDemoMatch && demoCheck.account) {
      defaultLoginRateLimiter.reset();
      setPasswordInput('');
      return onLoginSuccess(demoCheck.account);
    }
    if (demoCheck.isDemoPhoneWithWrongPassword) {
      const fail = defaultLoginRateLimiter.recordFailure();
      if (fail.locked) setLockRemainingSec(fail.remainingSeconds);
      return setErrorMessage(fail.message || demoCheck.error || 'Số điện thoại hoặc mật khẩu chưa đúng.');
    }

    setIsSubmitting(true);
    try {
      const res = await signInWithPhoneFirebase(phoneCheck.normalizedPhone, passwordInput, rememberMe);
      if (!res.success) {
        const fail = defaultLoginRateLimiter.recordFailure();
        if (fail.locked) setLockRemainingSec(fail.remainingSeconds);
        return setErrorMessage(fail.message || res.error || 'Số điện thoại hoặc mật khẩu chưa đúng.');
      }
      defaultLoginRateLimiter.reset();
      setPasswordInput('');
      onLoginSuccess(
        buildEmptyPersonalProfile({
          fullNameInput: res.displayName || `Người dùng ${res.normalizedPhone}`,
          birthYearInput: '1966',
          genderInput: 'male',
          identifierInput: '',
          hospitalInput: 'Bệnh viện Đa khoa Khu vực',
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const res = await googleSignIn();
      if (onGoogleAuthSuccess) onGoogleAuthSuccess(res.user, Boolean(res.accessToken));
      onLoginSuccess(
        buildEmptyPersonalProfile({
          fullNameInput: res.user.displayName || 'Hồ sơ Google của tôi',
          birthYearInput: '1966',
          genderInput: 'male',
          identifierInput: '',
          hospitalInput: 'Bệnh viện Đa khoa Khu vực',
        })
      );
    } catch {
      setErrorMessage('Không thể mở cửa sổ đăng nhập Google lúc này. Bạn có thể dùng tài khoản Demo.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      data-testid="vneid-welcome-login-screen"
      className="relative min-h-dvh w-full overflow-x-hidden bg-[#0B5F57] text-[#173B3A] flex items-center justify-center sm:py-4 sm:px-4"
    >
      {/* Lớp nền môi trường toàn màn hình cho màn hình rộng (Desktop/Tablet) */}
      <div className="hidden sm:block pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img src="/images/login-care.jpg" alt="" aria-hidden="true" referrerPolicy="no-referrer" className="w-full h-full object-cover object-center scale-110 blur-2xl opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B5F57]/75 via-[#0F766E]/55 to-[#0B5F57]/80" />
      </div>

      {/* Khung thiết kế tỷ lệ điện thoại 9:19.5 hiển thị trọn vẹn bác sĩ & cụ ông phía sau tấm kính mờ */}
      <div className="relative z-10 w-full max-w-[420px] min-h-dvh sm:min-h-[820px] sm:rounded-[36px] overflow-hidden sm:shadow-[0_28px_70px_rgba(0,0,0,0.45)] sm:border sm:border-white/35 flex flex-col justify-between">
        <LoginCareHeroArtwork className="absolute inset-0 w-full h-full z-0" />

        <header className="relative z-10 w-full px-4 pt-2.5 pb-1 flex flex-col items-center gap-1.5">
          <div className="w-full flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0F766E] border border-white/40 flex items-center justify-center text-white shadow-md shrink-0">
              <HeartPulse className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="block font-extrabold text-[23px] tracking-tight text-white leading-none drop-shadow-xs">VitaPulse</span>
              <p className="text-[12.5px] font-medium text-white/95 leading-snug mt-0.5 drop-shadow-xs">Đồng hành cùng sức khỏe gia đình bạn</p>
            </div>
          </div>

          {onChangeFontSizeMode && (
            <div data-testid="welcome-font-size-switcher" role="group" aria-label="Chọn cỡ chữ hiển thị" className="inline-flex items-center gap-1 bg-white/65 backdrop-blur-md p-0.5 rounded-full border border-white/75 shadow-xs">
              {(['normal', 'large', 'xlarge'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChangeFontSizeMode(mode)}
                  data-testid={`welcome-font-size-${mode}-btn`}
                  aria-pressed={fontSizeMode === mode}
                  className={`min-h-[28px] px-3.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                    fontSizeMode === mode ? 'bg-white text-[#0B5F57] shadow-xs' : 'text-[#173B3A] hover:bg-white/40'
                  }`}
                >
                  {mode === 'normal' ? 'Vừa' : mode === 'large' ? 'Lớn' : 'Rất lớn'}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Khoảng mở ưu tiên hiển thị rõ nét khuôn mặt bác sĩ và cụ ông trước khi vào thẻ kính mờ */}
        <div aria-hidden="true" className="relative z-10 h-[172px] sm:h-[182px] shrink-0 pointer-events-none" />

        {/* Thẻ đăng nhập Frosted Glass / Glassmorphism trong trẻo (độ trong suốt 28%, backdrop-blur 4px) để nhìn rõ bác sĩ và cụ ông phía sau */}
        <main className="relative z-10 px-3.5 sm:px-4 pb-0.5 flex-1 flex flex-col justify-end">
          <div
            data-testid="login-glass-card"
            className="w-full bg-white/28 backdrop-blur-[4px] rounded-[26px] shadow-[0_20px_48px_-12px_rgba(11,95,87,0.32)] border border-white/80 p-3.5 sm:p-4 space-y-1.5 vp-card-slide-up"
          >
            <div className="space-y-0.5">
              <h1 className="text-[21px] font-extrabold text-[#0B3B36] drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)] tracking-tight leading-tight">
                Chào mừng trở lại
              </h1>
              <p className="text-[13.5px] font-semibold text-[#173B3A] drop-shadow-[0_1px_1px_rgba(255,255,255,0.75)]">
                Đăng nhập để xem sổ sức khỏe của bạn
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Chọn Đăng nhập hoặc Đăng ký"
              className="grid grid-cols-2 gap-1.5 p-1 rounded-full bg-white/42 border border-white/75"
            >
              {(['login', 'register'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setErrorMessage(null);
                  }}
                  data-testid={tab === 'login' ? 'tab-login-btn' : 'tab-register-btn'}
                  className={`min-h-[36px] px-4 py-1 rounded-full text-[14.5px] font-bold transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'text-[#173B3A] hover:bg-white/40'
                  }`}
                >
                  {tab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              ))}
            </div>

            {activeTab === 'login' ? (
              <LoginSocialAndDemoFooter
                phoneInput={phoneInput}
                setPhoneInput={setPhoneInput}
                passwordInput={passwordInput}
                setPasswordInput={setPasswordInput}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
                errorMessage={errorMessage}
                demoAutofillHint={demoAutofillHint}
                setDemoAutofillHint={setDemoAutofillHint}
                isSubmitting={isSubmitting}
                lockRemainingSec={lockRemainingSec}
                isGoogleLoading={isGoogleLoading}
                onLoginSubmit={handleLoginSubmit}
                onGoogleSignIn={handleGoogleSignIn}
                onOpenVneidModal={() => setIsVneidModalOpen(true)}
                onOpenForgotModal={() => setIsForgotModalOpen(true)}
                onAutoFillDemo={handleAutoFillDemo}
              />
            ) : (
              <RegisterForm onRegisterComplete={onLoginSuccess} onOpenComplianceModal={onOpenComplianceModal} />
            )}
          </div>
        </main>

        {/* Chân trang chứa thông tin miễn trừ trách nhiệm */}
        <footer className="relative z-10 px-4 pt-2 pb-3 text-center space-y-0.5">
          <p
            data-testid="bhyt-self-entry-disclaimer"
            className="text-[11.5px] font-medium text-white/95 leading-snug drop-shadow-xs"
          >
            VitaPulse là sổ theo dõi cá nhân độc lập, không đại diện cơ quan BHXH/VNeID và không thay thế chẩn đoán y khoa.
          </p>
          {onOpenComplianceModal && (
            <button
              type="button"
              onClick={onOpenComplianceModal}
              data-testid="welcome-open-compliance-btn"
              className="text-xs font-bold text-[#FAF7F2] underline hover:text-amber-200 cursor-pointer drop-shadow-xs"
            >
              Chính sách quyền riêng tư (NĐ 13/2023)
            </button>
          )}
        </footer>
      </div>

      <VneidComingSoonModal isOpen={isVneidModalOpen} onClose={() => setIsVneidModalOpen(false)} onAutoFillDemo={handleAutoFillDemo} />
      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} onAutoFillDemo={handleAutoFillDemo} />
    </div>
  );
};

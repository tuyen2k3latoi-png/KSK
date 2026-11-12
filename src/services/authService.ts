import { CITIZEN_VNEID_ACCOUNTS } from '../data/seedHealthData';
import { CitizenHealthAccount } from '../types/health';

export const DEMO_PHONE = '0123456789';
export const DEMO_PASSWORD = 'demo@123';
export const VIRTUAL_EMAIL_DOMAIN = 'vitapulse.app';

export interface PhoneValidationResult {
  valid: boolean;
  normalizedPhone: string;
  error?: string;
}

export interface PasswordStrengthResult {
  valid: boolean;
  score: 0 | 1 | 2 | 3;
  label: string;
  barClass: string;
  textClass: string;
}

export interface DemoAuthCheckResult {
  isDemoMatch: boolean;
  isDemoPhoneWithWrongPassword: boolean;
  account?: CitizenHealthAccount;
  error?: string;
}

export function normalizeVietnamesePhone(raw: string): string {
  const cleaned = String(raw || '').trim().replace(/[\s.\-()]/g, '');
  if (cleaned.startsWith('+84') && /^\+84\d{9}$/.test(cleaned)) {
    return `0${cleaned.slice(3)}`;
  }
  if (cleaned.startsWith('84') && /^84\d{9}$/.test(cleaned)) {
    return `0${cleaned.slice(2)}`;
  }
  return cleaned;
}

export function validateVietnamesePhone(raw: string): PhoneValidationResult {
  const normalizedPhone = normalizeVietnamesePhone(raw);
  if (!normalizedPhone) {
    return { valid: false, normalizedPhone: '', error: 'Vui lòng nhập số điện thoại của bạn.' };
  }
  if (!/^0\d{9}$/.test(normalizedPhone)) {
    return {
      valid: false,
      normalizedPhone,
      error: 'Số điện thoại cần gồm đúng 10 chữ số và bắt đầu bằng số 0 (ví dụ: 0912345678).',
    };
  }
  return { valid: true, normalizedPhone };
}

export function mapPhoneToVirtualEmail(rawPhone: string): string {
  const check = validateVietnamesePhone(rawPhone);
  if (!check.valid) throw new Error(check.error || 'Số điện thoại không hợp lệ.');
  return `${check.normalizedPhone}@${VIRTUAL_EMAIL_DOMAIN}`;
}

export function verifyDemoCredentials(rawPhone: string, password: string): DemoAuthCheckResult {
  const normalized = normalizeVietnamesePhone(rawPhone);
  if (normalized === DEMO_PHONE) {
    if (password === DEMO_PASSWORD) {
      const seedDemo = CITIZEN_VNEID_ACCOUNTS[0];
      const demoAccount: CitizenHealthAccount = {
        ...seedDemo,
        isDemo: true,
        profile: {
          ...seedDemo.profile,
          isDemo: true,
          bhytCard: { ...(seedDemo.profile.bhytCard || seedDemo.bhytCard), isDemo: true },
        },
        bhytCard: { ...seedDemo.bhytCard, isDemo: true },
      };
      return { isDemoMatch: true, isDemoPhoneWithWrongPassword: false, account: demoAccount };
    }
    return {
      isDemoMatch: false,
      isDemoPhoneWithWrongPassword: true,
      error: 'Số điện thoại hoặc mật khẩu chưa đúng. Với tài khoản dùng thử, mật khẩu là demo@123.',
    };
  }
  return { isDemoMatch: false, isDemoPhoneWithWrongPassword: false };
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const len = password.length;
  if (len === 0) {
    return { valid: false, score: 0, label: 'Tối thiểu 8 ký tự', barClass: 'bg-slate-200', textClass: 'text-slate-600' };
  }
  if (len < 8) {
    return {
      valid: false,
      score: 1,
      label: `Cần thêm ${8 - len} ký tự nữa (tối thiểu 8 ký tự)`,
      barClass: 'bg-rose-500',
      textClass: 'text-rose-700',
    };
  }
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialOrUpper = /[^a-zA-Z0-9]/.test(password) || /[A-Z]/.test(password);
  if (len >= 10 && hasLetters && hasNumbers && hasSpecialOrUpper) {
    return {
      valid: true,
      score: 3,
      label: 'Mật khẩu mạnh — An toàn tốt',
      barClass: 'bg-emerald-600',
      textClass: 'text-emerald-800',
    };
  }
  return {
    valid: true,
    score: 2,
    label: 'Độ mạnh đạt yêu cầu (nên có cả chữ và số)',
    barClass: 'bg-amber-500',
    textClass: 'text-amber-800',
  };
}

export function createLoginRateLimiter(maxAttempts = 5, lockDurationMs = 30_000) {
  let failedCount = 0;
  let lockedUntilMs = 0;
  return {
    getFailedCount: () => failedCount,
    getLockStatus(nowMs = Date.now()) {
      if (lockedUntilMs > nowMs) {
        const remainingSeconds = Math.max(1, Math.ceil((lockedUntilMs - nowMs) / 1000));
        return {
          locked: true,
          remainingSeconds,
          message: `Bạn đã nhập sai quá ${maxAttempts} lần. Vui lòng đợi ${remainingSeconds} giây trước khi thử lại.`,
        };
      }
      if (lockedUntilMs !== 0 && lockedUntilMs <= nowMs) {
        failedCount = 0;
        lockedUntilMs = 0;
      }
      return { locked: false, remainingSeconds: 0 };
    },
    recordFailure(nowMs = Date.now()) {
      const current = this.getLockStatus(nowMs);
      if (current.locked) {
        return { locked: true, remainingSeconds: current.remainingSeconds, attemptsLeft: 0, message: current.message };
      }
      failedCount += 1;
      if (failedCount >= maxAttempts) {
        lockedUntilMs = nowMs + lockDurationMs;
        const remainingSeconds = Math.ceil(lockDurationMs / 1000);
        return {
          locked: true,
          remainingSeconds,
          attemptsLeft: 0,
          message: `Bạn đã nhập sai ${maxAttempts} lần liên tiếp. Tạm khóa đăng nhập trong ${remainingSeconds} giây để bảo vệ tài khoản.`,
        };
      }
      return { locked: false, remainingSeconds: 0, attemptsLeft: maxAttempts - failedCount };
    },
    reset() {
      failedCount = 0;
      lockedUntilMs = 0;
    },
  };
}

export const defaultLoginRateLimiter = createLoginRateLimiter(5, 30_000);

export function translateFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
  const message = error instanceof Error ? error.message : String(error || '');
  if (
    code.includes('auth/invalid-credential') ||
    code.includes('auth/wrong-password') ||
    code.includes('auth/user-not-found') ||
    code.includes('auth/invalid-email')
  ) {
    return 'Số điện thoại hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.';
  }
  if (code.includes('auth/email-already-in-use')) {
    return 'Số điện thoại này đã đăng ký. Bạn hãy chuyển sang tab Đăng nhập nhé.';
  }
  if (code.includes('auth/weak-password')) {
    return 'Mật khẩu quá ngắn. Vui lòng đặt mật khẩu tối thiểu 8 ký tự.';
  }
  if (code.includes('auth/too-many-requests')) {
    return 'Tài khoản tạm khóa do thử quá nhiều lần. Vui lòng thử lại sau ít phút.';
  }
  if (code.includes('auth/network-request-failed')) {
    return 'Không có kết nối mạng. Vui lòng kiểm tra Wi-Fi hoặc 4G rồi thử lại.';
  }
  if (
    code.includes('auth/operation-not-allowed') ||
    code.includes('auth/configuration-not-found') ||
    message.includes('operation-not-allowed')
  ) {
    return 'AUTH_PROVIDER_NOT_ENABLED';
  }
  return 'Không thể thực hiện xác thực lúc này. Vui lòng thử lại hoặc dùng tài khoản Demo.';
}

export async function signInWithPhoneFirebase(
  rawPhone: string,
  password: string,
  rememberMe: boolean
) {
  const phoneCheck = validateVietnamesePhone(rawPhone);
  if (!phoneCheck.valid) {
    return { success: false, normalizedPhone: phoneCheck.normalizedPhone, error: phoneCheck.error };
  }
  const virtualEmail = mapPhoneToVirtualEmail(phoneCheck.normalizedPhone);
  try {
    const { auth } = await import('./firebaseService');
    const { browserLocalPersistence, browserSessionPersistence, setPersistence, signInWithEmailAndPassword } =
      await import('firebase/auth');
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const cred = await signInWithEmailAndPassword(auth, virtualEmail, password);
    return { success: true, uid: cred.user.uid, displayName: cred.user.displayName, normalizedPhone: phoneCheck.normalizedPhone };
  } catch (err) {
    const translated = translateFirebaseAuthError(err);
    if (translated === 'AUTH_PROVIDER_NOT_ENABLED') {
      return {
        success: false,
        normalizedPhone: phoneCheck.normalizedPhone,
        error: 'Số điện thoại này chưa được kích hoạt trên đám mây. Bạn có thể bấm "Điền tự động tài khoản demo" hoặc "Đăng nhập bằng Google".',
      };
    }
    return { success: false, normalizedPhone: phoneCheck.normalizedPhone, error: translated };
  }
}

export async function registerWithPhoneFirebase(params: {
  fullName: string;
  rawPhone: string;
  password: string;
}) {
  const phoneCheck = validateVietnamesePhone(params.rawPhone);
  if (!phoneCheck.valid) {
    return { success: false, normalizedPhone: phoneCheck.normalizedPhone, error: phoneCheck.error };
  }
  const virtualEmail = mapPhoneToVirtualEmail(phoneCheck.normalizedPhone);
  try {
    const { auth } = await import('./firebaseService');
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const cred = await createUserWithEmailAndPassword(auth, virtualEmail, params.password);
    if (params.fullName.trim()) await updateProfile(cred.user, { displayName: params.fullName.trim() });
    return { success: true, uid: cred.user.uid, normalizedPhone: phoneCheck.normalizedPhone };
  } catch (err) {
    const translated = translateFirebaseAuthError(err);
    if (translated === 'AUTH_PROVIDER_NOT_ENABLED') {
      return { success: true, normalizedPhone: phoneCheck.normalizedPhone };
    }
    return { success: false, normalizedPhone: phoneCheck.normalizedPhone, error: translated };
  }
}

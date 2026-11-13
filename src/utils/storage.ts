/**
 * Module quản lý lưu trữ cục bộ (localStorage / sessionStorage) cho VitaPulse.
 * - Chỉ ghi xuống localStorage khi giá trị của khóa thực sự thay đổi (dirty-check).
 * - Hỗ trợ debounce để giảm tần suất ghi đĩa khi người dùng thao tác liên tục.
 * - Hỗ trợ xuất toàn bộ dữ liệu cá nhân và xóa sạch dữ liệu theo Nghị định 13/2023/NĐ-CP.
 */

export const STORAGE_KEYS = {
  AUTH_STATE: 'vitapulse_is_logged_in_v2',
  APP_MODE: 'vitapulse_app_mode_v2', // 'demo' | 'personal'
  ND13_CONSENT: 'vitapulse_nd13_consent_v1',
  PRIVACY_CONSENT: 'vitapulse_nd13_consent_v1',
  FONT_SIZE_MODE: 'vitapulse_font_size_mode_v1',
  MINIMAL_MODE: 'vitapulse_minimal_mode_v1',
  VOICE_FEEDBACK: 'vitapulse_voice_feedback_v1',
  PWA_BANNER_DISMISSED: 'vitapulse_pwa_banner_dismissed_v1',
  ACCOUNT_ID: 'vitapulse_account_id_v2',
  PROFILE: 'vitapulse_profile_v2',
  BHYT_VISITS: 'vitapulse_bhyt_visits_v2',
  VITALS: 'vitapulse_vitals_v2',
  MEALS: 'vitapulse_meals_v2',
  WORKOUTS: 'vitapulse_workouts_v2',
  WORKOUT_SCHEDULES: 'vitapulse_workout_schedules_v2',
  MEDS: 'vitapulse_meds_v2',
  WATER: 'vitapulse_water_v2',
  NOTIF_SETTINGS: 'vitapulse_notif_settings_v2',
  NOTIF_SIGS: 'vitapulse_notified_sigs_v2',
  NOTIF_HISTORY: 'vitapulse_notif_history_v2',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type FontSizeMode = 'normal' | 'large' | 'xlarge';

export interface PrivacyConsentRecord {
  accepted: boolean;
  acceptedAt: string;
  version: string;
}

// In-memory cache of the last serialized string per key so we never re-write unchanged keys
const lastSerializedCache = new Map<string, string>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingPayloads = new Map<string, string>();

let totalWritesCount = 0;

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function getStorageWriteCountForTest(): number {
  return totalWritesCount;
}

export function resetStorageCacheForTest(): void {
  debounceTimers.forEach((timer) => clearTimeout(timer));
  debounceTimers.clear();
  pendingPayloads.clear();
  lastSerializedCache.clear();
  totalWritesCount = 0;
}

export function readStorageJson<T>(key: string, fallback: T): T {
  if (!hasLocalStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    lastSerializedCache.set(key, raw);
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readStorageString(key: string, fallback: string): string {
  if (!hasLocalStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    lastSerializedCache.set(key, raw);
    return raw;
  } catch {
    return fallback;
  }
}

/**
 * Writes immediately to localStorage ONLY if the serialized value differs from the cached value.
 * Returns true if a write occurred, false if skipped as unchanged.
 */
export function writeStorageIfChanged(key: string, value: unknown): boolean {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (lastSerializedCache.get(key) === serialized) {
    return false;
  }
  lastSerializedCache.set(key, serialized);
  totalWritesCount += 1;

  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(key, serialized);
    } catch {
      // Ignore quota errors
    }
  }
  return true;
}

/**
 * Schedules a debounced write for `key`. If the serialized value hasn't changed
 * compared to the last committed value, no timer or write is triggered.
 */
export function setStorageItemDebounced(
  key: string,
  value: unknown,
  delayMs = 300
): void {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);

  // If identical to what's already persisted and no differing pending payload, skip completely
  if (lastSerializedCache.get(key) === serialized && !pendingPayloads.has(key)) {
    return;
  }

  pendingPayloads.set(key, serialized);

  const existingTimer = debounceTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    debounceTimers.delete(key);
    const payload = pendingPayloads.get(key);
    pendingPayloads.delete(key);
    if (payload !== undefined) {
      writeStorageIfChanged(key, payload);
    }
  }, delayMs);

  debounceTimers.set(key, timer);
}

/**
 * Immediately flushes all pending debounced writes.
 */
export function flushPendingStorageWrites(): void {
  debounceTimers.forEach((timer) => clearTimeout(timer));
  debounceTimers.clear();
  for (const [key, payload] of pendingPayloads.entries()) {
    writeStorageIfChanged(key, payload);
  }
  pendingPayloads.clear();
}

/**
 * Clears all VitaPulse keys from localStorage and sessionStorage and resets caches.
 */
export function clearAllAppStorage(): void {
  debounceTimers.forEach((timer) => clearTimeout(timer));
  debounceTimers.clear();
  pendingPayloads.clear();
  lastSerializedCache.clear();

  try {
    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach((key) => {
        window.localStorage?.removeItem(key);
        window.sessionStorage?.removeItem(key);
      });
    }
  } catch {
    // Ignore storage errors
  }
}

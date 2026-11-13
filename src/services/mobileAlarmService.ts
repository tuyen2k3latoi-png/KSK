import {
  DayOfWeekCode,
  LocalPushNotificationItem,
  MedicationNotificationSettings,
  MedicationSchedule,
  WorkoutSchedule,
} from '../types/health';
import {
  buildMedicationPushPayload,
  buildWorkoutPushPayload,
  formatRecurringDaysLabel,
  parseTimeMinutes,
} from '../utils/healthCalculations';

export const VITAPULSE_ALARM_CHANNEL = 'vitapulse-alarm-channel';

export interface SwAlarmActionMessage {
  type: 'ALARM_ACTION';
  action: 'confirm' | 'snooze' | 'focus' | 'dismiss';
  payload: Partial<LocalPushNotificationItem> & {
    tag?: string;
    snoozeMinutes?: number;
  };
  timestamp: number;
}

export interface ScheduledAlarmDescriptor {
  id: string;
  signature: string;
  kind: 'medication' | 'workout';
  medicationId: string;
  workoutScheduleId?: string;
  medicationName: string;
  dosage: string;
  timeSlot: string;
  mealInstruction: string;
  purpose: string;
  title: string;
  body: string;
  triggerTimestampMs: number;
  snoozeMinutes: number;
  soundEnabled: boolean;
  tag: string;
}

export interface MobileNotificationCapabilities {
  supported: boolean;
  permission: MedicationNotificationSettings['browserPermission'];
  hasServiceWorker: boolean;
  isStandalonePwa: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  needsIosHomeScreenInstall: boolean;
}

export function createMedicationNotificationItem(params: {
  med: MedicationSchedule;
  fullName: string;
  timeStr: string;
  isTest: boolean;
}): LocalPushNotificationItem {
  const { med, fullName, timeStr, isTest } = params;
  const payload = buildMedicationPushPayload(med, fullName, timeStr);
  return {
    id: `push_${isTest ? 'test_' : ''}${med.id}_${Date.now()}`,
    kind: 'medication',
    medicationId: med.id,
    medicationName: med.medicationName,
    dosage: med.dosage,
    timeSlot: med.timeSlot,
    mealInstruction: med.mealInstruction,
    purpose: med.purpose,
    title: payload.title,
    body: payload.body,
    triggeredAt: timeStr,
    isTest,
    status: 'active',
  };
}

export function createWorkoutNotificationItem(params: {
  sched: WorkoutSchedule;
  fullName: string;
  timeStr: string;
  isTest: boolean;
}): LocalPushNotificationItem {
  const { sched, fullName, timeStr, isTest } = params;
  const payload = buildWorkoutPushPayload(sched, fullName, timeStr);
  return {
    id: `push_${isTest ? 'test_' : ''}workout_${sched.id}_${Date.now()}`,
    kind: 'workout',
    medicationId: sched.id,
    workoutScheduleId: sched.id,
    medicationName: sched.activityName,
    dosage: `${sched.durationMinutes} phút`,
    timeSlot: sched.timeSlot,
    mealInstruction: `${sched.category} · ${formatRecurringDaysLabel(sched.daysOfWeek)}`,
    purpose: `Cường độ ${sched.intensityLabel} · Tiêu hao ~${sched.targetCalories} kcal`,
    activityCategory: sched.category,
    durationMinutes: sched.durationMinutes,
    targetCalories: sched.targetCalories,
    title: payload.title,
    body: payload.body,
    triggeredAt: timeStr,
    isTest,
    status: 'active',
  };
}

/**
 * Pure helper: builds standardized OS notification payload + action buttons
 * compatible with Android Chrome & iOS Home Screen PWA ServiceWorker notifications.
 */
export function buildAlarmNotificationPayload(
  item: LocalPushNotificationItem,
  snoozeMinutes: number,
  soundEnabled: boolean = true
) {
  const isWorkout = item.kind === 'workout';
  const safeSnooze = snoozeMinutes || 10;
  const tag = isWorkout
    ? `vitapulse-workout-${item.workoutScheduleId || item.medicationId}`
    : `vitapulse-med-${item.medicationId}`;

  return {
    title: item.title,
    tag,
    options: {
      body: item.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag,
      renotify: true,
      requireInteraction: true,
      silent: !soundEnabled,
      vibrate: [500, 200, 500, 200, 800, 300, 500, 200, 500],
      data: {
        ...item,
        tag,
        snoozeMinutes: safeSnooze,
        soundEnabled,
      },
      actions: [
        {
          action: 'confirm',
          title: isWorkout ? '✓ Đã tập xong' : '✓ Đã uống thuốc',
        },
        {
          action: 'snooze',
          title: `Nhắc lại ${safeSnooze} phút`,
        },
      ],
    },
  };
}

/**
 * Pure helper: converts upcoming enabled medications & today's workouts into
 * timestamped alarm descriptors so the Service Worker can fire OS notifications.
 */
export function buildScheduledAlarmDescriptors(params: {
  medications: MedicationSchedule[];
  workoutSchedules: WorkoutSchedule[];
  currentDayCode: DayOfWeekCode;
  settings: MedicationNotificationSettings;
  fullName: string;
  now?: Date;
}): ScheduledAlarmDescriptor[] {
  const { medications, workoutSchedules, currentDayCode, settings, fullName } = params;
  if (!settings.enabled) return [];

  const now = params.now || new Date();
  const baseMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const descriptors: ScheduledAlarmDescriptor[] = [];

  for (const med of medications) {
    if (med.takenToday || med.reminderEnabled === false) continue;
    const effectiveTime = med.snoozedUntil || med.timeSlot;
    const targetMinutes = parseTimeMinutes(effectiveTime);
    const triggerMinutes = med.snoozedUntil
      ? targetMinutes
      : Math.max(0, targetMinutes - settings.leadMinutes);
    const triggerTimestampMs = baseMidnight.getTime() + triggerMinutes * 60 * 1000;
    const payload = buildMedicationPushPayload(med, fullName, effectiveTime);
    const signature = med.snoozedUntil
      ? `${med.id}@snooze-${med.snoozedUntil}`
      : `${med.id}@${med.timeSlot}`;

    descriptors.push({
      id: `alarm_med_${med.id}`,
      signature,
      kind: 'medication',
      medicationId: med.id,
      medicationName: med.medicationName,
      dosage: med.dosage,
      timeSlot: effectiveTime,
      mealInstruction: med.mealInstruction,
      purpose: med.purpose,
      title: payload.title,
      body: payload.body,
      triggerTimestampMs,
      snoozeMinutes: settings.snoozeMinutes,
      soundEnabled: settings.soundEnabled,
      tag: `vitapulse-med-${med.id}`,
    });
  }

  for (const sched of workoutSchedules) {
    if (sched.completedToday || sched.reminderEnabled === false) continue;
    if (!sched.daysOfWeek.includes(currentDayCode)) continue;
    const effectiveTime = sched.snoozedUntil || sched.timeSlot;
    const targetMinutes = parseTimeMinutes(effectiveTime);
    const triggerMinutes = sched.snoozedUntil
      ? targetMinutes
      : Math.max(0, targetMinutes - settings.leadMinutes);
    const triggerTimestampMs = baseMidnight.getTime() + triggerMinutes * 60 * 1000;
    const payload = buildWorkoutPushPayload(sched, fullName, effectiveTime);
    const signature = sched.snoozedUntil
      ? `workout-${sched.id}@snooze-${sched.snoozedUntil}`
      : `workout-${sched.id}@${sched.timeSlot}`;

    descriptors.push({
      id: `alarm_workout_${sched.id}`,
      signature,
      kind: 'workout',
      medicationId: sched.id,
      workoutScheduleId: sched.id,
      medicationName: sched.activityName,
      dosage: `${sched.durationMinutes} phút`,
      timeSlot: effectiveTime,
      mealInstruction: `${sched.category} · ${formatRecurringDaysLabel(sched.daysOfWeek)}`,
      purpose: `Cường độ ${sched.intensityLabel} · Tiêu hao ~${sched.targetCalories} kcal`,
      title: payload.title,
      body: payload.body,
      triggerTimestampMs,
      snoozeMinutes: settings.snoozeMinutes,
      soundEnabled: settings.soundEnabled,
      tag: `vitapulse-workout-${sched.id}`,
    });
  }

  return descriptors;
}

let sharedAudioContext: AudioContext | null = null;
let ringtoneTimerId: number | null = null;
let ringtoneCycleCount = 0;
let isAlarmRinging = false;
let activeWakeLock: WakeLockSentinel | null = null;

function canUseUserActivatedFeatures(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & {
    userActivation?: { hasBeenActive: boolean };
  };
  return !nav.userActivation || nav.userActivation.hasBeenActive;
}

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioCtx();
  }
  return sharedAudioContext;
}

/**
 * Call inside a user click/tap handler (e.g., "Bật chuông", "Gửi thử thông báo")
 * so mobile browsers permit playing alarm audio when scheduled doses arrive.
 */
export async function unlockAlarmAudio(): Promise<void> {
  try {
    if (!canUseUserActivatedFeatures()) return;
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Ignore audio unlock restrictions
  }
}

/**
 * Plays a warm, clear alarm chime pattern using Web Audio API (no external audio files).
 */
export function playAlarmChimeOnce(): void {
  try {
    if (typeof window === 'undefined' || !canUseUserActivatedFeatures()) return;
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const pattern = [
      { freq: 587.33, offset: 0.0, duration: 0.24 }, // D5
      { freq: 783.99, offset: 0.18, duration: 0.24 }, // G5
      { freq: 987.77, offset: 0.36, duration: 0.42 }, // B5
      { freq: 783.99, offset: 0.72, duration: 0.22 }, // G5
      { freq: 987.77, offset: 0.92, duration: 0.48 }, // B5
    ];

    pattern.forEach(({ freq, offset, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + offset);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.24, ctx.currentTime + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + duration + 0.02);
    });
  } catch {
    // Ignore Web Audio errors
  }
}

export function triggerPhoneVibration(): void {
  try {
    if (
      canUseUserActivatedFeatures() &&
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function'
    ) {
      navigator.vibrate([450, 180, 450, 180, 650]);
    }
  } catch {
    // Ignore vibration errors
  }
}

export function stopAlarmRingtoneLoop(): void {
  const wasRinging = isAlarmRinging;
  isAlarmRinging = false;

  if (typeof window !== 'undefined' && ringtoneTimerId !== null) {
    window.clearInterval(ringtoneTimerId);
    ringtoneTimerId = null;
  }
  ringtoneCycleCount = 0;

  if (wasRinging && canUseUserActivatedFeatures()) {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(0);
      }
    } catch {
      // Ignore
    }
  }

  if (activeWakeLock) {
    activeWakeLock.release().catch(() => {});
    activeWakeLock = null;
  }
}

/**
 * Starts looping alarm chime + phone vibration every 2.5s (auto-stops after ~30s)
 * until the user taps confirm, snooze, or dismiss.
 */
export function startAlarmRingtoneLoop(soundEnabled: boolean): void {
  if (typeof window === 'undefined') return;
  stopAlarmRingtoneLoop();
  isAlarmRinging = true;

  triggerPhoneVibration();
  if (soundEnabled) {
    playAlarmChimeOnce();
  }

  try {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> };
    };
    if (nav.wakeLock && typeof nav.wakeLock.request === 'function') {
      nav.wakeLock
        .request('screen')
        .then((sentinel) => {
          activeWakeLock = sentinel;
        })
        .catch(() => {});
    }
  } catch {
    // Ignore wake lock errors
  }

  ringtoneCycleCount = 1;
  ringtoneTimerId = window.setInterval(() => {
    ringtoneCycleCount += 1;
    if (ringtoneCycleCount > 12) {
      stopAlarmRingtoneLoop();
      return;
    }
    triggerPhoneVibration();
    if (soundEnabled) {
      playAlarmChimeOnce();
    }
  }, 2500);
}

export function getMobileNotificationCapabilities(): MobileNotificationCapabilities {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      permission: 'unsupported',
      hasServiceWorker: false,
      isStandalonePwa: false,
      isIOS: false,
      isAndroid: false,
      needsIosHomeScreenInstall: false,
    };
  }

  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isStandalonePwa =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const supported = 'Notification' in window;
  const permission: MedicationNotificationSettings['browserPermission'] = supported
    ? (Notification.permission as 'default' | 'granted' | 'denied')
    : 'unsupported';
  const hasServiceWorker = 'serviceWorker' in navigator;

  return {
    supported,
    permission,
    hasServiceWorker,
    isStandalonePwa,
    isIOS,
    isAndroid,
    needsIosHomeScreenInstall: isIOS && !isStandalonePwa,
  };
}

export async function requestPhoneNotificationPermission(): Promise<
  MedicationNotificationSettings['browserPermission']
> {
  await unlockAlarmAudio();
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result as 'default' | 'granted' | 'denied';
  } catch {
    return (Notification.permission as 'default' | 'granted' | 'denied') || 'default';
  }
}

async function getReadyServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing && (existing.active || existing.waiting || existing.installing)) {
      return existing;
    }
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<null>((resolve) =>
      window.setTimeout(() => resolve(null), 1200)
    );
    return await Promise.race([readyPromise, timeoutPromise]);
  } catch {
    return null;
  }
}

/**
 * Dispatches a REAL phone notification via ServiceWorkerRegistration.showNotification()
 * (required on Android Chrome & iOS Home Screen PWAs), with desktop Notification fallback.
 */
export async function dispatchPhoneAlarmNotification(
  item: LocalPushNotificationItem,
  snoozeMinutes: number,
  soundEnabled: boolean = true
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  const built = buildAlarmNotificationPayload(item, snoozeMinutes, soundEnabled);

  try {
    const reg = await getReadyServiceWorkerRegistration();
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(built.title, built.options as NotificationOptions);
      return true;
    }
  } catch {
    // Fall through to standard Notification API on desktop
  }

  try {
    new Notification(built.title, {
      body: built.options.body,
      icon: built.options.icon,
      tag: built.tag,
      requireInteraction: true,
    });
    return true;
  } catch {
    return false;
  }
}

export async function syncAlarmsWithServiceWorker(
  alarms: ScheduledAlarmDescriptor[]
): Promise<void> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage({ type: 'SYNC_ALARMS', alarms });
      return;
    }
    const reg = await getReadyServiceWorkerRegistration();
    reg?.active?.postMessage({ type: 'SYNC_ALARMS', alarms });
  } catch {
    // Ignore SW sync errors
  }
}

export async function cancelAlarmNotificationTag(tag: string): Promise<void> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage({ type: 'CANCEL_ALARM', tag });
      return;
    }
    const reg = await getReadyServiceWorkerRegistration();
    reg?.active?.postMessage({ type: 'CANCEL_ALARM', tag });
  } catch {
    // Ignore
  }
}

export function subscribeToSwAlarmActions(
  onAction: (message: SwAlarmActionMessage) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handlePayload = (data: unknown) => {
    if (
      data &&
      typeof data === 'object' &&
      (data as SwAlarmActionMessage).type === 'ALARM_ACTION'
    ) {
      onAction(data as SwAlarmActionMessage);
    }
  };

  let bc: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    try {
      bc = new BroadcastChannel(VITAPULSE_ALARM_CHANNEL);
      bc.onmessage = (event) => handlePayload(event.data);
    } catch {
      bc = null;
    }
  }

  const swMessageListener = (event: MessageEvent) => handlePayload(event.data);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', swMessageListener);
  }

  return () => {
    if (bc) bc.close();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', swMessageListener);
    }
  };
}

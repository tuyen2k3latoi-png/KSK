import React from 'react';
import { BellRing, Check, Clock, Dumbbell, Pill, Volume2, X } from 'lucide-react';
import { LocalPushNotificationItem } from '../types/health';

/**
 * Plays a gentle 3-note chime using Web Audio API so local push notifications
 * work offline without external audio assets.
 */
export function playMedicationReminderChime(): void {
  try {
    if (typeof window === 'undefined') return;
    const nav = window.navigator as Navigator & {
      userActivation?: { hasBeenActive: boolean };
    };
    if (nav.userActivation && !nav.userActivation.hasBeenActive) {
      return;
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99]; // C5 - E5 - G5 pleasant major triad
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.16 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.42);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.16);
      osc.stop(ctx.currentTime + idx * 0.16 + 0.45);
    });
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

/**
 * Sends a native browser / OS local push notification if Web Notification API is supported and granted.
 */
export function dispatchBrowserLocalNotification(item: LocalPushNotificationItem): boolean {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      new Notification(item.title, {
        body: item.body,
        tag: item.id,
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

interface MedicationPushBannerProps {
  activeNotifications: LocalPushNotificationItem[];
  snoozeMinutes: number;
  soundEnabled: boolean;
  onConfirmTaken: (notification: LocalPushNotificationItem) => void;
  onSnooze: (notification: LocalPushNotificationItem) => void;
  onDismiss: (notificationId: string) => void;
}

export const MedicationPushBanner: React.FC<MedicationPushBannerProps> = ({
  activeNotifications,
  snoozeMinutes,
  soundEnabled,
  onConfirmTaken,
  onSnooze,
  onDismiss,
}) => {
  if (activeNotifications.length === 0) return null;

  const current = activeNotifications[0];
  const isWorkout = current.kind === 'workout';

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label={
        isWorkout
          ? 'Thông báo đẩy nhắc tập luyện định kỳ'
          : 'Thông báo đẩy nhắc uống thuốc đúng giờ'
      }
      data-testid="local-push-notification-banner"
      className={`fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.25rem)] max-w-2xl bg-white border-2 rounded-2xl shadow-2xl p-4 sm:p-5 transition-all ${
        isWorkout ? 'border-indigo-600' : 'border-teal-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
              isWorkout ? 'bg-indigo-600' : 'bg-teal-600'
            }`}
          >
            {isWorkout ? (
              <Dumbbell className="w-6 h-6 animate-bounce" />
            ) : (
              <BellRing className="w-6 h-6 animate-bounce" />
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${
                  isWorkout
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    : 'bg-teal-50 border-teal-200 text-teal-800'
                }`}
              >
                {isWorkout
                  ? current.isTest
                    ? 'THÔNG BÁO NHẮC TẬP THỬ NGHIỆM'
                    : 'CHUÔNG NHẮC TẬP LUYỆN ĐỊNH KỲ'
                  : current.isTest
                  ? 'THÔNG BÁO ĐẨY THỬ NGHIỆM'
                  : 'CHUÔNG NHẮC UỐNG THUỐC ĐÚNG GIỜ'}
              </span>
              <span className="text-xs font-mono-tabular font-semibold text-slate-600">
                Khung giờ: {current.timeSlot}
              </span>
              {soundEnabled && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                    isWorkout ? 'text-indigo-700' : 'text-teal-700'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Có chuông báo
                </span>
              )}
              {activeNotifications.length > 1 && (
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  +{activeNotifications.length - 1} lời nhắc khác đang chờ
                </span>
              )}
            </div>

            <h3
              data-testid="push-banner-med-name"
              className="text-base sm:text-lg font-bold text-slate-900 leading-snug"
            >
              {isWorkout
                ? `Đến giờ tập: ${current.medicationName} (${current.dosage})`
                : `Đến giờ uống: ${current.medicationName} (${current.dosage})`}
            </h3>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {isWorkout ? (
                <>
                  Lịch tập:{' '}
                  <strong className="text-indigo-800">{current.mealInstruction}</strong> · Mục tiêu:{' '}
                  {current.purpose}
                </>
              ) : (
                <>
                  Chỉ dẫn: <strong className="text-teal-800">{current.mealInstruction}</strong> ·
                  Công dụng: {current.purpose}
                </>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(current.id)}
          aria-label="Đóng thông báo nhắc nhở"
          data-testid="push-banner-dismiss-btn"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          {isWorkout ? (
            <>
              <Dumbbell className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Bấm xác nhận để ghi bài tập và lượng calo tiêu hao vào nhật ký hôm nay</span>
            </>
          ) : (
            <>
              <Pill className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Bấm xác nhận ngay sau khi cô/chú đã uống thuốc để lưu vào sổ</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => onSnooze(current)}
            data-testid="push-banner-snooze-btn"
            className="flex-1 sm:flex-initial min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Nhắc lại sau {snoozeMinutes} phút</span>
          </button>

          <button
            type="button"
            onClick={() => onConfirmTaken(current)}
            data-testid="push-banner-confirm-btn"
            className={`flex-1 sm:flex-initial min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              isWorkout
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{isWorkout ? 'Xác nhận Đã tập ngay' : 'Xác nhận Đã uống ngay'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


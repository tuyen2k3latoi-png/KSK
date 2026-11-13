import React, { useState } from 'react';
import { BellRing, Check, Clock, Dumbbell, Pill, Volume2, VolumeX, X } from 'lucide-react';
import { LocalPushNotificationItem } from '../types/health';
import { formatTime24h } from '../utils/formatters';
import { stopAlarmRingtoneLoop } from '../services/mobileAlarmService';

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
  const [mutedCurrent, setMutedCurrent] = useState(false);

  if (activeNotifications.length === 0) return null;

  const current = activeNotifications[0];
  const isWorkout = current.kind === 'workout';

  const handleMuteSound = () => {
    stopAlarmRingtoneLoop();
    setMutedCurrent(true);
  };

  const handleConfirm = () => {
    setMutedCurrent(false);
    onConfirmTaken(current);
  };

  const handleSnooze = () => {
    setMutedCurrent(false);
    onSnooze(current);
  };

  const handleDismiss = () => {
    setMutedCurrent(false);
    onDismiss(current.id);
  };

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label={isWorkout ? 'Báo thức nhắc tập luyện' : 'Báo thức nhắc uống thuốc'}
      data-testid="local-push-notification-banner"
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.25rem)] max-w-xl bg-white border-2 border-[#0F766E] rounded-[24px] shadow-[0_24px_56px_-12px_rgba(11,95,87,0.4)] overflow-hidden"
    >
      {/* Dải tiêu đề báo thức */}
      <div className="bg-[#FAF7F2] px-4 py-3 border-b border-stone-200/80 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0F766E] text-white text-xs font-extrabold">
            {isWorkout ? (
              <Dumbbell className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <BellRing className="w-3.5 h-3.5 animate-bounce" />
            )}
            <span>
              {isWorkout
                ? current.isTest
                  ? 'BÁO THỨC TẬP (THỬ)'
                  : 'BÁO THỨC TẬP LUYỆN'
                : current.isTest
                ? 'BÁO THỨC THUỐC (THỬ)'
                : 'BÁO THỨC UỐNG THUỐC'}
            </span>
          </span>
          <span className="text-sm font-extrabold text-[#0B5F57] tabular-nums">
            {formatTime24h(current.timeSlot)}
          </span>
          {soundEnabled && !mutedCurrent && (
            <button
              type="button"
              onClick={handleMuteSound}
              aria-label="Tắt tiếng chuông đang kêu"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-stone-300 text-xs font-bold text-[#0B5F57] hover:bg-stone-100 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Tắt tiếng</span>
            </button>
          )}
          {mutedCurrent && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500">
              <VolumeX className="w-3.5 h-3.5" />
              <span>Đã tắt tiếng</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Đóng thông báo"
          data-testid="push-banner-dismiss-btn"
          className="min-w-[40px] min-h-[40px] rounded-xl text-stone-500 hover:text-[#1F2937] hover:bg-stone-200/70 flex items-center justify-center shrink-0 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nội dung báo thức */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/10 border border-[#0F766E]/25 text-[#0F766E] flex items-center justify-center shrink-0">
            {isWorkout ? <Dumbbell className="w-6 h-6" /> : <Pill className="w-6 h-6" />}
          </div>
          <div className="min-w-0 space-y-1">
            <h3
              data-testid="push-banner-med-name"
              className="text-lg sm:text-xl font-extrabold text-[#1F2937] leading-snug break-words"
            >
              {isWorkout
                ? `${current.medicationName} (${current.dosage})`
                : `${current.medicationName} — ${current.dosage}`}
            </h3>
            <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
              <strong className="text-[#0B5F57]">{current.mealInstruction}</strong> · {current.purpose}
            </p>
            {activeNotifications.length > 1 && (
              <p className="text-xs font-bold text-amber-800">
                Còn {activeNotifications.length - 1} lời nhắc khác đang chờ
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleSnooze}
            data-testid="push-banner-snooze-btn"
            className="min-h-[52px] px-4 py-2.5 rounded-2xl text-base font-bold text-[#1F2937] bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-300 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Clock className="w-5 h-5 text-[#F59E0B] shrink-0" />
            <span>Nhắc lại sau {snoozeMinutes} phút</span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            data-testid="push-banner-confirm-btn"
            className="min-h-[52px] px-4 py-2.5 rounded-2xl text-base font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] shadow-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-5 h-5 shrink-0" />
            <span>{isWorkout ? 'Đã tập xong' : 'Đã uống thuốc'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

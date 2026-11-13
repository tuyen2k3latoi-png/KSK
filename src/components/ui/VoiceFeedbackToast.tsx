import React from 'react';
import { Volume2, X } from 'lucide-react';

interface VoiceFeedbackToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const VoiceFeedbackToast: React.FC<VoiceFeedbackToastProps> = ({
  message,
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="voice-feedback-toast"
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-lg rounded-2xl bg-[#0B5F57] text-white border border-teal-300/40 shadow-[0_18px_40px_-10px_rgba(11,95,87,0.45)] px-4 py-3 flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
        <Volume2 className="w-5 h-5 text-teal-100" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-wide text-teal-100">
          Xác nhận bằng giọng nói
        </p>
        <p className="text-sm sm:text-base font-semibold text-white leading-snug mt-0.5">
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Đóng thông báo giọng nói"
        className="min-h-[36px] min-w-[36px] rounded-xl text-teal-100 hover:bg-white/15 flex items-center justify-center shrink-0 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

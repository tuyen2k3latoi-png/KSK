import { useCallback, useEffect, useRef, useState } from 'react';
import { MedicationSchedule, VitalRecord } from '../types/health';
import {
  buildMedicationConfirmedSpeechText,
  buildVitalRecordedSpeechText,
  speakFeedback,
  stopVoiceFeedback,
} from '../services/speechFeedbackService';

export function useVoiceFeedback(isEnabled: boolean) {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!isEnabled) {
      stopVoiceFeedback();
    }
    return () => {
      clearTimer();
    };
  }, [isEnabled]);

  const triggerAnnouncement = useCallback(
    (text: string) => {
      if (!isEnabled || !text.trim()) return;
      speakFeedback(text, true);
      setAnnouncement(text);
      clearTimer();
      timerRef.current = setTimeout(() => {
        setAnnouncement(null);
      }, 5000);
    },
    [isEnabled]
  );

  const announceVitalRecorded = useCallback(
    (record: VitalRecord) => {
      const text = buildVitalRecordedSpeechText({
        systolic: record.systolic,
        diastolic: record.diastolic,
        heartRate: record.heartRate,
      });
      triggerAnnouncement(text);
    },
    [triggerAnnouncement]
  );

  const announceMedicationToggled = useCallback(
    (med: MedicationSchedule, takenCount: number, totalCount: number) => {
      const text = buildMedicationConfirmedSpeechText({
        medicationName: med.medicationName,
        takenToday: med.takenToday,
        takenCount,
        totalCount,
      });
      triggerAnnouncement(text);
    },
    [triggerAnnouncement]
  );

  const announceTestVoice = useCallback(() => {
    const text = 'Giọng nói xác nhận đang bật. Hệ thống sẽ đọc xác nhận mỗi khi bạn lưu chỉ số hoặc uống thuốc.';
    speakFeedback(text, true);
    setAnnouncement(text);
    clearTimer();
    timerRef.current = setTimeout(() => {
      setAnnouncement(null);
    }, 5000);
  }, []);

  const dismissAnnouncement = useCallback(() => {
    clearTimer();
    stopVoiceFeedback();
    setAnnouncement(null);
  }, []);

  return {
    voiceAnnouncement: announcement,
    announceVitalRecorded,
    announceMedicationToggled,
    announceTestVoice,
    dismissAnnouncement,
  };
}

import { classifyBloodPressure } from '../utils/healthCalculations';

export interface VoiceDescriptorLike {
  lang: string;
  name: string;
}

export function parseVoiceFeedbackFlag(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined || raw === '') return true;
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'off') {
    return false;
  }
  return normalized === 'true' || normalized === '1' || normalized === 'on';
}

export function selectPreferredVietnameseVoice<T extends VoiceDescriptorLike>(
  voices: T[]
): T | null {
  if (!Array.isArray(voices) || voices.length === 0) return null;
  const exact = voices.find((v) => v.lang.toLowerCase() === 'vi-vn');
  if (exact) return exact;
  const prefix = voices.find((v) => v.lang.toLowerCase().startsWith('vi'));
  if (prefix) return prefix;
  return null;
}

export function buildVitalRecordedSpeechText(params: {
  systolic: number;
  diastolic: number;
  heartRate: number;
  isAlarming?: boolean;
}): string {
  const { systolic, diastolic, heartRate, isAlarming } = params;
  const bpEval = classifyBloodPressure(systolic, diastolic);
  const highAlert = isAlarming || bpEval.status === 'critical' || systolic >= 180 || diastolic >= 120;

  if (highAlert) {
    return `Đã ghi nhận chỉ số. Lưu ý huyết áp ${systolic} trên ${diastolic}, nhịp tim ${heartRate}. Mức này cần chú ý, hãy nghỉ ngơi hoặc gọi bác sĩ ngay nếu thấy mệt.`;
  }

  return `Đã ghi nhận chỉ số sức khỏe. Huyết áp ${systolic} trên ${diastolic}, nhịp tim ${heartRate}. ${bpEval.label}.`;
}

export function buildMedicationConfirmedSpeechText(params: {
  medicationName: string;
  takenToday: boolean;
  takenCount: number;
  totalCount: number;
}): string {
  const shortName = String(params.medicationName || 'thuốc')
    .replace(/\([^)]*\)/g, '')
    .trim();

  if (!params.takenToday) {
    return `Đã bỏ đánh dấu uống ${shortName}.`;
  }

  if (params.totalCount > 0 && params.takenCount >= params.totalCount) {
    return `Đã xác nhận uống ${shortName}. Tuyệt vời, hôm nay bạn đã uống đủ ${params.takenCount} trên ${params.totalCount} cữ thuốc.`;
  }

  return `Đã xác nhận uống ${shortName}. Đã hoàn thành ${params.takenCount} trên ${params.totalCount} cữ hôm nay.`;
}

export function stopVoiceFeedback(): void {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore speech synthesis cancel errors on restricted webviews
  }
}

export function speakFeedback(text: string, enabled: boolean): boolean {
  if (!enabled || !text.trim()) return false;
  try {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      return false;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = synth.getVoices?.() || [];
    const preferred = selectPreferredVietnameseVoice(voices);
    if (preferred) {
      utterance.voice = preferred;
    }

    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

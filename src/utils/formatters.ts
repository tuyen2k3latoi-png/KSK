import { VitalRecord } from '../types/health';

/**
 * Chuyển đổi chuỗi ngày ISO ("2026-12-05" hoặc "2026-11-10T08:00:00Z")
 * sang định dạng tiếng Việt thân thiện "dd/mm/yyyy" (VD: "05/12/2026").
 */
export function formatDateDdMmYyyy(rawDate?: string | null): string {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd}/${mm}/${yyyy}`;
  }
  const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return trimmed;
}

/**
 * Chuyển đổi chuỗi ngày ISO ("2026-11-04" hoặc "11-04") sang "dd/mm" (VD: "04/11").
 */
export function formatShortDateDdMm(rawDate?: string | null): string {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();
  const fullIso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (fullIso) {
    return `${fullIso[3]}/${fullIso[2]}`;
  }
  const shortIso = trimmed.match(/^(\d{2})-(\d{2})$/);
  if (shortIso) {
    return `${shortIso[2]}/${shortIso[1]}`;
  }
  return trimmed;
}

/**
 * Chuẩn hóa giờ 24h kiểu "07:00".
 */
export function formatTime24h(rawTime?: string | null): string {
  if (!rawTime) return '07:00';
  const match = rawTime.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return rawTime;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

/**
 * Đổi tên nguồn thiết bị kỹ thuật sang ngôn ngữ đời thường cho người 45–70 tuổi.
 */
export function humanizeDeviceSource(source?: string): string {
  if (!source) return 'Tự ghi nhận';
  const lower = source.toLowerCase();
  if (lower.includes('ble') || lower.includes('smartwatch') || lower.includes('watch')) {
    return 'Đồng bộ từ thiết bị';
  }
  if (lower.includes('manual')) {
    return 'Tự ghi nhận';
  }
  if (lower.includes('omron')) {
    return 'Máy đo huyết áp';
  }
  return source;
}

/**
 * Tạo lời chào thân thiện theo khung giờ trong ngày và danh xưng phù hợp độ tuổi.
 * Ví dụ: "Chào buổi sáng, chú Quân" hoặc "Chào buổi chiều, cô Hương".
 */
export function buildVietnameseGreeting(params: {
  fullName: string;
  gender?: 'male' | 'female' | 'other';
  birthYear?: number;
  now?: Date;
}): {
  greetingTitle: string;
  todayFormatted: string;
  shortFirstName: string;
  honorific: string;
} {
  const current = params.now || new Date();
  const hour = current.getHours();
  let period = 'buổi sáng';
  if (hour >= 11 && hour < 14) {
    period = 'buổi trưa';
  } else if (hour >= 14 && hour < 18) {
    period = 'buổi chiều';
  } else if (hour >= 18 || hour < 5) {
    period = 'buổi tối';
  }

  const nameParts = (params.fullName || 'Bạn').trim().split(/\s+/);
  const shortFirstName = nameParts[nameParts.length - 1] || 'Bạn';
  const age = params.birthYear ? 2026 - params.birthYear : 58;

  let honorific = 'bạn';
  if (age >= 68) {
    honorific = params.gender === 'female' ? 'bà' : 'ông';
  } else if (age >= 48) {
    honorific = params.gender === 'female' ? 'cô' : 'chú';
  } else {
    honorific = params.gender === 'female' ? 'chị' : 'anh';
  }

  const weekdayNames = [
    'Chủ nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];
  const dayName = weekdayNames[current.getDay()];
  const dd = String(current.getDate()).padStart(2, '0');
  const mm = String(current.getMonth() + 1).padStart(2, '0');
  const yyyy = current.getFullYear();

  return {
    greetingTitle: `Chào ${period}, ${honorific} ${shortFirstName}`,
    todayFormatted: `${dayName}, ngày ${dd}/${mm}/${yyyy}`,
    shortFirstName,
    honorific,
  };
}

export interface MetricTrendInfo {
  direction: 'up' | 'down' | 'flat';
  arrow: '↑' | '↓' | '→';
  label: string;
}

/**
 * So sánh chỉ số mới nhất với lần đo liền trước để hiển thị mũi tên xu hướng dễ hiểu.
 */
export function computeVitalTrend(
  vitals: VitalRecord[],
  selector: (v: VitalRecord) => number,
  threshold = 2
): MetricTrendInfo {
  if (!vitals || vitals.length < 2) {
    return { direction: 'flat', arrow: '→', label: 'Ổn định' };
  }
  const latest = selector(vitals[0]);
  const prev = selector(vitals[1]);
  const diff = latest - prev;
  if (Math.abs(diff) <= threshold) {
    return { direction: 'flat', arrow: '→', label: 'Ổn định so với lần trước' };
  }
  if (diff > 0) {
    return { direction: 'up', arrow: '↑', label: `Tăng nhẹ (+${Math.round(diff * 10) / 10})` };
  }
  return { direction: 'down', arrow: '↓', label: `Giảm nhẹ (${Math.round(diff * 10) / 10})` };
}

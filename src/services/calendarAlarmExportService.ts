import { MedicationSchedule } from '../types/health';

function escapeIcsText(value: string): string {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function formatIcsDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function formatIcsTimePart(timeSlot: string): string {
  const [rawH, rawM] = String(timeSlot || '07:00').split(':');
  const h = Math.max(0, Math.min(23, Number(rawH) || 0));
  const m = Math.max(0, Math.min(59, Number(rawM) || 0));
  return `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
}

export interface BuildIcsResult {
  icsContent: string;
  eventCount: number;
}

/**
 * Tạo nội dung tệp lịch chuẩn RFC 5545 (.ics) chứa các cữ thuốc lặp lại hằng ngày
 * kèm VALARM để iPhone (Apple Calendar) & Android (Google Calendar) tự đổ chuông
 * ngay cả khi người dùng đóng hoàn toàn trình duyệt.
 */
export function buildMedicationAlarmIcs(params: {
  medications: MedicationSchedule[];
  patientName?: string;
  leadMinutes?: number;
  referenceDate?: Date;
}): BuildIcsResult {
  const now = params.referenceDate || new Date();
  const datePart = formatIcsDatePart(now);
  const stampUtc = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const safeLead = Math.max(0, Math.min(60, Math.round(params.leadMinutes ?? 5)));
  const triggerStr = safeLead > 0 ? `-PT${safeLead}M` : 'PT0M';

  const enabledMeds = params.medications.filter((m) => m.reminderEnabled !== false);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VitaPulse//Lich Uong Thuoc//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Lich uong thuoc VitaPulse',
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
  ];

  for (const med of enabledMeds) {
    const timePart = formatIcsTimePart(med.timeSlot);
    const dtStart = `${datePart}T${timePart}`;
    const uid = `vitapulse-${med.id.replace(/[^a-zA-Z0-9_-]/g, '')}-${timePart}@vitapulse.app`;
    const summary = escapeIcsText(`Uống thuốc: ${med.medicationName} (${med.dosage})`);
    const patientPrefix = params.patientName ? `Người dùng: ${params.patientName}. ` : '';
    const desc = escapeIcsText(
      `${patientPrefix}Liều: ${med.dosage} · ${med.mealInstruction}. Công dụng: ${med.purpose}.`
    );

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stampUtc}`,
      `DTSTART;TZID=Asia/Ho_Chi_Minh:${dtStart}`,
      'DURATION:PT10M',
      'RRULE:FREQ=DAILY',
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${summary}`,
      `TRIGGER:${triggerStr}`,
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return {
    icsContent: `${lines.join('\r\n')}\r\n`,
    eventCount: enabledMeds.length,
  };
}

export function downloadMedicationAlarmIcs(params: {
  medications: MedicationSchedule[];
  patientName?: string;
  leadMinutes?: number;
}): { exported: boolean; eventCount: number } {
  const result = buildMedicationAlarmIcs(params);
  if (result.eventCount === 0 || typeof document === 'undefined') {
    return { exported: false, eventCount: 0 };
  }

  const blob = new Blob([result.icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'vitapulse-lich-uong-thuoc.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { exported: true, eventCount: result.eventCount };
}

import { HealthStatusLevel, VitalRecord } from '../types/health';

export interface EmergencyAlertEvaluation {
  isAlarming: boolean;
  reasons: string[];
}

/**
 * Chuẩn hóa số điện thoại thành chuỗi tel: hợp lệ cho nút gọi 1 chạm.
 * Trả về null nếu chưa nhập số hoặc là chuỗi giữ chỗ ("Chưa cập nhật").
 */
export function sanitizeTelHref(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  const cleaned = rawPhone.replace(/[\s().-]+/g, '').trim();
  if (!cleaned) return null;
  if (/^(112|113|114|115)$/.test(cleaned)) {
    return `tel:${cleaned}`;
  }
  if (/^(\+84|84|0)\d{8,10}$/.test(cleaned) || /^(\+)?\d{8,13}$/.test(cleaned)) {
    return `tel:${cleaned}`;
  }
  return null;
}

export function formatEmergencyPhoneDisplay(rawPhone?: string | null): string {
  const href = sanitizeTelHref(rawPhone);
  if (!href) return 'Chưa lưu số điện thoại';
  return (rawPhone || '').trim();
}

export interface EmergencyContactInput {
  emergencyContactName: string;
  emergencyContactPhone: string;
  primaryDoctor: string;
  primaryDoctorPhone: string;
}

export function validateEmergencyContactsForm(input: EmergencyContactInput): {
  valid: boolean;
  error?: string;
  normalized: EmergencyContactInput;
} {
  const familyName = input.emergencyContactName.trim();
  const familyPhone = input.emergencyContactPhone.trim();
  const doctorName = input.primaryDoctor.trim();
  const doctorPhone = input.primaryDoctorPhone.trim();

  const familyHref = familyPhone ? sanitizeTelHref(familyPhone) : null;
  const doctorHref = doctorPhone ? sanitizeTelHref(doctorPhone) : null;

  if (familyPhone && !familyHref) {
    return {
      valid: false,
      error: 'Số điện thoại người thân chưa đúng (cần 8–12 chữ số, VD: 0912 345 678).',
      normalized: input,
    };
  }

  if (doctorPhone && !doctorHref) {
    return {
      valid: false,
      error: 'Số điện thoại bác sĩ chưa đúng (cần 8–12 chữ số, VD: 028 3855 4269).',
      normalized: input,
    };
  }

  if (!familyHref && !doctorHref) {
    return {
      valid: false,
      error: 'Vui lòng nhập ít nhất 1 số điện thoại (người thân hoặc bác sĩ gia đình).',
      normalized: input,
    };
  }

  return {
    valid: true,
    normalized: {
      emergencyContactName: familyName || 'Người thân gia đình',
      emergencyContactPhone: familyPhone || 'Chưa cập nhật',
      primaryDoctor: doctorName || 'Bác sĩ gia đình',
      primaryDoctorPhone: doctorPhone,
    },
  };
}

export function evaluateEmergencyVitalAlert(params: {
  bpStatus: HealthStatusLevel;
  gluStatus: HealthStatusLevel;
  scoreStatus: HealthStatusLevel;
  latestVital: VitalRecord;
}): EmergencyAlertEvaluation {
  const { bpStatus, gluStatus, scoreStatus, latestVital } = params;
  const reasons: string[] = [];

  if (bpStatus === 'critical' || latestVital.systolic >= 140 || latestVital.diastolic >= 90) {
    reasons.push(`Huyết áp cao (${latestVital.systolic}/${latestVital.diastolic} mmHg)`);
  }
  if (gluStatus === 'critical') {
    reasons.push(`Đường huyết báo động (${latestVital.bloodGlucose} mg/dL)`);
  }
  if (latestVital.spo2 > 0 && latestVital.spo2 < 92) {
    reasons.push(`SpO2 thấp (${latestVital.spo2}%)`);
  }
  if (latestVital.heartRate >= 120 || (latestVital.heartRate > 0 && latestVital.heartRate <= 45)) {
    reasons.push(`Nhịp tim bất thường (${latestVital.heartRate} lần/phút)`);
  }

  const isAlarming =
    bpStatus === 'critical' ||
    gluStatus === 'critical' ||
    scoreStatus === 'critical' ||
    reasons.length > 0;

  return { isAlarming, reasons };
}

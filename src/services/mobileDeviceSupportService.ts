import { ExtractedMedicalImageResponse } from '../utils/aiHealthGuardrails';

export interface MobileDeviceCapabilities {
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isWebBluetoothAvailable: boolean;
  recommendedInputHint: string;
}

export function detectMobileCapabilities(
  userAgentInput?: string,
  hasBluetoothInput?: boolean
): MobileDeviceCapabilities {
  const ua =
    userAgentInput !== undefined
      ? userAgentInput
      : typeof navigator !== 'undefined'
      ? navigator.userAgent || ''
      : '';
  const hasBluetooth =
    hasBluetoothInput !== undefined
      ? hasBluetoothInput
      : typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const isIOS = /iPad|iPhone|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Edg|Android/i.test(ua);
  const isWebBluetoothAvailable = Boolean(hasBluetooth) && !isIOS;

  let recommendedInputHint =
    'Chụp ảnh màn hình máy đo hoặc kết nối Bluetooth (Chrome Android / máy tính) để điền số nhanh.';
  if (isIOS) {
    recommendedInputHint =
      'Trên iPhone: hãy bấm “Chụp ảnh máy đo” để tự điền chỉ số (Safari chưa hỗ trợ Bluetooth web).';
  } else if (!isWebBluetoothAvailable) {
    recommendedInputHint =
      'Trình duyệt hiện tại chưa bật Bluetooth web — hãy dùng “Chụp ảnh máy đo” để điền nhanh.';
  }

  return {
    isIOS,
    isAndroid,
    isSafari,
    isWebBluetoothAvailable,
    recommendedInputHint,
  };
}

export interface ParsedMeterPhotoReading {
  systolic: number;
  diastolic: number;
  heartRate: number;
  note: string;
  confidenceNote: string;
  isEmergency: boolean;
  emergencyMessage?: string;
}

export function parseCameraMeterResponse(
  data: ExtractedMedicalImageResponse
): ParsedMeterPhotoReading | null {
  if (!data?.bpReading) return null;
  const sys = Math.round(Number(data.bpReading.systolic) || 0);
  const dia = Math.round(Number(data.bpReading.diastolic) || 0);
  const hr = Math.round(Number(data.bpReading.heartRate) || 72);
  if (sys <= 0 || dia <= 0) return null;

  return {
    systolic: Math.max(60, Math.min(250, sys)),
    diastolic: Math.max(40, Math.min(160, dia)),
    heartRate: Math.max(35, Math.min(220, hr)),
    note: data.bpReading.measurementNote || 'Đọc từ ảnh màn hình máy đo huyết áp',
    confidenceNote:
      data.confidenceNote || 'Vui lòng đối chiếu lại số trên màn hình máy đo trước khi bấm Lưu.',
    isEmergency: Boolean(data.isEmergency),
    emergencyMessage: data.emergencyCall115Message,
  };
}

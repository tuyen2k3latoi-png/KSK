import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bluetooth,
  Calendar,
  CheckCircle2,
  Cloud,
  ExternalLink,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  MealEntry,
  MedicationSchedule,
  UserMedicalProfile,
  VitalRecord,
  WorkoutEntry,
} from '../types/health';
import {
  getAccessToken,
  googleSignIn,
  logout,
  syncFullHealthDatasetToFirestore,
} from '../services/firebaseService';
import {
  createCalendarHealthEvent,
  deleteCalendarHealthEvent,
  GoogleCalendarHealthEvent,
  listUpcomingHealthEvents,
} from '../services/calendarService';
import {
  BleMeasurementResult,
  decodeSampleBleGattPacket,
  isWebBluetoothSupported,
  scanAndReadBleMedicalDevice,
} from '../services/bleService';
import { formatDateDdMmYyyy, formatTime24h } from '../utils/formatters';
import { Card } from './ui/Primitives';

interface ConnectedEcosystemPanelProps {
  user: User | null;
  hasCalendarToken: boolean;
  onAuthSuccess: (user: User, hasToken: boolean) => void;
  onSignOut: () => void;
  profile: UserMedicalProfile;
  waterIntakeMl: number;
  vitals: VitalRecord[];
  meals: MealEntry[];
  workouts: WorkoutEntry[];
  medications: MedicationSchedule[];
  onRecordBleVital: (vital: Omit<VitalRecord, 'id'>) => void;
}

type PendingCalendarMutation =
  | {
      type: 'create_checkup';
      summary: string;
      description: string;
      location: string;
      date: string;
      time: string;
      durationMinutes: number;
    }
  | {
      type: 'sync_medications';
      date: string;
      medications: MedicationSchedule[];
    }
  | {
      type: 'delete_event';
      eventId: string;
      summary: string;
    };

export const ConnectedEcosystemPanel: React.FC<ConnectedEcosystemPanelProps> = ({
  user,
  hasCalendarToken,
  onAuthSuccess,
  onSignOut,
  profile,
  waterIntakeMl,
  vitals,
  meals,
  workouts,
  medications,
  onRecordBleVital,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Cloud Firestore Sync State
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<string | null>(null);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string | null>(null);

  // Google Calendar State
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarHealthEvent[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarMsg, setCalendarMsg] = useState<string | null>(null);
  const [checkupTitle, setCheckupTitle] = useState(
    `Tái khám Tim mạch định kỳ — ${profile.primaryDoctor}`
  );
  const [checkupLocation, setCheckupLocation] = useState(profile.hospitalName);
  const [checkupDate, setCheckupDate] = useState('2026-11-15');
  const [checkupTime, setCheckupTime] = useState('08:30');
  const [checkupDuration] = useState(45);
  const [pendingMutation, setPendingMutation] = useState<PendingCalendarMutation | null>(null);

  // Bluetooth BLE State
  const [bleSupported] = useState<boolean>(() => isWebBluetoothSupported());
  const [isScanningBle, setIsScanningBle] = useState(false);
  const [bleReading, setBleReading] = useState<BleMeasurementResult | null>(null);
  const [bleStatusMsg, setBleStatusMsg] = useState<string | null>(null);

  const loadCalendarEvents = async () => {
    const token = await getAccessToken();
    if (!token) return;
    setIsLoadingCalendar(true);
    setCalendarMsg(null);
    try {
      const events = await listUpcomingHealthEvents(token, 8);
      setCalendarEvents(events);
    } catch (error) {
      setCalendarMsg(
        error instanceof Error ? error.message : 'Không thể tải danh sách lịch hẹn.'
      );
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  useEffect(() => {
    if (user && hasCalendarToken) {
      loadCalendarEvents();
    } else {
      setCalendarEvents([]);
    }
  }, [user, hasCalendarToken]);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      onAuthSuccess(res.user, Boolean(res.accessToken));
      setCloudStatusMsg('Đã đăng nhập Google và kết nối sao lưu đám mây thành công.');
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : 'Đăng nhập Google không thành công. Vui lòng thử lại.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOutClick = async () => {
    await logout();
    onSignOut();
    setCloudStatusMsg('Đã đăng xuất khỏi tài khoản sao lưu đám mây.');
  };

  const handleSyncToFirestore = async () => {
    if (!user) return;
    setIsSyncingCloud(true);
    setCloudStatusMsg(null);
    try {
      await syncFullHealthDatasetToFirestore({
        userId: user.uid,
        profile,
        waterIntakeMl,
        vitals,
        meals,
        workouts,
        medications,
      });
      const nowStr = new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setLastCloudSyncAt(nowStr);
      setCloudStatusMsg(
        `Đã sao lưu ${vitals.length} lần đo, ${meals.length} bữa ăn và ${medications.length} đơn thuốc lên đám mây an toàn.`
      );
    } catch (error) {
      setCloudStatusMsg(
        error instanceof Error ? error.message : 'Lỗi khi sao lưu dữ liệu lên đám mây.'
      );
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleConfirmCalendarMutation = async () => {
    if (!pendingMutation) return;
    const mutation = pendingMutation;
    setPendingMutation(null);

    const token = await getAccessToken();
    if (!token) {
      setCalendarMsg('Phiên truy cập Lịch Google đã hết hạn. Vui lòng bấm Đăng nhập lại.');
      return;
    }

    setIsLoadingCalendar(true);
    setCalendarMsg(null);
    try {
      if (mutation.type === 'create_checkup') {
        await createCalendarHealthEvent(token, {
          summary: mutation.summary,
          description: mutation.description,
          location: mutation.location,
          date: mutation.date,
          time: mutation.time,
          durationMinutes: mutation.durationMinutes,
        });
        setCalendarMsg(`Đã tạo lịch hẹn "${mutation.summary}" trên Lịch Google.`);
      } else if (mutation.type === 'sync_medications') {
        for (const med of mutation.medications) {
          await createCalendarHealthEvent(token, {
            summary: `[VitaPulse] Uống thuốc: ${med.medicationName} (${med.dosage})`,
            description: `Chỉ dẫn: ${med.mealInstruction} · Công dụng: ${med.purpose}`,
            location: 'Tại nhà — Sổ Sức khỏe VitaPulse',
            date: mutation.date,
            time: med.timeSlot,
            durationMinutes: 15,
          });
        }
        setCalendarMsg(
          `Đã thêm ${mutation.medications.length} cữ nhắc uống thuốc vào Lịch Google.`
        );
      } else if (mutation.type === 'delete_event') {
        await deleteCalendarHealthEvent(token, mutation.eventId);
        setCalendarMsg(`Đã xóa sự kiện "${mutation.summary}" khỏi Lịch Google.`);
      }
      await loadCalendarEvents();
    } catch (error) {
      setCalendarMsg(
        error instanceof Error ? error.message : 'Thao tác với Lịch Google chưa thành công.'
      );
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleScanRealBle = async () => {
    setIsScanningBle(true);
    setBleStatusMsg(null);
    try {
      const reading = await scanAndReadBleMedicalDevice();
      setBleReading(reading);
      setBleStatusMsg(`Đã nhận số đo từ thiết bị "${reading.deviceName}".`);
    } catch (error) {
      setBleStatusMsg(
        error instanceof Error
          ? error.message
          : 'Không tìm thấy thiết bị đo hoặc bạn đã hủy kết nối.'
      );
    } finally {
      setIsScanningBle(false);
    }
  };

  const handleDecodeSampleGatt = (preset: 'omron_bp_cuff' | 'polar_hr_strap') => {
    const reading = decodeSampleBleGattPacket(preset);
    setBleReading(reading);
    setBleStatusMsg(
      `Đã nhận kết quả đo từ thiết bị "${reading.deviceName}". Bấm "Lưu vào Sổ Sức khỏe" để ghi lại.`
    );
  };

  const handleSaveBleToVitals = () => {
    if (!bleReading) return;
    const latest = vitals[vitals.length - 1];
    const today = new Date().toISOString().slice(0, 10);
    onRecordBleVital({
      date: today,
      time: bleReading.timestamp,
      systolic: bleReading.systolic || latest?.systolic || 118,
      diastolic: bleReading.diastolic || latest?.diastolic || 76,
      heartRate: bleReading.heartRate || latest?.heartRate || 70,
      spo2: bleReading.spo2 || latest?.spo2 || 98,
      bloodGlucose: latest?.bloodGlucose || 94,
      glucoseContext: 'fasting',
      temperatureC: latest?.temperatureC || 36.6,
      weightKg: latest?.weightKg || 67.2,
      sleepHours: latest?.sleepHours || 7.4,
      steps: latest?.steps || 6840,
      deviceSource:
        bleReading.serviceType === 'blood_pressure' ? 'Máy đo Omron' : 'Smartwatch BLE',
      notes: `Đồng bộ từ thiết bị (${bleReading.deviceName})`,
    });
    setBleStatusMsg(
      `Đã lưu chỉ số từ "${bleReading.deviceName}" vào Sổ Sức khỏe${
        user ? ' và sao lưu lên tài khoản cá nhân' : ''
      }.`
    );
  };

  return (
    <div className="space-y-5">
      {/* Thanh kết nối tài khoản Google & Thiết bị */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B5F57] bg-[#0F766E]/10 border border-[#0F766E]/25 px-2.5 py-1 rounded-xl">
                <Cloud className="w-4 h-4 text-[#0F766E]" />
                <span>Sao lưu Sổ Sức khỏe &amp; Lịch Hẹn Khám</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F2937] bg-[#FAF7F2] border border-stone-200 px-2.5 py-1 rounded-xl">
                <Bluetooth className="w-4 h-4 text-[#0F766E]" />
                <span>Đồng bộ từ thiết bị đo</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] pt-1">
              Tiện ích Sao lưu Hồ sơ, Nhắc Lịch Tái khám &amp; Đồng bộ từ Thiết bị
            </h2>
            <p className="text-sm text-stone-600">
              Giúp bạn cất giữ sổ sức khỏe an toàn khi đổi điện thoại, tự động nhắc ngày giờ tái khám bác sĩ và nhận số đo trực tiếp từ máy đo huyết áp tại nhà.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {!user || !hasCalendarToken ? (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                data-testid="google-signin-button"
                className="min-h-[48px] inline-flex items-center justify-center gap-3 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FAF7F2] border border-stone-300 text-[#1F2937] text-sm font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
              >
                <div className="w-4 h-4 shrink-0">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-full h-full block"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span>
                  {isSigningIn
                    ? 'Đang kết nối tài khoản...'
                    : user
                    ? 'Bật Lịch Hẹn Google Calendar'
                    : 'Sign in with Google'}
                </span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                  <p className="font-bold">{user.displayName || user.email}</p>
                  <p className="text-emerald-800">Đã kết nối Sao lưu &amp; Lịch hẹn</p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOutClick}
                  className="min-h-[44px] px-3.5 py-2 rounded-2xl border border-stone-300 hover:bg-stone-100 text-xs font-bold text-[#1F2937] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {authError && (
          <div className="mt-3 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-sm text-[#DC2626] font-semibold">
            {authError}
          </div>
        )}
      </Card>

      {/* Lưới 3 cột tiện ích */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* 1. Sao lưu đám mây */}
        <Card className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-[#0F766E] shrink-0" />
                <h3 className="text-base font-bold text-[#1F2937]">
                  1. Sao lưu Sổ Sức khỏe An toàn
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-xl border ${
                  user
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                {user ? 'Đã kết nối' : 'Lưu trên máy này'}
              </span>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed">
              Cất giữ toàn bộ lịch sử đo huyết áp, đường huyết, bữa ăn và đơn thuốc trên tài khoản cá nhân để không bị mất khi đổi điện thoại.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-stone-100">
              <div>
                <p className="text-xs text-stone-500">Số lần đo đã lưu</p>
                <p className="text-base font-extrabold text-[#1F2937] tabular-nums">
                  {vitals.length} lần đo
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Bữa ăn &amp; Thuốc</p>
                <p className="text-base font-extrabold text-[#1F2937] tabular-nums">
                  {meals.length} bữa · {medications.length} thuốc
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 text-xs text-stone-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#1F2937]">
                <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                <span>Hướng dẫn nhanh:</span>
              </div>
              <p className="leading-relaxed">
                Bấm <strong>Sign in with Google</strong> ở góc trên, sau đó bấm nút bên dưới để sao lưu toàn bộ sổ sức khỏe.
              </p>
              {lastCloudSyncAt && (
                <p className="text-emerald-800 font-bold pt-1 tabular-nums">
                  Đã sao lưu lần cuối lúc: {formatTime24h(lastCloudSyncAt)}
                </p>
              )}
            </div>

            {cloudStatusMsg && (
              <div className="p-3 rounded-2xl bg-[#0F766E]/10 border border-[#0F766E]/25 text-xs font-semibold text-[#0B5F57]">
                {cloudStatusMsg}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-200/80">
            <button
              type="button"
              disabled={!user || isSyncingCloud}
              onClick={handleSyncToFirestore}
              data-testid="sync-firestore-btn"
              className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] disabled:bg-stone-200 disabled:text-stone-500 text-white text-sm font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>
                {!user
                  ? 'Đăng nhập Google để Sao lưu'
                  : isSyncingCloud
                  ? 'Đang sao lưu hồ sơ...'
                  : 'Sao lưu Toàn bộ Sổ Sức khỏe Ngay'}
              </span>
            </button>
          </div>
        </Card>

        {/* 2. Lịch tái khám & Nhắc thuốc trên Lịch Google */}
        <Card className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0F766E] shrink-0" />
                <h3 className="text-base font-bold text-[#1F2937]">
                  2. Hẹn Lịch Tái khám &amp; Nhắc Thuốc
                </h3>
              </div>
              {hasCalendarToken && (
                <button
                  type="button"
                  onClick={loadCalendarEvents}
                  className="text-xs font-bold text-[#0F766E] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCalendar ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5 text-sm">
              <label className="block font-bold text-[#1F2937]">
                Nội dung lịch tái khám / xét nghiệm
                <input
                  type="text"
                  value={checkupTitle}
                  onChange={(e) => setCheckupTitle(e.target.value)}
                  className="mt-1 w-full min-h-[44px] px-3 py-1.5 text-sm bg-white border border-stone-300 rounded-2xl text-[#1F2937] font-normal"
                />
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <label className="block font-bold text-[#1F2937]">
                  Ngày đi khám
                  <input
                    type="date"
                    value={checkupDate}
                    onChange={(e) => setCheckupDate(e.target.value)}
                    className="mt-1 w-full min-h-[44px] px-3 py-1.5 text-sm bg-white border border-stone-300 rounded-2xl tabular-nums font-normal"
                  />
                </label>
                <label className="block font-bold text-[#1F2937]">
                  Giờ hẹn (24h)
                  <input
                    type="time"
                    value={checkupTime}
                    onChange={(e) => setCheckupTime(e.target.value)}
                    className="mt-1 w-full min-h-[44px] px-3 py-1.5 text-sm bg-white border border-stone-300 rounded-2xl tabular-nums font-normal"
                  />
                </label>
              </div>
              <label className="block font-bold text-[#1F2937]">
                Bệnh viện / Phòng khám
                <input
                  type="text"
                  value={checkupLocation}
                  onChange={(e) => setCheckupLocation(e.target.value)}
                  className="mt-1 w-full min-h-[44px] px-3 py-1.5 text-sm bg-white border border-stone-300 rounded-2xl text-[#1F2937] font-normal"
                />
              </label>
            </div>

            {calendarMsg && (
              <div className="p-3 rounded-2xl bg-[#0F766E]/10 border border-[#0F766E]/25 text-xs font-semibold text-[#0B5F57]">
                {calendarMsg}
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-bold text-[#1F2937]">
                Lịch hẹn sắp tới ({calendarEvents.length}):
              </p>
              {!hasCalendarToken ? (
                <p className="text-xs text-stone-600">
                  Đăng nhập Google để điện thoại tự động nhắc lịch tái khám bác sĩ trước 30 phút.
                </p>
              ) : calendarEvents.length === 0 ? (
                <p className="text-xs text-stone-600">
                  Chưa có lịch hẹn nào sắp tới. Hãy chọn ngày giờ và bấm Đặt lịch Tái khám bên dưới.
                </p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {calendarEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className="py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#1F2937] truncate">{ev.summary}</p>
                        <p className="text-stone-600 tabular-nums truncate">
                          {formatDateDdMmYyyy(ev.startDateTime.slice(0, 10))} ·{' '}
                          {formatTime24h(ev.startDateTime.slice(11, 16))}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {ev.htmlLink && (
                          <a
                            href={ev.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-stone-500 hover:text-[#0F766E]"
                            title="Mở Lịch"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setPendingMutation({
                              type: 'delete_event',
                              eventId: ev.id,
                              summary: ev.summary,
                            })
                          }
                          className="p-1.5 text-stone-500 hover:text-[#DC2626] cursor-pointer"
                          title="Xóa lịch hẹn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!hasCalendarToken || isLoadingCalendar}
              onClick={() =>
                setPendingMutation({
                  type: 'create_checkup',
                  summary: checkupTitle,
                  description: `Bệnh nhân: ${profile.fullName} · Huyết áp gần nhất: ${
                    vitals[vitals.length - 1]?.systolic || 118
                  }/${vitals[vitals.length - 1]?.diastolic || 76} mmHg`,
                  location: checkupLocation,
                  date: checkupDate,
                  time: checkupTime,
                  durationMinutes: checkupDuration,
                })
              }
              className="min-h-[48px] px-3 py-2 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] disabled:bg-stone-200 disabled:text-stone-500 text-white text-xs sm:text-sm font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Đặt lịch Tái khám</span>
            </button>
            <button
              type="button"
              disabled={!hasCalendarToken || isLoadingCalendar}
              onClick={() =>
                setPendingMutation({
                  type: 'sync_medications',
                  date: checkupDate,
                  medications,
                })
              }
              className="min-h-[48px] px-3 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-300 disabled:bg-stone-100 disabled:text-stone-400 text-[#1F2937] text-xs sm:text-sm font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#0F766E]" />
              <span>Nhắc {medications.length} cữ thuốc</span>
            </button>
          </div>
        </Card>

        {/* 3. Đồng bộ từ thiết bị đo Bluetooth */}
        <Card className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Bluetooth className="w-5 h-5 text-[#0F766E] shrink-0" />
                <h3 className="text-base font-bold text-[#1F2937]">
                  3. Đồng bộ từ Thiết bị Đo
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-xl border ${
                  bleSupported
                    ? 'bg-[#0F766E]/10 text-[#0B5F57] border-[#0F766E]/25'
                    : 'bg-amber-50 text-amber-950 border-amber-300'
                }`}
              >
                {bleSupported ? 'Sẵn sàng kết nối' : 'Chế độ đọc thử'}
              </span>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed">
              Nhận kết quả đo từ máy đo huyết áp bắp tay (Omron, Beurer...) hoặc thiết bị đeo sức khỏe có bật Bluetooth mà không cần gõ từng con số.
            </p>

            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-600">
                Bấm để thử đồng bộ số đo từ thiết bị:
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDecodeSampleGatt('omron_bp_cuff')}
                  data-testid="ble-sample-omron-btn"
                  className="min-h-[52px] px-3 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-200 text-[#1F2937] text-xs font-bold transition-colors text-left cursor-pointer"
                >
                  <span className="block text-[#1F2937]">Máy đo Huyết áp Omron</span>
                  <span className="text-stone-600 font-normal">Đọc Huyết áp &amp; Nhịp tim</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDecodeSampleGatt('polar_hr_strap')}
                  data-testid="ble-sample-polar-btn"
                  className="min-h-[52px] px-3 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-200 text-[#1F2937] text-xs font-bold transition-colors text-left cursor-pointer"
                >
                  <span className="block text-[#1F2937]">Đồng hồ Sức khỏe</span>
                  <span className="text-stone-600 font-normal">Đọc Nhịp tim &amp; Oxy máu</span>
                </button>
              </div>
            </div>

            {bleReading && (
              <div
                data-testid="ble-decoded-card"
                className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#0F766E]/30 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1F2937] truncate">
                    {bleReading.deviceName.replace(/\s*\(GATT[^)]*\)/g, '')}
                  </span>
                  <span className="tabular-nums font-bold text-[#0B5F57]">
                    Đo lúc {formatTime24h(bleReading.timestamp)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-stone-200/80 tabular-nums">
                  <div>
                    <p className="text-xs text-stone-500">Huyết áp</p>
                    <p className="text-sm font-extrabold text-[#1F2937]">
                      {bleReading.systolic || 118}/{bleReading.diastolic || 76}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Nhịp tim</p>
                    <p className="text-sm font-extrabold text-[#0F766E]">
                      {bleReading.heartRate || 70} nhịp/p
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Oxy máu</p>
                    <p className="text-sm font-extrabold text-[#0B5F57]">
                      {bleReading.spo2 || 98}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-stone-600 truncate">
                    Đã nhận đủ số đo từ thiết bị
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveBleToVitals}
                    data-testid="save-ble-vital-btn"
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Lưu vào Sổ Sức khỏe
                  </button>
                </div>
              </div>
            )}

            {bleStatusMsg && (
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-xs font-semibold text-[#1F2937]">
                {bleStatusMsg}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-200/80">
            <button
              type="button"
              onClick={handleScanRealBle}
              disabled={isScanningBle}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bluetooth className="w-4 h-4" />
              <span>
                {isScanningBle
                  ? 'Đang dò tìm máy đo...'
                  : 'Dò tìm & Đồng bộ từ Thiết bị Thực tế'}
              </span>
            </button>
          </div>
        </Card>
      </div>

      {/* Hộp thoại xác nhận trước khi thay đổi Lịch Google */}
      {pendingMutation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-confirm-title"
        >
          <div className="bg-white border border-stone-200 rounded-[24px] max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-[#F59E0B] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4
                  id="calendar-confirm-title"
                  className="text-base font-bold text-[#1F2937]"
                >
                  Xác nhận lưu lịch hẹn trên Lịch Google
                </h4>
                <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                  {pendingMutation.type === 'create_checkup' &&
                    `Bạn có muốn thêm lịch hẹn "${pendingMutation.summary}" vào ngày ${formatDateDdMmYyyy(pendingMutation.date)} lúc ${formatTime24h(pendingMutation.time)} trên Lịch Google cá nhân không?`}
                  {pendingMutation.type === 'sync_medications' &&
                    `Bạn có muốn tạo ${pendingMutation.medications.length} lịch nhắc uống thuốc trong ngày ${formatDateDdMmYyyy(pendingMutation.date)} trên Lịch Google cá nhân không?`}
                  {pendingMutation.type === 'delete_event' &&
                    `Bạn có muốn xóa lịch hẹn "${pendingMutation.summary}" khỏi Lịch Google cá nhân không?`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setPendingMutation(null)}
                className="min-h-[44px] px-4 py-2 rounded-2xl border border-stone-300 hover:bg-stone-100 text-sm font-bold text-[#1F2937] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCalendarMutation}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận thực hiện</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

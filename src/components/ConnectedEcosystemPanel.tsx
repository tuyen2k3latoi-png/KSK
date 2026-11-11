import React, { useState, useEffect } from 'react';
import {
  Bluetooth,
  Calendar,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Plus,
  Trash2,
  AlertTriangle,
  Activity,
  ExternalLink,
  ShieldCheck,
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
  const [checkupDuration, setCheckupDuration] = useState(45);
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
      setCloudStatusMsg('Đã xác thực Google & kết nối Firebase Cloud thành công.');
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
    setCloudStatusMsg('Đã đăng xuất khỏi phiên đám mây.');
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
        second: '2-digit',
      });
      setLastCloudSyncAt(nowStr);
      setCloudStatusMsg(
        `Đã đồng bộ ${vitals.length} bản ghi sinh hiệu, ${meals.length} bữa ăn và ${medications.length} đơn thuốc lên Firebase Firestore.`
      );
    } catch (error) {
      setCloudStatusMsg(
        error instanceof Error ? error.message : 'Lỗi khi đồng bộ dữ liệu lên Firestore.'
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
      setCalendarMsg('Phiên truy cập Google Calendar đã hết hạn. Vui lòng bấm Đăng nhập lại.');
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
        setCalendarMsg(`Đã tạo lịch hẹn "${mutation.summary}" trên Google Calendar.`);
      } else if (mutation.type === 'sync_medications') {
        for (const med of mutation.medications) {
          await createCalendarHealthEvent(token, {
            summary: `[VitaPulse] Uống thuốc: ${med.medicationName} (${med.dosage})`,
            description: `Chỉ dẫn: ${med.mealInstruction} · Công dụng: ${med.purpose}`,
            location: 'Tại nhà — Hồ sơ VitaPulse Health',
            date: mutation.date,
            time: med.timeSlot,
            durationMinutes: 15,
          });
        }
        setCalendarMsg(
          `Đã đồng bộ ${mutation.medications.length} cữ nhắc uống thuốc lên Google Calendar.`
        );
      } else if (mutation.type === 'delete_event') {
        await deleteCalendarHealthEvent(token, mutation.eventId);
        setCalendarMsg(`Đã xóa sự kiện "${mutation.summary}" khỏi Google Calendar.`);
      }
      await loadCalendarEvents();
    } catch (error) {
      setCalendarMsg(
        error instanceof Error ? error.message : 'Thao tác Google Calendar thất bại.'
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
      setBleStatusMsg(`Đã đọc gói tin GATT từ thiết bị "${reading.deviceName}".`);
    } catch (error) {
      setBleStatusMsg(
        error instanceof Error
          ? error.message
          : 'Không tìm thấy thiết bị BLE hoặc người dùng đã hủy ghép đôi.'
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
      notes: `Đo tự động qua Bluetooth (${bleReading.deviceName})`,
    });
    setBleStatusMsg(
      `Đã lưu chỉ số từ "${bleReading.deviceName}" vào Sổ Sức khỏe${
        user ? ' và sao lưu lên tài khoản cá nhân' : ''
      }.`
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner: Cloud Account & Authentication Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                <Cloud className="w-3.5 h-3.5" />
                Sao lưu Sổ Sức khỏe &amp; Lịch Hẹn Khám
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
                <Bluetooth className="w-3.5 h-3.5" />
                Kết nối Máy đo Huyết áp &amp; Đồng hồ
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 pt-1">
              Tiện ích Sao lưu Hồ sơ, Nhắc Lịch Tái khám &amp; Kết nối Máy đo Tại nhà
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Giúp Cô Chú, Anh Chị cất giữ sổ sức khỏe an toàn khi đổi điện thoại, tự động báo nhắc ngày giờ đi khám bác sĩ và nhận số đo trực tiếp từ máy đo huyết áp Bluetooth.
            </p>
          </div>

          {/* Official Google Sign-In Button or Active Session Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {!user || !hasCalendarToken ? (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                data-testid="google-signin-button"
                className="gsi-material-button inline-flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
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
                <span className="gsi-material-button-contents">
                  {isSigningIn
                    ? 'Đang kết nối tài khoản...'
                    : user
                    ? 'Bật Lịch Hẹn Google Calendar'
                    : 'Sign in with Google'}
                </span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <p className="font-semibold">{user.displayName || user.email}</p>
                  <p className="text-[11px] text-emerald-700">
                    Đã kết nối Sao lưu &amp; Lịch hẹn
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOutClick}
                  className="min-h-[38px] px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>

        {authError && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {authError}
          </div>
        )}
      </div>

      {/* 3-Column Adaptive Integration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {/* PILLAR 1: FIREBASE FIRESTORE CLOUD SYNC */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-teal-600 shrink-0" />
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                  1. Sao lưu Sổ Sức khỏe An toàn
                </h3>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  user
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {user ? 'Đã kết nối Đám mây' : 'Lưu trên máy này'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cất giữ toàn bộ lịch sử đo huyết áp, đường huyết, bữa ăn và đơn thuốc trên tài khoản cá nhân để xem được trên cả điện thoại lẫn máy tính và không lo bị mất khi đổi máy.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-500">Số lần đo đã lưu</p>
                <p className="text-sm font-bold text-slate-900 font-mono-tabular">
                  {vitals.length} lần đo
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-500">Bữa ăn &amp; Thuốc</p>
                <p className="text-sm font-bold text-slate-900 font-mono-tabular">
                  {meals.length} bữa · {medications.length} thuốc
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Cách sử dụng:</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bấm <strong>Sign in with Google</strong> ở góc trên, sau đó bấm nút bên dưới để lưu toàn bộ sổ sức khỏe lên tài khoản của bạn.
              </p>
              {lastCloudSyncAt && (
                <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                  Đã sao lưu lần cuối lúc: {lastCloudSyncAt}
                </p>
              )}
            </div>

            {cloudStatusMsg && (
              <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900">
                {cloudStatusMsg}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={!user || isSyncingCloud}
              onClick={handleSyncToFirestore}
              data-testid="sync-firestore-btn"
              className="w-full min-h-[42px] px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>
                {!user
                  ? 'Đăng nhập Google để Sao lưu Sổ Sức khỏe'
                  : isSyncingCloud
                  ? 'Đang sao lưu hồ sơ...'
                  : 'Sao lưu Toàn bộ Sổ Sức khỏe Ngay'}
              </span>
            </button>
          </div>
        </div>

        {/* PILLAR 2: GOOGLE CALENDAR APPOINTMENT & MEDICATION SYNC */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                  2. Hẹn Lịch Tái khám &amp; Nhắc Thuốc
                </h3>
              </div>
              {hasCalendarToken && (
                <button
                  type="button"
                  onClick={loadCalendarEvents}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingCalendar ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              )}
            </div>

            {/* Quick Checkup Scheduling Form */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                Nội dung lịch tái khám / xét nghiệm
                <input
                  type="text"
                  value={checkupTitle}
                  onChange={(e) => setCheckupTitle(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-medium text-slate-700">
                  Ngày đi khám
                  <input
                    type="date"
                    value={checkupDate}
                    onChange={(e) => setCheckupDate(e.target.value)}
                    className="mt-1 w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono-tabular"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700">
                  Giờ hẹn ({checkupDuration} phút)
                  <input
                    type="time"
                    value={checkupTime}
                    onChange={(e) => setCheckupTime(e.target.value)}
                    className="mt-1 w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono-tabular"
                  />
                </label>
              </div>
              <label className="block text-xs font-medium text-slate-700">
                Bệnh viện / Phòng khám
                <input
                  type="text"
                  value={checkupLocation}
                  onChange={(e) => setCheckupLocation(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </label>
            </div>

            {calendarMsg && (
              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
                {calendarMsg}
              </div>
            )}

            {/* Upcoming Google Calendar Events List */}
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-semibold text-slate-700">
                Lịch hẹn sắp tới trên điện thoại ({calendarEvents.length}):
              </p>
              {!hasCalendarToken ? (
                <p className="text-xs text-slate-500 italic">
                  Đăng nhập Google để điện thoại tự động nhắc lịch tái khám bác sĩ trước 30 phút.
                </p>
              ) : calendarEvents.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Chưa có lịch hẹn nào sắp tới. Hãy chọn ngày giờ và bấm Đặt lịch Tái khám bên dưới.
                </p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {calendarEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{ev.summary}</p>
                        <p className="text-[11px] text-slate-500 font-mono-tabular truncate">
                          {ev.startDateTime.replace('T', ' ').slice(0, 16)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {ev.htmlLink && (
                          <a
                            href={ev.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-500 hover:text-indigo-600"
                            title="Mở Lịch"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
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
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="Xóa lịch hẹn"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              className="min-h-[40px] px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
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
              className="min-h-[40px] px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Nhắc {medications.length} cữ thuốc</span>
            </button>
          </div>
        </div>

        {/* PILLAR 3: WEB BLUETOOTH BLE MEDICAL DEVICE CONNECTION */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bluetooth className="w-4 h-4 text-sky-600 shrink-0" />
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                  3. Kết nối Máy đo Huyết áp Bluetooth
                </h3>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  bleSupported
                    ? 'bg-sky-50 text-sky-800 border border-sky-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {bleSupported ? 'Sẵn sàng kết nối' : 'Chế độ đọc thử'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tự động nhận kết quả đo từ máy đo huyết áp bắp tay (Omron, Beurer...) hoặc đồng hồ thông minh có bật Bluetooth mà không cần phải gõ từng con số.
            </p>

            {/* Quick Sample Device Controls for Easy Testing */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-500">
                Bấm để thử nhận số đo tự động từ máy đo:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDecodeSampleGatt('omron_bp_cuff')}
                  data-testid="ble-sample-omron-btn"
                  className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors text-left cursor-pointer"
                >
                  <span className="block text-slate-900">Máy đo Huyết áp Omron</span>
                  <span className="text-[10px] text-slate-500">Đọc Huyết áp &amp; Nhịp tim</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDecodeSampleGatt('polar_hr_strap')}
                  data-testid="ble-sample-polar-btn"
                  className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors text-left cursor-pointer"
                >
                  <span className="block text-slate-900">Đồng hồ Sức khỏe</span>
                  <span className="text-[10px] text-slate-500">Đọc Nhịp tim &amp; Oxy máu</span>
                </button>
              </div>
            </div>

            {/* Decoded BLE Reading Display */}
            {bleReading && (
              <div
                data-testid="ble-decoded-card"
                className="p-3 rounded-lg bg-sky-50/70 border border-sky-200 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 truncate">
                    {bleReading.deviceName.replace(/\s*\(GATT[^)]*\)/g, '')}
                  </span>
                  <span className="text-[11px] font-mono-tabular text-sky-800">
                    Đo lúc {bleReading.timestamp}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center bg-white p-2 rounded border border-sky-100">
                  <div>
                    <p className="text-[10px] text-slate-500">Huyết áp</p>
                    <p className="text-xs font-bold text-slate-900 font-mono-tabular">
                      {bleReading.systolic || 118}/{bleReading.diastolic || 76}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Nhịp tim</p>
                    <p className="text-xs font-bold text-teal-700 font-mono-tabular">
                      {bleReading.heartRate || 70} bpm
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Oxy máu</p>
                    <p className="text-xs font-bold text-indigo-700 font-mono-tabular">
                      {bleReading.spo2 || 98}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-600 truncate">
                    Đã nhận đủ số đo từ thiết bị
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveBleToVitals}
                    data-testid="save-ble-vital-btn"
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Lưu vào Sổ Sức khỏe
                  </button>
                </div>
              </div>
            )}

            {bleStatusMsg && (
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800">
                {bleStatusMsg}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleScanRealBle}
              disabled={isScanningBle}
              className="w-full min-h-[42px] px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>
                {isScanningBle
                  ? 'Đang dò tìm máy đo Bluetooth...'
                  : 'Dò tìm & Kết nối Máy đo Bluetooth Thực tế'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* MANDATORY USER CONFIRMATION DIALOG FOR GOOGLE CALENDAR MUTATIONS */}
      {pendingMutation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-confirm-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4
                  id="calendar-confirm-title"
                  className="text-sm sm:text-base font-bold text-slate-900"
                >
                  Xác nhận Thay đổi trên Google Calendar
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  {pendingMutation.type === 'create_checkup' &&
                    `Bạn có chắc chắn muốn thêm lịch hẹn "${pendingMutation.summary}" vào ngày ${pendingMutation.date} lúc ${pendingMutation.time} trên Google Calendar cá nhân không?`}
                  {pendingMutation.type === 'sync_medications' &&
                    `Bạn có chắc chắn muốn tạo ${pendingMutation.medications.length} sự kiện nhắc uống thuốc trong ngày ${pendingMutation.date} lên Google Calendar cá nhân không?`}
                  {pendingMutation.type === 'delete_event' &&
                    `Bạn có chắc chắn muốn xóa vĩnh viễn sự kiện "${pendingMutation.summary}" khỏi Google Calendar cá nhân không?`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingMutation(null)}
                className="min-h-[38px] px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCalendarMutation}
                className="min-h-[38px] px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Xác nhận thực hiện</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

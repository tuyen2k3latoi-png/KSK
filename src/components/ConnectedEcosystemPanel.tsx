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
  onSignOut,
  profile,
  waterIntakeMl,
  vitals,
  meals,
  workouts,
  medications,
  onRecordBleVital,
}) => {

  // Cloud Firestore Sync State
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<string | null>(null);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string | null>(null);

  // Google Calendar State
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarHealthEvent[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarMsg, setCalendarMsg] = useState<string | null>(null);
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [checkupTitle, setCheckupTitle] = useState(`Tái khám — ${profile.primaryDoctor}`);
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
        error instanceof Error ? error.message : 'Không thể tải lịch hẹn.'
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

  const handleSignOutClick = async () => {
    await logout();
    onSignOut();
    setCloudStatusMsg('Đã đăng xuất phiên đồng bộ đám mây.');
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
      setCloudStatusMsg('Đã sao lưu toàn bộ sổ sức khỏe lên đám mây.');
    } catch (error) {
      setCloudStatusMsg(
        error instanceof Error ? error.message : 'Sao lưu chưa thành công.'
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
      setCalendarMsg('Cần đăng nhập lại Google để tạo lịch.');
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
        setCalendarMsg(`Đã thêm lịch "${mutation.summary}".`);
        setShowCalendarForm(false);
      } else if (mutation.type === 'sync_medications') {
        for (const med of mutation.medications) {
          await createCalendarHealthEvent(token, {
            summary: `[VitaPulse] Uống thuốc: ${med.medicationName} (${med.dosage})`,
            description: `${med.mealInstruction}`,
            location: 'Tại nhà',
            date: mutation.date,
            time: med.timeSlot,
            durationMinutes: 15,
          });
        }
        setCalendarMsg(`Đã thêm ${mutation.medications.length} cữ thuốc vào Lịch Google.`);
      } else if (mutation.type === 'delete_event') {
        await deleteCalendarHealthEvent(token, mutation.eventId);
        setCalendarMsg(`Đã xóa lịch "${mutation.summary}".`);
      }
      await loadCalendarEvents();
    } catch (error) {
      setCalendarMsg(
        error instanceof Error ? error.message : 'Thao tác chưa thành công.'
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
      setBleStatusMsg(`Đã nhận số đo từ "${reading.deviceName}".`);
    } catch (error) {
      setBleStatusMsg(
        error instanceof Error
          ? error.message
          : 'Không tìm thấy máy đo Bluetooth.'
      );
    } finally {
      setIsScanningBle(false);
    }
  };

  const handleDecodeSampleGatt = (preset: 'omron_bp_cuff' | 'polar_hr_strap') => {
    const reading = decodeSampleBleGattPacket(preset);
    setBleReading(reading);
    setBleStatusMsg(`Đã đọc số đo từ "${reading.deviceName}".`);
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
    setBleStatusMsg(`Đã lưu số đo từ "${bleReading.deviceName}" vào Sổ.`);
  };

  return (
    <div className="space-y-4">
      {/* Thanh trạng thái sao lưu & thiết bị */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1F2937]">
              Sao lưu &amp; Đồng bộ thiết bị
            </h2>
            <p className="text-sm text-stone-600">
              Cất giữ sổ online bằng tài khoản số điện thoại và đọc máy đo Bluetooth.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-950">
                  {user.displayName || user.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOutClick}
                  className="min-h-[40px] px-3 py-1.5 rounded-2xl border border-stone-300 hover:bg-stone-100 text-xs font-bold text-[#1F2937] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <span className="px-3.5 py-2 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-xs font-bold text-stone-700">
                Đang lưu trực tiếp trên máy
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Lưới 3 cột tiện ích */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* 1. Sao lưu đám mây */}
        <Card className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-[#0F766E] shrink-0" />
                <h3 className="text-base font-bold text-[#1F2937]">1. Sao lưu Đám mây</h3>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-xl border ${
                  user
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                {user ? 'Đã kết nối' : 'Trên máy'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 tabular-nums">
              <div className="p-3 rounded-2xl bg-[#FAF7F2]">
                <p className="text-xs text-stone-500">Lần đo</p>
                <p className="text-lg font-extrabold text-[#1F2937]">{vitals.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF7F2]">
                <p className="text-xs text-stone-500">Thuốc &amp; Bữa ăn</p>
                <p className="text-lg font-extrabold text-[#1F2937]">
                  {medications.length} · {meals.length}
                </p>
              </div>
            </div>

            {lastCloudSyncAt && (
              <p className="text-xs text-emerald-800 font-bold tabular-nums">
                Sao lưu gần nhất: {formatTime24h(lastCloudSyncAt)}
              </p>
            )}

            {cloudStatusMsg && (
              <div className="p-3 rounded-2xl bg-[#0F766E]/10 border border-[#0F766E]/25 text-xs font-semibold text-[#0B5F57]">
                {cloudStatusMsg}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!user || isSyncingCloud}
            onClick={handleSyncToFirestore}
            data-testid="sync-firestore-btn"
            className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] disabled:bg-stone-200 disabled:text-stone-500 text-white text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
            <span>
              {!user
                ? 'Đăng nhập SĐT để sao lưu'
                : isSyncingCloud
                ? 'Đang sao lưu...'
                : 'Sao lưu ngay'}
            </span>
          </button>
        </Card>

        {/* 2. Lịch tái khám */}
        <Card className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0F766E] shrink-0" />
                <h3 className="text-base font-bold text-[#1F2937]">2. Lịch tái khám</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarForm((prev) => !prev)}
                className="px-3 py-1 rounded-xl bg-[#FAF7F2] border border-stone-200 text-xs font-bold text-[#0B5F57] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showCalendarForm ? 'Đóng' : 'Đặt lịch'}</span>
              </button>
            </div>

            {showCalendarForm && (
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-2 text-sm">
                <input
                  type="text"
                  value={checkupTitle}
                  onChange={(e) => setCheckupTitle(e.target.value)}
                  placeholder="Nội dung khám"
                  className="w-full min-h-[40px] px-3 py-1.5 text-sm bg-white border border-stone-300 rounded-xl"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={checkupDate}
                    onChange={(e) => setCheckupDate(e.target.value)}
                    className="w-full min-h-[40px] px-2.5 py-1.5 text-sm bg-white border border-stone-300 rounded-xl tabular-nums"
                  />
                  <input
                    type="time"
                    value={checkupTime}
                    onChange={(e) => setCheckupTime(e.target.value)}
                    className="w-full min-h-[40px] px-2.5 py-1.5 text-sm bg-white border border-stone-300 rounded-xl tabular-nums"
                  />
                </div>
                <input
                  type="text"
                  value={checkupLocation}
                  onChange={(e) => setCheckupLocation(e.target.value)}
                  placeholder="Bệnh viện"
                  className="w-full min-h-[40px] px-3 py-1.5 text-sm bg-white border border-stone-300 rounded-xl"
                />
                <button
                  type="button"
                  disabled={!hasCalendarToken || isLoadingCalendar}
                  onClick={() =>
                    setPendingMutation({
                      type: 'create_checkup',
                      summary: checkupTitle,
                      description: `Bệnh nhân: ${profile.fullName}`,
                      location: checkupLocation,
                      date: checkupDate,
                      time: checkupTime,
                      durationMinutes: checkupDuration,
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0B5F57] disabled:bg-stone-200 disabled:text-stone-500 text-white text-sm font-bold cursor-pointer"
                >
                  Lưu lên Lịch Google
                </button>
              </div>
            )}

            {calendarMsg && (
              <div className="p-3 rounded-2xl bg-[#0F766E]/10 border border-[#0F766E]/25 text-xs font-semibold text-[#0B5F57]">
                {calendarMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#1F2937]">
                  Sắp tới ({calendarEvents.length}):
                </p>
                {hasCalendarToken && (
                  <button
                    type="button"
                    onClick={loadCalendarEvents}
                    className="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
                  >
                    Làm mới
                  </button>
                )}
              </div>

              {!hasCalendarToken ? (
                <p className="text-xs text-stone-600">
                  Các lịch uống thuốc và nhắc hẹn đang được nhắc bằng chuông báo thức trực tiếp trên ứng dụng.
                </p>
              ) : calendarEvents.length === 0 ? (
                <p className="text-xs text-stone-600">Chưa có lịch hẹn nào.</p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {calendarEvents.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-[#1F2937] truncate">{ev.summary}</p>
                        <p className="text-stone-600 tabular-nums">
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
            className="w-full min-h-[48px] px-3 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-300 disabled:bg-stone-100 disabled:text-stone-400 text-[#1F2937] text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#0F766E]" />
            <span>Nhắc {medications.length} cữ thuốc trên Lịch</span>
          </button>
        </Card>

        {/* 3. Thiết bị Bluetooth */}
        <Card className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Bluetooth className="w-5 h-5 text-[#0F766E] shrink-0" />
                <h3 className="text-base font-bold text-[#1F2937]">3. Máy đo Bluetooth</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-xl bg-[#0F766E]/10 text-[#0B5F57] border border-[#0F766E]/25">
                {bleSupported ? 'Sẵn sàng' : 'Đọc thử'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDecodeSampleGatt('omron_bp_cuff')}
                data-testid="ble-sample-omron-btn"
                className="min-h-[48px] px-3 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-200 text-[#1F2937] text-xs font-bold text-left cursor-pointer"
              >
                <span className="block">Máy đo Omron</span>
                <span className="text-stone-500 font-normal">Thử số đo HA</span>
              </button>
              <button
                type="button"
                onClick={() => handleDecodeSampleGatt('polar_hr_strap')}
                data-testid="ble-sample-polar-btn"
                className="min-h-[48px] px-3 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-200 text-[#1F2937] text-xs font-bold text-left cursor-pointer"
              >
                <span className="block">Đồng hồ đo</span>
                <span className="text-stone-500 font-normal">Thử nhịp tim</span>
              </button>
            </div>

            {bleReading && (
              <div
                data-testid="ble-decoded-card"
                className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#0F766E]/30 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#1F2937] truncate">
                    {bleReading.deviceName.replace(/\s*\(GATT[^)]*\)/g, '')}
                  </span>
                  <span className="tabular-nums text-[#0B5F57]">
                    {formatTime24h(bleReading.timestamp)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-stone-200/80 tabular-nums">
                  <div>
                    <p className="text-xs text-stone-500">HA</p>
                    <p className="text-sm font-extrabold text-[#1F2937]">
                      {bleReading.systolic || 118}/{bleReading.diastolic || 76}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Nhịp tim</p>
                    <p className="text-sm font-extrabold text-[#0F766E]">
                      {bleReading.heartRate || 70}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">SpO2</p>
                    <p className="text-sm font-extrabold text-[#0B5F57]">
                      {bleReading.spo2 || 98}%
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveBleToVitals}
                  data-testid="save-ble-vital-btn"
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-xs font-bold cursor-pointer"
                >
                  Lưu vào Sổ
                </button>
              </div>
            )}

            {bleStatusMsg && (
              <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-xs font-semibold text-[#1F2937]">
                {bleStatusMsg}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleScanRealBle}
            disabled={isScanningBle}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Bluetooth className="w-4 h-4" />
            <span>{isScanningBle ? 'Đang tìm...' : 'Tìm máy đo Bluetooth'}</span>
          </button>
        </Card>
      </div>

      {/* Hộp thoại xác nhận */}
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
                <h4 id="calendar-confirm-title" className="text-base font-bold text-[#1F2937]">
                  Xác nhận Lịch Google
                </h4>
                <p className="text-sm text-stone-600 mt-1">
                  {pendingMutation.type === 'create_checkup' &&
                    `Thêm lịch "${pendingMutation.summary}" ngày ${formatDateDdMmYyyy(pendingMutation.date)} lúc ${formatTime24h(pendingMutation.time)}?`}
                  {pendingMutation.type === 'sync_medications' &&
                    `Tạo ${pendingMutation.medications.length} nhắc uống thuốc ngày ${formatDateDdMmYyyy(pendingMutation.date)}?`}
                  {pendingMutation.type === 'delete_event' &&
                    `Xóa lịch "${pendingMutation.summary}"?`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setPendingMutation(null)}
                className="min-h-[44px] px-4 py-2 rounded-2xl border border-stone-300 text-sm font-bold text-[#1F2937] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCalendarMutation}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Đồng ý</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

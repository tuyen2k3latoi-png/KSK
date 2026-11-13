import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  CalendarPlus,
  Check,
  ChevronDown,
  Clock,
  FileHeart,
  Phone,
  Pill,
  Plus,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { downloadMedicationAlarmIcs } from '../services/calendarAlarmExportService';
import {
  LocalPushNotificationItem,
  MedicationNotificationSettings,
  MedicationSchedule,
  UserMedicalProfile,
} from '../types/health';
import {
  calculateMedicationAdherence,
  NextMedicationDoseInfo,
} from '../utils/healthCalculations';
import { formatTime24h } from '../utils/formatters';
import { Card, Chip, EmptyState, SectionHeader } from './ui/Primitives';

interface MedicationCareViewProps {
  medications: MedicationSchedule[];
  profile: UserMedicalProfile;
  notificationSettings: MedicationNotificationSettings;
  nextDoseInfo: NextMedicationDoseInfo | null;
  notificationHistory: LocalPushNotificationItem[];
  onToggleMedication: (id: string) => void;
  onAddMedication: (med: Omit<MedicationSchedule, 'id'>) => void;
  onUpdateMedicationReminder: (
    id: string,
    updates: Partial<Pick<MedicationSchedule, 'timeSlot' | 'reminderEnabled' | 'snoozedUntil'>>
  ) => void;
  onUpdateNotificationSettings: (updated: MedicationNotificationSettings) => void;
  onRequestBrowserPermission: () => void;
  onTriggerTestPush: (med?: MedicationSchedule) => void;
  onUpdateProfile: (updated: UserMedicalProfile) => void;
}

const QUICK_TIME_PRESETS = [
  { label: '07:00 (Sáng)', value: '07:00' },
  { label: '12:30 (Trưa)', value: '12:30' },
  { label: '19:00 (Tối)', value: '19:00' },
  { label: '21:30 (Tối muộn)', value: '21:30' },
];

export const MedicationCareView: React.FC<MedicationCareViewProps> = ({
  medications,
  profile,
  notificationSettings,
  nextDoseInfo,
  notificationHistory,
  onToggleMedication,
  onAddMedication,
  onUpdateMedicationReminder,
  onUpdateNotificationSettings,
  onRequestBrowserPermission,
  onTriggerTestPush,
  onUpdateProfile,
}) => {
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('1 viên');
  const [purpose, setPurpose] = useState('');
  const [timeSlot, setTimeSlot] = useState<string>('07:00');
  const [mealInstruction, setMealInstruction] =
    useState<MedicationSchedule['mealInstruction']>('Sau ăn 30 phút');
  const [formError, setFormError] = useState<string | null>(null);
  const [showAllNotifLogs, setShowAllNotifLogs] = useState(false);
  const [showBellSettings, setShowBellSettings] = useState(false);
  const [showAddMedForm, setShowAddMedForm] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [icsExportNotice, setIcsExportNotice] = useState<string | null>(null);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editTargetWeight, setEditTargetWeight] = useState(String(profile.targetWeightKg));
  const [editDoctor, setEditDoctor] = useState(profile.primaryDoctor);
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(profile.emergencyContactPhone);

  const adherence = calculateMedicationAdherence(medications);
  const visibleLogs = showAllNotifLogs
    ? notificationHistory
    : notificationHistory.slice(0, 3);

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) {
      setFormError('Vui lòng nhập tên thuốc.');
      return;
    }
    setFormError(null);
    onAddMedication({
      medicationName: medName.trim(),
      dosage: dosage.trim() || '1 viên',
      purpose: purpose.trim() || 'Theo chỉ định bác sĩ',
      frequency: 'Hàng ngày',
      timeSlot: timeSlot || '07:00',
      mealInstruction,
      takenToday: false,
      remainingPills: 30,
      totalPills: 30,
      reminderEnabled: true,
    });
    setMedName('');
    setPurpose('');
    setShowAddMedForm(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      targetWeightKg: Number(editTargetWeight) || profile.targetWeightKg,
      primaryDoctor: editDoctor.trim() || profile.primaryDoctor,
      emergencyContactPhone: editEmergencyPhone.trim() || profile.emergencyContactPhone,
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Cột trái: Liều tiếp theo + Danh sách uống thuốc */}
      <div className="lg:col-span-8 space-y-4">
        {/* 1. Liều tiếp theo & Chuông nhắc */}
        <Card
          as="section"
          ariaLabel="Cữ thuốc sắp tới và chuông nhắc"
          testId="medication-notification-settings-panel"
          className="space-y-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  notificationSettings.enabled
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {notificationSettings.enabled ? (
                  <BellRing className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1F2937]">Liều thuốc tiếp theo</h2>
                <span
                  data-testid="push-notification-status-badge"
                  className="text-xs font-bold text-[#0B5F57]"
                >
                  {notificationSettings.enabled ? 'Chuông nhắc đang bật' : 'Chuông nhắc đang tắt'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="toggle-push-enabled-btn"
                onClick={() =>
                  onUpdateNotificationSettings({
                    ...notificationSettings,
                    enabled: !notificationSettings.enabled,
                  })
                }
                className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-sm font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                  notificationSettings.enabled
                    ? 'bg-[#FAF7F2] hover:bg-stone-200/70 text-[#1F2937] border border-stone-300'
                    : 'bg-[#0F766E] hover:bg-[#0B5F57] text-white'
                }`}
              >
                {notificationSettings.enabled ? (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span>Tắt chuông</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Bật chuông</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowBellSettings((prev) => !prev)}
                className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-200 text-sm font-bold text-[#0B5F57] cursor-pointer"
              >
                {showBellSettings ? 'Đóng cài đặt' : 'Cài đặt chuông'}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#0F766E]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {nextDoseInfo ? (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    data-testid="next-dose-countdown"
                    className="px-2.5 py-0.5 rounded-xl bg-white border border-[#0F766E]/30 text-[#0B5F57] text-xs sm:text-sm font-bold tabular-nums"
                  >
                    {nextDoseInfo.countdownLabel}
                  </span>
                  <span className="text-sm font-bold text-[#0F766E] tabular-nums">
                    Lúc {formatTime24h(nextDoseInfo.medication.timeSlot)}
                  </span>
                </div>
                <p className="text-base sm:text-lg font-extrabold text-[#1F2937]">
                  {nextDoseInfo.medication.medicationName} ({nextDoseInfo.medication.dosage}) ·{' '}
                  <span className="font-semibold text-stone-700">
                    {nextDoseInfo.medication.mealInstruction}
                  </span>
                </p>
              </div>
            ) : (
              <div className="text-base font-bold text-emerald-800">
                ✓ Đã uống đủ các cữ thuốc hôm nay.
              </div>
            )}

            {nextDoseInfo && (
              <button
                type="button"
                onClick={() => onToggleMedication(nextDoseInfo.medication.id)}
                className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Đã uống</span>
              </button>
            )}
          </div>

          {/* Lưu báo thức vào Lịch gốc của điện thoại (iPhone / Android) để reo kể cả khi tắt app */}
          <div className="pt-2.5 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              <strong className="text-[#1F2937]">Báo thức chạy nền ngay cả khi tắt ứng dụng:</strong>{' '}
              Lưu lịch thuốc vào Lịch iPhone hoặc Google Calendar để máy tự reo mỗi ngày.
            </div>
            <button
              type="button"
              data-testid="export-phone-alarm-ics-btn"
              onClick={() => {
                const res = downloadMedicationAlarmIcs({
                  medications,
                  patientName: profile.fullName,
                  leadMinutes: notificationSettings.leadMinutes,
                });
                setIcsExportNotice(
                  res.exported
                    ? `Đã tải lịch nhắc ${res.eventCount} cữ thuốc hằng ngày (.ics). Mở tệp vừa tải để thêm vào Lịch điện thoại.`
                    : 'Hiện chưa có cữ thuốc nào đang bật nhắc để lưu vào Lịch.'
                );
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-white hover:bg-[#0F766E]/10 border border-[#0F766E]/35 text-sm font-bold text-[#0B5F57] inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <CalendarPlus className="w-4 h-4 text-[#0F766E] shrink-0" />
              <span>Lưu vào Lịch đt (.ics)</span>
            </button>
          </div>

          {icsExportNotice && (
            <div
              role="status"
              data-testid="ics-export-confirmation"
              className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-950"
            >
              {icsExportNotice}
            </div>
          )}

          {/* Cài đặt chuông & Thông báo điện thoại */}
          {showBellSettings && (
            <div className="pt-3 border-t border-stone-200/80 space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-[#1F2937]">
                      Thông báo trên điện thoại
                    </p>
                    <p className="text-sm text-stone-600">
                      {notificationSettings.browserPermission === 'granted'
                        ? '✓ Đã cấp quyền — thông báo sẽ hiện trên thanh thông báo khi đến giờ.'
                        : notificationSettings.browserPermission === 'denied'
                        ? 'Thông báo đang bị chặn. Hãy mở Cài đặt trang web trên trình duyệt và chọn Cho phép.'
                        : notificationSettings.browserPermission === 'unsupported'
                        ? 'Trình duyệt này chỉ hỗ trợ nhắc nhở ngay trong ứng dụng.'
                        : 'Chưa cấp quyền hiện thông báo ra màn hình điện thoại.'}
                    </p>
                  </div>
                  {notificationSettings.browserPermission !== 'granted' &&
                    notificationSettings.browserPermission !== 'unsupported' && (
                      <button
                        type="button"
                        onClick={onRequestBrowserPermission}
                        data-testid="request-browser-notification-btn"
                        className="min-h-[46px] px-4 py-2 rounded-2xl text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] cursor-pointer shrink-0"
                      >
                        Cho phép thông báo
                      </button>
                    )}
                </div>

                {typeof window !== 'undefined' &&
                  /iPad|iPhone|iPod/.test(navigator.userAgent || '') &&
                  !window.matchMedia?.('(display-mode: standalone)')?.matches && (
                    <p className="text-xs font-semibold text-[#0B5F57] bg-white px-3 py-2 rounded-xl border border-[#0F766E]/25">
                      Trên iPhone: bấm <strong>Chia sẻ (Share)</strong> →{' '}
                      <strong>Thêm vào Màn hình chính</strong> để nhận báo thức ngoài màn hình khóa.
                    </p>
                  )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    data-testid="trigger-test-push-btn"
                    onClick={() => onTriggerTestPush()}
                    className="min-h-[46px] px-4 py-2 rounded-2xl text-sm font-bold text-[#0B5F57] bg-white hover:bg-[#0F766E]/10 border border-[#0F766E]/35 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <BellRing className="w-4 h-4 text-[#0F766E]" />
                    <span>Gửi thử thông báo &amp; chuông</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="notif-lead-minutes" className="block text-sm font-bold text-[#1F2937] mb-1">
                    Báo trước giờ uống
                  </label>
                  <select
                    id="notif-lead-minutes"
                    data-testid="notif-lead-select"
                    value={notificationSettings.leadMinutes}
                    onChange={(e) =>
                      onUpdateNotificationSettings({
                        ...notificationSettings,
                        leadMinutes: Number(e.target.value) as 0 | 5 | 10 | 15,
                      })
                    }
                    className="w-full min-h-[46px] px-3 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold"
                  >
                    <option value={0}>Đúng giờ (0 phút)</option>
                    <option value={5}>Trước 5 phút</option>
                    <option value={10}>Trước 10 phút</option>
                    <option value={15}>Trước 15 phút</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="notif-snooze-minutes" className="block text-sm font-bold text-[#1F2937] mb-1">
                    Nhắc lại sau
                  </label>
                  <select
                    id="notif-snooze-minutes"
                    data-testid="notif-snooze-select"
                    value={notificationSettings.snoozeMinutes}
                    onChange={(e) =>
                      onUpdateNotificationSettings({
                        ...notificationSettings,
                        snoozeMinutes: Number(e.target.value) as 5 | 10 | 15,
                      })
                    }
                    className="w-full min-h-[46px] px-3 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold"
                  >
                    <option value={5}>5 phút</option>
                    <option value={10}>10 phút</option>
                    <option value={15}>15 phút</option>
                  </select>
                </div>

                <div>
                  <span className="block text-sm font-bold text-[#1F2937] mb-1">Âm thanh</span>
                  <button
                    type="button"
                    data-testid="toggle-notif-sound-btn"
                    onClick={() =>
                      onUpdateNotificationSettings({
                        ...notificationSettings,
                        soundEnabled: !notificationSettings.soundEnabled,
                      })
                    }
                    className={`w-full min-h-[46px] px-3 py-2 rounded-2xl text-sm font-bold border flex items-center justify-center gap-2 cursor-pointer ${
                      notificationSettings.soundEnabled
                        ? 'bg-[#0F766E]/10 border-[#0F766E]/30 text-[#0B5F57]'
                        : 'bg-stone-100 border-stone-200 text-stone-600'
                    }`}
                  >
                    {notificationSettings.soundEnabled ? (
                      <>
                        <Volume2 className="w-4 h-4 text-[#0F766E]" />
                        <span>Đang bật</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-4 h-4 text-stone-500" />
                        <span>Im lặng</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {notificationHistory.length > 0 && (
                <div className="pt-2 border-t border-stone-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1F2937]">
                      Nhật ký nhắc ({notificationHistory.length})
                    </span>
                    {notificationHistory.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllNotifLogs((prev) => !prev)}
                        className="text-sm font-bold text-[#0F766E] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{showAllNotifLogs ? 'Thu gọn' : 'Xem thêm'}</span>
                        <ChevronDown className={`w-4 h-4 ${showAllNotifLogs ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-stone-100">
                    {visibleLogs.map((item) => (
                      <div key={item.id} className="py-1.5 flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0 truncate tabular-nums">
                          <span className="font-bold text-[#0F766E]">{formatTime24h(item.triggeredAt)}</span> ·{' '}
                          <strong>{item.medicationName}</strong>
                        </div>
                        <span className="text-xs font-bold text-stone-600 shrink-0">
                          {item.status === 'confirmed'
                            ? 'Đã uống'
                            : item.status === 'snoozed'
                            ? 'Nhắc lại sau'
                            : 'Đang nhắc'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 2. Danh sách thuốc hằng ngày */}
        <Card className="space-y-4">
          <SectionHeader
            title="Thuốc hằng ngày"
            icon={<Pill className="w-5 h-5" />}
            action={
              <div className="flex items-center gap-3">
                <span className="text-sm tabular-nums text-stone-600">
                  <strong data-testid="med-adherence-percent" className="text-base font-extrabold text-[#0F766E]">
                    {adherence.adherencePercent}%
                  </strong>{' '}
                  ({adherence.takenCount}/{adherence.totalCount})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddMedForm((prev) => !prev)}
                  className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddMedForm ? 'Đóng' : 'Thêm thuốc'}</span>
                </button>
              </div>
            }
          />

          {/* Biểu mẫu thêm thuốc mới (Thu gọn mặc định) */}
          {showAddMedForm && (
            <form
              onSubmit={handleAddMed}
              className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3"
            >
              <div className="text-base font-bold text-[#1F2937]">Thêm thuốc mới</div>
              {formError && (
                <p role="alert" className="text-sm text-[#DC2626] font-bold">
                  {formError}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="med-name" className="block text-sm font-bold text-[#1F2937] mb-1">
                    Tên thuốc
                  </label>
                  <input
                    id="med-name"
                    type="text"
                    placeholder="VD: Amlodipine 5mg"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="med-dosage" className="block text-sm font-bold text-[#1F2937] mb-1">
                    Liều dùng
                  </label>
                  <input
                    id="med-dosage"
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="med-time" className="block text-sm font-bold text-[#1F2937] mb-1">
                    Giờ nhắc (24h)
                  </label>
                  <input
                    id="med-time"
                    type="time"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value || '07:00')}
                    className="w-full min-h-[46px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white tabular-nums font-bold"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {QUICK_TIME_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setTimeSlot(preset.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold tabular-nums border cursor-pointer ${
                          timeSlot === preset.value
                            ? 'bg-[#0F766E] text-white border-[#0F766E]'
                            : 'bg-white text-[#1F2937] border-stone-200'
                        }`}
                      >
                        {preset.value}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="med-meal" className="block text-sm font-bold text-[#1F2937] mb-1">
                    Thời điểm
                  </label>
                  <select
                    id="med-meal"
                    value={mealInstruction}
                    onChange={(e) =>
                      setMealInstruction(e.target.value as MedicationSchedule['mealInstruction'])
                    }
                    className="w-full min-h-[46px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold"
                  >
                    <option value="Sau ăn 30 phút">Sau ăn 30 phút</option>
                    <option value="Trước ăn 30 phút">Trước ăn 30 phút</option>
                    <option value="Cùng bữa ăn">Cùng bữa ăn</option>
                    <option value="Trước khi ngủ">Trước khi ngủ</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="med-purpose" className="block text-sm font-bold text-[#1F2937] mb-1">
                    Ghi chú
                  </label>
                  <input
                    id="med-purpose"
                    type="text"
                    placeholder="VD: Huyết áp sáng"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="min-h-[48px] px-5 py-2 text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] rounded-2xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lưu thuốc mới</span>
                </button>
              </div>
            </form>
          )}

          {medications.length === 0 ? (
            <EmptyState
              title="Chưa có thuốc nào"
              description="Bấm “Thêm thuốc” để tạo nhắc giờ uống thuốc hằng ngày."
            />
          ) : (
            <div className="divide-y divide-stone-200/80">
              {medications.map((med) => {
                const isReminderOn = med.reminderEnabled !== false;
                const isEditingRow = editingMedId === med.id;
                return (
                  <div key={med.id} className="py-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 border ${
                            med.takenToday
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-[#FAF7F2] text-[#0F766E] border-stone-200'
                          }`}
                        >
                          <Pill className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h3
                            className={`text-base font-bold ${
                              med.takenToday ? 'text-stone-400 line-through' : 'text-[#1F2937]'
                            }`}
                          >
                            {med.medicationName}
                          </h3>
                          <p className="text-sm text-stone-600 tabular-nums">
                            <strong className="text-[#0B5F57]">{formatTime24h(med.timeSlot)}</strong> ·{' '}
                            {med.dosage} · {med.mealInstruction} · Còn {med.remainingPills} viên
                          </p>
                          {med.snoozedUntil && !med.takenToday && (
                            <Chip
                              label={`Nhắc lại lúc ${formatTime24h(med.snoozedUntil)}`}
                              variant="warning"
                              className="text-xs px-2 py-0.5 mt-1"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingMedId(isEditingRow ? null : med.id)}
                          className="min-h-[44px] px-3 py-2 rounded-2xl text-sm font-bold text-[#0B5F57] bg-[#FAF7F2] border border-stone-200 hover:bg-stone-100 cursor-pointer"
                        >
                          {isEditingRow ? 'Xong' : 'Sửa giờ'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleMedication(med.id)}
                          aria-label={`${
                            med.takenToday ? 'Hoàn tác đã uống' : 'Xác nhận đã uống'
                          } ${med.medicationName}`}
                          className={`min-h-[44px] px-4 py-2 rounded-2xl text-sm font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            med.takenToday
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              : 'bg-[#0F766E] text-white hover:bg-[#0B5F57]'
                          }`}
                        >
                          {med.takenToday ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Đã uống</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4" />
                              <span>Đã uống</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {isEditingRow && (
                      <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 flex flex-wrap items-center justify-between gap-2.5">
                        <label
                          htmlFor={`time-${med.id}`}
                          className="inline-flex items-center gap-2 text-sm text-[#1F2937] font-bold tabular-nums"
                        >
                          <span>Giờ nhắc:</span>
                          <input
                            id={`time-${med.id}`}
                            type="time"
                            value={med.timeSlot}
                            onChange={(e) =>
                              onUpdateMedicationReminder(med.id, {
                                timeSlot: e.target.value || '07:00',
                                snoozedUntil: undefined,
                              })
                            }
                            className="px-2.5 py-1.5 text-sm font-bold text-[#0B5F57] bg-white border border-stone-300 rounded-xl tabular-nums"
                          />
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMedicationReminder(med.id, {
                                reminderEnabled: !isReminderOn,
                              })
                            }
                            className="min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-bold border border-stone-300 bg-white text-[#1F2937] inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            {isReminderOn ? (
                              <>
                                <Bell className="w-4 h-4 text-[#0F766E]" />
                                <span>Đang bật nhắc</span>
                              </>
                            ) : (
                              <>
                                <BellOff className="w-4 h-4 text-stone-500" />
                                <span>Đã tắt nhắc</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            data-testid={`test-push-med-${med.id}`}
                            onClick={() => onTriggerTestPush(med)}
                            className="min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-bold text-[#0B5F57] bg-white border border-stone-300 cursor-pointer"
                          >
                            Nhắc thử
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Cột phải: Thẻ Khẩn cấp & Bác sĩ */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-200/80">
            <div className="flex items-center gap-2">
              <FileHeart className="w-5 h-5 text-[#DC2626] shrink-0" />
              <h2 className="text-lg font-bold text-[#1F2937]">Thẻ Cấp cứu</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-stone-200 text-sm font-bold text-[#0B5F57] cursor-pointer"
            >
              {isEditingProfile ? 'Đóng' : 'Sửa'}
            </button>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-3 text-sm">
              <div>
                <label htmlFor="prof-target-weight" className="block font-bold text-[#1F2937] mb-1">
                  Cân nặng mục tiêu (kg)
                </label>
                <input
                  id="prof-target-weight"
                  type="number"
                  step="0.1"
                  value={editTargetWeight}
                  onChange={(e) => setEditTargetWeight(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 py-2 border border-stone-300 rounded-2xl tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="prof-doctor" className="block font-bold text-[#1F2937] mb-1">
                  Bác sĩ điều trị
                </label>
                <input
                  id="prof-doctor"
                  type="text"
                  value={editDoctor}
                  onChange={(e) => setEditDoctor(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 py-2 border border-stone-300 rounded-2xl"
                />
              </div>
              <div>
                <label htmlFor="prof-phone" className="block font-bold text-[#1F2937] mb-1">
                  SĐT người thân khẩn cấp
                </label>
                <input
                  id="prof-phone"
                  type="tel"
                  value={editEmergencyPhone}
                  onChange={(e) => setEditEmergencyPhone(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 py-2 border border-stone-300 rounded-2xl tabular-nums"
                />
              </div>
              <button
                type="submit"
                className="w-full min-h-[46px] py-2 text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] rounded-2xl cursor-pointer"
              >
                Lưu thông tin
              </button>
            </form>
          ) : (
            <div className="divide-y divide-stone-100 text-sm">
              <div className="flex justify-between py-2 gap-2">
                <span className="text-stone-600">Chủ sổ</span>
                <strong className="font-bold text-[#1F2937] text-right">
                  {profile.fullName} ({2026 - profile.birthYear}t)
                </strong>
              </div>
              <div className="flex justify-between py-2 gap-2">
                <span className="text-stone-600">Nhóm máu</span>
                <strong className="font-extrabold text-[#DC2626]">{profile.bloodType}</strong>
              </div>
              <div className="py-2 space-y-0.5">
                <span className="text-stone-600 block">Dị ứng:</span>
                <p className="font-bold text-[#DC2626]">{profile.allergies.join(' · ')}</p>
              </div>
              <div className="py-2 space-y-0.5">
                <span className="text-stone-600 block">Bác sĩ theo dõi:</span>
                <p className="font-bold text-[#1F2937]">{profile.primaryDoctor}</p>
                <p className="text-stone-600">{profile.hospitalName}</p>
              </div>
              <div className="pt-3 space-y-2">
                <span className="text-stone-600 block">
                  Liên hệ khẩn cấp: <strong className="text-[#1F2937]">{profile.emergencyContactName}</strong>
                </span>
                <a
                  href={`tel:${profile.emergencyContactPhone.replace(/\s+/g, '')}`}
                  className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-[#0F766E]/10 border border-[#0F766E]/35 text-sm font-extrabold text-[#0B5F57] tabular-nums"
                >
                  <Phone className="w-4 h-4 text-[#0F766E]" />
                  <span>Gọi {profile.emergencyContactPhone}</span>
                </a>
              </div>
            </div>
          )}
        </Card>

        <Card className="bg-amber-50/80 border-amber-200 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
          <p className="text-sm text-[#1F2937] leading-relaxed">
            Nên uống thuốc đúng giờ mỗi ngày, không tự ý ngưng thuốc khi thấy khỏe.
          </p>
        </Card>
      </div>
    </div>
  );
};

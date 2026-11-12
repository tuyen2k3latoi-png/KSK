import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
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
      setFormError('Vui lòng nhập tên thuốc hoặc thực phẩm bảo vệ sức khỏe.');
      return;
    }
    setFormError(null);
    onAddMedication({
      medicationName: medName.trim(),
      dosage: dosage.trim() || '1 viên',
      purpose: purpose.trim() || 'Theo chỉ định của bác sĩ',
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
      {/* Cột trái (8 cột trên Desktop): Cữ thuốc hôm nay, Cài đặt chuông & Thêm thuốc */}
      <div className="lg:col-span-8 space-y-5">
        {/* 1. Bảng điều khiển Chuông nhắc & Cữ thuốc sắp tới */}
        <Card
          as="section"
          ariaLabel="Chuông nhắc uống thuốc đúng giờ"
          testId="medication-notification-settings-panel"
          className="space-y-4"
        >
          <div className="flex flex-col gap-3.5 pb-4 border-b border-stone-200/80">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
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
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">
                    Chuông nhắc uống thuốc đúng giờ
                  </h2>
                  <span
                    data-testid="push-notification-status-badge"
                    className={`px-2.5 py-0.5 rounded-xl text-xs font-bold border ${
                      notificationSettings.enabled
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {notificationSettings.enabled ? 'Đang bật tự động' : 'Đang tạm tắt'}
                  </span>
                </div>
                <p className="text-sm text-stone-600">
                  Báo chuông nhẹ và hiện lời nhắc trên màn hình khi đến giờ uống thuốc
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="toggle-push-enabled-btn"
                onClick={() =>
                  onUpdateNotificationSettings({
                    ...notificationSettings,
                    enabled: !notificationSettings.enabled,
                  })
                }
                className={`min-h-[48px] px-4 py-2 rounded-2xl text-sm font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  notificationSettings.enabled
                    ? 'bg-[#FAF7F2] hover:bg-stone-200/70 text-[#1F2937] border border-stone-300'
                    : 'bg-[#0F766E] hover:bg-[#0B5F57] text-white'
                }`}
              >
                {notificationSettings.enabled ? (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span>Tắt chuông nhắc</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Bật chuông nhắc</span>
                  </>
                )}
              </button>

              <button
                type="button"
                data-testid="trigger-test-push-btn"
                onClick={() => onTriggerTestPush()}
                className="min-h-[48px] px-4 py-2 rounded-2xl text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <BellRing className="w-4 h-4" />
                <span>Gửi thử thông báo ngay</span>
              </button>
            </div>
          </div>

          {/* Cữ thuốc sắp tới tiếp theo */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#0F766E]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {nextDoseInfo ? (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[#0B5F57]">
                    Cữ thuốc sắp tới tiếp theo:
                  </span>
                  <span
                    data-testid="next-dose-countdown"
                    className="px-2.5 py-0.5 rounded-xl bg-white border border-[#0F766E]/30 text-[#0B5F57] text-xs sm:text-sm font-bold tabular-nums"
                  >
                    {nextDoseInfo.countdownLabel}
                  </span>
                </div>
                <p className="text-base font-bold text-[#1F2937] tabular-nums">
                  {nextDoseInfo.medication.medicationName} ({nextDoseInfo.medication.dosage}) · Giờ uống:{' '}
                  <span className="text-[#0F766E]">
                    {formatTime24h(nextDoseInfo.medication.timeSlot)}
                  </span>{' '}
                  · {nextDoseInfo.medication.mealInstruction}
                </p>
              </div>
            ) : (
              <div className="text-base font-bold text-emerald-800">
                Tuyệt vời! Bạn đã uống đầy đủ tất cả các cữ thuốc trong ngày hôm nay.
              </div>
            )}

            {notificationSettings.browserPermission !== 'granted' &&
              notificationSettings.browserPermission !== 'unsupported' && (
                <button
                  type="button"
                  onClick={onRequestBrowserPermission}
                  data-testid="request-browser-notification-btn"
                  className="min-h-[44px] px-4 py-2 rounded-2xl text-sm font-bold text-[#0B5F57] bg-white hover:bg-[#0F766E]/10 border border-[#0F766E]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Bật thông báo trên điện thoại
                </button>
              )}
          </div>

          {/* Tùy chỉnh thời gian báo trước, nhắc lại sau và âm lượng */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label
                htmlFor="notif-lead-minutes"
                className="block text-sm font-bold text-[#1F2937] mb-1"
              >
                Báo nhắc trước giờ uống
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
                className="w-full min-h-[48px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold text-[#1F2937]"
              >
                <option value={0}>Đúng giờ hẹn (0 phút)</option>
                <option value={5}>Nhắc trước 5 phút</option>
                <option value={10}>Nhắc trước 10 phút</option>
                <option value={15}>Nhắc trước 15 phút</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="notif-snooze-minutes"
                className="block text-sm font-bold text-[#1F2937] mb-1"
              >
                Thời gian nhắc lại sau
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
                className="w-full min-h-[48px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold text-[#1F2937]"
              >
                <option value={5}>Nhắc lại sau 5 phút</option>
                <option value={10}>Nhắc lại sau 10 phút</option>
                <option value={15}>Nhắc lại sau 15 phút</option>
              </select>
            </div>

            <div>
              <span className="block text-sm font-bold text-[#1F2937] mb-1">
                Âm thanh chuông báo
              </span>
              <button
                type="button"
                data-testid="toggle-notif-sound-btn"
                onClick={() =>
                  onUpdateNotificationSettings({
                    ...notificationSettings,
                    soundEnabled: !notificationSettings.soundEnabled,
                  })
                }
                className={`w-full min-h-[48px] px-3.5 py-2 rounded-2xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  notificationSettings.soundEnabled
                    ? 'bg-[#0F766E]/10 border-[#0F766E]/30 text-[#0B5F57]'
                    : 'bg-stone-100 border-stone-200 text-stone-600'
                }`}
              >
                {notificationSettings.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-[#0F766E]" />
                    <span>Chuông báo: Đang bật</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-stone-500" />
                    <span>Chuông báo: Im lặng</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Nhật ký nhắc thuốc gần đây (dạng Xem thêm, không cuộn lồng nhau) */}
          {notificationHistory.length > 0 && (
            <div className="pt-3 border-t border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#1F2937]">
                  Lời nhắc gần đây ({notificationHistory.length})
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
                  <div
                    key={item.id}
                    className="py-2 flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0 truncate tabular-nums">
                      <span className="font-bold text-[#0F766E]">
                        {formatTime24h(item.triggeredAt)}
                      </span>{' '}
                      · <strong className="text-[#1F2937]">{item.medicationName}</strong> ({item.dosage})
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-xl text-xs font-bold shrink-0 ${
                        item.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : item.status === 'snoozed'
                          ? 'bg-amber-50 text-amber-950 border border-amber-300'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
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
        </Card>

        {/* 2. Danh sách thuốc hằng ngày & Thêm thuốc mới */}
        <Card className="space-y-4">
          <SectionHeader
            title="Lịch uống thuốc hằng ngày"
            subtitle="Đổi giờ nhắc trực tiếp trên từng thuốc hoặc bấm Nhắc thử để kiểm tra chuông"
            icon={<Pill className="w-5 h-5" />}
            action={
              <div className="text-right tabular-nums">
                <span className="text-xs sm:text-sm text-stone-600">Tuân thủ hôm nay: </span>
                <strong
                  data-testid="med-adherence-percent"
                  className="text-lg font-extrabold text-[#0F766E]"
                >
                  {adherence.adherencePercent}%
                </strong>{' '}
                <span className="text-xs sm:text-sm text-stone-600">
                  ({adherence.takenCount}/{adherence.totalCount} cữ)
                </span>
              </div>
            }
          />

          {medications.length === 0 ? (
            <EmptyState
              title="Chưa có thuốc nào trong lịch nhắc"
              description="Hãy thêm thuốc hoặc thực phẩm bảo vệ sức khỏe bên dưới để ứng dụng tự động nhắc đúng giờ mỗi ngày."
            />
          ) : (
            <div className="divide-y divide-stone-200/80">
              {medications.map((med) => {
                const isReminderOn = med.reminderEnabled !== false;
                return (
                  <div
                    key={med.id}
                    className="py-4 space-y-3"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 border ${
                          med.takenToday
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-[#FAF7F2] text-[#0F766E] border-stone-200'
                        }`}
                      >
                        <Pill className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3
                            className={`text-base font-bold ${
                              med.takenToday ? 'text-stone-400 line-through' : 'text-[#1F2937]'
                            }`}
                          >
                            {med.medicationName}
                          </h3>
                          {med.snoozedUntil && !med.takenToday && (
                            <Chip
                              label={`Nhắc lại sau lúc ${formatTime24h(med.snoozedUntil)}`}
                              variant="warning"
                            />
                          )}
                        </div>
                        <p className="text-sm text-stone-600">{med.purpose}</p>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-stone-600 tabular-nums">
                          <span>Liều dùng: <strong className="text-[#1F2937]">{med.dosage}</strong></span>
                          <span>·</span>
                          <span>{med.mealInstruction}</span>
                          <span>·</span>
                          <span>
                            Còn lại: <strong className="text-[#1F2937]">{med.remainingPills}/{med.totalPills}</strong> viên
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2.5 pl-0 sm:pl-14">
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
                          className="px-2.5 py-1.5 text-sm font-bold text-[#0B5F57] bg-[#FAF7F2] border border-[#0F766E]/35 rounded-xl tabular-nums"
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
                          aria-label={`${isReminderOn ? 'Tắt chuông nhắc' : 'Bật chuông nhắc'} ${
                            med.medicationName
                          }`}
                          className={`min-h-[44px] px-3 py-2 rounded-2xl text-sm font-bold border transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                            isReminderOn
                              ? 'bg-[#0F766E]/10 text-[#0B5F57] border-[#0F766E]/30 hover:bg-[#0F766E]/20'
                              : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                          }`}
                        >
                          {isReminderOn ? (
                            <>
                              <Bell className="w-4 h-4 text-[#0F766E]" />
                              <span>Bật nhắc</span>
                            </>
                          ) : (
                            <>
                              <BellOff className="w-4 h-4 text-stone-500" />
                              <span>Đã tắt</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          data-testid={`test-push-med-${med.id}`}
                          onClick={() => onTriggerTestPush(med)}
                          className="min-h-[44px] px-3 py-2 rounded-2xl text-sm font-bold text-[#1F2937] bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-300 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Nhắc thử
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleMedication(med.id)}
                          aria-label={`${
                            med.takenToday ? 'Hoàn tác đã uống' : 'Xác nhận đã uống'
                          } ${med.medicationName}`}
                          className={`min-h-[44px] px-4 py-2 rounded-2xl text-sm font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                            med.takenToday
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-[#0F766E] text-white hover:bg-[#0B5F57]'
                          }`}
                        >
                          {med.takenToday ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Đã uống ({formatTime24h(med.takenAt || med.timeSlot)})</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4" />
                              <span>Xác nhận Đã uống</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Biểu mẫu thêm thuốc mới */}
          <form
            onSubmit={handleAddMed}
            className="pt-4 border-t border-stone-200/80 space-y-3.5"
          >
            <div className="text-base font-bold text-[#1F2937]">
              Thêm thuốc mới vào lịch nhắc hằng ngày
            </div>
            {formError && (
              <p role="alert" className="text-sm text-[#DC2626] font-bold">
                {formError}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="med-name" className="block text-sm font-bold text-[#1F2937] mb-1">
                  Tên thuốc &amp; Hàm lượng
                </label>
                <input
                  id="med-name"
                  type="text"
                  placeholder="VD: Amlodipine 5mg hoặc Coenzyme Q10..."
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white"
                />
              </div>
              <div>
                <label htmlFor="med-dosage" className="block text-sm font-bold text-[#1F2937] mb-1">
                  Liều dùng mỗi lần
                </label>
                <input
                  id="med-dosage"
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="med-time" className="block text-sm font-bold text-[#1F2937] mb-1">
                  Giờ nhắc uống (24h)
                </label>
                <input
                  id="med-time"
                  type="time"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value || '07:00')}
                  className="w-full min-h-[48px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white tabular-nums font-bold"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_TIME_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setTimeSlot(preset.value)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold tabular-nums border cursor-pointer ${
                        timeSlot === preset.value
                          ? 'bg-[#0F766E] text-white border-[#0F766E]'
                          : 'bg-[#FAF7F2] text-[#1F2937] border-stone-200 hover:bg-stone-200/60'
                      }`}
                    >
                      {preset.value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="med-meal" className="block text-sm font-bold text-[#1F2937] mb-1">
                  Thời điểm dùng thuốc
                </label>
                <select
                  id="med-meal"
                  value={mealInstruction}
                  onChange={(e) =>
                    setMealInstruction(
                      e.target.value as MedicationSchedule['mealInstruction']
                    )
                  }
                  className="w-full min-h-[48px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold"
                >
                  <option value="Sau ăn 30 phút">Sau ăn 30 phút</option>
                  <option value="Trước ăn 30 phút">Trước ăn 30 phút</option>
                  <option value="Cùng bữa ăn">Cùng bữa ăn</option>
                  <option value="Trước khi ngủ">Trước khi ngủ</option>
                </select>
              </div>
              <div>
                <label htmlFor="med-purpose" className="block text-sm font-bold text-[#1F2937] mb-1">
                  Công dụng / Ghi chú
                </label>
                <input
                  id="med-purpose"
                  type="text"
                  placeholder="VD: Ổn định huyết áp buổi sáng"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="min-h-[52px] px-5 py-2.5 text-base font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] rounded-2xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                <Plus className="w-5 h-5" />
                <span>Thêm vào lịch nhắc thuốc</span>
              </button>
            </div>
          </form>
        </Card>
      </div>

      {/* Cột phải (4 cột trên Desktop): Hồ sơ Y tế & Thẻ Cấp cứu + Lưu ý an toàn */}
      <div className="lg:col-span-4 space-y-5">
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
            <div className="flex items-center gap-2">
              <FileHeart className="w-5 h-5 text-[#DC2626] shrink-0" />
              <h2 className="text-lg font-bold text-[#1F2937]">
                Hồ sơ Y tế &amp; Thẻ Cấp cứu
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#0F766E]/10 border border-stone-200 text-sm font-bold text-[#0B5F57] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isEditingProfile ? 'Đóng chỉnh sửa' : 'Cập nhật hồ sơ'}
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
                  className="w-full min-h-[48px] px-3.5 py-2 border border-stone-300 rounded-2xl tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="prof-doctor" className="block font-bold text-[#1F2937] mb-1">
                  Bác sĩ điều trị chính
                </label>
                <input
                  id="prof-doctor"
                  type="text"
                  value={editDoctor}
                  onChange={(e) => setEditDoctor(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2 border border-stone-300 rounded-2xl"
                />
              </div>
              <div>
                <label htmlFor="prof-phone" className="block font-bold text-[#1F2937] mb-1">
                  Số điện thoại Liên hệ Khẩn cấp
                </label>
                <input
                  id="prof-phone"
                  type="tel"
                  value={editEmergencyPhone}
                  onChange={(e) => setEditEmergencyPhone(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2 border border-stone-300 rounded-2xl tabular-nums"
                />
              </div>
              <button
                type="submit"
                className="w-full min-h-[48px] py-2.5 text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] rounded-2xl transition-colors cursor-pointer"
              >
                Lưu Hồ sơ Y tế
              </button>
            </form>
          ) : (
            <div className="divide-y divide-stone-100 text-sm">
              <div className="flex justify-between py-2.5 gap-2">
                <span className="text-stone-600">Họ và tên</span>
                <strong className="font-bold text-[#1F2937] text-right">{profile.fullName}</strong>
              </div>
              <div className="flex justify-between py-2.5 gap-2">
                <span className="text-stone-600">Năm sinh / Giới tính</span>
                <span className="tabular-nums font-semibold text-[#1F2937] text-right">
                  {profile.birthYear} ({2026 - profile.birthYear} tuổi) ·{' '}
                  {profile.gender === 'female' ? 'Nữ' : 'Nam'}
                </span>
              </div>
              <div className="flex justify-between py-2.5 gap-2">
                <span className="text-stone-600">Nhóm máu</span>
                <strong className="tabular-nums font-extrabold text-[#DC2626]">
                  {profile.bloodType}
                </strong>
              </div>
              <div className="flex justify-between py-2.5 gap-2">
                <span className="text-stone-600">Chiều cao / Mục tiêu</span>
                <span className="tabular-nums font-semibold text-[#1F2937] text-right">
                  {profile.heightCm} cm · {profile.targetWeightKg} kg
                </span>
              </div>
              <div className="py-2.5 space-y-1">
                <span className="text-stone-600 block">Tiền sử dị ứng cần lưu ý:</span>
                <p className="font-bold text-[#DC2626]">
                  {profile.allergies.join(' · ')}
                </p>
              </div>
              <div className="py-2.5 space-y-1">
                <span className="text-stone-600 block">Bệnh lý đang theo dõi:</span>
                <p className="font-semibold text-[#1F2937]">
                  {profile.chronicConditions.join(' · ')}
                </p>
              </div>
              <div className="py-2.5 space-y-0.5">
                <span className="text-stone-600 block">Bác sĩ &amp; Bệnh viện theo dõi:</span>
                <p className="font-bold text-[#1F2937]">{profile.primaryDoctor}</p>
                <p className="text-stone-600">{profile.hospitalName}</p>
              </div>
              <div className="pt-3 space-y-1">
                <span className="text-stone-600 block">Người thân liên hệ khẩn cấp:</span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="font-bold text-[#1F2937]">
                    {profile.emergencyContactName}
                  </strong>
                  <a
                    href={`tel:${profile.emergencyContactPhone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#0F766E]/30 text-sm font-bold text-[#0B5F57] tabular-nums"
                  >
                    <Phone className="w-4 h-4 text-[#0F766E]" />
                    <span>{profile.emergencyContactPhone}</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Lưu ý an toàn khi uống thuốc */}
        <Card className="bg-amber-50/80 border-amber-200 space-y-2">
          <div className="font-bold text-amber-950 flex items-center gap-2 text-base">
            <ShieldAlert className="w-5 h-5 text-[#F59E0B] shrink-0" />
            <span>Lưu ý khi uống thuốc đúng giờ</span>
          </div>
          <p className="text-sm text-[#1F2937] leading-relaxed">
            <strong>Thuốc huyết áp buổi sáng:</strong> Nên uống vào một khung giờ cố định mỗi ngày để giữ huyết áp ổn định, không tự ý ngưng thuốc khi thấy khỏe.
          </p>
          <p className="text-sm text-[#1F2937] leading-relaxed">
            <strong>Khi đang bận:</strong> Nếu chuông báo mà bạn chưa uống ngay được, hãy bấm{' '}
            <strong>“Nhắc lại sau”</strong> để điện thoại tự động nhắc lại sau 10 phút.
          </p>
        </Card>
      </div>
    </div>
  );
};

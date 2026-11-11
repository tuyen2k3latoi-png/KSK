import React, { useState } from 'react';
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
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  Clock,
  FileHeart,
  Pill,
  Plus,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';

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
  { label: '21:30 (Trước ngủ)', value: '21:30' },
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

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editTargetWeight, setEditTargetWeight] = useState(String(profile.targetWeightKg));
  const [editDoctor, setEditDoctor] = useState(profile.primaryDoctor);
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(profile.emergencyContactPhone);

  const adherence = calculateMedicationAdherence(medications);

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
      purpose: purpose.trim() || 'Theo chỉ định lâm sàng',
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left 2 Columns: Local Push Notification Control Center + Medication Schedule */}
      <div className="lg:col-span-2 space-y-5">
        {/* 1. Local Push Notification & Alarm Settings Panel */}
        <section
          aria-label="Hệ thống thông báo đẩy nhắc uống thuốc đúng giờ"
          data-testid="medication-notification-settings-panel"
          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  notificationSettings.enabled
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {notificationSettings.enabled ? (
                  <BellRing className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Chuông &amp; Thông báo Đẩy Nhắc Uống Thuốc Cục bộ
                  </h3>
                  <span
                    data-testid="push-notification-status-badge"
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      notificationSettings.enabled
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {notificationSettings.enabled ? 'Đang bật tự động' : 'Đang tạm tắt'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tự động đẩy thông báo nổi và phát chuông nhẹ trên màn hình đúng giờ hẹn uống thuốc
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
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                  notificationSettings.enabled
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                {notificationSettings.enabled ? (
                  <>
                    <BellOff className="w-3.5 h-3.5" />
                    <span>Tắt chuông nhắc</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>Bật chuông nhắc</span>
                  </>
                )}
              </button>

              <button
                type="button"
                data-testid="trigger-test-push-btn"
                onClick={() => onTriggerTestPush()}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Gửi thử Thông báo Đẩy ngay</span>
              </button>
            </div>
          </div>

          {/* Next Upcoming Medication Dose Banner */}
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {nextDoseInfo ? (
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-teal-900">
                    Cữ thuốc sắp tới tiếp theo:
                  </span>
                  <span
                    data-testid="next-dose-countdown"
                    className="px-2 py-0.5 rounded bg-white border border-teal-200 text-teal-800 text-xs font-bold font-mono-tabular"
                  >
                    {nextDoseInfo.countdownLabel}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  {nextDoseInfo.medication.medicationName} ({nextDoseInfo.medication.dosage}) — Giờ
                  hẹn:{' '}
                  <span className="font-mono-tabular text-teal-800">
                    {nextDoseInfo.medication.timeSlot}
                  </span>{' '}
                  ({nextDoseInfo.medication.mealInstruction})
                </p>
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-semibold text-emerald-800">
                Tuyệt vời! Cô/chú đã uống đầy đủ tất cả các cữ thuốc trong ngày hôm nay.
              </div>
            )}

            {notificationSettings.browserPermission !== 'granted' &&
              notificationSettings.browserPermission !== 'unsupported' && (
                <button
                  type="button"
                  onClick={onRequestBrowserPermission}
                  data-testid="request-browser-notification-btn"
                  className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-900 bg-white hover:bg-teal-100 border border-teal-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cho phép Thông báo Trình duyệt
                </button>
              )}
          </div>

          {/* Notification Configuration Controls (Lead time, Snooze, Sound) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label
                htmlFor="notif-lead-minutes"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Thời điểm báo nhắc trước giờ uống
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
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
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Thời gian nhắc lại khi bấm Hoãn
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
              >
                <option value={5}>Nhắc lại sau 5 phút</option>
                <option value={10}>Nhắc lại sau 10 phút</option>
                <option value={15}>Nhắc lại sau 15 phút</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700 mb-1">
                Âm thanh chuông nhắc nhở
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
                className={`w-full min-h-[34px] px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  notificationSettings.soundEnabled
                    ? 'bg-teal-50 border-teal-200 text-teal-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {notificationSettings.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-teal-600" />
                    <span>Chuông báo: Đang bật</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-400" />
                    <span>Chuông báo: Im lặng</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recent Local Push Notification Log */}
          {notificationHistory.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                Nhật ký Thông báo Đẩy gần đây ({notificationHistory.length})
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {notificationHistory.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 truncate">
                      <span className="font-mono-tabular font-semibold text-teal-700">
                        [{item.triggeredAt}]
                      </span>{' '}
                      <strong className="text-slate-900">{item.medicationName}</strong> ·{' '}
                      <span className="text-slate-600">{item.dosage}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${
                        item.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-800'
                          : item.status === 'snoozed'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-slate-200/70 text-slate-700'
                      }`}
                    >
                      {item.status === 'confirmed'
                        ? 'Đã xác nhận uống'
                        : item.status === 'snoozed'
                        ? 'Đã hẹn nhắc lại'
                        : item.status === 'active'
                        ? 'Đang hiển thị'
                        : 'Đã xem'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 2. Daily Medication Schedule & Prescription Adherence */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Lịch Uống Thuốc &amp; Cài Đặt Giờ Nhắc Từng Cữ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cô/chú có thể đổi giờ nhắc trực tiếp trên từng thuốc hoặc bấm &ldquo;Nhắc thử&rdquo;
                để kiểm tra chuông
              </p>
            </div>
            <div className="text-right font-mono-tabular">
              <span className="text-xs text-slate-500">Tỷ lệ tuân thủ hôm nay: </span>
              <strong
                data-testid="med-adherence-percent"
                className="text-base font-bold text-teal-700"
              >
                {adherence.adherencePercent}%
              </strong>{' '}
              <span className="text-xs text-slate-500">
                ({adherence.takenCount}/{adherence.totalCount} cữ)
              </span>
            </div>
          </div>

          {/* Medication List */}
          <div className="divide-y divide-slate-100 my-2">
            {medications.map((med) => {
              const isReminderOn = med.reminderEnabled !== false;
              return (
                <div
                  key={med.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        med.takenToday
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <Pill className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`text-sm font-semibold ${
                            med.takenToday ? 'text-slate-600 line-through' : 'text-slate-900'
                          }`}
                        >
                          {med.medicationName}
                        </h4>
                        {med.snoozedUntil && !med.takenToday && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold font-mono-tabular">
                            Hẹn nhắc lại lúc {med.snoozedUntil}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">{med.purpose}</p>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-500 font-mono-tabular">
                        <label
                          htmlFor={`time-${med.id}`}
                          className="inline-flex items-center gap-1.5 text-slate-700 font-medium"
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
                            className="px-2 py-0.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-md font-mono-tabular"
                          />
                        </label>
                        <span>·</span>
                        <span>Liều: {med.dosage}</span>
                        <span>·</span>
                        <span>{med.mealInstruction}</span>
                        <span>·</span>
                        <span>
                          Còn: {med.remainingPills}/{med.totalPills} viên
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
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
                      className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                        isReminderOn
                          ? 'bg-teal-50/70 text-teal-800 border-teal-200 hover:bg-teal-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isReminderOn ? (
                        <>
                          <Bell className="w-3.5 h-3.5 text-teal-600" />
                          <span>Bật nhắc</span>
                        </>
                      ) : (
                        <>
                          <BellOff className="w-3.5 h-3.5 text-slate-400" />
                          <span>Đã tắt</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      data-testid={`test-push-med-${med.id}`}
                      onClick={() => onTriggerTestPush(med)}
                      className="min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Nhắc thử
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleMedication(med.id)}
                      aria-label={`${
                        med.takenToday ? 'Hoàn tác đã uống' : 'Xác nhận đã uống'
                      } ${med.medicationName}`}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                        med.takenToday
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-teal-600 text-white hover:bg-teal-700'
                      }`}
                    >
                      {med.takenToday ? (
                        <>
                          <Check className="w-4 h-4" />
                          Đã uống ({med.takenAt || med.timeSlot})
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          Xác nhận Đã uống
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Medication Form with Custom Time Support */}
          <form
            onSubmit={handleAddMed}
            className="mt-4 pt-4 border-t border-slate-100 space-y-3"
          >
            <div className="text-xs font-semibold text-slate-800">
              Thêm Thuốc Mới vào Lịch Nhắc Thông báo Đẩy
            </div>
            {formError && (
              <p role="alert" className="text-xs text-red-600 font-medium">
                {formError}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="med-name" className="block text-xs text-slate-600 mb-1">
                  Tên thuốc &amp; Hàm lượng
                </label>
                <input
                  id="med-name"
                  type="text"
                  placeholder="VD: Coenzyme Q10 100mg..."
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="med-dosage" className="block text-xs text-slate-600 mb-1">
                  Liều dùng
                </label>
                <input
                  id="med-dosage"
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="med-time" className="block text-xs text-slate-600 mb-1">
                  Giờ thông báo đẩy (HH:mm)
                </label>
                <input
                  id="med-time"
                  type="time"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value || '07:00')}
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono-tabular font-semibold"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {QUICK_TIME_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setTimeSlot(preset.value)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono-tabular border cursor-pointer ${
                        timeSlot === preset.value
                          ? 'bg-teal-600 text-white border-teal-600 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="med-meal" className="block text-xs text-slate-600 mb-1">
                  Chỉ dẫn dùng thuốc
                </label>
                <select
                  id="med-meal"
                  value={mealInstruction}
                  onChange={(e) =>
                    setMealInstruction(
                      e.target.value as MedicationSchedule['mealInstruction']
                    )
                  }
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Sau ăn 30 phút">Sau ăn 30 phút</option>
                  <option value="Trước ăn 30 phút">Trước ăn 30 phút</option>
                  <option value="Cùng bữa ăn">Cùng bữa ăn</option>
                  <option value="Trước khi ngủ">Trước khi ngủ</option>
                </select>
              </div>
              <div>
                <label htmlFor="med-purpose" className="block text-xs text-slate-600 mb-1">
                  Mục đích điều trị
                </label>
                <input
                  id="med-purpose"
                  type="text"
                  placeholder="VD: Bảo vệ tim mạch"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm vào Lịch Nhắc Thông báo Đẩy
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: Emergency Medical ID & Clinical Profile */}
      <div className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileHeart className="w-4 h-4 text-rose-600" />
              <h3 className="text-base font-semibold text-slate-900">
                Hồ sơ Y tế &amp; Thẻ Cấp cứu
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="text-xs font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isEditingProfile ? 'Đóng chỉnh sửa' : 'Cập nhật hồ sơ'}
            </button>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label htmlFor="prof-target-weight" className="block text-slate-600 mb-1">
                  Cân nặng mục tiêu (kg)
                </label>
                <input
                  id="prof-target-weight"
                  type="number"
                  step="0.1"
                  value={editTargetWeight}
                  onChange={(e) => setEditTargetWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-tabular"
                />
              </div>
              <div>
                <label htmlFor="prof-doctor" className="block text-slate-600 mb-1">
                  Bác sĩ điều trị chính
                </label>
                <input
                  id="prof-doctor"
                  type="text"
                  value={editDoctor}
                  onChange={(e) => setEditDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="prof-phone" className="block text-slate-600 mb-1">
                  Số điện thoại Liên hệ Khẩn cấp
                </label>
                <input
                  id="prof-phone"
                  type="text"
                  value={editEmergencyPhone}
                  onChange={(e) => setEditEmergencyPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-tabular"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
              >
                Lưu Hồ sơ Y tế
              </button>
            </form>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Họ và tên bệnh nhân</span>
                <span className="font-semibold text-slate-900">{profile.fullName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Năm sinh / Giới tính</span>
                <span className="font-mono-tabular text-slate-800">
                  {profile.birthYear} ({2026 - profile.birthYear} tuổi) ·{' '}
                  {profile.gender === 'female' ? 'Nữ' : 'Nam'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Nhóm máu (ABO/Rh)</span>
                <span className="font-mono-tabular font-bold text-rose-700">
                  {profile.bloodType}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Chiều cao / Mục tiêu cân nặng</span>
                <span className="font-mono-tabular text-slate-800">
                  {profile.heightCm} cm · Mục tiêu {profile.targetWeightKg} kg
                </span>
              </div>
              <div className="py-1.5 border-b border-slate-100">
                <span className="text-slate-500 block mb-1">Tiền sử Dị ứng Cảnh báo:</span>
                <p className="font-medium text-rose-700">
                  {profile.allergies.join(' · ')}
                </p>
              </div>
              <div className="py-1.5 border-b border-slate-100">
                <span className="text-slate-500 block mb-1">Tình trạng Theo dõi Mãn tính:</span>
                <p className="font-medium text-slate-800">
                  {profile.chronicConditions.join(' · ')}
                </p>
              </div>
              <div className="py-1.5 border-b border-slate-100">
                <span className="text-slate-500 block mb-1">Bác sĩ &amp; Cơ sở Y tế Quản lý:</span>
                <p className="font-medium text-slate-900">{profile.primaryDoctor}</p>
                <p className="text-slate-500 mt-0.5">{profile.hospitalName}</p>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Liên hệ Khẩn cấp (Người thân):</span>
                <p className="font-semibold text-slate-900">
                  {profile.emergencyContactName} ·{' '}
                  <span className="font-mono-tabular text-teal-700">
                    {profile.emergencyContactPhone}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Clinical Drug Interaction Notice */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-slate-700 space-y-1.5">
          <div className="font-semibold text-amber-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            Lưu ý Khi Uống Thuốc Đúng Giờ
          </div>
          <p className="leading-relaxed">
            <strong>Thuốc huyết áp (Amlodipine / Telmisartan):</strong> Nên uống vào một khung giờ
            cố định mỗi sáng để giữ huyết áp ổn định suốt 24 giờ, không uống chung với nước ép bưởi.
          </p>
          <p className="leading-relaxed">
            <strong>Nếu lỡ quên cữ thuốc:</strong> Khi thông báo nhắc nhở hiện lên mà cô/chú đang
            bận, hãy bấm <strong>&ldquo;Nhắc lại sau 10 phút&rdquo;</strong> để máy báo lại, tránh
            quên cữ.
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  HeartHandshake,
  PhoneCall,
  ShieldAlert,
  Stethoscope,
  X,
} from 'lucide-react';
import { UserMedicalProfile, VitalRecord } from '../types/health';
import {
  EmergencyAlertEvaluation,
  EmergencyContactInput,
  formatEmergencyPhoneDisplay,
  sanitizeTelHref,
  validateEmergencyContactsForm,
} from '../services/emergencyService';
import { ContactCallRow, EmergencyContactEditForm } from './EmergencyContactParts';

interface EmergencyCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserMedicalProfile;
  alertEvaluation: EmergencyAlertEvaluation;
  latestVital: VitalRecord;
  onSaveContacts: (contacts: EmergencyContactInput) => void;
}

export const EmergencyCallModal: React.FC<EmergencyCallModalProps> = ({
  isOpen,
  onClose,
  profile,
  alertEvaluation,
  latestVital,
  onSaveContacts,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState<EmergencyContactInput>({
    emergencyContactName: profile.emergencyContactName || '',
    emergencyContactPhone:
      profile.emergencyContactPhone === 'Chưa cập nhật' ? '' : profile.emergencyContactPhone || '',
    primaryDoctor: profile.primaryDoctor || '',
    primaryDoctorPhone: profile.primaryDoctorPhone || '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (!justOpened) return;
    setFormValues({
      emergencyContactName: profile.emergencyContactName || '',
      emergencyContactPhone:
        profile.emergencyContactPhone === 'Chưa cập nhật' ? '' : profile.emergencyContactPhone || '',
      primaryDoctor: profile.primaryDoctor || '',
      primaryDoctorPhone: profile.primaryDoctorPhone || '',
    });
    setFormError(null);
    setSavedSuccess(false);
    setIsEditing(false);
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateEmergencyContactsForm(formValues);
    if (!check.valid) {
      setFormError(check.error || 'Vui lòng kiểm tra lại số điện thoại.');
      return;
    }
    onSaveContacts(check.normalized);
    setFormError(null);
    setSavedSuccess(true);
    setIsEditing(false);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      data-testid="emergency-call-modal"
    >
      <div className="bg-white border-t sm:border border-stone-200 rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl max-h-[92dvh] overflow-y-auto pb-safe space-y-4">
        <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto" />

        <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 text-[#DC2626] flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h2 id="emergency-modal-title" className="text-lg sm:text-xl font-extrabold text-[#1F2937]">
                Gọi khẩn cấp nhanh
              </h2>
              <p className="text-sm text-stone-600">
                Chạm 1 lần để gọi người thân, bác sĩ hoặc cấp cứu 115
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ gọi khẩn cấp"
            data-testid="close-emergency-modal-btn"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {alertEvaluation.isAlarming && (
          <div role="alert" data-testid="emergency-modal-alarm-banner" className="p-3.5 rounded-2xl bg-[#DC2626] text-white space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Phát hiện chỉ số sức khỏe đang báo động</span>
            </div>
            <p className="text-sm leading-relaxed text-red-50">
              {alertEvaluation.reasons.length > 0
                ? alertEvaluation.reasons.join(' · ')
                : `Huyết áp gần nhất: ${latestVital.systolic}/${latestVital.diastolic} mmHg`}
            </p>
          </div>
        )}

        {savedSuccess && (
          <div role="status" data-testid="emergency-contact-saved-toast" className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Đã lưu số điện thoại liên hệ khẩn cấp.</span>
          </div>
        )}

        {!isEditing ? (
          <div className="space-y-3">
            <ContactCallRow
              icon={<HeartHandshake className="w-5 h-5" />}
              categoryLabel="Người thân khẩn cấp"
              nameLabel={profile.emergencyContactName || 'Chưa đặt tên người thân'}
              phoneDisplay={formatEmergencyPhoneDisplay(profile.emergencyContactPhone)}
              telHref={sanitizeTelHref(profile.emergencyContactPhone)}
              callButtonLabel="Gọi người thân"
              addButtonLabel="Thêm số ngay"
              testIdPrefix="family"
              phoneDisplayTestId="emergency-family-phone-display"
              onAddClick={() => setIsEditing(true)}
            />

            <ContactCallRow
              icon={<Stethoscope className="w-5 h-5" />}
              categoryLabel="Bác sĩ gia đình / điều trị"
              nameLabel={profile.primaryDoctor || 'Bác sĩ gia đình'}
              phoneDisplay={formatEmergencyPhoneDisplay(profile.primaryDoctorPhone)}
              subLabel={profile.hospitalName}
              telHref={sanitizeTelHref(profile.primaryDoctorPhone)}
              callButtonLabel="Gọi bác sĩ"
              addButtonLabel="Thêm số bác sĩ"
              testIdPrefix="doctor"
              phoneDisplayTestId="emergency-doctor-phone-display"
              onAddClick={() => setIsEditing(true)}
            />

            <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white border border-red-200 text-[#DC2626] flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-700">Cấp cứu y tế toàn quốc</p>
                  <p className="text-base font-extrabold text-[#1F2937]">Trung tâm Cấp cứu 115</p>
                  <p className="text-sm text-stone-700">Khi đau ngực, khó thở, yếu liệt hoặc HA &ge; 180/120</p>
                </div>
              </div>
              <a
                href="tel:115"
                data-testid="call-115-tel-link"
                className="min-h-[52px] px-5 py-2.5 rounded-2xl bg-[#DC2626] hover:bg-red-700 text-white text-base font-extrabold inline-flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                <PhoneCall className="w-5 h-5 shrink-0" />
                <span>Gọi 115 ngay</span>
              </a>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-stone-100">
              <button
                type="button"
                onClick={() => { setSavedSuccess(false); setIsEditing(true); }}
                data-testid="edit-emergency-contacts-btn"
                className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-[#1F2937] text-base font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Edit3 className="w-4 h-4 text-[#0F766E]" />
                <span>Lưu / Sửa số liên hệ</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-300 text-[#1F2937] text-base font-semibold cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <EmergencyContactEditForm
            values={formValues}
            error={formError}
            onChange={setFormValues}
            onCancel={() => { setFormError(null); setIsEditing(false); }}
            onSubmit={handleSave}
          />
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { PhoneCall } from 'lucide-react';
import { EmergencyContactInput } from '../services/emergencyService';

interface ContactCallRowProps {
  icon: React.ReactNode;
  categoryLabel: string;
  nameLabel: string;
  phoneDisplay: string;
  subLabel?: string;
  telHref: string | null;
  callButtonLabel: string;
  addButtonLabel: string;
  testIdPrefix: 'family' | 'doctor';
  phoneDisplayTestId: string;
  onAddClick: () => void;
}

export const ContactCallRow: React.FC<ContactCallRowProps> = ({
  icon,
  categoryLabel,
  nameLabel,
  phoneDisplay,
  subLabel,
  telHref,
  callButtonLabel,
  addButtonLabel,
  testIdPrefix,
  phoneDisplayTestId,
  onAddClick,
}) => (
  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-start gap-3 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 text-[#0F766E] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{categoryLabel}</p>
        <p className="text-base font-extrabold text-[#1F2937] truncate">{nameLabel}</p>
        <p data-testid={phoneDisplayTestId} className="text-base font-bold text-[#0B5F57] tabular-nums">
          {phoneDisplay}
        </p>
        {subLabel && <p className="text-xs text-stone-600 truncate mt-0.5">{subLabel}</p>}
      </div>
    </div>
    {telHref ? (
      <a
        href={telHref}
        data-testid={`call-${testIdPrefix}-tel-link`}
        className="min-h-[50px] px-4 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-base font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors whitespace-nowrap shrink-0"
      >
        <PhoneCall className="w-5 h-5 shrink-0" />
        <span>{callButtonLabel}</span>
      </a>
    ) : (
      <button
        type="button"
        onClick={onAddClick}
        className="min-h-[50px] px-4 py-2.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-300 text-[#0B5F57] text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
      >
        <span>{addButtonLabel}</span>
      </button>
    )}
  </div>
);

interface EmergencyContactEditFormProps {
  values: EmergencyContactInput;
  error: string | null;
  onChange: (next: EmergencyContactInput) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EmergencyContactEditForm: React.FC<EmergencyContactEditFormProps> = ({
  values,
  error,
  onChange,
  onCancel,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="space-y-3.5" data-testid="emergency-contact-form">
    {error && (
      <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-[#DC2626]">
        {error}
      </div>
    )}

    <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3">
      <p className="text-sm font-extrabold text-[#0B5F57]">1. Thông tin người thân khẩn cấp</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="ec-family-name" className="block text-sm font-semibold text-stone-700 mb-1">
            Họ tên / Quan hệ
          </label>
          <input
            id="ec-family-name"
            type="text"
            value={values.emergencyContactName}
            onChange={(e) => onChange({ ...values, emergencyContactName: e.target.value })}
            placeholder="VD: Con gái Lan"
            className="w-full min-h-[46px] px-3.5 py-2 text-base bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>
        <div>
          <label htmlFor="ec-family-phone" className="block text-sm font-semibold text-stone-700 mb-1">
            Số điện thoại người thân
          </label>
          <input
            id="ec-family-phone"
            type="tel"
            inputMode="tel"
            value={values.emergencyContactPhone}
            onChange={(e) => onChange({ ...values, emergencyContactPhone: e.target.value })}
            placeholder="VD: 0912 345 678"
            className="w-full min-h-[46px] px-3.5 py-2 text-base bg-white border border-stone-300 rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>
      </div>
    </div>

    <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3">
      <p className="text-sm font-extrabold text-[#0B5F57]">2. Thông tin bác sĩ gia đình</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="ec-doctor-name" className="block text-sm font-semibold text-stone-700 mb-1">
            Tên bác sĩ
          </label>
          <input
            id="ec-doctor-name"
            type="text"
            value={values.primaryDoctor}
            onChange={(e) => onChange({ ...values, primaryDoctor: e.target.value })}
            placeholder="VD: BS. Nguyễn Văn Hùng"
            className="w-full min-h-[46px] px-3.5 py-2 text-base bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>
        <div>
          <label htmlFor="ec-doctor-phone" className="block text-sm font-semibold text-stone-700 mb-1">
            Số điện thoại bác sĩ
          </label>
          <input
            id="ec-doctor-phone"
            type="tel"
            inputMode="tel"
            value={values.primaryDoctorPhone}
            onChange={(e) => onChange({ ...values, primaryDoctorPhone: e.target.value })}
            placeholder="VD: 028 3855 4269"
            className="w-full min-h-[46px] px-3.5 py-2 text-base bg-white border border-stone-300 rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>
      </div>
    </div>

    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
      <button
        type="button"
        onClick={onCancel}
        className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-[#1F2937] text-base font-bold cursor-pointer"
      >
        Quay lại
      </button>
      <button
        type="submit"
        data-testid="save-emergency-contacts-btn"
        className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-base font-bold cursor-pointer"
      >
        Lưu số liên hệ
      </button>
    </div>
  </form>
);

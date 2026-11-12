import React from 'react';
import { User } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Cloud,
  FileHeart,
  UserPlus,
} from 'lucide-react';
import { CitizenHealthAccount } from '../../types/health';
import { CONDITION_TEMPLATES } from '../../utils/welcomeProfileBuilder';

interface WelcomePersonalFormProps {
  fullNameInput: string;
  setFullNameInput: (val: string) => void;
  identifierInput: string;
  setIdentifierInput: (val: string) => void;
  birthYearInput: string;
  setBirthYearInput: (val: string) => void;
  genderInput: 'male' | 'female';
  setGenderInput: (val: 'male' | 'female') => void;
  hospitalInput: string;
  setHospitalInput: (val: string) => void;
  selectedConditions: string[];
  onToggleCondition: (key: string) => void;
  onStartEmptyPersonalProfile: () => void;
  onProceedStep2EmptyProfile: () => void;
  onCustomSubmit: (e: React.FormEvent) => void;
}

export const WelcomePersonalForm: React.FC<WelcomePersonalFormProps> = ({
  fullNameInput,
  setFullNameInput,
  identifierInput,
  setIdentifierInput,
  birthYearInput,
  setBirthYearInput,
  genderInput,
  setGenderInput,
  hospitalInput,
  setHospitalInput,
  selectedConditions,
  onToggleCondition,
  onStartEmptyPersonalProfile,
  onProceedStep2EmptyProfile,
  onCustomSubmit,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-bold text-teal-950 break-words">
            Bắt đầu nhanh với Hồ sơ của tôi (Dữ liệu trống)
          </h3>
          <p className="text-sm text-teal-900 break-words">
            Tạo sổ sức khỏe cá nhân trống hoàn toàn để bạn tự nhập chỉ số huyết áp, đường huyết và đơn thuốc của riêng mình.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onProceedStep2EmptyProfile}
            data-testid="empty-profile-step2-btn"
            className="min-h-[42px] px-3 py-2 rounded-xl bg-white border border-teal-300 hover:bg-teal-100 text-teal-900 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Cloud className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Bước 2: Sao lưu</span>
          </button>
          <button
            type="button"
            onClick={onStartEmptyPersonalProfile}
            data-testid="start-empty-personal-profile-btn"
            className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Mở Hồ sơ Trống</span>
          </button>
        </div>
      </div>

      <form onSubmit={onCustomSubmit} className="space-y-4 pt-3 border-t border-slate-200">
        <p className="text-sm font-semibold text-slate-800 break-words">
          Hoặc tự điền thông tin cá nhân &amp; mã thẻ BHYT để lưu trữ trên thiết bị:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Họ và tên của bạn *
            </label>
            <input
              type="text"
              value={fullNameInput}
              onChange={(e) => setFullNameInput(e.target.value)}
              placeholder="VD: Nguyễn Văn Bình"
              data-testid="welcome-name-input"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-teal-600 rounded-xl text-slate-900 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Mã thẻ BHYT / CCCD (Tự nhập, không bắt buộc)
            </label>
            <input
              type="text"
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              placeholder="Tự nhập 15 ký tự BHYT hoặc để trống"
              data-testid="welcome-cccd-input"
              className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-slate-50 focus:bg-white border border-slate-300 focus:border-teal-600 rounded-xl text-slate-900 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Năm sinh
            </label>
            <input
              type="number"
              min={1930}
              max={2020}
              value={birthYearInput}
              onChange={(e) => setBirthYearInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-slate-50 focus:bg-white border border-slate-300 focus:border-teal-600 rounded-xl text-slate-900 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Giới tính
            </label>
            <select
              value={genderInput}
              onChange={(e) => setGenderInput(e.target.value === 'female' ? 'female' : 'male')}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-teal-600 rounded-xl text-slate-900 outline-none transition-colors"
            >
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Nơi khám chữa bệnh BHYT ban đầu
            </label>
            <input
              type="text"
              value={hospitalInput}
              onChange={(e) => setHospitalInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-teal-600 rounded-xl text-slate-900 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-800">
            Bệnh lý cần ưu tiên hiển thị trên bảng Tổng quan:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(CONDITION_TEMPLATES).map(([key, item]) => {
              const checked = selectedConditions.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleCondition(key)}
                  className={`p-2.5 rounded-xl border text-left text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
                    checked
                      ? 'bg-teal-50/70 border-teal-600 text-slate-900 font-semibold'
                      : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      checked
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3" />}
                  </span>
                  <span className="break-words">
                    {item.label}{' '}
                    <span className="text-slate-600 font-normal">({item.icdCode})</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-600 break-words">
            Tự nhập mã thẻ BHYT để lưu trữ cá nhân – không kết nối cơ quan BHXH/VNeID
          </span>
          <button
            type="submit"
            data-testid="welcome-submit-cccd-btn"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <FileHeart className="w-4 h-4 shrink-0" />
            <span>Lưu &amp; Mở Hồ sơ của tôi</span>
          </button>
        </div>
      </form>
    </div>
  );
};

interface WelcomeStep2CloudBackupProps {
  pendingAccount: CitizenHealthAccount;
  cloudUser: User | null;
  isGoogleLoading: boolean;
  onGoogleLoginAndEnter: () => void;
  onContinueWithoutBackup: () => void;
  onBackToStep1: () => void;
}

export const WelcomeStep2CloudBackup: React.FC<WelcomeStep2CloudBackupProps> = ({
  pendingAccount,
  cloudUser,
  isGoogleLoading,
  onGoogleLoginAndEnter,
  onContinueWithoutBackup,
  onBackToStep1,
}) => {
  return (
    <div
      data-testid="welcome-step-2-panel"
      className="space-y-4 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200"
    >
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-100 text-teal-900 text-xs font-bold">
          Bước 2 / 2 · Tùy chọn Sao lưu Đám mây
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 break-words">
          Sao lưu Hồ sơ Sức khỏe qua Google (Không bắt buộc)
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed break-words">
          Bạn đã chọn hồ sơ:{' '}
          <strong className="text-slate-900">{pendingAccount.profile.fullName}</strong> (
          {pendingAccount.isDemo ? 'HỒ SƠ DEMO' : 'HỒ SƠ CỦA TÔI'}). Bạn có thể đăng nhập Google để đồng bộ dữ liệu lên đám mây cá nhân hoặc bỏ qua để vào thẳng ứng dụng.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700">Hồ sơ chuẩn bị mở:</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              pendingAccount.isDemo
                ? 'bg-amber-100 border border-amber-300 text-amber-950'
                : 'bg-teal-50 border border-teal-200 text-teal-900'
            }`}
          >
            {pendingAccount.isDemo ? 'HỒ SƠ DEMO' : 'HỒ SƠ CỦA TÔI'}
          </span>
        </div>
        <p className="text-base font-bold text-slate-900 break-words">
          {pendingAccount.profile.fullName} ({2026 - pendingAccount.profile.birthYear} tuổi)
        </p>
        <p className="text-xs text-slate-700 break-words">
          Bệnh lý theo dõi:{' '}
          {pendingAccount.profile.chronicConditions.length > 0
            ? pendingAccount.profile.chronicConditions.join(' · ')
            : 'Chưa ghi nhận bệnh lý mãn tính'}
        </p>
      </div>

      <div className="space-y-2.5 pt-1">
        {cloudUser ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-950 flex items-center gap-2 break-words">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Đã kết nối Google Cloud (<strong>{cloudUser.email}</strong>).
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onGoogleLoginAndEnter}
            disabled={isGoogleLoading}
            data-testid="welcome-google-login-btn"
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-teal-600 text-teal-900 text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Cloud className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              {isGoogleLoading
                ? 'Đang kết nối Google...'
                : 'Đăng nhập Google để sao lưu đám mây (Tùy chọn)'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onContinueWithoutBackup}
          data-testid="welcome-step2-continue-btn"
          className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <span>Bỏ qua sao lưu &amp; Mở Sổ Sức khỏe ngay</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>

        <button
          type="button"
          onClick={onBackToStep1}
          data-testid="welcome-step2-back-btn"
          className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Quay lại Bước 1 (Đổi chế độ Dùng thử / Hồ sơ của tôi)</span>
        </button>
      </div>
    </div>
  );
};

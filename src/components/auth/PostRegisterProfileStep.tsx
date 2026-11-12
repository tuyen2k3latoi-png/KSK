import React, { useState } from 'react';
import { Check, CheckCircle2, FileHeart } from 'lucide-react';
import { CitizenHealthAccount } from '../../types/health';
import {
  buildCustomPersonalAccount,
  buildEmptyPersonalProfile,
  CONDITION_TEMPLATES,
} from '../../utils/welcomeProfileBuilder';

interface PostRegisterProfileStepProps {
  fullName: string;
  phone: string;
  onComplete: (account: CitizenHealthAccount) => void;
}

export const PostRegisterProfileStep: React.FC<PostRegisterProfileStepProps> = ({
  fullName,
  phone,
  onComplete,
}) => {
  const [birthYearInput, setBirthYearInput] = useState('1965');
  const [genderInput, setGenderInput] = useState<'male' | 'female'>('male');
  const [bhytInput, setBhytInput] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>(['hypertension']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleCondition = (key: string) => {
    setSelectedConditions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleFinishCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const built = buildCustomPersonalAccount({
      fullNameInput: fullName.trim(),
      birthYearInput,
      genderInput,
      identifierInput: bhytInput.trim(),
      hospitalInput: 'Bệnh viện Đa khoa Khu vực',
      selectedConditions,
    });
    if (built.error || !built.account) {
      return setErrorMsg(built.error || 'Thông tin mã thẻ BHYT chưa hợp lệ.');
    }
    onComplete({
      ...built.account,
      isDemo: false,
      profile: {
        ...built.account.profile,
        isDemo: false,
        emergencyContactPhone: phone,
      },
    });
  };

  const handleOpenEmptyProfile = () => {
    onComplete(
      buildEmptyPersonalProfile({
        fullNameInput: fullName.trim(),
        birthYearInput,
        genderInput,
        identifierInput: bhytInput.trim(),
        hospitalInput: 'Bệnh viện Đa khoa Khu vực',
      })
    );
  };

  return (
    <form
      onSubmit={handleFinishCreateProfile}
      data-testid="post-register-profile-form"
      className="space-y-4 pt-1"
    >
      <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex items-start gap-2.5">
        <CheckCircle2 className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
        <div className="text-sm text-slate-800">
          <p className="font-bold text-[#0B5F57]">
            Đăng ký thành công cho {fullName} ({phone})!
          </p>
          <p className="mt-0.5">Thiết lập nhanh hồ sơ sức khỏe cá nhân của bạn:</p>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm font-semibold text-rose-800"
        >
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="profile-birth-year" className="block text-sm font-semibold text-slate-800 mb-1">
            Năm sinh
          </label>
          <input
            id="profile-birth-year"
            type="number"
            min={1930}
            max={2020}
            value={birthYearInput}
            onChange={(e) => setBirthYearInput(e.target.value)}
            className="w-full min-h-[48px] px-3.5 py-2.5 text-base font-mono-tabular bg-white border border-slate-300 focus:border-[#0F766E] rounded-xl text-slate-900 outline-none"
          />
        </div>
        <div>
          <label htmlFor="profile-gender" className="block text-sm font-semibold text-slate-800 mb-1">
            Giới tính
          </label>
          <select
            id="profile-gender"
            value={genderInput}
            onChange={(e) => setGenderInput(e.target.value === 'female' ? 'female' : 'male')}
            className="w-full min-h-[48px] px-3.5 py-2.5 text-base bg-white border border-slate-300 focus:border-[#0F766E] rounded-xl text-slate-900 outline-none"
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="profile-bhyt-optional" className="block text-sm font-semibold text-slate-800 mb-1">
          Mã thẻ BHYT tự nhập (Không bắt buộc — lưu cá nhân)
        </label>
        <input
          id="profile-bhyt-optional"
          type="text"
          value={bhytInput}
          onChange={(e) => setBhytInput(e.target.value)}
          placeholder="Nhập 15 ký tự thẻ BHYT hoặc để trống"
          className="w-full min-h-[48px] px-3.5 py-2.5 text-base font-mono-tabular bg-white border border-slate-300 focus:border-[#0F766E] rounded-xl text-slate-900 outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <span className="block text-sm font-semibold text-slate-800">Bệnh lý cần ưu tiên theo dõi:</span>
        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(CONDITION_TEMPLATES).map(([key, item]) => {
            const checked = selectedConditions.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleCondition(key)}
                className={`min-h-[48px] px-3.5 py-2 rounded-xl border text-left text-sm flex items-center gap-2.5 cursor-pointer ${
                  checked
                    ? 'bg-teal-50 border-[#0F766E] text-slate-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                    checked ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-white border-slate-300'
                  }`}
                >
                  {checked && <Check className="w-3.5 h-3.5" />}
                </span>
                <span>
                  {item.label} ({item.icdCode})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleOpenEmptyProfile}
          data-testid="register-open-empty-profile-btn"
          className="min-h-[52px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-base font-semibold cursor-pointer"
        >
          Mở sổ trống
        </button>
        <button
          type="submit"
          data-testid="register-complete-profile-btn"
          className="flex-1 min-h-[52px] px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-[18px] font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <FileHeart className="w-5 h-5 shrink-0" />
          <span>Hoàn tất &amp; Mở Sổ Sức khỏe</span>
        </button>
      </div>
    </form>
  );
};

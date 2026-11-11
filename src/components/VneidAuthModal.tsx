import React, { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  FileHeart,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  BhytCardInfo,
  BhytVisitRecord,
  CitizenHealthAccount,
  MedicationSchedule,
  UserMedicalProfile,
  VitalRecord,
} from '../types/health';
import { CITIZEN_VNEID_ACCOUNTS } from '../data/seedHealthData';
import { validateVneidOrBhytInput } from '../utils/healthCalculations';
import { googleSignIn } from '../services/firebaseService';

interface VneidAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccountId: string;
  currentProfile: UserMedicalProfile;
  cloudUser: User | null;
  onSelectCitizenAccount: (account: CitizenHealthAccount) => void;
  onGoogleAuthSuccess: (user: User, hasToken: boolean) => void;
}

type AuthTab = 'quick_accounts' | 'custom_vneid';

const CONDITION_TEMPLATES: Record<
  string,
  {
    icdCode: string;
    label: string;
    department: string;
    diagnosisSummary: string;
    plainExplanation: string;
    doctorAdvice: string;
    med: {
      medicationName: string;
      dosage: string;
      purpose: string;
      timeSlot: '07:00' | '12:30' | '19:00' | '21:30';
      mealInstruction: 'Trước ăn 30 phút' | 'Sau ăn 30 phút' | 'Cùng bữa ăn' | 'Trước khi ngủ';
    };
    vitalsSample: { systolic: number; diastolic: number; bloodGlucose: number };
  }
> = {
  hypertension: {
    icdCode: 'I10',
    label: 'Tăng huyết áp (Cao huyết áp)',
    department: 'Khoa Nội Tim mạch',
    diagnosisSummary: 'Tăng huyết áp nguyên phát (Mã I10) — Đang điều trị ngoại trú BHYT',
    plainExplanation:
      'Áp lực máu lên thành mạch hơi cao. Cần uống thuốc huyết áp đều đặn mỗi sáng, ăn nhạt bớt muối và đo huyết áp hàng ngày.',
    doctorAdvice:
      'Uống thuốc hạ áp đúng giờ sau bữa sáng, hạn chế đồ mặn/dưa muối và đi bộ nhẹ 30 phút mỗi ngày.',
    med: {
      medicationName: 'Amlodipine 5mg (Thuốc BHYT ổn định huyết áp)',
      dosage: '1 viên nén',
      purpose: 'Kiểm soát huyết áp 24 giờ',
      timeSlot: '07:00',
      mealInstruction: 'Sau ăn 30 phút',
    },
    vitalsSample: { systolic: 132, diastolic: 83, bloodGlucose: 95 },
  },
  diabetes: {
    icdCode: 'E11',
    label: 'Tiểu đường / Đường huyết cao',
    department: 'Khoa Nội tiết — Đái tháo đường',
    diagnosisSummary: 'Đái tháo đường tuýp 2 (Mã E11) — Theo dõi đường huyết định kỳ',
    plainExplanation:
      'Lượng đường trong máu cao hơn mức bình thường. Cần hạn chế cơm trắng, bánh kẹo ngọt và tăng cường rau xanh, ngũ cốc nguyên hạt.',
    doctorAdvice:
      'Uống thuốc ổn định đường huyết sau bữa ăn, kiểm tra đường huyết lúc đói buổi sáng định kỳ.',
    med: {
      medicationName: 'Metformin 500mg (Thuốc BHYT kiểm soát đường huyết)',
      dosage: '1 viên nén',
      purpose: 'Ổn định đường huyết lúc đói & sau ăn',
      timeSlot: '07:00',
      mealInstruction: 'Sau ăn 30 phút',
    },
    vitalsSample: { systolic: 124, diastolic: 78, bloodGlucose: 115 },
  },
  lipid: {
    icdCode: 'E78.2',
    label: 'Mỡ máu cao (Cholesterol / Triglyceride)',
    department: 'Khoa Nội Tổng hợp',
    diagnosisSummary: 'Rối loạn chuyển hóa Lipoprotein / Mỡ máu tăng nhẹ (Mã E78.2)',
    plainExplanation:
      'Chỉ số mỡ trong máu hơi cao. Nên hạn chế đồ chiên rán, mỡ động vật, nội tạng và ăn nhiều cá, rau luộc.',
    doctorAdvice:
      'Bổ sung Omega-3 hoặc thuốc hạ mỡ máu theo đơn BHYT, tập thể dục tối thiểu 150 phút/tuần.',
    med: {
      medicationName: 'Atorvastatin 10mg / Omega-3 1000mg (Giảm mỡ máu)',
      dosage: '1 viên',
      purpose: 'Giảm Cholesterol & bảo vệ thành mạch',
      timeSlot: '19:00',
      mealInstruction: 'Sau ăn 30 phút',
    },
    vitalsSample: { systolic: 125, diastolic: 80, bloodGlucose: 96 },
  },
  joint: {
    icdCode: 'M17.0',
    label: 'Thoái hóa khớp gối / Đau xương khớp',
    department: 'Khoa Cơ Xương Khớp',
    diagnosisSummary: 'Thoái hóa khớp gối và cột sống thắt lưng theo tuổi (Mã M17.0)',
    plainExplanation:
      'Sụn khớp bị mòn tự nhiên theo tuổi tác gây mỏi khi đi lại nhiều hoặc thay đổi thời tiết.',
    doctorAdvice:
      'Tránh ngồi xổm hoặc khiêng vác nặng, giữ ấm khớp gối và tập đi bộ đường bằng phẳng.',
    med: {
      medicationName: 'Glucosamine Sulfate 1500mg + Canxi D3',
      dosage: '1 viên',
      purpose: 'Bổ sung dịch khớp & hỗ trợ sụn khớp',
      timeSlot: '12:30',
      mealInstruction: 'Sau ăn 30 phút',
    },
    vitalsSample: { systolic: 122, diastolic: 76, bloodGlucose: 94 },
  },
  stomach: {
    icdCode: 'K21',
    label: 'Đau dạ dày / Trào ngược thực quản',
    department: 'Khoa Nội Tiêu hóa',
    diagnosisSummary: 'Viêm dạ dày & Trào ngược dạ dày thực quản (Mã K21)',
    plainExplanation:
      'Dạ dày tiết nhiều dịch vị axit gây ợ hơi, đầy bụng hoặc nóng rát vùng thượng vị.',
    doctorAdvice:
      'Ăn đúng giờ, kiêng đồ chua cay, không nằm ngay sau khi ăn và ngủ kê cao gối.',
    med: {
      medicationName: 'Esomeprazole 20mg (Thuốc BHYT bảo vệ dạ dày)',
      dosage: '1 viên',
      purpose: 'Giảm axit dạ dày & lành niêm mạc',
      timeSlot: '07:00',
      mealInstruction: 'Trước ăn 30 phút',
    },
    vitalsSample: { systolic: 118, diastolic: 75, bloodGlucose: 91 },
  },
};

export const VneidAuthModal: React.FC<VneidAuthModalProps> = ({
  isOpen,
  onClose,
  currentAccountId,
  currentProfile,
  cloudUser,
  onSelectCitizenAccount,
  onGoogleAuthSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('quick_accounts');
  const [identifierInput, setIdentifierInput] = useState('079068009988');
  const [fullNameInput, setFullNameInput] = useState('');
  const [birthYearInput, setBirthYearInput] = useState('1966');
  const [genderInput, setGenderInput] = useState<'male' | 'female'>('male');
  const [hospitalInput, setHospitalInput] = useState('Bệnh viện Đa khoa Tỉnh / Thành phố');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([
    'hypertension',
    'joint',
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const toggleCondition = (key: string) => {
    setSelectedConditions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleCustomVneidLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateVneidOrBhytInput(identifierInput);
    if (!validation.valid) {
      setFormError(validation.error || 'Số CCCD hoặc Mã thẻ BHYT chưa hợp lệ.');
      return;
    }

    const cleanName = fullNameInput.trim() || 'Nguyễn Văn An';
    const birthYear = Math.max(1930, Math.min(2020, Number(birthYearInput) || 1966));
    const chosenKeys =
      selectedConditions.length > 0 ? selectedConditions : ['hypertension'];

    const bhytCard: BhytCardInfo = {
      bhytCode: validation.derivedBhytCode || 'DN4790680099881',
      bhxhNumber: (validation.derivedCccdNumber || '079068009988').slice(-10),
      cccdNumber: validation.derivedCccdNumber || '079068009988',
      vneidLevel: 2,
      coverageRate: birthYear <= 1966 ? '95% chi phí KCB (Hưu trí)' : '80% chi phí KCB đúng tuyến',
      registeredHospital: hospitalInput.trim() || 'Bệnh viện Đa khoa Trung ương',
      validFrom: '01/01/2026',
      fiveYearContinuousDate: 'Đủ 5 năm liên tục từ 01/01/2021',
      lastSyncedVneidAt: '11/11/2026 09:00',
    };

    const visits: BhytVisitRecord[] = chosenKeys.map((key, idx) => {
      const tpl = CONDITION_TEMPLATES[key] || CONDITION_TEMPLATES.hypertension;
      return {
        id: `bhyt-custom-${idx + 1}-${Date.now()}`,
        visitDate: idx === 0 ? '2026-11-06' : '2026-10-02',
        hospitalName: bhytCard.registeredHospital,
        department: tpl.department,
        doctorName: 'BS.CKII Trần Quốc Bảo',
        icdCode: tpl.icdCode,
        diagnosisSummary: tpl.diagnosisSummary,
        plainExplanation: tpl.plainExplanation,
        doctorAdvice: tpl.doctorAdvice,
        followUpDate: '2026-12-06',
        totalCostVnd: 760000,
        bhytPaidVnd: birthYear <= 1966 ? 722000 : 608000,
        patientCoPayVnd: birthYear <= 1966 ? 38000 : 152000,
        recordedVitals: {
          systolic: tpl.vitalsSample.systolic,
          diastolic: tpl.vitalsSample.diastolic,
          heartRate: 72,
          bloodGlucose: tpl.vitalsSample.bloodGlucose,
          weightKg: 64.0,
        },
        prescribedMedications: [
          {
            ...tpl.med,
            daysSupply: 30,
          },
        ],
      };
    });

    const meds: MedicationSchedule[] = chosenKeys.map((key, idx) => {
      const tpl = CONDITION_TEMPLATES[key] || CONDITION_TEMPLATES.hypertension;
      return {
        id: `med-custom-${idx + 1}-${Date.now()}`,
        medicationName: tpl.med.medicationName,
        dosage: tpl.med.dosage,
        purpose: tpl.med.purpose,
        frequency: 'Hàng ngày',
        timeSlot: tpl.med.timeSlot,
        mealInstruction: tpl.med.mealInstruction,
        takenToday: idx === 0,
        takenAt: idx === 0 ? '07:30' : undefined,
        remainingPills: 25,
        totalPills: 30,
      };
    });

    const primaryVital = visits[0]?.recordedVitals || {
      systolic: 124,
      diastolic: 78,
      heartRate: 72,
      bloodGlucose: 95,
      weightKg: 64,
    };

    const customVitals: VitalRecord[] = Array.from({ length: 7 }, (_, i) => {
      const dayNum = 10 - i;
      const dayStr = `2026-11-${String(dayNum).padStart(2, '0')}`;
      return {
        id: `vital-custom-${dayNum}`,
        date: dayStr,
        time: '07:15',
        systolic: primaryVital.systolic - (i % 3) * 2,
        diastolic: primaryVital.diastolic - (i % 2) * 2,
        heartRate: 70 + (i % 4),
        spo2: 98,
        bloodGlucose: primaryVital.bloodGlucose - (i % 3) * 2,
        glucoseContext: 'fasting',
        temperatureC: 36.6,
        weightKg: primaryVital.weightKg,
        sleepHours: 7.2,
        steps: 6800 + i * 250,
        deviceSource: 'Máy đo Omron',
        notes:
          i === 0
            ? `Đồng bộ hồ sơ BHYT từ VNeID (${bhytCard.bhytCode})`
            : 'Đo định kỳ buổi sáng tại nhà.',
      };
    });

    const newAccount: CitizenHealthAccount = {
      accountId: `citizen-custom-${bhytCard.cccdNumber}`,
      roleLabel: `${cleanName} (${2026 - birthYear} tuổi — Thẻ BHYT ${bhytCard.bhytCode})`,
      bhytCard,
      profile: {
        id: `usr-${bhytCard.cccdNumber}`,
        fullName: cleanName,
        birthYear,
        gender: genderInput,
        heightCm: genderInput === 'male' ? 168 : 158,
        weightKg: primaryVital.weightKg,
        targetWeightKg: genderInput === 'male' ? 63 : 54,
        bloodType: 'O+',
        allergies: ['Chưa ghi nhận dị ứng thuốc'],
        chronicConditions: chosenKeys.map(
          (k) =>
            `${CONDITION_TEMPLATES[k]?.label} (Mã ${CONDITION_TEMPLATES[k]?.icdCode})`
        ),
        emergencyContactName: 'Người thân Gia đình',
        emergencyContactPhone: '0912 345 678',
        primaryDoctor: 'BS.CKII Trần Quốc Bảo',
        hospitalName: bhytCard.registeredHospital,
        dailyCalorieGoal: 1950,
        dailyWaterGoalMl: 2100,
        dailyStepGoal: 7000,
        dailySleepGoalHours: 7.5,
        bhytCard,
      },
      bhytVisits: visits,
      vitals: customVitals,
      meals: CITIZEN_VNEID_ACCOUNTS[0].meals,
      workouts: CITIZEN_VNEID_ACCOUNTS[0].workouts,
      medications: meds,
      waterIntakeMl: 1600,
    };

    setFormError(null);
    onSelectCitizenAccount(newAccount);
    onClose();
  };

  const handleGoogleConnect = async () => {
    setIsGoogleLoading(true);
    setFormError(null);
    try {
      const res = await googleSignIn();
      onGoogleAuthSuccess(res.user, Boolean(res.accessToken));
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Không thể kết nối tài khoản Google.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vneid-auth-modal-title"
      data-testid="vneid-auth-modal"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl my-auto">
        {/* Authentic VNeID + BHYT Header */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                  Tích hợp VNeID Mức 2 &amp; VssID BHYT
                </span>
                <span className="text-xs text-red-100">
                  Sổ Sức khỏe Điện tử Cá nhân
                </span>
              </div>
              <h2
                id="vneid-auth-modal-title"
                className="text-base sm:text-lg font-bold tracking-tight truncate mt-0.5"
              >
                Đăng nhập &amp; Đồng bộ Bệnh án Bảo hiểm Y tế (BHYT)
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ đăng nhập VNeID"
            className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="bg-slate-100 px-4 sm:px-6 pt-3 border-b border-slate-200 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('quick_accounts')}
            data-testid="tab-quick-vneid-accounts"
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'quick_accounts'
                ? 'bg-white text-red-700 border-slate-200'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Chọn Hồ sơ Đã Liên kết VNeID (1 Chạm)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom_vneid')}
            data-testid="tab-custom-vneid-login"
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'custom_vneid'
                ? 'bg-white text-red-700 border-slate-200'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>2. Đăng nhập Số CCCD / Mã Thẻ BHYT Mới</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Active Session Notice */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="text-slate-600">Đang theo dõi hồ sơ của: </span>
                <strong className="text-slate-900">{currentProfile.fullName}</strong>
                {currentProfile.bhytCard && (
                  <span className="ml-1.5 font-mono-tabular text-xs font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                    BHYT: {currentProfile.bhytCard.bhytCode}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-emerald-800 font-semibold">
              Đã đồng bộ bệnh án VNeID
            </span>
          </div>

          {activeTab === 'quick_accounts' ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Chọn Người dùng để Tải Tình trạng Bệnh Đã Đi Khám BHYT &amp; Đơn Thuốc
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Mỗi hồ sơ dưới đây đã được liên kết sẵn với <strong>Thẻ Bảo hiểm Y tế (BHYT)</strong> trên <strong>VNeID</strong>. Khi bấm chọn, ứng dụng sẽ tự động tải lịch sử đi khám bệnh viện, chẩn đoán bệnh của bác sĩ, đơn thuốc BHYT và biểu đồ huyết áp/đường huyết của người đó:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {CITIZEN_VNEID_ACCOUNTS.map((acc) => {
                  const isCurrent =
                    acc.accountId === currentAccountId ||
                    acc.profile.fullName === currentProfile.fullName;
                  return (
                    <div
                      key={acc.accountId}
                      data-testid={`citizen-account-card-${acc.accountId}`}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCurrent
                          ? 'bg-teal-50/50 border-teal-600'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm sm:text-base font-bold text-slate-900">
                            {acc.profile.fullName} ({2026 - acc.profile.birthYear} tuổi)
                          </span>
                          <span className="text-xs font-mono-tabular font-semibold bg-amber-100 text-amber-950 px-2 py-0.5 rounded">
                            CCCD: {acc.bhytCard.cccdNumber}
                          </span>
                          <span className="text-xs font-mono-tabular font-semibold bg-sky-100 text-sky-900 px-2 py-0.5 rounded">
                            Mã BHYT: {acc.bhytCard.bhytCode}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700">
                          <strong>Nơi KCB BHYT:</strong> {acc.bhytCard.registeredHospital} ·{' '}
                          <span className="text-teal-800 font-semibold">
                            {acc.bhytCard.coverageRate}
                          </span>
                        </p>

                        <div className="pt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-500">
                            Bệnh đã đi khám (VNeID):
                          </span>
                          {acc.profile.chronicConditions.map((cond) => (
                            <span
                              key={cond}
                              className="text-xs font-semibold bg-rose-50 text-rose-900 border border-rose-200 px-2.5 py-0.5 rounded-md"
                            >
                              {cond}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCitizenAccount(acc);
                            onClose();
                          }}
                          data-testid={`select-citizen-btn-${acc.accountId}`}
                          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-700 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isCurrent
                              ? 'Đang mở Hồ sơ này'
                              : 'Đăng nhập Hồ sơ này'}
                          </span>
                        </button>
                        <span className="text-[11px] text-slate-500">
                          {acc.bhytVisits.length} đợt khám BHYT · {acc.medications.length} thuốc
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomVneidLogin} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs sm:text-sm text-amber-950 flex items-start gap-2.5">
                <QrCode className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Liên kết Sổ Sức khỏe Điện tử VNeID &amp; Thẻ BHYT Cá nhân:</strong> Nhập số Căn cước công dân (12 chữ số) hoặc Mã thẻ BHYT (15 ký tự) cùng các bệnh đã được bác sĩ chẩn đoán khi đi khám để hệ thống tạo ngay sổ theo dõi riêng cho bạn.
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm font-semibold text-red-700"
                >
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                    Số CCCD gắn chip (12 số) hoặc Mã thẻ BHYT *
                  </label>
                  <input
                    type="text"
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    placeholder="VD: 079068004512 hoặc DN4790123849201"
                    data-testid="vneid-identifier-input"
                    className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                    Họ và tên Chủ thẻ BHYT *
                  </label>
                  <input
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="VD: Nguyễn Văn Bình"
                    data-testid="vneid-fullname-input"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                    Năm sinh
                  </label>
                  <input
                    type="number"
                    min={1930}
                    max={2020}
                    value={birthYearInput}
                    onChange={(e) => setBirthYearInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={genderInput}
                    onChange={(e) =>
                      setGenderInput(e.target.value === 'female' ? 'female' : 'male')
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                    Bệnh viện ĐK Khám BHYT ban đầu
                  </label>
                  <input
                    type="text"
                    value={hospitalInput}
                    onChange={(e) => setHospitalInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                  Chọn Tình trạng Bệnh đã đi khám BHYT (để tích hợp đơn thuốc &amp; phác đồ theo dõi):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(CONDITION_TEMPLATES).map(([key, item]) => {
                    const checked = selectedConditions.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleCondition(key)}
                        className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-colors flex items-start gap-2.5 cursor-pointer ${
                          checked
                            ? 'bg-red-50/70 border-red-500 text-slate-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="mt-0.5 rounded text-red-600"
                        />
                        <div>
                          <span className="block">{item.label}</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            Mã BHYT: {item.icdCode} · {item.department}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Đóng lại
                </button>
                <button
                  type="submit"
                  data-testid="submit-custom-vneid-btn"
                  className="min-h-[42px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <FileHeart className="w-4 h-4" />
                  <span>Đăng nhập VNeID &amp; Tải Bệnh án BHYT</span>
                </button>
              </div>
            </form>
          )}

          {/* Optional Cloud Sync Strip */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <strong className="text-slate-800">Sao lưu Đám mây Cá nhân:</strong>{' '}
              {cloudUser
                ? `Đang kết nối Google (${cloudUser.email}) — Sổ khám VNeID/BHYT được tự động sao lưu.`
                : 'Bạn có thể kết nối thêm tài khoản Google để cất giữ hồ sơ BHYT khi đổi điện thoại.'}
            </div>
            {!cloudUser && (
              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={isGoogleLoading}
                className="min-h-[38px] px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isGoogleLoading ? 'Đang kết nối...' : 'Kết nối thêm Google Cloud'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

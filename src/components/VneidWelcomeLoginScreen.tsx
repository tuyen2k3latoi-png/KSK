import React, { useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BellRing,
  Check,
  CheckCircle2,
  Cloud,
  CreditCard,
  Eye,
  EyeOff,
  FileHeart,
  HeartPulse,
  ShieldCheck,
  Type,
  UserPlus,
  Users,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  BhytCardInfo,
  BhytVisitRecord,
  CitizenHealthAccount,
  MedicationSchedule,
  VitalRecord,
} from '../types/health';
import {
  CITIZEN_VNEID_ACCOUNTS,
  createEmptyPersonalHealthAccount,
  INITIAL_WORKOUT_SCHEDULES,
} from '../data/seedHealthData';
import {
  maskSensitiveIdentifier,
  validateVneidOrBhytInput,
} from '../utils/healthCalculations';
import { googleSignIn } from '../services/firebaseService';
import { PWAInstallBanner } from './PWAInstallButton';
import { FontSizeMode } from '../utils/storage';

interface VneidWelcomeLoginScreenProps {
  onLoginSuccess: (account: CitizenHealthAccount) => void;
  cloudUser: User | null;
  onGoogleAuthSuccess: (user: User, hasToken: boolean) => void;
  onOpenComplianceModal?: () => void;
  fontSizeMode?: FontSizeMode;
  onChangeFontSizeMode?: (mode: FontSizeMode) => void;
}

type LoginTab = 'vneid_quick' | 'cccd_form';
type EntryFlowStep = 1 | 2;

const HERO_IMAGE_PATH =
  '/src/assets/images/login_hero_family_health_1794405439475.jpg';

const FAMILY_AVATAR_LIST = [
  '/src/assets/images/avatar_nguyen_minh_quan_1794405440004.jpg',
  '/src/assets/images/avatar_tran_thi_mai_huong_1794405441176.jpg',
  '/src/assets/images/avatar_le_hoang_phuc_1794405441774.jpg',
];

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
      mealInstruction:
        | 'Trước ăn 30 phút'
        | 'Sau ăn 30 phút'
        | 'Cùng bữa ăn'
        | 'Trước khi ngủ';
    };
    vitalsSample: { systolic: number; diastolic: number; bloodGlucose: number };
  }
> = {
  hypertension: {
    icdCode: 'I10',
    label: 'Tăng huyết áp (Cao huyết áp)',
    department: 'Khoa Nội Tim mạch',
    diagnosisSummary:
      'Tăng huyết áp nguyên phát (Mã I10) — Tự theo dõi ngoại trú',
    plainExplanation:
      'Áp lực máu lên thành mạch hơi cao. Bạn nên trao đổi với bác sĩ về lịch uống thuốc huyết áp đều đặn mỗi sáng, ăn nhạt bớt muối và đo huyết áp hàng ngày.',
    doctorAdvice:
      'Uống thuốc hạ áp đúng giờ theo hướng dẫn của bác sĩ, hạn chế đồ mặn/dưa muối và đi bộ nhẹ 30 phút mỗi ngày.',
    med: {
      medicationName: 'Amlodipine 5mg (Thuốc ổn định huyết áp)',
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
    diagnosisSummary:
      'Đái tháo đường tuýp 2 (Mã E11) — Theo dõi đường huyết định kỳ',
    plainExplanation:
      'Lượng đường trong máu cao hơn mức bình thường. Cần hạn chế cơm trắng, bánh kẹo ngọt và tăng cường rau xanh, ngũ cốc nguyên hạt.',
    doctorAdvice:
      'Duy trì dùng thuốc theo hướng dẫn của bác sĩ sau bữa ăn, kiểm tra đường huyết lúc đói buổi sáng định kỳ.',
    med: {
      medicationName: 'Metformin 500mg (Thuốc kiểm soát đường huyết)',
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
    diagnosisSummary:
      'Rối loạn chuyển hóa Lipoprotein / Mỡ máu tăng nhẹ (Mã E78.2)',
    plainExplanation:
      'Chỉ số mỡ trong máu hơi cao. Nên hạn chế đồ chiên rán, mỡ động vật, nội tạng và ăn nhiều cá, rau luộc.',
    doctorAdvice:
      'Trao đổi với bác sĩ về việc bổ sung Omega-3 hoặc thuốc giảm mỡ máu, tập thể dục tối thiểu 150 phút/tuần.',
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
    diagnosisSummary:
      'Thoái hóa khớp gối và cột sống thắt lưng theo tuổi (Mã M17.0)',
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
    diagnosisSummary:
      'Viêm dạ dày & Trào ngược dạ dày thực quản (Mã K21)',
    plainExplanation:
      'Dạ dày tiết nhiều dịch vị axit gây ợ hơi, đầy bụng hoặc nóng rát vùng thượng vị.',
    doctorAdvice:
      'Ăn đúng giờ, kiêng đồ chua cay, không nằm ngay sau khi ăn và ngủ kê cao gối.',
    med: {
      medicationName: 'Esomeprazole 20mg (Bảo vệ niêm mạc dạ dày)',
      dosage: '1 viên',
      purpose: 'Giảm axit dạ dày & lành niêm mạc',
      timeSlot: '07:00',
      mealInstruction: 'Trước ăn 30 phút',
    },
    vitalsSample: { systolic: 118, diastolic: 75, bloodGlucose: 91 },
  },
};

export const VneidWelcomeLoginScreen: React.FC<VneidWelcomeLoginScreenProps> = ({
  onLoginSuccess,
  cloudUser,
  onGoogleAuthSuccess,
  onOpenComplianceModal,
  fontSizeMode = 'normal',
  onChangeFontSizeMode,
}) => {
  const [activeTab, setActiveTab] = useState<LoginTab>('vneid_quick');
  const [entryStep, setEntryStep] = useState<EntryFlowStep>(1);
  const [pendingAccount, setPendingAccount] = useState<CitizenHealthAccount>(
    CITIZEN_VNEID_ACCOUNTS[0]
  );
  const [showUnmaskedCodes, setShowUnmaskedCodes] = useState<boolean>(false);
  const [identifierInput, setIdentifierInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [birthYearInput, setBirthYearInput] = useState('1968');
  const [genderInput, setGenderInput] = useState<'male' | 'female'>('male');
  const [hospitalInput, setHospitalInput] = useState(
    'Bệnh viện Đa khoa Tỉnh / Thành phố'
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>([
    'hypertension',
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const toggleCondition = (key: string) => {
    setSelectedConditions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const buildEmptyPersonalAccount = (): CitizenHealthAccount => {
    return createEmptyPersonalHealthAccount({
      fullName: fullNameInput.trim() || 'Hồ sơ của tôi',
      birthYear: Number(birthYearInput) || 1968,
      gender: genderInput,
      bhytCode: identifierInput.trim() || 'Chưa nhập mã thẻ BHYT',
      registeredHospital: hospitalInput.trim() || 'Chưa nhập nơi ĐK KCB ban đầu',
    });
  };

  const handleStartEmptyPersonalProfile = () => {
    setFormError(null);
    const emptyPersonal = buildEmptyPersonalAccount();
    setPendingAccount(emptyPersonal);
    onLoginSuccess(emptyPersonal);
  };

  const handleProceedToStep2WithAccount = (account: CitizenHealthAccount) => {
    setFormError(null);
    setPendingAccount(account);
    setEntryStep(2);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let derivedBhyt = 'Chưa nhập mã thẻ BHYT';
    let derivedCccd = 'Chưa nhập CCCD';

    if (identifierInput.trim()) {
      const validation = validateVneidOrBhytInput(identifierInput);
      if (!validation.valid) {
        setFormError(
          validation.error || 'Số CCCD hoặc Mã thẻ BHYT chưa hợp lệ.'
        );
        return;
      }
      derivedBhyt = validation.derivedBhytCode || identifierInput.trim();
      derivedCccd = validation.derivedCccdNumber || identifierInput.trim();

      const matchedPreset = CITIZEN_VNEID_ACCOUNTS.find(
        (acc) =>
          acc.bhytCard.cccdNumber === validation.derivedCccdNumber ||
          acc.bhytCard.bhytCode === validation.derivedBhytCode
      );
      if (matchedPreset && !fullNameInput.trim()) {
        onLoginSuccess(matchedPreset);
        return;
      }
    }

    const cleanName = fullNameInput.trim() || 'Hồ sơ của tôi';
    const birthYear = Math.max(
      1930,
      Math.min(2020, Number(birthYearInput) || 1968)
    );
    const chosenKeys =
      selectedConditions.length > 0 ? selectedConditions : ['hypertension'];

    const bhytCard: BhytCardInfo = {
      isDemo: false,
      bhytCode: derivedBhyt,
      bhxhNumber: derivedCccd.slice(-10),
      cccdNumber: derivedCccd,
      vneidLevel: 2,
      coverageRate:
        birthYear <= 1966
          ? '95% chi phí KCB (Hưu trí - Tự ghi chú)'
          : '80% chi phí KCB đúng tuyến (Tự ghi chú)',
      registeredHospital:
        hospitalInput.trim() || 'Bệnh viện Đa khoa Trung ương',
      validFrom: '01/01/2026',
      fiveYearContinuousDate: 'Tự lưu trữ cá nhân trên thiết bị',
      lastSyncedVneidAt: 'Tự nhập cá nhân',
    };

    const visits: BhytVisitRecord[] = chosenKeys.map((key, idx) => {
      const tpl = CONDITION_TEMPLATES[key] || CONDITION_TEMPLATES.hypertension;
      return {
        id: `bhyt-custom-${idx + 1}-${Date.now()}`,
        visitDate: idx === 0 ? '2026-11-06' : '2026-10-02',
        hospitalName: bhytCard.registeredHospital,
        department: tpl.department,
        doctorName: 'Bác sĩ điều trị',
        icdCode: tpl.icdCode,
        diagnosisSummary: tpl.diagnosisSummary,
        plainExplanation: tpl.plainExplanation,
        doctorAdvice: tpl.doctorAdvice,
        followUpDate: '2026-12-06',
        totalCostVnd: 0,
        bhytPaidVnd: 0,
        patientCoPayVnd: 0,
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
        takenToday: false,
        remainingPills: 30,
        totalPills: 30,
      };
    });

    const primaryVital = visits[0]?.recordedVitals || {
      systolic: 120,
      diastolic: 76,
      heartRate: 72,
      bloodGlucose: 94,
      weightKg: 64,
    };

    const customVitals: VitalRecord[] = [
      {
        id: `vital-custom-1`,
        date: '2026-11-10',
        time: '07:15',
        systolic: primaryVital.systolic,
        diastolic: primaryVital.diastolic,
        heartRate: 72,
        spo2: 98,
        bloodGlucose: primaryVital.bloodGlucose,
        glucoseContext: 'fasting',
        temperatureC: 36.6,
        weightKg: primaryVital.weightKg,
        sleepHours: 7.2,
        steps: 6000,
        deviceSource: 'Nhập thủ công',
        notes: 'Hồ sơ cá nhân tự nhập ban đầu.',
      },
    ];

    const newAccount: CitizenHealthAccount = {
      accountId: `citizen-personal-${Date.now()}`,
      isDemo: false,
      roleLabel: `[HỒ SƠ CỦA TÔI] ${cleanName} (${2026 - birthYear} tuổi)`,
      bhytCard,
      profile: {
        id: `usr-personal-${Date.now()}`,
        isDemo: false,
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
        emergencyContactPhone: 'Chưa nhập',
        primaryDoctor: 'Bác sĩ điều trị',
        hospitalName: bhytCard.registeredHospital,
        dailyCalorieGoal: 1950,
        dailyWaterGoalMl: 2000,
        dailyStepGoal: 7000,
        dailySleepGoalHours: 7.5,
        bhytCard,
      },
      bhytVisits: visits,
      vitals: customVitals,
      meals: [],
      workouts: [],
      workoutSchedules: INITIAL_WORKOUT_SCHEDULES.map((ws) => ({
        ...ws,
        completedToday: false,
      })),
      medications: meds,
      waterIntakeMl: 0,
    };

    setFormError(null);
    setPendingAccount(newAccount);
    onLoginSuccess(newAccount);
  };

  const handleGoogleLoginAndEnter = async () => {
    setIsGoogleLoading(true);
    setFormError(null);
    try {
      const res = await googleSignIn();
      onGoogleAuthSuccess(res.user, Boolean(res.accessToken));
      onLoginSuccess(pendingAccount || CITIZEN_VNEID_ACCOUNTS[0]);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Đăng nhập Google không thành công. Bạn có thể bấm "Vào ứng dụng ngay" bên dưới.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      data-testid="vneid-welcome-login-screen"
      className="min-h-dvh w-full max-w-full overflow-x-hidden bg-[#f8fafc] text-slate-900 flex flex-col justify-between"
    >
      {/* Top Header Bar (No truncated text, responsive wrapping on 320px) */}
      <header className="w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xs">
        <div className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-base font-bold text-slate-900 tracking-tight block leading-snug break-words">
                VitaPulse Health
              </span>
              <span className="text-xs text-slate-600 block leading-snug break-words">
                Sổ Sức khỏe Cá nhân &amp; Gia đình
              </span>
            </div>
          </div>

          {/* Zone 2: Font Size Switcher ("Cỡ chữ: Vừa / Lớn / Rất lớn") */}
          {onChangeFontSizeMode && (
            <div
              data-testid="welcome-font-size-switcher"
              className="flex flex-wrap items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1"
            >
              <span className="text-xs font-semibold text-slate-700 px-2 inline-flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span>Cỡ chữ:</span>
              </span>
              {(
                [
                  { id: 'normal', label: 'Vừa' },
                  { id: 'large', label: 'Lớn' },
                  { id: 'xlarge', label: 'Rất lớn' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeFontSizeMode(opt.id)}
                  data-testid={`welcome-font-size-${opt.id}-btn`}
                  aria-pressed={fontSizeMode === opt.id}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    fontSizeMode === opt.id
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Zone 3: Quick Navigation & Privacy */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenComplianceModal && (
              <button
                type="button"
                onClick={onOpenComplianceModal}
                data-testid="welcome-open-compliance-btn"
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Quyền riêng tư (NĐ 13)
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-7 flex-1 space-y-4">
        {/* Dismissible PWA Install Banner ("Cài App" chuyển thành banner có thể tắt) */}
        <PWAInstallBanner />

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (5 cols): Editorial Family Healthcare Visual */}
          <section className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900 text-white relative flex flex-col justify-between min-h-[360px] lg:min-h-[540px] shadow-xs">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950">
              <img
                src={HERO_IMAGE_PATH}
                alt="Gia đình Việt Nam theo dõi sức khỏe và huyết áp tại nhà"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/25" />
            </div>

            <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-300 flex items-center gap-2 break-words">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Sổ Sức khỏe Cá nhân Độc lập</span>
              </span>
            </div>

            <div className="relative z-10 p-4 sm:p-6 pt-0 space-y-4 mt-auto">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug text-white break-words">
                  Quản lý hồ sơ khám bệnh, chỉ số huyết áp và lịch nhắc thuốc trong một nơi.
                </h1>
                <p className="text-sm text-slate-100 leading-relaxed break-words">
                  Thiết kế rõ ràng, chữ lớn dễ đọc dành cho người 45–70 tuổi và gia đình. Tự nhập mã thẻ BHYT để lưu trữ cá nhân – không kết nối cơ quan BHXH/VNeID.
                </p>
              </div>

              <div className="border-t border-white/15 pt-3.5 space-y-2 text-sm text-slate-100">
                <div className="flex items-start gap-2.5">
                  <FileHeart className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                  <span className="break-words">
                    Tự nhập mã thẻ BHYT để lưu trữ cá nhân – không kết nối cơ quan BHXH/VNeID
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Activity className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                  <span className="break-words">
                    Biểu đồ huyết áp, nhịp tim, đường huyết 7 ngày trực quan
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <BellRing className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                  <span className="break-words">
                    Chuông báo nhắc uống thuốc và lịch tập dưỡng sinh định kỳ
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column (7 cols): 2-Step Entry Flow Workspace */}
          <section className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between min-w-0">
            <div className="space-y-4">
              {/* 2-Step Entry Flow Stepper Header */}
              <div
                data-testid="welcome-2step-stepper"
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200"
              >
                <button
                  type="button"
                  onClick={() => setEntryStep(1)}
                  data-testid="welcome-step-1-indicator"
                  className={`min-h-[44px] px-3 py-2 rounded-lg text-left text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    entryStep === 1
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      entryStep === 1
                        ? 'bg-white text-teal-900'
                        : 'bg-teal-100 text-teal-900'
                    }`}
                  >
                    1
                  </span>
                  <span className="break-words leading-snug">
                    Bước 1: Chọn &ldquo;Dùng thử&rdquo; hoặc &ldquo;Hồ sơ của tôi&rdquo;
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEntryStep(2)}
                  data-testid="welcome-step-2-indicator"
                  className={`min-h-[44px] px-3 py-2 rounded-lg text-left text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    entryStep === 2
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      entryStep === 2
                        ? 'bg-white text-teal-900'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    2
                  </span>
                  <span className="break-words leading-snug">
                    Bước 2 (Tùy chọn): Đăng nhập Google để sao lưu
                  </span>
                </button>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-800 break-words"
                >
                  {formError}
                </div>
              )}

              {/* STEP 1: Choose "Dùng thử (Demo)" or "Hồ sơ của tôi" */}
              {entryStep === 1 ? (
                <div data-testid="welcome-step-1-panel" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight break-words">
                          Bước 1: Chọn Chế độ Sử dụng Sổ Sức khỏe
                        </h2>
                        <p
                          data-testid="bhyt-self-entry-disclaimer"
                          className="text-sm text-slate-700 mt-0.5 break-words"
                        >
                          Tự nhập mã thẻ BHYT để lưu trữ cá nhân – không kết nối cơ quan BHXH/VNeID
                        </p>
                      </div>

                      {activeTab === 'vneid_quick' && (
                        <button
                          type="button"
                          onClick={() => setShowUnmaskedCodes((prev) => !prev)}
                          data-testid="toggle-mask-welcome-btn"
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {showUnmaskedCodes ? (
                            <>
                              <EyeOff className="w-4 h-4 text-slate-700 shrink-0" />
                              <span>Ẩn mã BHYT/CCCD</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 text-teal-700 shrink-0" />
                              <span>Hiện mã đầy đủ</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Segmented Control: Dùng thử (Demo) vs Hồ sơ của tôi */}
                    <div
                      role="tablist"
                      aria-label="Phương thức mở sổ sức khỏe"
                      className="bg-slate-100 p-1 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1.5"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'vneid_quick'}
                        onClick={() => setActiveTab('vneid_quick')}
                        data-testid="login-tab-quick-profiles"
                        className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          activeTab === 'vneid_quick'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        <Users className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="break-words">Dùng thử (Demo — 3 Hồ sơ mẫu)</span>
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'cccd_form'}
                        onClick={() => setActiveTab('cccd_form')}
                        data-testid="login-tab-custom-cccd"
                        className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          activeTab === 'cccd_form'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="break-words">Hồ sơ của tôi (Trống / Tự nhập)</span>
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: Demo Profiles */}
                  {activeTab === 'vneid_quick' ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-sm text-amber-950 break-words">
                        <strong>Chế độ Dùng thử (Demo):</strong> Các hồ sơ dưới đây là dữ liệu minh họa giả định để bạn trải nghiệm thử biểu đồ và chuông nhắc thuốc.
                      </div>

                      {CITIZEN_VNEID_ACCOUNTS.map((acc, idx) => {
                        const latestVital = acc.vitals[0];
                        const avatarSrc = FAMILY_AVATAR_LIST[idx];
                        const age = 2026 - acc.profile.birthYear;
                        const displayedBhyt = showUnmaskedCodes
                          ? acc.bhytCard.bhytCode
                          : maskSensitiveIdentifier(acc.bhytCard.bhytCode, 'bhyt');
                        const displayedCccd = showUnmaskedCodes
                          ? acc.bhytCard.cccdNumber
                          : maskSensitiveIdentifier(acc.bhytCard.cccdNumber, 'cccd');

                        return (
                          <div
                            key={acc.accountId}
                            data-testid={`welcome-account-card-${acc.accountId}`}
                            onClick={() => handleProceedToStep2WithAccount(acc)}
                            className="group p-3.5 sm:p-4 rounded-xl border border-slate-200/90 hover:border-teal-600/80 bg-white hover:bg-slate-50/70 transition-all flex flex-col justify-between gap-3 cursor-pointer"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-teal-50 border border-slate-200 shrink-0 flex items-center justify-center text-teal-800 font-bold text-base">
                                {avatarSrc ? (
                                  <img
                                    src={avatarSrc}
                                    alt={acc.profile.fullName}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{acc.profile.fullName.charAt(0)}</span>
                                )}
                              </div>

                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span
                                    data-testid={`demo-badge-${acc.accountId}`}
                                    className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold tracking-wide"
                                  >
                                    HỒ SƠ DEMO
                                  </span>
                                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors break-words">
                                    {acc.profile.fullName}
                                  </h3>
                                  <span className="text-xs font-medium text-slate-600 break-words">
                                    {age} tuổi · {acc.bhytCard.registeredHospital}
                                  </span>
                                </div>

                                <p className="text-xs font-mono-tabular text-slate-700 break-words">
                                  Mã BHYT mẫu:{' '}
                                  <strong
                                    data-testid={`welcome-bhyt-code-${acc.accountId}`}
                                    className="font-semibold text-slate-900 break-all"
                                  >
                                    {displayedBhyt}
                                  </strong>
                                  {' · '}
                                  CCCD mẫu: <span className="break-all">{displayedCccd}</span>
                                </p>

                                <p className="text-xs text-slate-700 break-words">
                                  <span className="text-slate-600">Bệnh lý mẫu:</span>{' '}
                                  <span className="font-medium text-slate-900 break-words">
                                    {acc.profile.chronicConditions.join(' · ')}
                                  </span>
                                  {latestVital && (
                                    <span className="font-mono-tabular text-slate-700">
                                      {' · '}HA {latestVital.systolic}/{latestVital.diastolic} mmHg
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProceedToStep2WithAccount(acc);
                                }}
                                data-testid={`select-step2-btn-${acc.accountId}`}
                                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Cloud className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                <span> sang Bước 2 (Sao lưu Google)</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onLoginSuccess(acc);
                                }}
                                data-testid={`enter-app-btn-${acc.accountId}`}
                                className="min-h-[40px] px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <span>Dùng thử</span>
                                <ArrowRight className="w-4 h-4 shrink-0" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Tab 2: Personal Self-Entered or Empty Profile ("Hồ sơ của tôi") */
                    <div className="space-y-4">
                      {/* Option A: Start Immediately with an Empty Personal Profile */}
                      <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <h3 className="text-base font-bold text-teal-950 break-words">
                            Bắt đầu ngay với Hồ sơ của tôi (Dữ liệu trống)
                          </h3>
                          <p className="text-sm text-teal-900 break-words">
                            Tạo sổ sức khỏe cá nhân trống hoàn toàn để bạn tự nhập chỉ số huyết áp, đường huyết và đơn thuốc của riêng mình.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleProceedToStep2WithAccount(buildEmptyPersonalAccount())
                            }
                            data-testid="empty-profile-step2-btn"
                            className="min-h-[42px] px-3 py-2 rounded-xl bg-white border border-teal-300 hover:bg-teal-100 text-teal-900 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Cloud className="w-4 h-4 text-teal-700 shrink-0" />
                            <span>Bước 2: Sao lưu</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleStartEmptyPersonalProfile}
                            data-testid="start-empty-personal-profile-btn"
                            className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4 shrink-0" />
                            <span>Mở Hồ sơ Trống</span>
                          </button>
                        </div>
                      </div>

                      {/* Option B: Self-Enter Personal Profile Details */}
                      <form onSubmit={handleCustomSubmit} className="space-y-4 pt-2 border-t border-slate-200">
                        <p className="text-sm font-semibold text-slate-700 break-words">
                          Hoặc tự điền thông tin cá nhân &amp; mã thẻ BHYT để lưu trữ trên máy:
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
                              onChange={(e) =>
                                setGenderInput(
                                  e.target.value === 'female' ? 'female' : 'male'
                                )
                              }
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
                                  onClick={() => toggleCondition(key)}
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
                                    <span className="text-slate-600 font-normal">
                                      ({item.icdCode})
                                    </span>
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
                  )}
                </div>
              ) : (
                /* STEP 2 (OPTIONAL): Sign in with Google for Cloud Backup or Enter App Directly */
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
                      <strong className="text-slate-900">
                        {pendingAccount.profile.fullName}
                      </strong>{' '}
                      ({pendingAccount.isDemo ? 'HỒ SƠ DEMO' : 'HỒ SƠ CỦA TÔI'}). Bạn có thể đăng nhập Google để đồng bộ dữ liệu lên đám mây cá nhân hoặc bỏ qua để vào thẳng ứng dụng.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        Hồ sơ chuẩn bị mở:
                      </span>
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
                        onClick={handleGoogleLoginAndEnter}
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
                      onClick={() => onLoginSuccess(pendingAccount)}
                      data-testid="welcome-step2-continue-btn"
                      className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Bỏ qua sao lưu &amp; Mở Sổ Sức khỏe ngay</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEntryStep(1)}
                      data-testid="welcome-step2-back-btn"
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 shrink-0" />
                      <span>Quay lại Bước 1 (Đổi chế độ Dùng thử / Hồ sơ của tôi)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Subtle Card Footer */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span className="break-words">
                Tự nhập mã thẻ BHYT để lưu trữ cá nhân – không kết nối cơ quan BHXH/VNeID
              </span>
              {onOpenComplianceModal && (
                <button
                  type="button"
                  onClick={onOpenComplianceModal}
                  className="text-teal-700 hover:text-teal-800 font-semibold underline underline-offset-4 cursor-pointer"
                >
                  Quyền riêng tư (NĐ 13/2023) &amp; Miễn trừ Y khoa
                </button>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Quiet Compliance Footer */}
      <footer className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-3 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 border-t border-slate-200/60">
        <span className="break-words">
          Sổ Theo dõi Sức khỏe Cá nhân Độc lập · Không đại diện cơ quan nhà nước &amp; không thay thế chẩn đoán y khoa
        </span>
        <span className="font-mono-tabular text-slate-600">
          Bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP
        </span>
      </footer>
    </div>
  );
};

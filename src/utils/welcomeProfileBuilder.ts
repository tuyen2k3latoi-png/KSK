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
import { validateVneidOrBhytInput } from './healthCalculations';

export const CONDITION_TEMPLATES: Record<
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
    diagnosisSummary: 'Tăng huyết áp nguyên phát (Mã I10) — Tự theo dõi ngoại trú',
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
    diagnosisSummary: 'Đái tháo đường tuýp 2 (Mã E11) — Theo dõi đường huyết định kỳ',
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
    diagnosisSummary: 'Rối loạn chuyển hóa Lipoprotein / Mỡ máu tăng nhẹ (Mã E78.2)',
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
      medicationName: 'Esomeprazole 20mg (Bảo vệ niêm mạc dạ dày)',
      dosage: '1 viên',
      purpose: 'Giảm axit dạ dày & lành niêm mạc',
      timeSlot: '07:00',
      mealInstruction: 'Trước ăn 30 phút',
    },
    vitalsSample: { systolic: 118, diastolic: 75, bloodGlucose: 91 },
  },
};

export function buildEmptyPersonalProfile(params: {
  fullNameInput: string;
  birthYearInput: string;
  genderInput: 'male' | 'female';
  identifierInput: string;
  hospitalInput: string;
}): CitizenHealthAccount {
  return createEmptyPersonalHealthAccount({
    fullName: params.fullNameInput.trim() || 'Hồ sơ của tôi',
    birthYear: Number(params.birthYearInput) || 1968,
    gender: params.genderInput,
    bhytCode: params.identifierInput.trim() || 'Chưa nhập mã thẻ BHYT',
    registeredHospital: params.hospitalInput.trim() || 'Chưa nhập nơi ĐK KCB ban đầu',
  });
}

export function buildCustomPersonalAccount(params: {
  fullNameInput: string;
  birthYearInput: string;
  genderInput: 'male' | 'female';
  identifierInput: string;
  hospitalInput: string;
  selectedConditions: string[];
}): { account?: CitizenHealthAccount; error?: string } {
  let derivedBhyt = 'Chưa nhập mã thẻ BHYT';
  let derivedCccd = 'Chưa nhập CCCD';

  if (params.identifierInput.trim()) {
    const validation = validateVneidOrBhytInput(params.identifierInput);
    if (!validation.valid) {
      return {
        error: validation.error || 'Số CCCD hoặc Mã thẻ BHYT chưa hợp lệ.',
      };
    }
    derivedBhyt = validation.derivedBhytCode || params.identifierInput.trim();
    derivedCccd = validation.derivedCccdNumber || params.identifierInput.trim();

    const matchedPreset = CITIZEN_VNEID_ACCOUNTS.find(
      (acc) =>
        acc.bhytCard.cccdNumber === validation.derivedCccdNumber ||
        acc.bhytCard.bhytCode === validation.derivedBhytCode
    );
    if (matchedPreset && !params.fullNameInput.trim()) {
      return { account: matchedPreset };
    }
  }

  const cleanName = params.fullNameInput.trim() || 'Hồ sơ của tôi';
  const birthYear = Math.max(1930, Math.min(2020, Number(params.birthYearInput) || 1968));
  const chosenKeys =
    params.selectedConditions.length > 0 ? params.selectedConditions : ['hypertension'];

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
    registeredHospital: params.hospitalInput.trim() || 'Bệnh viện Đa khoa Trung ương',
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
      prescribedMedications: [{ ...tpl.med, daysSupply: 30 }],
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
      id: 'vital-custom-1',
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

  return {
    account: {
      accountId: `citizen-personal-${Date.now()}`,
      isDemo: false,
      roleLabel: `[HỒ SƠ CỦA TÔI] ${cleanName} (${2026 - birthYear} tuổi)`,
      bhytCard,
      profile: {
        id: `usr-personal-${Date.now()}`,
        isDemo: false,
        fullName: cleanName,
        birthYear,
        gender: params.genderInput,
        heightCm: params.genderInput === 'male' ? 168 : 158,
        weightKg: primaryVital.weightKg,
        targetWeightKg: params.genderInput === 'male' ? 63 : 54,
        bloodType: 'O+',
        allergies: ['Chưa ghi nhận dị ứng thuốc'],
        chronicConditions: chosenKeys.map(
          (k) => `${CONDITION_TEMPLATES[k]?.label} (Mã ${CONDITION_TEMPLATES[k]?.icdCode})`
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
    },
  };
}

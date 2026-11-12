import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBMI,
  classifyBMI,
  classifyBloodPressure,
  classifyBloodGlucose,
  calculateHealthScore,
  calculateDailyCalorieSummary,
  calculateMedicationAdherence,
  validateVitalEntry,
  serializeVitalsToCsv,
  serializeMealsToCsv,
  serializeCombinedHealthToCsv,
  serializeHealthDataToJson,
  resolveDeviceFrameMetrics,
  parseBleHeartRatePacket,
  parseBleBloodPressurePacket,
  buildGoogleCalendarEventPayload,
  sanitizeVitalForFirestore,
  prepareSevenDayVitalsBarData,
  validateVneidOrBhytInput,
  summarizeBhytVisitHistory,
  parseTimeMinutes,
  addMinutesToTimeStr,
  buildMedicationPushPayload,
  evaluateMedicationScheduleNotifications,
  getVietnameseDayCode,
  formatRecurringDaysLabel,
  calculateWorkoutScheduleAdherence,
  buildWorkoutPushPayload,
  evaluateWorkoutScheduleNotifications,
  maskSensitiveIdentifier,
  resolvePriorityDashboardConfig,
} from './healthCalculations';
import {
  getStorageWriteCountForTest,
  resetStorageCacheForTest,
  writeStorageIfChanged,
} from './storage';
import {
  anonymizeWeeklyHealthData,
  detectEmergencyGuardrail,
  MEDICAL_AI_SYSTEM_PROMPT,
  normalizeFiveLineSummary,
} from './aiHealthGuardrails';
import {
  INITIAL_MEDICATIONS,
  INITIAL_MEDICAL_PROFILE,
  INITIAL_VITAL_RECORDS,
} from '../data/seedHealthData';
import {
  BhytVisitRecord,
  MealEntry,
  MedicationSchedule,
  VitalRecord,
  WorkoutSchedule,
} from '../types/health';
import {
  createLoginRateLimiter,
  DEMO_PASSWORD,
  DEMO_PHONE,
  evaluatePasswordStrength,
  mapPhoneToVirtualEmail,
  normalizeVietnamesePhone,
  validateVietnamesePhone,
  verifyDemoCredentials,
} from '../services/authService';

test('calculateBMI and classifyBMI follow Asian WHO standards', () => {
  const bmi = calculateBMI(66.5, 172);
  assert.equal(bmi, 22.5);
  const evaluation = classifyBMI(bmi);
  assert.equal(evaluation.status, 'normal');

  const overweightBmi = calculateBMI(75, 170);
  assert.equal(classifyBMI(overweightBmi).status, 'warning');
});

test('classifyBloodPressure accurately detects normal, stage 1, and stage 2 hypertension', () => {
  assert.equal(classifyBloodPressure(118, 76).status, 'normal');
  assert.equal(classifyBloodPressure(125, 78).status, 'elevated');
  assert.equal(classifyBloodPressure(135, 86).status, 'warning');
  assert.equal(classifyBloodPressure(148, 94).status, 'critical');
});

test('classifyBloodGlucose distinguishes fasting vs post_meal thresholds', () => {
  assert.equal(classifyBloodGlucose(92, 'fasting').status, 'normal');
  assert.equal(classifyBloodGlucose(110, 'fasting').status, 'warning');
  assert.equal(classifyBloodGlucose(132, 'post_meal').status, 'normal');
  assert.equal(classifyBloodGlucose(165, 'post_meal').status, 'warning');
});

test('calculateHealthScore computes composite clinical score accurately', () => {
  const optimalRecord: VitalRecord = {
    id: 'v-1',
    date: '2026-11-10',
    time: '07:30',
    systolic: 118,
    diastolic: 76,
    heartRate: 68,
    spo2: 98,
    bloodGlucose: 92,
    glucoseContext: 'fasting',
    temperatureC: 36.6,
    weightKg: 66.5,
    sleepHours: 7.5,
    steps: 8500,
    deviceSource: 'Smartwatch BLE',
  };

  const result = calculateHealthScore(optimalRecord, 22.5, 100);
  assert.equal(result.score, 100);
  assert.equal(result.status, 'normal');
});

test('calculateDailyCalorieSummary aggregates intake, burn, and macros', () => {
  const summary = calculateDailyCalorieSummary(
    [
      {
        id: 'm1',
        date: '2026-11-10',
        time: '07:30',
        mealType: 'Sáng',
        foodName: 'Phở bò tái nạm',
        calories: 480,
        proteinG: 28,
        carbsG: 58,
        fatG: 14,
      },
      {
        id: 'm2',
        date: '2026-11-10',
        time: '12:30',
        mealType: 'Trưa',
        foodName: 'Cơm gạo lứt cá hồi áp chảo',
        calories: 620,
        proteinG: 42,
        carbsG: 65,
        fatG: 20,
      },
    ],
    [
      {
        id: 'w1',
        date: '2026-11-10',
        time: '17:30',
        activityName: 'Chạy bộ công viên',
        category: 'Cardio',
        durationMinutes: 35,
        caloriesBurned: 310,
      },
    ],
    2000
  );

  assert.equal(summary.totalIntake, 1100);
  assert.equal(summary.totalBurned, 310);
  assert.equal(summary.netCalories, 790);
  assert.equal(summary.remainingCalories, 1210);
  assert.equal(summary.proteinG, 70);
});

test('calculateMedicationAdherence calculates percentage of taken doses', () => {
  const adherence = calculateMedicationAdherence([
    {
      id: 'med-1',
      medicationName: 'Omega-3 Fish Oil 1000mg',
      dosage: '1 viên',
      purpose: 'Hỗ trợ tim mạch & mỡ máu',
      frequency: '1 lần/ngày',
      timeSlot: '07:00',
      mealInstruction: 'Sau ăn 30 phút',
      takenToday: true,
      remainingPills: 24,
      totalPills: 30,
    },
    {
      id: 'med-2',
      medicationName: 'Magnesium Glycinate 400mg',
      dosage: '1 viên',
      purpose: 'Cải thiện giấc ngủ sâu & giãn cơ',
      frequency: '1 lần/ngày',
      timeSlot: '21:30',
      mealInstruction: 'Trước khi ngủ',
      takenToday: false,
      remainingPills: 18,
      totalPills: 30,
    },
  ]);

  assert.equal(adherence.takenCount, 1);
  assert.equal(adherence.totalCount, 2);
  assert.equal(adherence.adherencePercent, 50);
});

test('validateVitalEntry rejects out-of-range or inverted blood pressure values', () => {
  assert.equal(
    validateVitalEntry({
      systolic: 120,
      diastolic: 80,
      heartRate: 72,
      spo2: 98,
      bloodGlucose: 95,
      weightKg: 66,
      sleepHours: 7.5,
    }).valid,
    true
  );

  const inverted = validateVitalEntry({
    systolic: 85,
    diastolic: 95,
    heartRate: 72,
    spo2: 98,
    bloodGlucose: 95,
    weightKg: 66,
    sleepHours: 7.5,
  });
  assert.equal(inverted.valid, false);
});

test('serializeVitalsToCsv, serializeMealsToCsv, and serializeCombinedHealthToCsv format offline CSV accurately', () => {
  const sampleVitals: VitalRecord[] = [
    {
      id: 'v-10',
      date: '2026-11-10',
      time: '07:15',
      systolic: 118,
      diastolic: 76,
      heartRate: 68,
      spo2: 98,
      bloodGlucose: 94,
      glucoseContext: 'fasting',
      temperatureC: 36.6,
      weightKg: 67.2,
      sleepHours: 7.4,
      steps: 6840,
      deviceSource: 'Smartwatch BLE',
      notes: 'Ổn định, tỉnh táo',
    },
  ];

  const sampleMeals: MealEntry[] = [
    {
      id: 'm-1',
      date: '2026-11-10',
      time: '07:45',
      mealType: 'Sáng',
      foodName: 'Phở bò tái, ít béo',
      calories: 460,
      proteinG: 32,
      carbsG: 52,
      fatG: 12,
    },
  ];

  const vitalsCsv = serializeVitalsToCsv(sampleVitals);
  assert.ok(vitalsCsv.includes('HuyetAp_TamThu_mmHg'));
  assert.ok(vitalsCsv.includes('118,76,68,98,94'));
  assert.ok(vitalsCsv.includes('"Ổn định, tỉnh táo"'));

  const mealsCsv = serializeMealsToCsv(sampleMeals);
  assert.ok(mealsCsv.includes('TenMonAn,Calories_kcal'));
  assert.ok(mealsCsv.includes('"Phở bò tái, ít béo",460,32,52,12'));

  const combinedCsv = serializeCombinedHealthToCsv(sampleVitals, sampleMeals);
  assert.ok(combinedCsv.includes('VITALS,v-10'));
  assert.ok(combinedCsv.includes('MEALS,m-1'));
});

test('serializeHealthDataToJson outputs valid JSON with vitals and meals arrays', () => {
  const sampleVitals: VitalRecord[] = [
    {
      id: 'v-10',
      date: '2026-11-10',
      time: '07:15',
      systolic: 118,
      diastolic: 76,
      heartRate: 68,
      spo2: 98,
      bloodGlucose: 94,
      glucoseContext: 'fasting',
      temperatureC: 36.6,
      weightKg: 67.2,
      sleepHours: 7.4,
      steps: 6840,
      deviceSource: 'Smartwatch BLE',
    },
  ];

  const sampleMeals: MealEntry[] = [
    {
      id: 'm-1',
      date: '2026-11-10',
      time: '12:15',
      mealType: 'Trưa',
      foodName: 'Cơm gạo lứt ức gà',
      calories: 580,
      proteinG: 45,
      carbsG: 62,
      fatG: 14,
    },
  ];

  const jsonAll = JSON.parse(serializeHealthDataToJson(sampleVitals, sampleMeals, 'all'));
  assert.equal(jsonAll.summary.vitalsCount, 1);
  assert.equal(jsonAll.summary.mealsCount, 1);
  assert.equal(jsonAll.summary.totalMealCalories, 580);
  assert.equal(jsonAll.vitals.length, 1);
  assert.equal(jsonAll.meals.length, 1);

  const jsonMealsOnly = JSON.parse(serializeHealthDataToJson(sampleVitals, sampleMeals, 'meals'));
  assert.equal(jsonMealsOnly.vitals, undefined);
  assert.equal(jsonMealsOnly.meals.length, 1);
});

test('resolveDeviceFrameMetrics adapts columns and dimensions across small, standard, foldable, and landscape screens', () => {
  const compact = resolveDeviceFrameMetrics('compact_se', 'portrait');
  assert.equal(compact.effectiveWidthPx, 320);
  assert.equal(compact.vitalsGridCols, 1);

  const standard = resolveDeviceFrameMetrics('standard_phone', 'portrait');
  assert.equal(standard.effectiveWidthPx, 390);
  assert.equal(standard.vitalsGridCols, 2);

  const standardLandscape = resolveDeviceFrameMetrics('standard_phone', 'landscape');
  assert.equal(standardLandscape.effectiveWidthPx, 640);
  assert.equal(standardLandscape.vitalsGridCols, 3);

  const foldable = resolveDeviceFrameMetrics('foldable_tablet', 'portrait');
  assert.equal(foldable.effectiveWidthPx, 620);
  assert.equal(foldable.vitalsGridCols, 3);

  const fluid = resolveDeviceFrameMetrics('adaptive_fluid', 'portrait');
  assert.equal(fluid.isFluid, true);
  assert.equal(fluid.vitalsGridCols, 3);
});

test('parseBleHeartRatePacket decodes 8-bit and 16-bit Bluetooth SIG 0x2A37 packets', () => {
  // Flags = 0x06 (UINT8 HR, sensor contact detected), HR = 72 bpm
  const packet8Bit = new Uint8Array([0x06, 72]);
  const parsed8 = parseBleHeartRatePacket(packet8Bit);
  assert.equal(parsed8.heartRate, 72);
  assert.equal(parsed8.contactDetected, true);

  // Flags = 0x09 (UINT16 HR + Energy Expended), HR = 145 bpm (0x0091), Energy = 250 kJ (0x00FA)
  const packet16Bit = new Uint8Array([0x09, 0x91, 0x00, 0xfa, 0x00]);
  const parsed16 = parseBleHeartRatePacket(packet16Bit);
  assert.equal(parsed16.heartRate, 145);
  assert.equal(parsed16.energyExpendedKJ, 250);
});

test('parseBleBloodPressurePacket decodes IEEE 11073 SFLOAT Blood Pressure 0x2A35 packets', () => {
  // Flags = 0x04 (mmHg, no timestamp, pulse rate present)
  // Systolic = 122 (0x007A), Diastolic = 78 (0x004E), MAP = 93 (0x005D), Pulse = 69 (0x0045)
  const bpPacket = new Uint8Array([0x04, 0x7a, 0x00, 0x4e, 0x00, 0x5d, 0x00, 0x45, 0x00]);
  const parsedBp = parseBleBloodPressurePacket(bpPacket);
  assert.equal(parsedBp.systolic, 122);
  assert.equal(parsedBp.diastolic, 78);
  assert.equal(parsedBp.meanArterialPressure, 93);
  assert.equal(parsedBp.pulseRate, 69);
  assert.equal(parsedBp.unit, 'mmHg');
});

test('buildGoogleCalendarEventPayload formats RFC3339 timestamps and reminders accurately', () => {
  const event = buildGoogleCalendarEventPayload({
    summary: 'Tái khám Tim mạch định kỳ - BS.CKII Lê Hoàng Nam',
    description: 'Mang theo sổ theo dõi huyết áp VitaPulse 7 ngày gần nhất.',
    location: 'Bệnh viện Đại học Y Dược - Khoa Tim Mạch',
    date: '2026-11-15',
    time: '08:30',
    durationMinutes: 45,
  });

  assert.equal(event.start.dateTime, '2026-11-15T08:30:00');
  assert.equal(event.end.dateTime, '2026-11-15T09:15:00');
  assert.equal(event.reminders.overrides.length, 2);
});

test('sanitizeVitalForFirestore enforces blueprint schema bounds and strips unsafe IDs', () => {
  const sanitized = sanitizeVitalForFirestore(
    {
      id: 'vital$unsafe!123',
      date: '2026-11-10',
      time: '08:00',
      systolic: 350, // should clamp to 260
      diastolic: 20, // should clamp to 35
      heartRate: 72,
      spo2: 98,
      bloodGlucose: 94,
      glucoseContext: 'fasting',
      temperatureC: 36.6,
      weightKg: 67.2,
      sleepHours: 7.5,
      steps: 7000,
      deviceSource: 'Smartwatch BLE',
      notes: 'Ghi chú kiểm tra',
    },
    'user_uid_123',
    '2026-11-10T08:00:00Z'
  );

  assert.equal(sanitized.id, 'vital_unsafe_123');
  assert.equal(sanitized.userId, 'user_uid_123');
  assert.equal(sanitized.systolic, 260);
  assert.equal(sanitized.diastolic, 35);
  assert.equal(sanitized.note, 'Ghi chú kiểm tra');
});

test('prepareSevenDayVitalsBarData slices the latest 7 records chronologically and computes 7-day averages', () => {
  const records: VitalRecord[] = Array.from({ length: 9 }, (_, idx) => ({
    id: `v-${idx + 1}`,
    date: `2026-11-0${idx + 1}`,
    time: '07:15',
    systolic: 115 + idx,
    diastolic: 75 + idx,
    heartRate: 65 + idx,
    spo2: 98,
    bloodGlucose: 90 + idx,
    glucoseContext: 'fasting',
    temperatureC: 36.6,
    weightKg: 67,
    sleepHours: 7.5,
    steps: 6000 + idx * 500,
    deviceSource: 'Smartwatch BLE',
  }));

  const barData = prepareSevenDayVitalsBarData(records);
  assert.equal(barData.items.length, 7);
  assert.equal(barData.items[0].dateLabel, '11-03');
  assert.equal(barData.items[6].dateLabel, '11-09');
  assert.equal(barData.averages.systolic, 120);
  assert.equal(barData.averages.diastolic, 80);
  assert.equal(barData.averages.heartRate, 70);
});

test('validateVneidOrBhytInput validates 12-digit CCCD, 15-char BHYT, and 10-digit BHXH numbers', () => {
  const cccdRes = validateVneidOrBhytInput('0790 6800 4512');
  assert.equal(cccdRes.valid, true);
  assert.equal(cccdRes.type, 'CCCD_12');
  assert.equal(cccdRes.derivedCccdNumber, '079068004512');
  assert.equal(cccdRes.derivedBhytCode, 'DN4799068004512');

  const bhytRes = validateVneidOrBhytInput('DN4790123849201');
  assert.equal(bhytRes.valid, true);
  assert.equal(bhytRes.type, 'BHYT_15');
  assert.equal(bhytRes.derivedBhytCode, 'DN4790123849201');

  const bhxhRes = validateVneidOrBhytInput('7901238492');
  assert.equal(bhxhRes.valid, true);
  assert.equal(bhxhRes.type, 'BHXH_10');

  const invalidRes = validateVneidOrBhytInput('12345');
  assert.equal(invalidRes.valid, false);
});

test('summarizeBhytVisitHistory aggregates BHYT costs, co-pay, and unique ICD diagnoses', () => {
  const visits: BhytVisitRecord[] = [
    {
      id: 'v1',
      visitDate: '2026-11-05',
      hospitalName: 'Bệnh viện Đại học Y Dược TP.HCM',
      department: 'Khoa Nội Tim mạch',
      doctorName: 'BS.CKII Lê Hoàng Nam',
      icdCode: 'I10',
      diagnosisSummary: 'Tăng huyết áp nguyên phát',
      plainExplanation: 'Huyết áp ổn định hơn.',
      doctorAdvice: 'Uống thuốc đều đặn.',
      followUpDate: '2026-12-05',
      totalCostVnd: 800000,
      bhytPaidVnd: 640000,
      patientCoPayVnd: 160000,
      recordedVitals: {
        systolic: 132,
        diastolic: 82,
        heartRate: 74,
        bloodGlucose: 96,
        weightKg: 67.5,
      },
      prescribedMedications: [],
    },
    {
      id: 'v2',
      visitDate: '2026-09-18',
      hospitalName: 'Bệnh viện Đại học Y Dược TP.HCM',
      department: 'Khoa Nội Tổng hợp',
      doctorName: 'TS.BS Nguyễn Thị Minh Tâm',
      icdCode: 'E78.2',
      diagnosisSummary: 'Tăng mỡ máu nhẹ',
      plainExplanation: 'Cần giảm đồ chiên xào.',
      doctorAdvice: 'Tập thể dục 30 phút/ngày.',
      followUpDate: '2026-12-18',
      totalCostVnd: 200000,
      bhytPaidVnd: 160000,
      patientCoPayVnd: 40000,
      recordedVitals: {
        systolic: 135,
        diastolic: 85,
        heartRate: 76,
        bloodGlucose: 98,
        weightKg: 68.2,
      },
      prescribedMedications: [],
    },
  ];

  const summary = summarizeBhytVisitHistory(visits);
  assert.equal(summary.totalVisits, 2);
  assert.equal(summary.totalCostVnd, 1000000);
  assert.equal(summary.totalBhytCoveredVnd, 800000);
  assert.equal(summary.totalPatientCoPayVnd, 200000);
  assert.equal(summary.coverageSavedPercent, 80);
  assert.equal(summary.diagnosedConditions.length, 2);
  assert.equal(summary.nextFollowUpDate, '2026-12-05');
});

test('evaluateMedicationScheduleNotifications triggers local push notifications on time, with leadMinutes, and handles snooze', () => {
  const sampleMeds: MedicationSchedule[] = [
    {
      id: 'med-morning',
      medicationName: 'Amlodipine 5mg',
      dosage: '1 viên',
      purpose: 'Ổn định huyết áp',
      frequency: 'Hàng ngày',
      timeSlot: '07:00',
      mealInstruction: 'Sau ăn 30 phút',
      takenToday: true,
      remainingPills: 20,
      totalPills: 30,
    },
    {
      id: 'med-noon',
      medicationName: 'Omega-3 1000mg',
      dosage: '1 viên',
      purpose: 'Hỗ trợ tim mạch',
      frequency: 'Hàng ngày',
      timeSlot: '12:30',
      mealInstruction: 'Cùng bữa ăn',
      takenToday: false,
      remainingPills: 25,
      totalPills: 30,
    },
    {
      id: 'med-evening',
      medicationName: 'Rosuvastatin 10mg',
      dosage: '1 viên',
      purpose: 'Giảm mỡ máu',
      frequency: 'Hàng ngày',
      timeSlot: '19:00',
      mealInstruction: 'Sau ăn 30 phút',
      takenToday: false,
      remainingPills: 18,
      totalPills: 30,
    },
  ];

  assert.equal(parseTimeMinutes('12:30'), 750);
  assert.equal(addMinutesToTimeStr('12:25', 10), '12:35');

  // 1. At 12:22 with leadMinutes = 10 -> 12:30 med is due right now!
  const evalDue = evaluateMedicationScheduleNotifications({
    medications: sampleMeds,
    currentTimeStr: '12:22',
    leadMinutes: 10,
    notifiedSignaturesToday: [],
  });
  assert.equal(evalDue.dueNowMedications.length, 1);
  assert.equal(evalDue.dueNowMedications[0].id, 'med-noon');
  assert.equal(evalDue.nextDose?.medication.id, 'med-noon');
  assert.equal(evalDue.nextDose?.minutesUntilDue, 8);
  assert.equal(evalDue.nextDose?.countdownLabel, 'Còn 8 phút nữa');

  // 2. Once notified ("med-noon@12:30"), it shouldn't re-trigger
  const evalAfterNotified = evaluateMedicationScheduleNotifications({
    medications: sampleMeds,
    currentTimeStr: '12:25',
    leadMinutes: 10,
    notifiedSignaturesToday: ['med-noon@12:30'],
  });
  assert.equal(evalAfterNotified.dueNowMedications.length, 0);

  // 3. If snoozed until 12:40, it triggers again at 12:40
  const snoozedMeds: MedicationSchedule[] = sampleMeds.map((m) =>
    m.id === 'med-noon' ? { ...m, snoozedUntil: '12:40' } : m
  );
  const evalSnoozed = evaluateMedicationScheduleNotifications({
    medications: snoozedMeds,
    currentTimeStr: '12:41',
    leadMinutes: 10,
    notifiedSignaturesToday: ['med-noon@12:30'],
  });
  assert.equal(evalSnoozed.dueNowMedications.length, 1);
  assert.equal(evalSnoozed.dueNowMedications[0].id, 'med-noon');

  const payload = buildMedicationPushPayload(sampleMeds[1], 'Chú Quân', '12:30');
  assert.ok(payload.title.includes('Omega-3 1000mg'));
  assert.ok(payload.body.includes('Chú Quân ơi'));
});

test('evaluateWorkoutScheduleNotifications and calculateWorkoutScheduleAdherence handle recurring days, lead time, and snooze', () => {
  // 2026-11-11 is Wednesday -> T4
  assert.equal(getVietnameseDayCode(new Date('2026-11-11T10:00:00')), 'T4');
  assert.equal(
    formatRecurringDaysLabel(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']),
    'Hàng ngày (T2 – CN)'
  );
  assert.equal(formatRecurringDaysLabel(['T2', 'T3', 'T4', 'T5', 'T6']), 'Thứ 2 – Thứ 6');
  assert.equal(formatRecurringDaysLabel(['T2', 'T4', 'T6']), 'T2, T4, T6');

  const sampleWorkoutSchedules: WorkoutSchedule[] = [
    {
      id: 'ws-morning',
      activityName: 'Đi bộ nhanh công viên',
      category: 'Đi bộ',
      timeSlot: '06:00',
      durationMinutes: 30,
      targetCalories: 220,
      daysOfWeek: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      intensityLabel: 'Vừa phải',
      completedToday: true,
      completedAt: '06:32',
      reminderEnabled: true,
    },
    {
      id: 'ws-afternoon',
      activityName: 'Tập dưỡng sinh giãn cơ',
      category: 'Linh hoạt',
      timeSlot: '17:30',
      durationMinutes: 20,
      targetCalories: 95,
      daysOfWeek: ['T2', 'T4', 'T6'],
      intensityLabel: 'Nhẹ nhàng',
      completedToday: false,
      reminderEnabled: true,
    },
    {
      id: 'ws-weekend',
      activityName: 'Đạp xe hồ Tây',
      category: 'Cardio',
      timeSlot: '07:00',
      durationMinutes: 45,
      targetCalories: 320,
      daysOfWeek: ['T7', 'CN'],
      intensityLabel: 'Tích cực',
      completedToday: false,
      reminderEnabled: true,
    },
  ];

  // On Wednesday ('T4'), only ws-morning and ws-afternoon are scheduled (2 total, 1 completed = 50%)
  const adherenceT4 = calculateWorkoutScheduleAdherence(sampleWorkoutSchedules, 'T4');
  assert.equal(adherenceT4.totalScheduledToday, 2);
  assert.equal(adherenceT4.completedCount, 1);
  assert.equal(adherenceT4.adherencePercent, 50);

  // At 17:25 on T4 with leadMinutes = 5 -> ws-afternoon (17:30) triggers right now!
  const evalDue = evaluateWorkoutScheduleNotifications({
    schedules: sampleWorkoutSchedules,
    currentDayCode: 'T4',
    currentTimeStr: '17:25',
    leadMinutes: 5,
    notifiedSignaturesToday: [],
  });
  assert.equal(evalDue.dueNowWorkouts.length, 1);
  assert.equal(evalDue.dueNowWorkouts[0].id, 'ws-afternoon');
  assert.equal(evalDue.nextWorkout?.schedule.id, 'ws-afternoon');
  assert.equal(evalDue.nextWorkout?.minutesUntilDue, 5);
  assert.equal(evalDue.nextWorkout?.countdownLabel, 'Còn 5 phút nữa');

  // On Tuesday ('T3'), ws-afternoon is NOT scheduled, so dueNowWorkouts is empty
  const evalNotScheduledDay = evaluateWorkoutScheduleNotifications({
    schedules: sampleWorkoutSchedules,
    currentDayCode: 'T3',
    currentTimeStr: '17:25',
    leadMinutes: 5,
    notifiedSignaturesToday: [],
  });
  assert.equal(evalNotScheduledDay.dueNowWorkouts.length, 0);
  assert.equal(evalNotScheduledDay.nextWorkout, null);

  // Check workout push notification payload formatting
  const wPayload = buildWorkoutPushPayload(sampleWorkoutSchedules[1], 'Chú Quân', '17:30');
  assert.ok(wPayload.title.includes('Tập dưỡng sinh giãn cơ'));
  assert.ok(wPayload.body.includes('20 phút'));
});

test('Stage 1: calculateHealthScore enforces cap rule when adherence < 80% or any vital is warning/critical', () => {
  const optimalRecord: VitalRecord = {
    id: 'v-cap-1',
    date: '2026-11-10',
    time: '07:30',
    systolic: 118,
    diastolic: 76,
    heartRate: 68,
    spo2: 98,
    bloodGlucose: 92,
    glucoseContext: 'fasting',
    temperatureC: 36.6,
    weightKg: 66.5,
    sleepHours: 7.5,
    steps: 8500,
    deviceSource: 'Smartwatch BLE',
  };

  // 1. Optimal vitals BUT medication adherence is 70% (< 80%) -> MUST NOT be 'Tối ưu'
  const lowAdherenceScore = calculateHealthScore(optimalRecord, 22.5, 70);
  assert.notEqual(lowAdherenceScore.grade, 'Tối ưu');
  assert.ok(lowAdherenceScore.score <= 84);
  assert.equal(lowAdherenceScore.grade, 'Khá tốt');

  // 2. Optimal adherence (100%) BUT blood pressure is in warning (135/85) -> MUST NOT be 'Tối ưu'
  const warningBpRecord: VitalRecord = {
    ...optimalRecord,
    systolic: 135,
    diastolic: 85,
  };
  const warningBpScore = calculateHealthScore(warningBpRecord, 22.5, 100);
  assert.notEqual(warningBpScore.grade, 'Tối ưu');
  assert.ok(warningBpScore.score <= 84);
  assert.equal(warningBpScore.grade, 'Khá tốt');

  // 3. Critical blood pressure (150/96) -> capped at <= 59, status 'critical', grade 'Cần chú ý ngay'
  const criticalBpRecord: VitalRecord = {
    ...optimalRecord,
    systolic: 150,
    diastolic: 96,
  };
  const criticalBpScore = calculateHealthScore(criticalBpRecord, 22.5, 100);
  assert.equal(criticalBpScore.status, 'critical');
  assert.equal(criticalBpScore.grade, 'Cần chú ý ngay');
  assert.ok(criticalBpScore.score <= 59);
});

test('Stage 1: recommendations use neutral doctor-discussion phrasing and critical includes 115 emergency guidance', () => {
  const bpWarning = classifyBloodPressure(135, 86);
  assert.ok(bpWarning.recommendation.includes('Bạn nên trao đổi với bác sĩ'));

  const bpCritical = classifyBloodPressure(152, 96);
  assert.equal(bpCritical.status, 'critical');
  assert.ok(bpCritical.label.includes('Cần chú ý ngay'));
  assert.ok(bpCritical.recommendation.includes('115'));

  const gluCritical = classifyBloodGlucose(140, 'fasting');
  assert.equal(gluCritical.status, 'critical');
  assert.ok(gluCritical.label.includes('Cần chú ý ngay'));
  assert.ok(gluCritical.recommendation.includes('115'));
});

test('Stage 1: maskSensitiveIdentifier masks BHYT and CCCD codes clearly', () => {
  assert.equal(maskSensitiveIdentifier('DN4700000000201', 'bhyt'), 'DN47•••••••201');
  assert.equal(maskSensitiveIdentifier('079000000001', 'cccd'), '0790•••••001');
});

test('Stage 1: resolvePriorityDashboardConfig prioritizes cards by ICD code (I10 -> bp, E11 -> glucose, K21/K76 -> nutrition_meds)', () => {
  const i10Config = resolvePriorityDashboardConfig(
    ['Tăng huyết áp nguyên phát (Mã I10)'],
    []
  );
  assert.equal(i10Config.conditionGroup, 'blood_pressure');
  assert.equal(i10Config.orderedCardIds[0], 'bp');
  assert.equal(i10Config.orderedCardIds[1], 'hr_spo2');

  const e11Config = resolvePriorityDashboardConfig(
    ['Đái tháo đường tuýp 2 (Mã E11)'],
    []
  );
  assert.equal(e11Config.conditionGroup, 'blood_glucose');
  assert.equal(e11Config.orderedCardIds[0], 'glucose');
  assert.equal(e11Config.orderedCardIds[1], 'weight_bmi');

  const k21Config = resolvePriorityDashboardConfig(
    ['Trào ngược dạ dày thực quản (Mã K21)', 'Gan nhiễm mỡ độ 1 (Mã K76.0)'],
    []
  );
  assert.equal(k21Config.conditionGroup, 'digestive_metabolic');
  assert.equal(k21Config.orderedCardIds[0], 'nutrition_meds');
  assert.equal(k21Config.orderedCardIds[1], 'weight_bmi');
});

test('Stage 1: storage writeStorageIfChanged only writes when serialized value actually changes', () => {
  resetStorageCacheForTest();
  assert.equal(getStorageWriteCountForTest(), 0);

  const firstWrite = writeStorageIfChanged('test_key_stage1', { a: 1, b: 'hello' });
  assert.equal(firstWrite, true);
  assert.equal(getStorageWriteCountForTest(), 1);

  // Writing the exact same payload should be skipped
  const secondWrite = writeStorageIfChanged('test_key_stage1', { a: 1, b: 'hello' });
  assert.equal(secondWrite, false);
  assert.equal(getStorageWriteCountForTest(), 1);

  // Writing a modified payload should write once more
  const thirdWrite = writeStorageIfChanged('test_key_stage1', { a: 2, b: 'hello' });
  assert.equal(thirdWrite, true);
  assert.equal(getStorageWriteCountForTest(), 2);
});

test('Stage 3: anonymizeWeeklyHealthData strips fullName, bhytCode, and cccdNumber from 7-day payload', () => {
  const anonymized = anonymizeWeeklyHealthData({
    vitals: INITIAL_VITAL_RECORDS,
    medications: INITIAL_MEDICATIONS,
    profile: INITIAL_MEDICAL_PROFILE,
    userSymptomNote: `Tôi là ${INITIAL_MEDICAL_PROFILE.fullName}, mã thẻ ${INITIAL_MEDICAL_PROFILE.bhytCard?.bhytCode} cảm thấy khỏe.`,
  });

  const serialized = JSON.stringify(anonymized);
  assert.equal(serialized.includes(INITIAL_MEDICAL_PROFILE.fullName), false);
  assert.equal(
    serialized.includes(INITIAL_MEDICAL_PROFILE.bhytCard?.bhytCode || 'DN4700000000201'),
    false
  );
  assert.equal(
    serialized.includes(INITIAL_MEDICAL_PROFILE.bhytCard?.cccdNumber || '079000000001'),
    false
  );
  assert.ok(anonymized.sevenDayVitals.length <= 7);
  assert.ok(anonymized.icdCodes.includes('I10'));
});

test('Stage 3: detectEmergencyGuardrail triggers 115 alert on chest pain, shortness of breath, or BP >= 180/120', () => {
  // 1. Normal vitals and normal note -> not emergency
  const safeCheck = detectEmergencyGuardrail({
    text: 'Hôm nay đi bộ nhẹ 30 phút, ngủ ngon',
    systolic: 124,
    diastolic: 78,
  });
  assert.equal(safeCheck.isEmergency, false);

  // 2. Keyword "đau ngực" -> triggers 115 emergency guardrail
  const chestPainCheck = detectEmergencyGuardrail({
    text: 'Sáng nay tôi bị đau ngực và mệt',
    systolic: 128,
    diastolic: 80,
  });
  assert.equal(chestPainCheck.isEmergency, true);
  assert.ok(chestPainCheck.emergencyCall115Message.includes('115'));

  // 3. Keyword "khó thở" -> triggers 115 emergency guardrail
  const dyspneaCheck = detectEmergencyGuardrail({
    text: 'Cảm thấy khó thở khi nằm nghỉ',
  });
  assert.equal(dyspneaCheck.isEmergency, true);
  assert.ok(dyspneaCheck.emergencyCall115Message.includes('115'));

  // 4. Blood pressure >= 180/120 -> triggers 115 emergency guardrail
  const bpCrisisCheck = detectEmergencyGuardrail({
    systolic: 185,
    diastolic: 122,
  });
  assert.equal(bpCrisisCheck.isEmergency, true);
  assert.ok(bpCrisisCheck.emergencyCall115Message.includes('115'));
});

test('Stage 3: normalizeFiveLineSummary enforces 5 lines and MEDICAL_AI_SYSTEM_PROMPT forbids diagnosis/prescription/dose changes', () => {
  assert.ok(MEDICAL_AI_SYSTEM_PROMPT.includes('CẤM chẩn đoán'));
  assert.ok(MEDICAL_AI_SYSTEM_PROMPT.includes('CẤM kê đơn'));
  assert.ok(MEDICAL_AI_SYSTEM_PROMPT.includes('115'));

  const normalized = normalizeFiveLineSummary([
    '1. Dòng 1: Huyết áp ổn định.',
    '2. Dòng 2: Không tự ý đổi liều hoặc kê đơn mới.',
    '3. Dòng 3: Ngủ đủ giấc.',
  ]);
  assert.equal(normalized.length, 5);
  assert.equal(normalized[1].toLowerCase().includes('kê đơn'), false);
});

test('Stage 4: technical cleanup verifies vitapulse package name, assetlinks placeholder, DRAFT_firestore.rules removal, and modular files under 300 lines', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const pkgJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
  assert.equal(pkgJson.name, 'vitapulse');
  assert.equal(Boolean(pkgJson.dependencies?.motion), false);

  const assetLinks = fs.readFileSync(
    path.resolve('public/.well-known/assetlinks.json'),
    'utf8'
  );
  assert.ok(assetLinks.includes('GHI_SHA256_THAT_VAO_DAY'));

  assert.equal(fs.existsSync(path.resolve('DRAFT_firestore.rules')), false);

  const modularFilesToVerify = [
    'src/App.tsx',
    'src/hooks/useProfile.ts',
    'src/hooks/useVitals.ts',
    'src/hooks/useMedications.ts',
    'src/hooks/useScheduleNotifications.ts',
    'src/hooks/useAccountActions.ts',
    'src/components/layout/AppTopHeaderAndNav.tsx',
    'src/components/layout/PatientIdentityBar.tsx',
    'src/components/dashboard/CompositeIndexCard.tsx',
    'src/components/dashboard/PriorityMetricsGrid.tsx',
    'src/components/dashboard/DashboardDailyChecklists.tsx',
    'src/components/dashboard/DashboardOverviewView.tsx',
    'src/components/records/RecordsModuleView.tsx',
    'src/services/authService.ts',
    'src/components/LoginScreen.tsx',
    'src/components/auth/RegisterForm.tsx',
    'src/components/auth/PostRegisterProfileStep.tsx',
    'src/components/auth/LoginSocialAndDemoFooter.tsx',
    'src/components/auth/LoginCareIllustration.tsx',
    'src/utils/formatters.ts',
    'src/components/ui/Primitives.tsx',
    'src/components/ui/BottomNav.tsx',
  ];

  for (const relPath of modularFilesToVerify) {
    const content = fs.readFileSync(path.resolve(relPath), 'utf8');
    const lineCount = content.split('\n').length;
    assert.ok(
      lineCount < 300,
      `Expected ${relPath} to be under 300 lines, but got ${lineCount} lines`
    );
  }
});

test('Auth Redesign: validateVietnamesePhone and normalizeVietnamesePhone validate 10-digit phone starting with 0 and normalize +84', () => {
  assert.equal(normalizeVietnamesePhone('+84912345678'), '0912345678');
  assert.equal(normalizeVietnamesePhone('84987654321'), '0987654321');
  assert.equal(normalizeVietnamesePhone('0912 345 678'), '0912345678');

  const validCheck = validateVietnamesePhone('0912345678');
  assert.equal(validCheck.valid, true);
  assert.equal(validCheck.normalizedPhone, '0912345678');

  const validPlus84 = validateVietnamesePhone('+84123456789');
  assert.equal(validPlus84.valid, true);
  assert.equal(validPlus84.normalizedPhone, '0123456789');

  const tooShort = validateVietnamesePhone('09123456');
  assert.equal(tooShort.valid, false);
  assert.ok(tooShort.error?.includes('10 chữ số'));

  const wrongPrefix = validateVietnamesePhone('1912345678');
  assert.equal(wrongPrefix.valid, false);
});

test('Auth Redesign: mapPhoneToVirtualEmail maps valid phone numbers to {sdt}@vitapulse.app', () => {
  assert.equal(mapPhoneToVirtualEmail('0912345678'), '0912345678@vitapulse.app');
  assert.equal(mapPhoneToVirtualEmail('+84912345678'), '0912345678@vitapulse.app');
  assert.equal(mapPhoneToVirtualEmail('0123 456 789'), '0123456789@vitapulse.app');
  assert.throws(() => mapPhoneToVirtualEmail('12345'));
});

test('Auth Redesign: verifyDemoCredentials matches 0123456789 / demo@123 with isDemo=true and rejects wrong password', () => {
  const matched = verifyDemoCredentials(DEMO_PHONE, DEMO_PASSWORD);
  assert.equal(matched.isDemoMatch, true);
  assert.equal(matched.account?.isDemo, true);
  assert.equal(matched.account?.profile.isDemo, true);

  const matchedPlus84 = verifyDemoCredentials('+84123456789', 'demo@123');
  assert.equal(matchedPlus84.isDemoMatch, true);

  const wrongPass = verifyDemoCredentials(DEMO_PHONE, 'wrongpass');
  assert.equal(wrongPass.isDemoMatch, false);
  assert.equal(wrongPass.isDemoPhoneWithWrongPassword, true);
  assert.ok(wrongPass.error?.includes('chưa đúng'));

  const nonDemoPhone = verifyDemoCredentials('0988776655', 'demo@123');
  assert.equal(nonDemoPhone.isDemoMatch, false);
  assert.equal(nonDemoPhone.isDemoPhoneWithWrongPassword, false);
});

test('Auth Redesign: createLoginRateLimiter locks for 30s after 5 failed attempts and evaluatePasswordStrength checks >= 8 chars', () => {
  const limiter = createLoginRateLimiter(5, 30_000);
  const startMs = 1_000_000;
  for (let i = 1; i <= 4; i++) {
    const r = limiter.recordFailure(startMs);
    assert.equal(r.locked, false);
    assert.equal(r.attemptsLeft, 5 - i);
  }
  const fifth = limiter.recordFailure(startMs);
  assert.equal(fifth.locked, true);
  assert.equal(fifth.remainingSeconds, 30);

  const midCheck = limiter.getLockStatus(startMs + 10_000);
  assert.equal(midCheck.locked, true);
  assert.equal(midCheck.remainingSeconds, 20);

  const expiredCheck = limiter.getLockStatus(startMs + 31_000);
  assert.equal(expiredCheck.locked, false);

  assert.equal(evaluatePasswordStrength('1234567').valid, false);
  assert.equal(evaluatePasswordStrength('matkhau123').valid, true);
  assert.equal(evaluatePasswordStrength('MatKhau@2026').score, 3);
});

test('Step 1 & 2 Redesign: formatDateDdMmYyyy, formatShortDateDdMm, humanizeDeviceSource, buildVietnameseGreeting, and computeVitalTrend work accurately', async () => {
  const {
    formatDateDdMmYyyy,
    formatShortDateDdMm,
    formatTime24h,
    humanizeDeviceSource,
    buildVietnameseGreeting,
    computeVitalTrend,
  } = await import('./formatters');

  assert.equal(formatDateDdMmYyyy('2026-12-05'), '05/12/2026');
  assert.equal(formatShortDateDdMm('11-04'), '04/11');
  assert.equal(formatShortDateDdMm('2026-11-09'), '09/11');
  assert.equal(formatTime24h('7:05'), '07:05');
  assert.equal(humanizeDeviceSource('Smartwatch BLE'), 'Đồng bộ từ thiết bị');

  const morningGreeting = buildVietnameseGreeting({
    fullName: 'Nguyễn Minh Quân',
    gender: 'male',
    birthYear: 1968,
    now: new Date('2026-11-11T08:30:00'),
  });
  assert.equal(morningGreeting.greetingTitle, 'Chào buổi sáng, chú Quân');
  assert.ok(morningGreeting.todayFormatted.includes('11/11/2026'));

  const trend = computeVitalTrend(INITIAL_VITAL_RECORDS, (v) => v.systolic, 2);
  assert.ok(['↑', '↓', '→'].includes(trend.arrow));
});

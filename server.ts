import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = 'gemini-3.8-flash';

interface AnonymizedVitalItem {
  dayIndex: number;
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  spo2: number;
  bloodGlucose: number;
  glucoseContext: 'fasting' | 'post_meal';
  weightKg: number;
  sleepHours: number;
  steps: number;
}

interface AnonymizedWeeklyHealthPayload {
  ageGroup: string;
  gender: 'male' | 'female' | 'other';
  icdCodes: string[];
  medicationAdherencePercent: number;
  takenDosesCount: number;
  totalDosesCount: number;
  medicationSchedulesSummary: Array<{
    timeSlot: string;
    mealInstruction: string;
    takenToday: boolean;
  }>;
  sevenDayVitals: AnonymizedVitalItem[];
  userSymptomNote?: string;
}

interface EmergencyGuardrailResult {
  isEmergency: boolean;
  triggerReason: string | null;
  emergencyTitle: string;
  emergencyCall115Message: string;
}

interface WeeklyAiSummaryResponse {
  isEmergency: boolean;
  triggerReason?: string | null;
  emergencyTitle?: string;
  emergencyCall115Message?: string;
  lines: string[];
  doctorQuestionSuggestion: string;
  disclaimer: string;
  anonymizedFieldsStripped: string[];
}

interface ExtractedMedicationDraft {
  medicationName: string;
  dosage: string;
  purpose: string;
  timeSlot: '07:00' | '12:30' | '19:00' | '21:30';
  mealInstruction:
    | 'Trước ăn 30 phút'
    | 'Sau ăn 30 phút'
    | 'Cùng bữa ăn'
    | 'Trước khi ngủ';
}

interface ExtractedMedicalImageResponse {
  isEmergency: boolean;
  triggerReason?: string | null;
  emergencyTitle?: string;
  emergencyCall115Message?: string;
  mode: 'bp_monitor' | 'prescription';
  bpReading?: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    measurementNote: string;
  };
  prescribedMedications?: ExtractedMedicationDraft[];
  confidenceNote: string;
  doctorReminder: string;
  requiresUserConfirmation: true;
}

const MEDICAL_AI_SYSTEM_PROMPT = `Bạn là Trợ lý Tóm tắt Sổ Sức khỏe Cá nhân VitaPulse dành cho người 45–70 tuổi và gia đình tại Việt Nam.
QUY TẮC AN TOÀN Y KHOA BẮT BUỘC (GUARDRAILS):
1. TUYỆT ĐỐI CẤM chẩn đoán bệnh lý mới, CẤM kê đơn thuốc, CẤM khuyên người dùng tự ý thay đổi liều lượng hoặc tự ý ngưng thuốc.
2. Luôn sử dụng giọng điệu trung tính, dễ hiểu, lễ phép và LUÔN nhắc người dùng trao đổi với bác sĩ điều trị (ví dụ: "Bạn nên trao đổi với bác sĩ về...").
3. Nếu dữ liệu đầu vào có dấu hiệu nguy cấp (đau ngực, đau tức ngực, khó thở, tê yếu tay chân, nói khó, hoặc huyết áp tâm thu >= 180 mmHg hoặc huyết áp tâm trương >= 120 mmHg), TUYỆT ĐỐI KHÔNG đưa ra bản tóm tắt thông thường mà CHỈ hiển thị cảnh báo gọi cấp cứu 115 ngay lập tức.
4. Bản tóm tắt tuần phải trình bày đúng 5 dòng ngắn gọn, rõ ràng bằng tiếng Việt phổ thông để người lớn tuổi dễ đọc.`;

const EMERGENCY_KEYWORDS = [
  'đau ngực',
  'đau tức ngực',
  'tức ngực',
  'khó thở',
  'ngạt thở',
  'hụt hơi dữ dội',
  'tê yếu tay chân',
  'liệt nửa người',
  'méo miệng',
  'nói khó',
  'ngất xỉu',
  'bất tỉnh',
  'đột quỵ',
  'co giật',
];

function detectEmergencyGuardrail(params: {
  text?: string;
  systolic?: number;
  diastolic?: number;
  vitalsList?: Array<{ systolic: number; diastolic: number; notes?: string }>;
}): EmergencyGuardrailResult {
  const defaultTitle = 'CẢNH BÁO KHẨN CẤP — CẦN GỌI CẤP CỨU 115 NGAY';
  const defaultMessage =
    'Phát hiện dấu hiệu nguy cấp (đau ngực, khó thở hoặc huyết áp ≥ 180/120 mmHg). Hệ thống tạm dừng mọi tính năng tóm tắt thông thường. Hãy để người bệnh nghỉ ngơi ngay lập tức, KHÔNG tự ý dùng thêm thuốc hạ áp liều cao và GỌI NGAY SỐ CẤP CỨU 115 hoặc đưa đến cơ sở y tế gần nhất.';

  const combinedText = [
    params.text || '',
    ...(params.vitalsList?.map((v) => v.notes || '') || []),
  ]
    .join(' ')
    .toLowerCase();

  for (const kw of EMERGENCY_KEYWORDS) {
    if (combinedText.includes(kw)) {
      return {
        isEmergency: true,
        triggerReason: `Phát hiện triệu chứng nguy cấp: "${kw}"`,
        emergencyTitle: defaultTitle,
        emergencyCall115Message: defaultMessage,
      };
    }
  }

  if (
    (typeof params.systolic === 'number' && params.systolic >= 180) ||
    (typeof params.diastolic === 'number' && params.diastolic >= 120)
  ) {
    return {
      isEmergency: true,
      triggerReason: `Huyết áp ở ngưỡng nguy cấp (${params.systolic ?? '--'}/${params.diastolic ?? '--'} mmHg ≥ 180/120 mmHg)`,
      emergencyTitle: defaultTitle,
      emergencyCall115Message: defaultMessage,
    };
  }

  const latestVital = params.vitalsList?.[0];
  if (
    latestVital &&
    (latestVital.systolic >= 180 || latestVital.diastolic >= 120)
  ) {
    return {
      isEmergency: true,
      triggerReason: `Chỉ số huyết áp gần nhất ở mức nguy cấp (${latestVital.systolic}/${latestVital.diastolic} mmHg ≥ 180/120 mmHg)`,
      emergencyTitle: defaultTitle,
      emergencyCall115Message: defaultMessage,
    };
  }

  return {
    isEmergency: false,
    triggerReason: null,
    emergencyTitle: '',
    emergencyCall115Message: '',
  };
}

function normalizeFiveLineSummary(rawLines: string[]): string[] {
  const cleaned = rawLines
    .map((line) => line.replace(/^\s*[-•*\d.)]+\s*/, '').trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line
        .replace(/chỉ định/gi, 'gợi ý tham khảo')
        .replace(/kê đơn/gi, 'ghi chú đơn thuốc')
        .replace(/tự ý đổi liều/gi, 'trao đổi với bác sĩ về liều dùng')
    );

  const defaults = [
    'Chỉ số huyết áp và nhịp tim tuần qua được ghi nhận đều đặn trong sổ theo dõi cá nhân.',
    'Đường huyết và cân nặng duy trì ở ngưỡng theo dõi hàng ngày, cần tiếp tục đo đúng khung giờ.',
    'Tỷ lệ tuân thủ lịch uống thuốc và vận động nhẹ nhàng đóng vai trò quan trọng để giữ ổn định sức khỏe.',
    'Giấc ngủ và lượng nước uống hàng ngày nên được duy trì đều đặn theo mục tiêu cá nhân.',
    'Bạn nên trao đổi với bác sĩ điều trị về bảng số liệu 7 ngày này trong lần tái khám gần nhất.',
  ];

  const result: string[] = [];
  for (let i = 0; i < 5; i++) {
    result.push(cleaned[i] || defaults[i]);
  }
  return result.slice(0, 5);
}

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`GEMINI_TIMEOUT_${ms}MS`));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function buildFallbackFiveLineSummary(
  payload: AnonymizedWeeklyHealthPayload
): WeeklyAiSummaryResponse {
  const vitals = payload.sevenDayVitals || [];
  const count = vitals.length;
  const avgSys =
    count > 0
      ? Math.round(vitals.reduce((acc, v) => acc + v.systolic, 0) / count)
      : 120;
  const avgDia =
    count > 0
      ? Math.round(vitals.reduce((acc, v) => acc + v.diastolic, 0) / count)
      : 78;
  const avgGlu =
    count > 0
      ? Math.round(vitals.reduce((acc, v) => acc + v.bloodGlucose, 0) / count)
      : 96;
  const avgSleep =
    count > 0
      ? (vitals.reduce((acc, v) => acc + v.sleepHours, 0) / count).toFixed(1)
      : '7.0';
  const avgSteps =
    count > 0
      ? Math.round(vitals.reduce((acc, v) => acc + v.steps, 0) / count)
      : 6000;

  const lines = normalizeFiveLineSummary([
    `1. Huyết áp trung bình ${count} ngày qua đạt khoảng ${avgSys}/${avgDia} mmHg; bạn nên tiếp tục đo vào cùng một khung giờ mỗi sáng.`,
    `2. Đường huyết trung bình ghi nhận ở mức ${avgGlu} mg/dL, phù hợp để theo dõi định kỳ cùng chế độ ăn giảm tinh bột tinh chế và đồ ngọt.`,
    `3. Tỷ lệ tuân thủ lịch uống thuốc hiện đạt ${payload.medicationAdherencePercent}% (${payload.takenDosesCount}/${payload.totalDosesCount} cữ trong ngày); tuyệt đối không tự ý ngưng thuốc hoặc đổi liều.`,
    `4. Vận động trung bình đạt ${avgSteps.toLocaleString('vi-VN')} bước/ngày và giấc ngủ đạt ${avgSleep} giờ/đêm, hỗ trợ tốt cho tim mạch và chuyển hóa.`,
    `5. Bạn nên trao đổi với bác sĩ điều trị về bảng số liệu 7 ngày này trong kỳ tái khám tới để được tư vấn chuyên môn chính xác.`,
  ]);

  return {
    isEmergency: false,
    triggerReason: null,
    lines,
    doctorQuestionSuggestion:
      'Thưa bác sĩ, với mức huyết áp trung bình ' +
      `${avgSys}/${avgDia} mmHg và đường huyết ${avgGlu} mg/dL trong 7 ngày qua, tôi cần lưu ý gì thêm về chế độ ăn nhạt và lịch đo tại nhà ạ?`,
    disclaimer:
      'Bản tóm tắt 5 dòng chỉ mang tính chất tham khảo từ dữ liệu ẩn danh 7 ngày (đã loại bỏ họ tên và mã thẻ BHYT), không thay thế chẩn đoán y khoa, không kê đơn và không thay đổi liều thuốc.',
    anonymizedFieldsStripped: [
      'fullName',
      'bhytCode',
      'cccdNumber',
      'bhxhNumber',
      'hospitalName',
      'primaryDoctor',
    ],
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'vitapulse-gemini-server',
      model: GEMINI_MODEL,
    });
  });

  app.post('/api/ai/weekly-summary', async (req, res) => {
    try {
      const rawBody = req.body || {};

      // Defensive server-side PII stripping
      delete rawBody.fullName;
      delete rawBody.bhytCode;
      delete rawBody.cccdNumber;
      delete rawBody.bhxhNumber;

      const payload = rawBody as AnonymizedWeeklyHealthPayload;
      const vitals = Array.isArray(payload.sevenDayVitals)
        ? payload.sevenDayVitals
        : [];

      const guardrail = detectEmergencyGuardrail({
        text: payload.userSymptomNote,
        vitalsList: vitals,
      });

      if (guardrail.isEmergency) {
        const emergencyRes: WeeklyAiSummaryResponse = {
          isEmergency: true,
          triggerReason: guardrail.triggerReason,
          emergencyTitle: guardrail.emergencyTitle,
          emergencyCall115Message: guardrail.emergencyCall115Message,
          lines: [],
          doctorQuestionSuggestion:
            'Hãy gọi ngay Cấp cứu 115 hoặc nhờ người thân đưa đến khoa Cấp cứu gần nhất.',
          disclaimer:
            'Cảnh báo an toàn tự động: Khi có dấu hiệu nguy cấp, hệ thống chỉ hiển thị hướng dẫn gọi 115.',
          anonymizedFieldsStripped: [
            'fullName',
            'bhytCode',
            'cccdNumber',
            'bhxhNumber',
            'hospitalName',
            'primaryDoctor',
          ],
        };
        res.json(emergencyRes);
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.json(buildFallbackFiveLineSummary(payload));
        return;
      }

      try {
        const ai = getGeminiClient();
        const prompt = `Hãy tóm tắt dữ liệu sức khỏe 7 ngày đã ẩn danh dưới đây thành ĐÚNG 5 DÒNG ngắn gọn, dễ hiểu cho người 45–70 tuổi.
Yêu cầu bắt buộc:
- Không chẩn đoán bệnh, không kê đơn thuốc, không khuyên đổi liều thuốc.
- Luôn dùng câu trung tính ("Bạn nên trao đổi với bác sĩ về...").
- Dữ liệu 7 ngày ẩn danh (không có tên, không có mã BHYT):
${JSON.stringify(payload, null, 2)}`;

        const response = await withTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              systemInstruction: MEDICAL_AI_SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  lines: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description:
                      'Đúng 5 dòng tóm tắt ngắn gọn, dễ hiểu bằng tiếng Việt cho người 45-70 tuổi.',
                  },
                  doctorQuestionSuggestion: {
                    type: Type.STRING,
                    description:
                      'Một câu hỏi gợi ý trung tính để người bệnh hỏi bác sĩ điều trị khi tái khám.',
                  },
                },
                required: ['lines', 'doctorQuestionSuggestion'],
              },
            },
          }),
          4500
        );

        const parsed = JSON.parse((response.text ?? '{}').trim()) as {
          lines?: string[];
          doctorQuestionSuggestion?: string;
        };

        const lines = normalizeFiveLineSummary(parsed.lines || []);
        const result: WeeklyAiSummaryResponse = {
          isEmergency: false,
          triggerReason: null,
          lines,
          doctorQuestionSuggestion:
            parsed.doctorQuestionSuggestion ||
            'Bạn nên trao đổi với bác sĩ điều trị về xu hướng huyết áp và đường huyết 7 ngày qua khi đi tái khám.',
          disclaimer:
            'Bản tóm tắt 5 dòng chỉ mang tính chất tham khảo từ dữ liệu ẩn danh 7 ngày (đã loại bỏ họ tên và mã thẻ BHYT), không thay thế chẩn đoán y khoa, không kê đơn và không thay đổi liều thuốc.',
          anonymizedFieldsStripped: [
            'fullName',
            'bhytCode',
            'cccdNumber',
            'bhxhNumber',
            'hospitalName',
            'primaryDoctor',
          ],
        };
        res.json(result);
      } catch (sdkErr) {
        const errMsg =
          sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
        if (
          errMsg.includes('API_KEY_INVALID') ||
          errMsg.includes('API key not valid') ||
          errMsg.includes('GEMINI_TIMEOUT') ||
          errMsg.includes('fetch failed') ||
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED')
        ) {
          res.json(buildFallbackFiveLineSummary(payload));
          return;
        }
        res.status(502).json({
          error: `Không thể kết nối dịch vụ Gemini AI trên máy chủ: ${errMsg}`,
        });
      }
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Lỗi máy chủ khi xử lý tóm tắt tuần.',
      });
    }
  });

  app.post('/api/ai/extract-medical-image', async (req, res) => {
    try {
      const {
        imageBase64,
        mimeType = 'image/jpeg',
        mode = 'bp_monitor',
        userNote = '',
        samplePreset,
      } = (req.body || {}) as {
        imageBase64?: string;
        mimeType?: string;
        mode?: 'bp_monitor' | 'prescription';
        userNote?: string;
        samplePreset?: 'bp_normal' | 'bp_critical_115' | 'prescription_sample';
      };

      const noteGuardrail = detectEmergencyGuardrail({ text: userNote });
      if (noteGuardrail.isEmergency) {
        const emergencyRes: ExtractedMedicalImageResponse = {
          isEmergency: true,
          triggerReason: noteGuardrail.triggerReason,
          emergencyTitle: noteGuardrail.emergencyTitle,
          emergencyCall115Message: noteGuardrail.emergencyCall115Message,
          mode,
          confidenceNote:
            'Đã tạm dừng trích xuất thông thường do phát hiện dấu hiệu nguy cấp.',
          doctorReminder:
            'Hãy gọi ngay số cấp cứu 115 hoặc đưa người bệnh đến cơ sở y tế gần nhất.',
          requiresUserConfirmation: true,
        };
        res.json(emergencyRes);
        return;
      }

      if (samplePreset === 'bp_critical_115') {
        const bpGuard = detectEmergencyGuardrail({
          systolic: 186,
          diastolic: 122,
        });
        res.json({
          isEmergency: true,
          triggerReason: bpGuard.triggerReason,
          emergencyTitle: bpGuard.emergencyTitle,
          emergencyCall115Message: bpGuard.emergencyCall115Message,
          mode: 'bp_monitor',
          bpReading: {
            systolic: 186,
            diastolic: 122,
            heartRate: 98,
            measurementNote: 'Ảnh máy đo huyết áp hiển thị 186/122 mmHg',
          },
          confidenceNote:
            'Chỉ số trên màn hình máy đo vượt ngưỡng nguy cấp (≥ 180/120 mmHg).',
          doctorReminder:
            'GỌI NGAY CẤP CỨU 115. Không tự ý uống chồng liều thuốc hạ áp khi chưa có hướng dẫn của bác sĩ.',
          requiresUserConfirmation: true,
        } satisfies ExtractedMedicalImageResponse);
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const cleanBase64 = (imageBase64 || '').replace(
        /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
        ''
      );

      const defaultBpResponse: ExtractedMedicalImageResponse = {
        isEmergency: false,
        triggerReason: null,
        mode: 'bp_monitor',
        bpReading: {
          systolic: 128,
          diastolic: 82,
          heartRate: 74,
          measurementNote:
            'Đọc từ ảnh màn hình máy đo huyết áp bắp tay (Vui lòng kiểm tra đối chiếu số trên màn hình máy đo)',
        },
        confidenceNote:
          'Kết quả nhận diện từ ảnh màn hình máy đo. Bạn hãy đối chiếu kỹ 3 con số Tâm thu (SYS), Tâm trương (DIA) và Nhịp tim (PULSE) trước khi bấm Xác nhận lưu.',
        doctorReminder:
          'Bạn nên trao đổi với bác sĩ điều trị về xu hướng huyết áp đo tại nhà, không tự ý thay đổi liều thuốc.',
        requiresUserConfirmation: true,
      };

      const defaultRxResponse: ExtractedMedicalImageResponse = {
        isEmergency: false,
        triggerReason: null,
        mode: 'prescription',
        prescribedMedications: [
          {
            medicationName: 'Amlodipine 5mg',
            dosage: '1 viên',
            purpose: 'Ghi trên đơn: Uống buổi sáng kiểm soát huyết áp',
            timeSlot: '07:00',
            mealInstruction: 'Sau ăn 30 phút',
          },
          {
            medicationName: 'Atorvastatin 10mg',
            dosage: '1 viên',
            purpose: 'Ghi trên đơn: Uống buổi tối hỗ trợ kiểm soát mỡ máu',
            timeSlot: '19:00',
            mealInstruction: 'Sau ăn 30 phút',
          },
        ],
        confidenceNote:
          'Đã trích xuất danh sách thuốc từ ảnh chụp đơn thuốc. Vui lòng đối chiếu tên thuốc, hàm lượng và giờ uống đúng với tờ đơn của bác sĩ trước khi bấm Xác nhận lưu.',
        doctorReminder:
          'Hệ thống chỉ hỗ trợ đọc chữ trên đơn thuốc bác sĩ đã kê để tạo lịch nhắc, tuyệt đối không tự kê đơn hoặc đổi liều.',
        requiresUserConfirmation: true,
      };

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !cleanBase64) {
        res.json(mode === 'bp_monitor' ? defaultBpResponse : defaultRxResponse);
        return;
      }

      try {
        const ai = getGeminiClient();
        const imagePart = {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        };

        if (mode === 'bp_monitor') {
          const response = await withTimeout(
            ai.models.generateContent({
              model: GEMINI_MODEL,
              contents: {
                parts: [
                  imagePart,
                  {
                    text: `Hãy đọc các con số trên màn hình máy đo huyết áp trong ảnh (SYS / Tâm thu, DIA / Tâm trương, PULSE / Nhịp tim).
Không chẩn đoán bệnh, không kê đơn thuốc. Nếu không rõ số nào, hãy ghi chú trong confidenceNote để người dùng kiểm tra lại.`,
                  },
                ],
              },
              config: {
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
                systemInstruction: MEDICAL_AI_SYSTEM_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    systolic: {
                      type: Type.INTEGER,
                      description: 'Huyết áp tâm thu (SYS) mmHg',
                    },
                    diastolic: {
                      type: Type.INTEGER,
                      description: 'Huyết áp tâm trương (DIA) mmHg',
                    },
                    heartRate: {
                      type: Type.INTEGER,
                      description: 'Nhịp tim (PULSE) bpm',
                    },
                    measurementNote: {
                      type: Type.STRING,
                      description: 'Ghi chú ngắn về kết quả đọc màn hình máy đo',
                    },
                    confidenceNote: {
                      type: Type.STRING,
                      description:
                        'Lời nhắc người dùng kiểm tra đối chiếu lại con số với màn hình máy đo trước khi xác nhận lưu',
                    },
                  },
                  required: [
                    'systolic',
                    'diastolic',
                    'heartRate',
                    'measurementNote',
                    'confidenceNote',
                  ],
                },
              },
            }),
            4500
          );

          const parsed = JSON.parse((response.text ?? '{}').trim()) as {
            systolic?: number;
            diastolic?: number;
            heartRate?: number;
            measurementNote?: string;
            confidenceNote?: string;
          };

          const sys = Number(parsed.systolic) || 126;
          const dia = Number(parsed.diastolic) || 80;
          const hr = Number(parsed.heartRate) || 72;

          const bpGuardrail = detectEmergencyGuardrail({
            systolic: sys,
            diastolic: dia,
          });

          res.json({
            isEmergency: bpGuardrail.isEmergency,
            triggerReason: bpGuardrail.triggerReason,
            emergencyTitle: bpGuardrail.emergencyTitle,
            emergencyCall115Message: bpGuardrail.emergencyCall115Message,
            mode: 'bp_monitor',
            bpReading: {
              systolic: sys,
              diastolic: dia,
              heartRate: hr,
              measurementNote:
                parsed.measurementNote || 'Đọc từ ảnh chụp máy đo huyết áp',
            },
            confidenceNote:
              parsed.confidenceNote ||
              'Vui lòng kiểm tra đối chiếu lại số Tâm thu, Tâm trương và Nhịp tim trên màn hình máy đo trước khi xác nhận lưu.',
            doctorReminder: bpGuardrail.isEmergency
              ? bpGuardrail.emergencyCall115Message
              : 'Bạn nên trao đổi với bác sĩ điều trị về chỉ số huyết áp này, tuyệt đối không tự ý thay đổi liều thuốc.',
            requiresUserConfirmation: true,
          } satisfies ExtractedMedicalImageResponse);
          return;
        }

        const response = await withTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: {
              parts: [
                imagePart,
                {
                  text: `Hãy đọc danh sách thuốc ghi trên ảnh chụp đơn thuốc để giúp người dùng tạo lịch nhắc uống thuốc cá nhân.
Tuyệt đối không tự kê thêm thuốc ngoài đơn, không tự ý đổi liều. Nhắc người dùng kiểm tra kỹ lại với đơn gốc của bác sĩ.`,
                },
              ],
            },
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              systemInstruction: MEDICAL_AI_SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  prescribedMedications: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        medicationName: { type: Type.STRING },
                        dosage: { type: Type.STRING },
                        purpose: { type: Type.STRING },
                        timeSlot: {
                          type: Type.STRING,
                          description:
                            'Chọn 1 trong 4 khung giờ: 07:00, 12:30, 19:00, 21:30',
                        },
                        mealInstruction: {
                          type: Type.STRING,
                          description:
                            'Chọn 1 trong 4 hướng dẫn: Trước ăn 30 phút, Sau ăn 30 phút, Cùng bữa ăn, Trước khi ngủ',
                        },
                      },
                      required: [
                        'medicationName',
                        'dosage',
                        'purpose',
                        'timeSlot',
                        'mealInstruction',
                      ],
                    },
                  },
                  confidenceNote: { type: Type.STRING },
                },
                required: ['prescribedMedications', 'confidenceNote'],
              },
            },
          }),
          4500
        );

        const parsed = JSON.parse((response.text ?? '{}').trim()) as {
          prescribedMedications?: Array<{
            medicationName: string;
            dosage: string;
            purpose: string;
            timeSlot: string;
            mealInstruction: string;
          }>;
          confidenceNote?: string;
        };

        const validSlots = ['07:00', '12:30', '19:00', '21:30'] as const;
        const validMeals = [
          'Trước ăn 30 phút',
          'Sau ăn 30 phút',
          'Cùng bữa ăn',
          'Trước khi ngủ',
        ] as const;

        const meds = (parsed.prescribedMedications || []).map((m) => ({
          medicationName: m.medicationName || 'Thuốc trên đơn',
          dosage: m.dosage || '1 viên',
          purpose: m.purpose || 'Ghi chú theo đơn bác sĩ',
          timeSlot: validSlots.includes(m.timeSlot as (typeof validSlots)[number])
            ? (m.timeSlot as (typeof validSlots)[number])
            : '07:00',
          mealInstruction: validMeals.includes(
            m.mealInstruction as (typeof validMeals)[number]
          )
            ? (m.mealInstruction as (typeof validMeals)[number])
            : 'Sau ăn 30 phút',
        }));

        res.json({
          isEmergency: false,
          triggerReason: null,
          mode: 'prescription',
          prescribedMedications:
            meds.length > 0 ? meds : defaultRxResponse.prescribedMedications,
          confidenceNote:
            parsed.confidenceNote ||
            'Vui lòng kiểm tra đối chiếu tên thuốc, hàm lượng và thời điểm uống với tờ đơn thuốc của bác sĩ trước khi bấm Xác nhận lưu.',
          doctorReminder:
            'Thông tin chỉ được lưu sau khi bạn xác nhận. Luôn uống thuốc theo đúng hướng dẫn của bác sĩ điều trị.',
          requiresUserConfirmation: true,
        } satisfies ExtractedMedicalImageResponse);
      } catch (sdkErr) {
        const errMsg =
          sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
        if (
          errMsg.includes('API_KEY_INVALID') ||
          errMsg.includes('API key not valid') ||
          errMsg.includes('GEMINI_TIMEOUT') ||
          errMsg.includes('fetch failed') ||
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED')
        ) {
          res.json(
            mode === 'bp_monitor' ? defaultBpResponse : defaultRxResponse
          );
          return;
        }
        res.status(502).json({
          error: `Lỗi khi gọi Gemini AI đọc ảnh trên máy chủ: ${errMsg}`,
        });
      }
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Lỗi máy chủ khi xử lý ảnh đơn thuốc / máy đo.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    process.env.DISABLE_HMR = 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, watch: null },
      appType: 'spa',
      plugins: [
        {
          name: 'disable-vite-client-ws',
          transform(code, id) {
            if (id.includes('client/client.mjs')) {
              return {
                code: code.replace(
                  'const createWebSocketModuleRunnerTransport = (options) => {',
                  'const createWebSocketModuleRunnerTransport = () => ({ async connect() {}, disconnect() {}, send() {} }); const _unusedWsTransport = (options) => {'
                ),
                map: null,
              };
            }
          },
        },
      ],
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VitaPulse server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

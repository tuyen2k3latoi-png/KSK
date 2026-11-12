import React, { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Eye,
  FileText,
  HeartPulse,
  PhoneCall,
  Pill,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  MedicationSchedule,
  UserMedicalProfile,
  VitalRecord,
} from '../types/health';
import {
  anonymizeWeeklyHealthData,
  ExtractedMedicalImageResponse,
  ExtractedMedicationDraft,
  WeeklyAiSummaryResponse,
} from '../utils/aiHealthGuardrails';

interface AiHealthAssistantPanelProps {
  profile: UserMedicalProfile;
  vitals: VitalRecord[];
  medications: MedicationSchedule[];
  onConfirmSaveVital: (newVital: Omit<VitalRecord, 'id'>) => void;
  onConfirmSaveMedications: (
    newMeds: Array<Omit<MedicationSchedule, 'id'>>
  ) => void;
}

export const AiHealthAssistantPanel: React.FC<AiHealthAssistantPanelProps> = ({
  profile,
  vitals,
  medications,
  onConfirmSaveVital,
  onConfirmSaveMedications,
}) => {
  const [activeTab, setActiveTab] = useState<'weekly_summary' | 'image_ocr'>(
    'weekly_summary'
  );

  // Weekly Summary state
  const [symptomNote, setSymptomNote] = useState('');
  const [showAnonymizedJson, setShowAnonymizedJson] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryResult, setSummaryResult] =
    useState<WeeklyAiSummaryResponse | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Image OCR Extraction & Confirmation state
  const [ocrMode, setOcrMode] = useState<'bp_monitor' | 'prescription'>(
    'bp_monitor'
  );
  const [selectedImageName, setSelectedImageName] = useState<string | null>(
    null
  );
  const [isLoadingOcr, setIsLoadingOcr] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] =
    useState<ExtractedMedicalImageResponse | null>(null);

  // Editable draft fields before user confirms saving
  const [draftSys, setDraftSys] = useState<number>(128);
  const [draftDia, setDraftDia] = useState<number>(82);
  const [draftHr, setDraftHr] = useState<number>(74);
  const [draftBpNote, setDraftBpNote] = useState<string>(
    'Đọc từ ảnh màn hình máy đo huyết áp (Đã xác nhận)'
  );
  const [draftMeds, setDraftMeds] = useState<ExtractedMedicationDraft[]>([]);
  const [confirmedBanner, setConfirmedBanner] = useState<string | null>(null);

  const anonymizedPreview = anonymizeWeeklyHealthData({
    vitals,
    medications,
    profile,
    userSymptomNote: symptomNote,
  });

  const handleGenerateWeeklySummary = async (overrideSymptomNote?: string) => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    setConfirmedBanner(null);

    try {
      const noteToUse =
        overrideSymptomNote !== undefined ? overrideSymptomNote : symptomNote;
      const payload = anonymizeWeeklyHealthData({
        vitals,
        medications,
        profile,
        userSymptomNote: noteToUse,
      });

      const response = await fetch('/api/ai/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || 'Không thể tạo bản tóm tắt tuần từ máy chủ.'
        );
      }

      setSummaryResult(data as WeeklyAiSummaryResponse);
    } catch (err) {
      setSummaryError(
        err instanceof Error
          ? err.message
          : 'Đã xảy ra lỗi khi kết nối máy chủ AI.'
      );
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const applyOcrResponseToDraft = (data: ExtractedMedicalImageResponse) => {
    setOcrResult(data);
    if (data.bpReading) {
      setDraftSys(data.bpReading.systolic);
      setDraftDia(data.bpReading.diastolic);
      setDraftHr(data.bpReading.heartRate);
      setDraftBpNote(data.bpReading.measurementNote);
    }
    if (data.prescribedMedications) {
      setDraftMeds(data.prescribedMedications);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageName(file.name);
    setIsLoadingOcr(true);
    setOcrError(null);
    setConfirmedBanner(null);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/ai/extract-medical-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: file.type || 'image/jpeg',
          mode: ocrMode,
          userNote: symptomNote,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || 'Không thể trích xuất thông tin từ ảnh.'
        );
      }

      applyOcrResponseToDraft(data as ExtractedMedicalImageResponse);
    } catch (err) {
      setOcrError(
        err instanceof Error ? err.message : 'Lỗi khi gửi ảnh lên máy chủ.'
      );
    } finally {
      setIsLoadingOcr(false);
    }
  };

  const handleTriggerSampleScan = async (
    sampleMode: 'bp_monitor' | 'prescription',
    samplePreset?: 'bp_normal' | 'bp_critical_115' | 'prescription_sample'
  ) => {
    setOcrMode(sampleMode);
    setSelectedImageName(
      sampleMode === 'bp_monitor'
        ? 'anh-may-do-huyet-ap-omron.jpg'
        : 'anh-don-thuoc-ngoai-tru.jpg'
    );
    setIsLoadingOcr(true);
    setOcrError(null);
    setConfirmedBanner(null);

    try {
      const response = await fetch('/api/ai/extract-medical-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: '',
          mimeType: 'image/jpeg',
          mode: sampleMode,
          samplePreset,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Không thể xử lý ảnh mẫu.');
      }

      applyOcrResponseToDraft(data as ExtractedMedicalImageResponse);
    } catch (err) {
      setOcrError(
        err instanceof Error ? err.message : 'Lỗi khi xử lý ảnh mẫu.'
      );
    } finally {
      setIsLoadingOcr(false);
    }
  };

  const handleConfirmSaveBpToTracker = () => {
    const latest = vitals[0];
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    onConfirmSaveVital({
      date: dateStr,
      time: timeStr,
      systolic: Number(draftSys) || 126,
      diastolic: Number(draftDia) || 80,
      heartRate: Number(draftHr) || 72,
      spo2: latest?.spo2 ?? 98,
      bloodGlucose: latest?.bloodGlucose ?? 95,
      glucoseContext: latest?.glucoseContext ?? 'fasting',
      temperatureC: latest?.temperatureC ?? 36.6,
      weightKg: latest?.weightKg ?? profile.weightKg,
      sleepHours: latest?.sleepHours ?? 7.2,
      steps: latest?.steps ?? 6000,
      deviceSource: 'Máy đo Omron',
      notes: draftBpNote.trim() || 'Đã xác nhận từ ảnh chụp máy đo huyết áp',
    });

    setConfirmedBanner(
      `Đã lưu chỉ số huyết áp ${draftSys}/${draftDia} mmHg (Nhịp tim ${draftHr} bpm) vào Sổ sau khi bạn xác nhận.`
    );
    setOcrResult(null);
  };

  const handleConfirmSavePrescriptionToMedications = () => {
    if (draftMeds.length === 0) return;

    onConfirmSaveMedications(
      draftMeds.map((m) => ({
        medicationName: m.medicationName.trim() || 'Thuốc theo đơn bác sĩ',
        dosage: m.dosage.trim() || '1 viên',
        purpose: m.purpose.trim() || 'Ghi chú từ ảnh đơn thuốc',
        frequency: 'Hàng ngày',
        timeSlot: m.timeSlot,
        mealInstruction: m.mealInstruction,
        takenToday: false,
        remainingPills: 30,
        totalPills: 30,
        reminderEnabled: true,
      }))
    );

    setConfirmedBanner(
      `Đã lưu ${draftMeds.length} thuốc từ ảnh đơn thuốc vào Tủ thuốc cá nhân sau khi bạn xác nhận.`
    );
    setOcrResult(null);
  };

  const handleUpdateDraftMed = (
    idx: number,
    field: keyof ExtractedMedicationDraft,
    value: string
  ) => {
    setDraftMeds((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  return (
    <section
      aria-label="Trợ lý AI Tóm tắt Sức khỏe 7 ngày & Đọc ảnh Đơn thuốc / Máy đo Huyết áp"
      data-testid="ai-health-assistant-panel"
      className="bg-white border border-teal-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs"
    >
      {/* Top Header & Guardrail Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-700 text-white text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Trợ lý AI (Chạy trên Máy chủ Bảo mật)</span>
            </span>
            <span
              data-testid="ai-anonymized-badge"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold break-words"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Đã ẩn danh: Tự động bỏ Họ tên &amp; Mã BHYT trước khi gửi</span>
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 break-words pt-0.5">
            Tóm tắt Sức khỏe 7 Ngày (5 dòng) &amp; Đọc Ảnh Đơn thuốc / Máy đo Huyết áp
          </h2>
          <p className="text-sm text-slate-700 break-words">
            Không chẩn đoán bệnh, không kê đơn, không tự ý đổi liều thuốc. Mọi thông tin trích xuất từ ảnh đều cần bạn <strong>XÁC NHẬN</strong> trước khi lưu.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('weekly_summary')}
            data-testid="ai-tab-weekly-summary-btn"
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'weekly_summary'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-teal-700 shrink-0" />
            <span>1. Tóm tắt Tuần (5 dòng)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image_ocr')}
            data-testid="ai-tab-image-ocr-btn"
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'image_ocr'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-indigo-700 shrink-0" />
            <span>2. Đọc Đơn thuốc / Ảnh Máy đo</span>
          </button>
        </div>
      </div>

      {confirmedBanner && (
        <div
          role="status"
          data-testid="ai-confirmed-save-banner"
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-sm font-semibold text-emerald-950 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="break-words">{confirmedBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setConfirmedBanner(null)}
            className="text-xs font-bold underline shrink-0 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* TAB 1: ANONYMIZED 7-DAY WEEKLY SUMMARY (5 LINES) */}
      {activeTab === 'weekly_summary' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-7 space-y-3">
              <div>
                <label
                  htmlFor="ai-symptom-note"
                  className="block text-sm font-semibold text-slate-800 mb-1"
                >
                  Ghi chú triệu chứng tuần này (không bắt buộc):
                </label>
                <input
                  id="ai-symptom-note"
                  type="text"
                  value={symptomNote}
                  onChange={(e) => setSymptomNote(e.target.value)}
                  placeholder="VD: Ngủ ngon, đi bộ đều 30 phút mỗi sáng (Nếu nhập 'đau ngực' hoặc 'khó thở' sẽ kích hoạt cảnh báo 115)"
                  data-testid="ai-weekly-symptom-input"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-teal-600 rounded-xl text-slate-900 outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateWeeklySummary()}
                  disabled={isLoadingSummary}
                  data-testid="ai-generate-weekly-summary-btn"
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    {isLoadingSummary
                      ? 'Đang tổng hợp 5 dòng...'
                      : 'Tạo Bản Tóm tắt Tuần (5 dòng dễ hiểu)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSymptomNote('Sáng nay tôi bị đau ngực và khó thở');
                    handleGenerateWeeklySummary(
                      'Sáng nay tôi bị đau ngực và khó thở'
                    );
                  }}
                  data-testid="ai-test-emergency-guardrail-btn"
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>Thử Guardrail Nguy cấp (Cảnh báo 115)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAnonymizedJson((prev) => !prev)}
                  data-testid="toggle-view-anonymized-payload-btn"
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>
                    {showAnonymizedJson
                      ? 'Ẩn dữ liệu ẩn danh'
                      : 'Xem dữ liệu ẩn danh gửi đi'}
                  </span>
                </button>
              </div>
            </div>

            {/* Privacy & Guardrail Info Card */}
            <div className="lg:col-span-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs sm:text-sm text-slate-700">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Cam kết Quyền riêng tư &amp; An toàn Y khoa:</span>
              </div>
              <p className="break-words">
                • <strong>Ẩn danh tuyệt đối:</strong> Họ tên (<em>{profile.fullName}</em>) và mã thẻ BHYT được cắt bỏ hoàn toàn trước khi gửi lên máy chủ.
              </p>
              <p className="break-words">
                • <strong>Guardrail Cấp cứu 115:</strong> Nếu có từ khóa nguy cấp (<em>đau ngực, khó thở</em>) hoặc huyết áp &ge; 180/120 mmHg, hệ thống dừng tóm tắt và chỉ hiển thị hướng dẫn gọi <strong>115</strong>.
              </p>
            </div>
          </div>

          {showAnonymizedJson && (
            <div
              data-testid="ai-anonymized-json-preview"
              className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono-tabular overflow-x-auto space-y-1.5"
            >
              <p className="text-teal-300 font-sans font-bold">
                Dữ liệu 7 ngày đã ẩn danh (Không có tên &ldquo;{profile.fullName}&rdquo;, không có mã BHYT):
              </p>
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(anonymizedPreview, null, 2)}
              </pre>
            </div>
          )}

          {summaryError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-800 break-words"
            >
              {summaryError}
            </div>
          )}

          {/* Weekly Summary Output OR Mandatory 115 Emergency Alert */}
          {summaryResult && (
            <div className="pt-1">
              {summaryResult.isEmergency ? (
                <div
                  role="alert"
                  data-testid="ai-emergency-115-banner"
                  className="p-4 sm:p-5 rounded-xl bg-rose-600 text-white space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold">
                    <PhoneCall className="w-5 h-5 shrink-0" />
                    <span className="break-words">
                      {summaryResult.emergencyTitle ||
                        'CẢNH BÁO KHẨN CẤP — GỌI CẤP CỨU 115 NGAY'}
                    </span>
                  </div>
                  {summaryResult.triggerReason && (
                    <p className="text-sm font-semibold text-rose-100 break-words">
                      Lý do kích hoạt Guardrail: {summaryResult.triggerReason}
                    </p>
                  )}
                  <p className="text-sm sm:text-base leading-relaxed font-medium break-words">
                    {summaryResult.emergencyCall115Message}
                  </p>
                </div>
              ) : (
                <div
                  data-testid="ai-weekly-summary-card"
                  className="p-4 sm:p-5 rounded-xl bg-teal-50/70 border border-teal-200 space-y-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-teal-200/80">
                    <h3 className="text-base font-bold text-teal-950">
                      Bản Tóm tắt Sức khỏe 7 Ngày (5 Dòng Dễ Hiểu)
                    </h3>
                    <span className="text-xs font-bold text-teal-900 bg-white border border-teal-200 px-2.5 py-0.5 rounded">
                      5 dòng · Không phải chẩn đoán y khoa
                    </span>
                  </div>

                  <ol
                    data-testid="ai-weekly-summary-lines"
                    className="space-y-2 text-sm text-slate-900"
                  >
                    {summaryResult.lines.map((line, idx) => (
                      <li
                        key={idx}
                        data-testid={`ai-summary-line-${idx}`}
                        className="p-2.5 rounded-lg bg-white border border-teal-200/80 flex items-start gap-2.5 leading-relaxed"
                      >
                        <span className="w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="break-words font-medium">{line}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-950 space-y-1">
                    <p className="font-bold">
                      Gợi ý câu hỏi để bạn trao đổi với bác sĩ khi tái khám:
                    </p>
                    <p
                      data-testid="ai-doctor-question-suggestion"
                      className="italic break-words"
                    >
                      &ldquo;{summaryResult.doctorQuestionSuggestion}&rdquo;
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 break-words">
                    {summaryResult.disclaimer}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: READ PRESCRIPTION / BP MONITOR PHOTO WITH MANDATORY CONFIRMATION BEFORE SAVING */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOcrMode('bp_monitor');
                  setOcrResult(null);
                }}
                data-testid="ai-mode-bp-monitor-btn"
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer border ${
                  ocrMode === 'bp_monitor'
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <HeartPulse className="w-4 h-4 shrink-0" />
                <span>Chế độ 1: Ảnh Máy đo Huyết áp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOcrMode('prescription');
                  setOcrResult(null);
                }}
                data-testid="ai-mode-prescription-btn"
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer border ${
                  ocrMode === 'prescription'
                    ? 'bg-indigo-700 text-white border-indigo-700'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Pill className="w-4 h-4 shrink-0" />
                <span>Chế độ 2: Ảnh Đơn thuốc Bác sĩ</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-2xs">
                <Upload className="w-4 h-4 shrink-0" />
                <span>Chụp / Chọn Ảnh từ Điện thoại</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  data-testid="ai-image-file-input"
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  handleTriggerSampleScan('bp_monitor', 'bp_normal')
                }
                data-testid="ai-scan-sample-bp-btn"
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Thử Ảnh Máy đo Mẫu
              </button>

              <button
                type="button"
                onClick={() =>
                  handleTriggerSampleScan('prescription', 'prescription_sample')
                }
                data-testid="ai-scan-sample-rx-btn"
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Thử Ảnh Đơn thuốc Mẫu
              </button>
            </div>
          </div>

          {selectedImageName && (
            <p className="text-xs text-slate-600 break-words">
              Ảnh đang xử lý: <strong>{selectedImageName}</strong>{' '}
              {isLoadingOcr ? '— Đang trích xuất thông tin trên máy chủ...' : ''}
            </p>
          )}

          {ocrError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-800 break-words"
            >
              {ocrError}
            </div>
          )}

          {/* Mandatory User Confirmation Panel Before Saving */}
          {ocrResult && (
            <div
              data-testid="ai-extraction-confirm-panel"
              className="p-4 sm:p-5 rounded-xl bg-amber-50/90 border-2 border-amber-400 space-y-4"
            >
              {ocrResult.isEmergency ? (
                <div
                  role="alert"
                  data-testid="ai-ocr-emergency-115-banner"
                  className="p-4 rounded-xl bg-rose-600 text-white space-y-2"
                >
                  <div className="flex items-center gap-2 text-base font-bold">
                    <PhoneCall className="w-5 h-5 shrink-0" />
                    <span>{ocrResult.emergencyTitle}</span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {ocrResult.emergencyCall115Message}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-amber-300">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-300 text-slate-950 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>CẦN BẠN KIỂM TRA &amp; XÁC NHẬN TRƯỚC KHI LƯU</span>
                  </span>
                  <h3 className="text-base font-bold text-slate-900 break-words">
                    {ocrResult.mode === 'bp_monitor'
                      ? 'Kết quả Đọc Ảnh Máy Đo Huyết Áp (Chưa lưu)'
                      : 'Kết quả Đọc Ảnh Đơn Thuốc (Chưa lưu)'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-800 break-words">
                    {ocrResult.confidenceNote}
                  </p>
                </div>
              </div>

              {ocrResult.mode === 'bp_monitor' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Huyết áp Tâm thu (SYS - mmHg)
                      </label>
                      <input
                        type="number"
                        value={draftSys}
                        onChange={(e) => setDraftSys(Number(e.target.value))}
                        data-testid="ai-confirm-sys-input"
                        className="w-full px-3.5 py-2 text-base font-bold font-mono-tabular bg-white border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Huyết áp Tâm trương (DIA - mmHg)
                      </label>
                      <input
                        type="number"
                        value={draftDia}
                        onChange={(e) => setDraftDia(Number(e.target.value))}
                        data-testid="ai-confirm-dia-input"
                        className="w-full px-3.5 py-2 text-base font-bold font-mono-tabular bg-white border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Nhịp tim (PULSE - bpm)
                      </label>
                      <input
                        type="number"
                        value={draftHr}
                        onChange={(e) => setDraftHr(Number(e.target.value))}
                        data-testid="ai-confirm-hr-input"
                        className="w-full px-3.5 py-2 text-base font-bold font-mono-tabular bg-white border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 break-words">
                    {ocrResult.doctorReminder}
                  </p>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOcrResult(null)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      Hủy bỏ (Không lưu)
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSaveBpToTracker}
                      data-testid="confirm-save-extracted-bp-btn"
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Tôi Đã Kiểm Tra — Xác Nhận Lưu Chỉ Số</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2.5">
                    {draftMeds.map((med, idx) => (
                      <div
                        key={idx}
                        data-testid={`ai-extracted-med-row-${idx}`}
                        className="p-3 rounded-xl bg-white border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2.5"
                      >
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Tên thuốc &amp; Hàm lượng
                          </label>
                          <input
                            type="text"
                            value={med.medicationName}
                            onChange={(e) =>
                              handleUpdateDraftMed(
                                idx,
                                'medicationName',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-1.5 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Liều dùng mỗi lần
                          </label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) =>
                              handleUpdateDraftMed(idx, 'dosage', e.target.value)
                            }
                            className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Giờ nhắc uống
                          </label>
                          <select
                            value={med.timeSlot}
                            onChange={(e) =>
                              handleUpdateDraftMed(
                                idx,
                                'timeSlot',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                          >
                            <option value="07:00">07:00 (Sáng)</option>
                            <option value="12:30">12:30 (Trưa)</option>
                            <option value="19:00">19:00 (Tối)</option>
                            <option value="21:30">21:30 (Trước ngủ)</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-700 break-words">
                    {ocrResult.doctorReminder}
                  </p>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOcrResult(null)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      Hủy bỏ (Không lưu)
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSavePrescriptionToMedications}
                      data-testid="confirm-save-extracted-rx-btn"
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Tôi Đã Đối Chiếu Đơn — Xác Nhận Lưu Thuốc</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

import React, { useState } from 'react';
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  HeartPulse,
  Pill,
  Plus,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import {
  BhytCardInfo,
  BhytVisitRecord,
  UserMedicalProfile,
} from '../types/health';
import {
  maskSensitiveIdentifier,
  summarizeBhytVisitHistory,
} from '../utils/healthCalculations';
import { INITIAL_BHYT_CARD } from '../data/seedHealthData';

interface VneidBhytPanelProps {
  profile: UserMedicalProfile;
  bhytVisits: BhytVisitRecord[];
  onOpenVneidLogin: () => void;
  onApplyVisitToTracker: (visit: BhytVisitRecord) => void;
  onAddBhytVisit: (visit: Omit<BhytVisitRecord, 'id'>) => void;
}

export const VneidBhytPanel: React.FC<VneidBhytPanelProps> = ({
  profile,
  bhytVisits,
  onApplyVisitToTracker,
  onAddBhytVisit,
}) => {
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);
  const [isAddingVisit, setIsAddingVisit] = useState(false);
  const [showFullCodes, setShowFullCodes] = useState(false);

  // New visit form state
  const [visitDate, setVisitDate] = useState('2026-11-11');
  const [hospitalName, setHospitalName] = useState(profile.hospitalName);
  const [department, setDepartment] = useState('Khoa Khám bệnh Đa khoa BHYT');
  const [doctorName, setDoctorName] = useState(profile.primaryDoctor);
  const [icdCode, setIcdCode] = useState('I10');
  const [diagnosisSummary, setDiagnosisSummary] = useState(
    'Tái khám Tăng huyết áp & Kiểm tra mỡ máu định kỳ'
  );
  const [doctorAdvice, setDoctorAdvice] = useState(
    'Duy trì uống thuốc đúng giờ buổi sáng, giảm ăn mặn và tập đi bộ 30 phút/ngày.'
  );
  const [sysInput, setSysInput] = useState('124');
  const [diaInput, setDiaInput] = useState('78');
  const [gluInput, setGluInput] = useState('95');
  const [medNameInput, setMedNameInput] = useState('Amlodipine 5mg (Thuốc BHYT)');

  const card: BhytCardInfo = profile.bhytCard || INITIAL_BHYT_CARD;
  const isDemoProfile = Boolean(profile.isDemo ?? card.isDemo);
  const summary = summarizeBhytVisitHistory(bhytVisits);

  const displayedBhytCode = showFullCodes
    ? card.bhytCode
    : maskSensitiveIdentifier(card.bhytCode, 'bhyt');
  const displayedCccdNumber = showFullCodes
    ? card.cccdNumber
    : maskSensitiveIdentifier(card.cccdNumber, 'cccd');

  const handleApplyVisit = (visit: BhytVisitRecord) => {
    onApplyVisitToTracker(visit);
    setAppliedBanner(
      `Đã chép chỉ số khám ngày ${visit.visitDate} (${visit.recordedVitals.systolic}/${visit.recordedVitals.diastolic} mmHg) và ${visit.prescribedMedications.length} thuốc từ "${visit.hospitalName}" vào Sổ theo dõi hàng ngày.`
    );
  };

  const handleAddVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisSummary.trim()) return;

    onAddBhytVisit({
      visitDate,
      hospitalName: hospitalName.trim() || profile.hospitalName,
      department: department.trim() || 'Khoa Nội Tổng hợp',
      doctorName: doctorName.trim() || profile.primaryDoctor,
      icdCode: icdCode.trim() || 'I10',
      diagnosisSummary: diagnosisSummary.trim(),
      plainExplanation:
        'Kết quả khám mới được bạn tự lưu vào Sổ Sức khỏe Cá nhân. Bạn nên trao đổi với bác sĩ nếu có bất kỳ thắc mắc nào về hướng dẫn dùng thuốc.',
      doctorAdvice:
        doctorAdvice.trim() || 'Uống thuốc đúng giờ và theo dõi huyết áp tại nhà.',
      followUpDate: '2026-12-11',
      totalCostVnd: 750000,
      bhytPaidVnd: 600000,
      patientCoPayVnd: 150000,
      recordedVitals: {
        systolic: Number(sysInput) || 124,
        diastolic: Number(diaInput) || 78,
        heartRate: 72,
        bloodGlucose: Number(gluInput) || 95,
        weightKg: profile.weightKg,
      },
      prescribedMedications: medNameInput.trim()
        ? [
            {
              medicationName: medNameInput.trim(),
              dosage: '1 viên',
              purpose: `Ghi chú đơn khám (${icdCode})`,
              timeSlot: '07:00',
              mealInstruction: 'Sau ăn 30 phút',
              daysSupply: 30,
            },
          ]
        : [],
    });

    setIsAddingVisit(false);
    setAppliedBanner(
      `Đã lưu đợt khám ngày ${visitDate} tại ${hospitalName} vào Sổ Sức khỏe Cá nhân của bạn.`
    );
  };

  return (
    <section
      aria-label="Sổ tự lưu trữ thẻ BHYT & Lịch sử khám cá nhân"
      data-testid="vneid-bhyt-panel"
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-5"
    >
      {/* Top Header Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {isDemoProfile ? (
              <span
                data-testid="bhyt-panel-demo-badge"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-md"
              >
                HỒ SƠ DEMO (SỐ GIẢ MINH HỌA)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                HỒ SƠ CỦA TÔI
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-md font-mono-tabular">
              <CreditCard className="w-3.5 h-3.5 text-sky-600" />
              Mã thẻ BHYT: {displayedBhytCode}
            </span>
            <button
              type="button"
              onClick={() => setShowFullCodes((prev) => !prev)}
              data-testid="toggle-bhyt-card-mask-btn"
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              {showFullCodes ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ẩn</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Hiện</span>
                </>
              )}
            </button>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 pt-0.5">
            Sổ Tự Quản lý Thẻ Bảo hiểm Y tế (BHYT) &amp; Tình trạng Bệnh Đã Đi Khám
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Tự nhập mã thẻ BHYT để lưu trữ cá nhân – không kết nối cơ quan BHXH/VNeID.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddingVisit(!isAddingVisit)}
            data-testid="toggle-add-bhyt-visit-btn"
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingVisit ? 'Đóng mẫu ghi khám' : 'Ghi thêm lần đi khám BHYT'}</span>
          </button>
        </div>
      </div>

      {appliedBanner && (
        <div
          role="status"
          data-testid="bhyt-sync-banner"
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-medium text-emerald-900 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{appliedBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setAppliedBanner(null)}
            className="text-xs font-bold text-emerald-800 underline shrink-0"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* Optional Form to Record a New Hospital BHYT Visit */}
      {isAddingVisit && (
        <form
          onSubmit={handleAddVisitSubmit}
          className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Tự Ghi nhận Đợt Đi Khám Bảo hiểm Y tế Mới vào Sổ Cá nhân
            </h3>
            <span className="text-xs text-slate-500">Thẻ BHYT: {displayedBhytCode}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày đi khám
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bệnh viện / Cơ sở KCB
              </label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bác sĩ khám &amp; Chuyên khoa
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã bệnh ICD
              </label>
              <input
                type="text"
                value={icdCode}
                onChange={(e) => setIcdCode(e.target.value)}
                placeholder="VD: I10, E11"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono-tabular"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chẩn đoán ghi trên phiếu khám
              </label>
              <input
                type="text"
                value={diagnosisSummary}
                onChange={(e) => setDiagnosisSummary(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Huyết áp Tâm thu (mmHg)
              </label>
              <input
                type="number"
                value={sysInput}
                onChange={(e) => setSysInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Huyết áp Tâm trương
              </label>
              <input
                type="number"
                value={diaInput}
                onChange={(e) => setDiaInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đường huyết (mg/dL)
              </label>
              <input
                type="number"
                value={gluInput}
                onChange={(e) => setGluInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thuốc ghi trên đơn
              </label>
              <input
                type="text"
                value={medNameInput}
                onChange={(e) => setMedNameInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingVisit(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
            >
              Lưu vào Sổ Khám Cá nhân
            </button>
          </div>
        </form>
      )}

      {/* Main 12-Col Layout: Left Digital BHYT Card (5 cols) | Right Medical History & Diagnosed Conditions (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT 5 COLS: Digital Health Insurance Card & Diagnosed Conditions Summary */}
        <div className="lg:col-span-5 space-y-4">
          {/* Self-Stored Personal BHYT Card UI */}
          <div className="rounded-2xl bg-gradient-to-br from-sky-900 via-sky-800 to-teal-900 text-white p-4 sm:p-5 shadow-md space-y-4 border border-sky-700">
            <div className="flex items-start justify-between gap-2 border-b border-white/15 pb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-sky-200 font-semibold">
                  Tự nhập mã thẻ BHYT để lưu trữ cá nhân
                </p>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
                  THÔNG TIN THẺ BHYT TỰ LƯU
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 text-[11px] font-bold shrink-0">
                {isDemoProfile ? 'HỒ SƠ DEMO' : 'Hồ sơ Cá nhân'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex flex-wrap justify-between items-baseline gap-x-2 gap-y-1">
                <span className="text-sky-200">Họ và tên chủ thẻ:</span>
                <strong
                  data-testid="bhyt-card-holder-name"
                  className="text-base font-bold text-white uppercase tracking-wide break-words"
                >
                  {profile.fullName}
                </strong>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-x-2 gap-y-1">
                <span className="text-sky-200">Mã số thẻ BHYT:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <strong
                    data-testid="bhyt-card-code"
                    className="font-mono-tabular text-amber-300 font-bold text-base break-all"
                  >
                    {displayedBhytCode}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setShowFullCodes((prev) => !prev)}
                    className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-xs font-semibold text-white cursor-pointer"
                  >
                    {showFullCodes ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap justify-between items-baseline gap-x-2 gap-y-1">
                <span className="text-sky-200">Số CCCD tự ghi chú:</span>
                <span
                  data-testid="bhyt-card-cccd"
                  className="font-mono-tabular text-white font-semibold break-all"
                >
                  {displayedCccdNumber}
                </span>
              </div>
              <div className="flex flex-wrap justify-between items-baseline gap-x-2 gap-y-1">
                <span className="text-sky-200">Năm sinh / Nhóm máu:</span>
                <span className="font-mono-tabular text-white">
                  {profile.birthYear} ({2026 - profile.birthYear} tuổi) · Nhóm máu{' '}
                  <strong>{profile.bloodType}</strong>
                </span>
              </div>
              <div className="pt-2 border-t border-white/15 space-y-1.5">
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5">
                  <span className="text-sky-200">Mức hưởng ghi chú:</span>
                  <strong className="text-emerald-300 font-semibold break-words">
                    {card.coverageRate}
                  </strong>
                </div>
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5">
                  <span className="text-sky-200">Nơi ĐK KCB ban đầu:</span>
                  <span className="text-white font-medium break-words">
                    {card.registeredHospital}
                  </span>
                </div>
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-xs text-sky-200 pt-1">
                  <span className="break-words">{card.fiveYearContinuousDate}</span>
                  <span>Không kết nối BHXH/VNeID</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosed Chronic Conditions Box */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="break-words">Tình trạng Bệnh Đang Theo Dõi</span>
              </h4>
              <span className="text-xs font-semibold text-amber-900">
                {profile.chronicConditions.length} bệnh lý
              </span>
            </div>

            <div className="space-y-2">
              {profile.chronicConditions.map((cond) => (
                <div
                  key={cond}
                  className="p-2.5 rounded-lg bg-white border border-amber-200/90 text-sm text-slate-900 font-semibold flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="break-words">{cond}</span>
                  <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                    Đang theo dõi
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-amber-200/70">
                <span className="text-slate-500 block text-[11px]">
                  Quỹ BHYT thanh toán (ghi chú)
                </span>
                <strong className="text-sm font-bold text-teal-800 font-mono-tabular">
                  {summary.totalBhytCoveredVnd.toLocaleString('vi-VN')} đ (
                  {summary.coverageSavedPercent}%)
                </strong>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-amber-200/70">
                <span className="text-slate-500 block text-[11px]">
                  Lịch hẹn tái khám tới
                </span>
                <strong className="text-sm font-bold text-slate-900 font-mono-tabular">
                  {summary.nextFollowUpDate || 'Chưa có lịch'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 7 COLS: Detailed Hospital Visit History & 1-Click Prescription Copy */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                Lịch sử Khám Chữa Bệnh Tự Lưu ({bhytVisits.length} đợt khám)
              </span>
            </h3>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Dữ liệu lưu cá nhân trên thiết bị
            </span>
          </div>

          {bhytVisits.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                Chưa có đợt khám BHYT nào được lưu trong Hồ sơ của tôi.
              </p>
              <p className="text-xs text-slate-600">
                Bấm nút &ldquo;Ghi thêm lần đi khám BHYT&rdquo; ở góc trên để tự lưu lại chẩn đoán và đơn thuốc sau mỗi lần đi khám.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {bhytVisits.map((visit) => (
                <div
                  key={visit.id}
                  data-testid={`bhyt-visit-card-${visit.id}`}
                  className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold font-mono-tabular bg-teal-700 text-white px-2.5 py-0.5 rounded">
                          Ngày khám: {visit.visitDate}
                        </span>
                        <span className="text-xs font-bold font-mono-tabular bg-rose-100 text-rose-900 px-2 py-0.5 rounded">
                          Mã ICD: {visit.icdCode}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1.5">
                        {visit.diagnosisSummary}
                      </h4>
                    </div>

                    <div className="text-xs text-slate-600 sm:text-right shrink-0">
                      <div className="font-semibold text-slate-800 flex sm:justify-end items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{visit.hospitalName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {visit.department} · {visit.doctorName}
                      </div>
                    </div>
                  </div>

                  {/* Plain Explanation & Doctor Advice for Easy Understanding */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200/80 space-y-1.5 text-xs sm:text-sm">
                    <p className="text-slate-800 leading-relaxed">
                      <strong className="text-teal-800">Giải thích dễ hiểu: </strong>
                      {visit.plainExplanation}
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      <strong className="text-amber-800">Ghi chú lời dặn bác sĩ: </strong>
                      {visit.doctorAdvice}
                    </p>
                  </div>

                  {/* Vitals Measured at the Hospital + BHYT Prescriptions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        Chỉ số đo tại Bệnh viện ngày {visit.visitDate}:
                      </span>
                      <div className="flex flex-wrap items-center gap-2 font-mono-tabular text-slate-900 font-semibold">
                        <span>
                          HA: {visit.recordedVitals.systolic}/{visit.recordedVitals.diastolic}{' '}
                          mmHg
                        </span>
                        <span>·</span>
                        <span>Đường: {visit.recordedVitals.bloodGlucose} mg/dL</span>
                        <span>·</span>
                        <span>{visit.recordedVitals.weightKg} kg</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        Thuốc ghi nhận ({visit.prescribedMedications.length} thuốc):
                      </span>
                      <ul className="space-y-0.5 text-slate-800">
                        {visit.prescribedMedications.map((m) => (
                          <li key={m.medicationName} className="flex items-center gap-1">
                            <Pill className="w-3 h-3 text-teal-600 shrink-0" />
                            <span className="font-medium">{m.medicationName}</span>
                            <span className="text-slate-500">({m.timeSlot})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer Row: BHYT Payment Breakdown + 1-Click Sync Button */}
                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="text-slate-600 font-mono-tabular flex flex-wrap items-center gap-2">
                      <span>
                        BHYT chi trả:{' '}
                        <strong className="text-emerald-700">
                          {visit.bhytPaidVnd.toLocaleString('vi-VN')} đ
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Đồng chi trả:{' '}
                        <strong className="text-slate-900">
                          {visit.patientCoPayVnd.toLocaleString('vi-VN')} đ
                        </strong>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        Tái khám: {visit.followUpDate}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyVisit(visit)}
                      data-testid={`apply-bhyt-visit-btn-${visit.id}`}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Cập nhật Đơn thuốc &amp; Chỉ số vào Sổ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

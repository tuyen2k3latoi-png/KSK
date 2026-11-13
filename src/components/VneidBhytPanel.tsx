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
import { formatDateDdMmYyyy, formatTime24h } from '../utils/formatters';
import { INITIAL_BHYT_CARD } from '../data/seedHealthData';
import { Card, Chip, EmptyState } from './ui/Primitives';

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
  const [expandedExplainId, setExpandedExplainId] = useState<string | null>(null);

  // New visit form state
  const [visitDate, setVisitDate] = useState('2026-11-11');
  const [hospitalName, setHospitalName] = useState(profile.hospitalName);
  const [doctorName, setDoctorName] = useState(profile.primaryDoctor);
  const [icdCode, setIcdCode] = useState('I10');
  const [diagnosisSummary, setDiagnosisSummary] = useState(
    'Tái khám Tăng huyết áp định kỳ'
  );
  const [doctorAdvice, setDoctorAdvice] = useState(
    'Uống thuốc đúng giờ sáng, ăn nhạt và đi bộ 30 phút/ngày.'
  );
  const [sysInput, setSysInput] = useState('124');
  const [diaInput, setDiaInput] = useState('78');
  const [gluInput, setGluInput] = useState('95');
  const [medNameInput, setMedNameInput] = useState('Amlodipine 5mg');

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
      `Đã chép chỉ số ngày ${formatDateDdMmYyyy(visit.visitDate)} (${visit.recordedVitals.systolic}/${visit.recordedVitals.diastolic} mmHg) và ${visit.prescribedMedications.length} thuốc vào Sổ hôm nay.`
    );
  };

  const handleAddVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisSummary.trim()) return;

    onAddBhytVisit({
      visitDate,
      hospitalName: hospitalName.trim() || profile.hospitalName,
      department: 'Khoa Khám bệnh Đa khoa',
      doctorName: doctorName.trim() || profile.primaryDoctor,
      icdCode: icdCode.trim() || 'I10',
      diagnosisSummary: diagnosisSummary.trim(),
      plainExplanation:
        'Kết quả khám được lưu cá nhân trên thiết bị. Hỏi lại bác sĩ nếu cần điều chỉnh liều thuốc.',
      doctorAdvice:
        doctorAdvice.trim() || 'Uống thuốc đúng giờ và đo huyết áp tại nhà.',
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
              purpose: `Đơn khám (${icdCode})`,
              timeSlot: '07:00',
              mealInstruction: 'Sau ăn 30 phút',
              daysSupply: 30,
            },
          ]
        : [],
    });

    setIsAddingVisit(false);
    setAppliedBanner(
      `Đã lưu đợt khám ngày ${formatDateDdMmYyyy(visitDate)} tại ${hospitalName}.`
    );
  };

  return (
    <section
      aria-label="Thẻ BHYT và Lịch sử khám"
      data-testid="vneid-bhyt-panel"
      className="space-y-4"
    >
      {/* Thanh tiêu đề & nút Thêm lần khám */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {isDemoProfile ? (
                <span
                  data-testid="bhyt-panel-demo-badge"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl"
                >
                  HỒ SƠ DEMO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B5F57] bg-[#0F766E]/10 border border-[#0F766E]/25 px-2.5 py-1 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                  <span>HỒ SƠ CỦA TÔI</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B5F57] bg-[#FAF7F2] border border-stone-200 px-2.5 py-1 rounded-xl tabular-nums">
                <CreditCard className="w-4 h-4 text-[#0F766E]" />
                <span>{displayedBhytCode}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowFullCodes((prev) => !prev)}
                data-testid="toggle-bhyt-card-mask-btn"
                className="min-h-[36px] px-3 py-1 rounded-xl bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-300 text-[#1F2937] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
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
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] pt-0.5">
              Thẻ BHYT &amp; Lịch sử khám
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingVisit(!isAddingVisit)}
            data-testid="toggle-add-bhyt-visit-btn"
            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingVisit ? 'Đóng' : 'Thêm lần khám'}</span>
          </button>
        </div>

        {appliedBanner && (
          <div
            role="status"
            data-testid="bhyt-sync-banner"
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-950 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{appliedBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setAppliedBanner(null)}
              className="text-xs font-bold text-emerald-900 underline shrink-0 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Biểu mẫu thêm lần khám */}
        {isAddingVisit && (
          <form
            onSubmit={handleAddVisitSubmit}
            className="pt-4 border-t border-stone-200/80 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Ngày khám</label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-2xl tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Bệnh viện</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-2xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Bác sĩ</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-2xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Mã bệnh</label>
                <input
                  type="text"
                  value={icdCode}
                  onChange={(e) => setIcdCode(e.target.value)}
                  placeholder="I10"
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-2xl tabular-nums"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 mb-1">Chẩn đoán</label>
                <input
                  type="text"
                  value={diagnosisSummary}
                  onChange={(e) => setDiagnosisSummary(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-2xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Lời dặn bác sĩ</label>
              <input
                type="text"
                value={doctorAdvice}
                onChange={(e) => setDoctorAdvice(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-2xl"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">HA trên</label>
                <input
                  type="number"
                  value={sysInput}
                  onChange={(e) => setSysInput(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-2xl tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">HA dưới</label>
                <input
                  type="number"
                  value={diaInput}
                  onChange={(e) => setDiaInput(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-2xl tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Đường huyết</label>
                <input
                  type="number"
                  value={gluInput}
                  onChange={(e) => setGluInput(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-2xl tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Thuốc kê đơn</label>
                <input
                  type="text"
                  value={medNameInput}
                  onChange={(e) => setMedNameInput(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-2xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingVisit(false)}
                className="min-h-[44px] px-4 py-2 rounded-2xl border border-stone-300 text-sm font-bold text-[#1F2937] bg-white cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold cursor-pointer"
              >
                Lưu lần khám
              </button>
            </div>
          </form>
        )}
      </Card>

      {/* Bố cục 2 cột: Trái Thẻ BHYT & Bệnh lý | Phải Lịch sử khám */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-5 space-y-4">
          {/* Thẻ BHYT cá nhân */}
          <div className="rounded-[20px] bg-gradient-to-br from-[#0B5F57] via-[#0F766E] to-[#115E59] text-white p-5 shadow-[0_12px_32px_-8px_rgba(11,95,87,0.38)] space-y-3.5 border border-white/20">
            <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-3">
              <h3 className="text-lg font-extrabold tracking-tight text-white">
                THẺ BHYT CÁ NHÂN
              </h3>
              <span className="px-2.5 py-1 rounded-xl bg-amber-300 text-stone-950 text-xs font-extrabold shrink-0">
                {isDemoProfile ? 'DEMO' : 'Cá nhân'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-teal-100">Họ tên:</span>
                <strong data-testid="bhyt-card-holder-name" className="text-base font-extrabold text-white">
                  {profile.fullName}
                </strong>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-teal-100">Mã BHYT:</span>
                <div className="flex items-center gap-2">
                  <strong data-testid="bhyt-card-code" className="tabular-nums text-amber-200 font-extrabold text-base">
                    {displayedBhytCode}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setShowFullCodes((prev) => !prev)}
                    className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold text-white cursor-pointer"
                  >
                    {showFullCodes ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-teal-100">Số CCCD:</span>
                <span data-testid="bhyt-card-cccd" className="tabular-nums text-white font-bold">
                  {displayedCccdNumber}
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-teal-100">Sinh năm / Máu:</span>
                <span className="tabular-nums text-white font-semibold">
                  {profile.birthYear} ({2026 - profile.birthYear}t) · Nhóm {profile.bloodType}
                </span>
              </div>
              <div className="pt-2.5 border-t border-white/15 space-y-1.5">
                <div className="flex justify-between items-baseline gap-3">
                  <span className="text-teal-100 shrink-0 whitespace-nowrap">Mức hưởng:</span>
                  <strong className="text-emerald-200 font-bold text-right">{card.coverageRate}</strong>
                </div>
                <div className="flex justify-between items-baseline gap-3">
                  <span className="text-teal-100 shrink-0 whitespace-nowrap">Nơi ĐK KCB:</span>
                  <span className="text-white font-semibold text-right">{card.registeredHospital}</span>
                </div>
                <p className="text-xs text-teal-100/90 pt-1">
                  {card.fiveYearContinuousDate} · Sổ lưu cá nhân (không thuộc BHXH/VNeID)
                </p>
              </div>
            </div>
          </div>

          {/* Bệnh lý đang theo dõi */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-200/80">
              <h4 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-[#DC2626] shrink-0" />
                <span>Bệnh lý theo dõi ({profile.chronicConditions.length})</span>
              </h4>
            </div>

            <div className="divide-y divide-stone-100">
              {profile.chronicConditions.map((cond) => (
                <div
                  key={cond}
                  className="py-2 text-sm text-[#1F2937] font-bold flex items-center justify-between gap-2"
                >
                  <span>{cond}</span>
                  <Chip label="Theo dõi" variant="normal" className="text-xs px-2 py-0.5" />
                </div>
              ))}
            </div>

            <div className="pt-2.5 border-t border-stone-200/80 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-stone-600 block text-xs">BHYT đã chi trả</span>
                <strong className="text-base font-extrabold text-[#0B5F57] tabular-nums">
                  {summary.totalBhytCoveredVnd.toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div>
                <span className="text-stone-600 block text-xs">Tái khám tới</span>
                <strong className="text-base font-extrabold text-[#1F2937] tabular-nums">
                  {summary.nextFollowUpDate
                    ? formatDateDdMmYyyy(summary.nextFollowUpDate)
                    : 'Chưa có'}
                </strong>
              </div>
            </div>
          </Card>
        </div>

        {/* Cột phải: Lịch sử khám */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#0F766E] shrink-0" />
              <span>Lịch sử khám ({bhytVisits.length} lần)</span>
            </h3>
          </div>

          {bhytVisits.length === 0 ? (
            <EmptyState
              title="Chưa có lần khám nào"
              description="Bấm “Thêm lần khám” để lưu chẩn đoán và đơn thuốc."
            />
          ) : (
            <div className="space-y-4">
              {bhytVisits.map((visit) => {
                const isExpanded = expandedExplainId === visit.id;
                return (
                  <Card
                    key={visit.id}
                    testId={`bhyt-visit-card-${visit.id}`}
                    className="space-y-3"
                  >
                    <div className="space-y-1.5 pb-2.5 border-b border-stone-200/80">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold tabular-nums bg-[#0F766E] text-white px-2.5 py-1 rounded-xl">
                            {formatDateDdMmYyyy(visit.visitDate)}
                          </span>
                          <span className="text-xs font-bold tabular-nums bg-amber-50 text-amber-950 border border-amber-300 px-2.5 py-1 rounded-xl">
                            {visit.icdCode}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-[#0B5F57] inline-flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[#0F766E] shrink-0" />
                          <span>{visit.hospitalName}</span>
                        </div>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-[#1F2937]">
                        {visit.diagnosisSummary}
                      </h4>
                      <p className="text-xs text-stone-600">{visit.doctorName}</p>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <p className="text-[#1F2937]">
                        <strong className="text-[#0B5F57]">Lời dặn bác sĩ: </strong>
                        {visit.doctorAdvice}
                      </p>
                      {visit.plainExplanation && (
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedExplainId(isExpanded ? null : visit.id)
                            }
                            className="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
                          >
                            {isExpanded ? 'Ẩn giải thích thêm' : 'Xem giải thích dễ hiểu'}
                          </button>
                          {isExpanded && (
                            <p className="text-sm text-stone-700 mt-1 leading-relaxed">
                              {visit.plainExplanation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs font-bold text-stone-500 block mb-0.5">
                          Chỉ số hôm khám:
                        </span>
                        <div className="flex flex-wrap items-center gap-2 tabular-nums text-[#1F2937] font-bold">
                          <span>
                            HA {visit.recordedVitals.systolic}/{visit.recordedVitals.diastolic}
                          </span>
                          <span>·</span>
                          <span>Đường {visit.recordedVitals.bloodGlucose}</span>
                          <span>·</span>
                          <span>{visit.recordedVitals.weightKg} kg</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-stone-500 block mb-0.5">
                          Đơn thuốc ({visit.prescribedMedications.length}):
                        </span>
                        <ul className="space-y-0.5 text-[#1F2937]">
                          {visit.prescribedMedications.map((m) => (
                            <li key={m.medicationName} className="flex items-center gap-1.5 tabular-nums">
                              <Pill className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                              <span className="font-semibold">{m.medicationName}</span>
                              <span className="text-stone-500 text-xs">({formatTime24h(m.timeSlot)})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-sm">
                      <div className="text-stone-600 tabular-nums flex flex-wrap items-center gap-2">
                        <span>
                          Trả:{' '}
                          <strong className="text-[#1F2937]">
                            {visit.patientCoPayVnd.toLocaleString('vi-VN')} đ
                          </strong>
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-[#0B5F57] font-bold">
                          <CalendarCheck className="w-4 h-4 text-[#0F766E]" />
                          <span>Tái khám {formatDateDdMmYyyy(visit.followUpDate)}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyVisit(visit)}
                        data-testid={`apply-bhyt-visit-btn-${visit.id}`}
                        className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Chép vào Sổ hôm nay</span>
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

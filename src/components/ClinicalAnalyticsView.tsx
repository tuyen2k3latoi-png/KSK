import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { MealEntry, VitalRecord } from '../types/health';
import {
  classifyBloodGlucose,
  classifyBloodPressure,
  serializeCombinedHealthToCsv,
  serializeHealthDataToJson,
  serializeMealsToCsv,
  serializeVitalsToCsv,
  triggerOfflineFileDownload,
} from '../utils/healthCalculations';
import {
  formatDateDdMmYyyy,
  formatTime24h,
  humanizeDeviceSource,
} from '../utils/formatters';
import { Card, Chip, EmptyState } from './ui/Primitives';

interface ClinicalAnalyticsViewProps {
  records: VitalRecord[];
  meals: MealEntry[];
  onDeleteRecord: (id: string) => void;
  onResetSampleData: () => void;
  onOpenLogModal: () => void;
}

type ExportScope = 'all' | 'vitals' | 'meals';
type PreviewFormat = 'csv' | 'json';

export const ClinicalAnalyticsView: React.FC<ClinicalAnalyticsViewProps> = ({
  records,
  meals,
  onDeleteRecord,
  onResetSampleData,
  onOpenLogModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [exportScope, setExportScope] = useState<ExportScope>('all');
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>('csv');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [copiedPreview, setCopiedPreview] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [showAllMobileVitals, setShowAllMobileVitals] = useState<boolean>(false);
  const [showAllMobileMeals, setShowAllMobileMeals] = useState<boolean>(false);

  const filteredRecords = records.filter((rec) => {
    const bp = classifyBloodPressure(rec.systolic, rec.diastolic);
    const formattedDate = formatDateDdMmYyyy(rec.date);
    const matchesSearch =
      rec.date.includes(searchQuery) ||
      formattedDate.includes(searchQuery) ||
      (rec.notes && rec.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      rec.deviceSource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || rec.deviceSource === sourceFilter;
    const matchesStatus = statusFilter === 'all' || bp.status === statusFilter;
    return matchesSearch && matchesSource && matchesStatus;
  });

  const mobileVisibleRecords = showAllMobileVitals
    ? filteredRecords
    : filteredRecords.slice(0, 5);
  const mobileVisibleMeals = showAllMobileMeals ? meals : meals.slice(0, 4);

  const getCsvPayload = (scope: ExportScope): string => {
    if (scope === 'vitals') return serializeVitalsToCsv(filteredRecords);
    if (scope === 'meals') return serializeMealsToCsv(meals);
    return serializeCombinedHealthToCsv(filteredRecords, meals);
  };

  const getJsonPayload = (scope: ExportScope): string => {
    return serializeHealthDataToJson(filteredRecords, meals, scope);
  };

  const handleDownloadCsv = (scopeOverride?: ExportScope) => {
    const targetScope = scopeOverride || exportScope;
    const csvContent = getCsvPayload(targetScope);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename =
      targetScope === 'vitals'
        ? `vitapulse_vitals_${dateStamp}.csv`
        : targetScope === 'meals'
        ? `vitapulse_meals_${dateStamp}.csv`
        : `vitapulse_vitals_and_meals_${dateStamp}.csv`;

    triggerOfflineFileDownload(csvContent, filename, 'text/csv;charset=utf-8;');

    const desc =
      targetScope === 'vitals'
        ? `${filteredRecords.length} lần đo sức khỏe`
        : targetScope === 'meals'
        ? `${meals.length} bữa ăn`
        : `${filteredRecords.length} lần đo sức khỏe và ${meals.length} bữa ăn`;

    setExportScope(targetScope);
    setPreviewFormat('csv');
    setExportMessage(`Đã tải Sổ Sức khỏe (${filename}) gồm ${desc} về máy.`);
  };

  const handleDownloadJson = (scopeOverride?: ExportScope) => {
    const targetScope = scopeOverride || exportScope;
    const jsonContent = getJsonPayload(targetScope);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename =
      targetScope === 'vitals'
        ? `vitapulse_vitals_${dateStamp}.json`
        : targetScope === 'meals'
        ? `vitapulse_meals_${dateStamp}.json`
        : `vitapulse_vitals_and_meals_${dateStamp}.json`;

    triggerOfflineFileDownload(jsonContent, filename, 'application/json;charset=utf-8;');

    const desc =
      targetScope === 'vitals'
        ? `${filteredRecords.length} lần đo sức khỏe`
        : targetScope === 'meals'
        ? `${meals.length} bữa ăn`
        : `${filteredRecords.length} lần đo sức khỏe và ${meals.length} bữa ăn`;

    setExportScope(targetScope);
    setPreviewFormat('json');
    setExportMessage(`Đã tải tệp Sao lưu Hồ sơ (${filename}) gồm ${desc} về máy.`);
  };

  const activePreviewContent =
    previewFormat === 'csv' ? getCsvPayload(exportScope) : getJsonPayload(exportScope);

  const handleCopyPreview = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activePreviewContent);
    }
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* 1. Tải Sổ Sức khỏe về máy */}
      <Card className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-stone-200/80">
          <div>
            <h3 className="text-lg font-bold text-[#1F2937]">
              Tải Sổ Sức khỏe Đưa Bác sĩ Xem hoặc Lưu trữ Về máy
            </h3>
            <p className="text-sm text-stone-600 mt-0.5">
              Lưu về điện thoại hoặc máy tính toàn bộ lịch sử đo Huyết áp, Đường huyết ({filteredRecords.length} lần đo) và Nhật ký Bữa ăn ({meals.length} bữa) để gửi cho bác sĩ hoặc người thân.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadCsv()}
              className="min-h-[48px] justify-center px-4 py-2 text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] rounded-2xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Tải Sổ Bảng biểu (CSV)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadJson()}
              className="min-h-[48px] justify-center px-4 py-2 text-sm font-bold text-[#1F2937] bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-300 rounded-2xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <FileJson className="w-4 h-4 text-[#0F766E] shrink-0" />
              <span>Tải Bản Sao lưu (JSON)</span>
            </button>
            <button
              type="button"
              onClick={onResetSampleData}
              className="col-span-2 sm:col-span-1 min-h-[48px] justify-center px-4 py-2 text-sm font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-2xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>Khôi phục dữ liệu mẫu</span>
            </button>
          </div>
        </div>

        {/* Chọn phạm vi dữ liệu xuất */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 md:flex items-center gap-1.5 p-1.5 bg-[#FAF7F2] border border-stone-200 rounded-2xl">
            <button
              type="button"
              onClick={() => setExportScope('all')}
              className={`min-h-[40px] px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                exportScope === 'all'
                  ? 'bg-white text-[#0B5F57] shadow-2xs'
                  : 'text-stone-600 hover:text-[#1F2937]'
              }`}
            >
              Trọn bộ Sổ Sức khỏe ({filteredRecords.length} lần đo + {meals.length} bữa)
            </button>
            <button
              type="button"
              onClick={() => setExportScope('vitals')}
              className={`min-h-[40px] px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                exportScope === 'vitals'
                  ? 'bg-white text-[#0B5F57] shadow-2xs'
                  : 'text-stone-600 hover:text-[#1F2937]'
              }`}
            >
              Chỉ riêng Huyết áp &amp; Chỉ số ({filteredRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setExportScope('meals')}
              className={`min-h-[40px] px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                exportScope === 'meals'
                  ? 'bg-white text-[#0B5F57] shadow-2xs'
                  : 'text-stone-600 hover:text-[#1F2937]'
              }`}
            >
              Chỉ riêng Nhật ký Bữa ăn ({meals.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="min-h-[40px] px-3.5 py-1.5 text-sm font-bold text-[#1F2937] bg-white border border-stone-300 hover:bg-[#FAF7F2] rounded-2xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#0F766E]" />
              <span>{showPreview ? 'Ẩn nội dung tệp' : 'Xem trước nội dung tệp'}</span>
            </button>
          </div>
        </div>

        {exportMessage && (
          <div
            role="status"
            data-testid="export-status-banner"
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
          >
            <span>{exportMessage}</span>
            <span className="tabular-nums text-xs font-bold text-emerald-800 shrink-0">
              Dùng được khi không có mạng
            </span>
          </div>
        )}

        {showPreview && (
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
              <span>
                Bản xem trước dữ liệu ({previewFormat.toUpperCase()} · Phạm vi:{' '}
                <strong className="text-[#1F2937]">
                  {exportScope === 'all'
                    ? 'Chỉ số + Bữa ăn'
                    : exportScope === 'vitals'
                    ? 'Chỉ số'
                    : 'Bữa ăn'}
                </strong>
                )
              </span>
              <button
                type="button"
                onClick={handleCopyPreview}
                className="px-3 py-1.5 text-xs font-bold text-[#1F2937] bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-300 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedPreview ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép nội dung</span>
                  </>
                )}
              </button>
            </div>
            <pre
              data-testid="export-preview-content"
              className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 text-xs tabular-nums overflow-x-auto max-h-48 leading-relaxed"
            >
              {activePreviewContent}
            </pre>
          </div>
        )}
      </Card>

      {/* 2. Nhật ký Chỉ số Sức khỏe */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
          <div>
            <h3 className="text-lg font-bold text-[#1F2937]">
              Nhật ký Đo Huyết áp &amp; Chỉ số Sức khỏe ({filteredRecords.length} lần đo)
            </h3>
            <p className="text-sm text-stone-600 mt-0.5">
              Tra cứu lịch sử đo theo ngày (dd/mm/yyyy), thiết bị đo hoặc mức huyết áp
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadCsv('vitals')}
              className="min-h-[40px] px-3.5 py-1.5 text-xs font-bold text-[#1F2937] bg-[#FAF7F2] border border-stone-300 hover:bg-stone-200/70 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Tải bảng CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadJson('vitals')}
              className="min-h-[40px] px-3.5 py-1.5 text-xs font-bold text-[#1F2937] bg-[#FAF7F2] border border-stone-300 hover:bg-stone-200/70 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Tải tệp JSON</span>
            </button>
          </div>
        </div>

        {/* Bộ lọc & Tìm kiếm */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Tìm kiếm theo ngày hoặc ghi chú"
              placeholder="Tìm theo ngày (10/11/2026) hoặc triệu chứng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[48px] pl-10 pr-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white"
            />
          </div>

          <div>
            <select
              aria-label="Lọc theo thiết bị đo"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full min-h-[48px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold"
            >
              <option value="all">Tất cả nguồn đo ({records.length})</option>
              <option value="Smartwatch BLE">Đồng bộ từ thiết bị</option>
              <option value="Máy đo Omron">Máy đo huyết áp Omron</option>
              <option value="Nhập thủ công">Tự ghi nhận</option>
            </select>
          </div>

          <div>
            <select
              aria-label="Lọc theo phân loại huyết áp"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full min-h-[48px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold"
            >
              <option value="all">Tất cả mức huyết áp</option>
              <option value="normal">Bình thường (&le; 120/80)</option>
              <option value="elevated">Bình thường cao (121–129/&lt;80)</option>
              <option value="warning">Tăng huyết áp Độ 1 (130–139/80–89)</option>
              <option value="critical">Tăng huyết áp Độ 2 (&ge; 140/90)</option>
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <EmptyState
            title="Không tìm thấy lần đo nào khớp với bộ lọc"
            description="Bạn có thể xóa từ khóa tìm kiếm hoặc ghi nhận số đo mới ngay bây giờ."
            actionLabel="Ghi nhận chỉ số mới"
            onAction={onOpenLogModal}
          />
        ) : (
          <>
            {/* Chế độ Điện thoại (< 768px): Danh sách có nút Xem thêm */}
            <div className="md:hidden divide-y divide-stone-100 border-t border-stone-100">
              {mobileVisibleRecords.map((rec) => {
                const bpEval = classifyBloodPressure(rec.systolic, rec.diastolic);
                const gluEval = classifyBloodGlucose(rec.bloodGlucose, rec.glucoseContext);
                return (
                  <div key={rec.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-[#1F2937] tabular-nums">
                          {formatDateDdMmYyyy(rec.date)} · {formatTime24h(rec.time)}
                        </span>
                        <span className="text-xs text-stone-600">
                          {' '}
                          · {humanizeDeviceSource(rec.deviceSource)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(rec.id)}
                        aria-label={`Xóa bản ghi ngày ${rec.date} lúc ${rec.time}`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-stone-500 hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 min-[380px]:grid-cols-4 gap-2 text-sm tabular-nums">
                      <div>
                        <span className="text-xs text-stone-500 block">Huyết áp</span>
                        <strong className="text-[#1F2937]">
                          {rec.systolic}/{rec.diastolic}
                        </strong>
                      </div>
                      <div>
                        <span className="text-xs text-stone-500 block">Nhịp tim</span>
                        <strong className="text-[#1F2937]">{rec.heartRate} nhịp/p</strong>
                      </div>
                      <div>
                        <span className="text-xs text-stone-500 block">Đường huyết</span>
                        <strong className="text-[#1F2937]">{rec.bloodGlucose} mg/dL</strong>
                      </div>
                      <div>
                        <span className="text-xs text-stone-500 block">Cân nặng</span>
                        <strong className="text-[#1F2937]">{rec.weightKg} kg</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Chip
                        label={bpEval.label}
                        variant={bpEval.status}
                        className="text-xs px-2.5 py-0.5"
                      />
                      <span className="text-xs text-stone-600">{gluEval.label}</span>
                    </div>
                    {rec.notes && (
                      <p className="text-xs text-stone-600 leading-relaxed">{rec.notes}</p>
                    )}
                  </div>
                );
              })}

              {filteredRecords.length > 5 && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAllMobileVitals((prev) => !prev)}
                    className="w-full min-h-[44px] px-4 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-stone-200/70 text-sm font-bold text-[#0B5F57] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>
                      {showAllMobileVitals
                        ? 'Thu gọn danh sách lần đo'
                        : `Xem thêm ${filteredRecords.length - 5} lần đo trước đó`}
                    </span>
                    <ChevronDown className={`w-4 h-4 ${showAllMobileVitals ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Chế độ Máy tính / Máy tính bảng (>= 768px): Bảng rõ ràng */}
            <div className="hidden md:block overflow-x-auto border-t border-stone-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-xs font-bold text-stone-600">
                    <th className="py-3 pr-4">Ngày &amp; Giờ đo</th>
                    <th className="py-3 px-3 text-right">Huyết áp (mmHg)</th>
                    <th className="py-3 px-3 text-right">Nhịp tim</th>
                    <th className="py-3 px-3 text-right">Oxy máu</th>
                    <th className="py-3 px-3 text-right">Đường huyết</th>
                    <th className="py-3 px-3 text-right">Cân nặng</th>
                    <th className="py-3 px-3">Đánh giá tham khảo</th>
                    <th className="py-3 pl-3 text-right">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {filteredRecords.map((rec) => {
                    const bpEval = classifyBloodPressure(rec.systolic, rec.diastolic);
                    const gluEval = classifyBloodGlucose(rec.bloodGlucose, rec.glucoseContext);
                    return (
                      <tr key={rec.id} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <div className="font-bold text-[#1F2937] tabular-nums">
                            {formatDateDdMmYyyy(rec.date)} · {formatTime24h(rec.time)}
                          </div>
                          <div className="text-xs text-stone-600">
                            {humanizeDeviceSource(rec.deviceSource)}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums font-extrabold text-[#1F2937] whitespace-nowrap">
                          {rec.systolic}/{rec.diastolic}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-[#1F2937] whitespace-nowrap">
                          {rec.heartRate} nhịp/p
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-[#1F2937] whitespace-nowrap">
                          {rec.spo2}%
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-[#1F2937] whitespace-nowrap">
                          {rec.bloodGlucose} mg/dL
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-[#1F2937] whitespace-nowrap">
                          {rec.weightKg} kg
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Chip
                              label={bpEval.label}
                              variant={bpEval.status}
                              className="text-xs px-2.5 py-0.5"
                            />
                            <span className="text-xs text-stone-600">{gluEval.label}</span>
                          </div>
                          {rec.notes && (
                            <div className="text-xs text-stone-600 mt-0.5 truncate max-w-xs">
                              {rec.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pl-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(rec.id)}
                            aria-label={`Xóa bản ghi ngày ${rec.date} lúc ${rec.time}`}
                            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl text-stone-500 hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* 3. Nhật ký Bữa ăn */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
          <div>
            <h3 className="text-lg font-bold text-[#1F2937]">
              Nhật ký Dinh dưỡng &amp; Khẩu phần Ăn ({meals.length} bữa ăn)
            </h3>
            <p className="text-sm text-stone-600 mt-0.5">
              Dữ liệu khẩu phần ăn hằng ngày sẵn sàng tải về để bác sĩ tham khảo
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadCsv('meals')}
              className="min-h-[40px] px-3.5 py-1.5 text-xs font-bold text-[#1F2937] bg-[#FAF7F2] border border-stone-300 hover:bg-stone-200/70 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>CSV Bữa ăn</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadJson('meals')}
              className="min-h-[40px] px-3.5 py-1.5 text-xs font-bold text-[#1F2937] bg-[#FAF7F2] border border-stone-300 hover:bg-stone-200/70 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>JSON Bữa ăn</span>
            </button>
          </div>
        </div>

        {/* Chế độ Điện thoại cho Bữa ăn */}
        <div className="md:hidden divide-y divide-stone-100">
          {mobileVisibleMeals.map((meal) => (
            <div key={meal.id} className="py-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#1F2937]">{meal.foodName}</span>
                <span className="text-sm font-extrabold text-[#0F766E] tabular-nums shrink-0">
                  {meal.calories} kcal
                </span>
              </div>
              <p className="text-xs text-stone-600 tabular-nums">
                Bữa {meal.mealType} · {formatDateDdMmYyyy(meal.date)} {formatTime24h(meal.time)} · Đạm{' '}
                {meal.proteinG}g · Tinh bột {meal.carbsG}g · Béo {meal.fatG}g
              </p>
            </div>
          ))}
          {meals.length > 4 && (
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setShowAllMobileMeals((prev) => !prev)}
                className="w-full min-h-[44px] px-4 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-stone-200/70 text-sm font-bold text-[#0B5F57] inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>
                  {showAllMobileMeals ? 'Thu gọn danh sách bữa ăn' : `Xem thêm ${meals.length - 4} bữa ăn`}
                </span>
                <ChevronDown className={`w-4 h-4 ${showAllMobileMeals ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Chế độ Máy tính cho Bữa ăn */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-bold text-stone-600">
                <th className="py-3 pr-4">Ngày &amp; Giờ</th>
                <th className="py-3 px-3">Bữa ăn</th>
                <th className="py-3 px-3">Món ăn / Khẩu phần</th>
                <th className="py-3 px-3 text-right">Năng lượng</th>
                <th className="py-3 px-3 text-right">Chất đạm</th>
                <th className="py-3 px-3 text-right">Tinh bột</th>
                <th className="py-3 pl-3 text-right">Chất béo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {meals.map((meal) => (
                <tr key={meal.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3 pr-4 tabular-nums text-stone-700 whitespace-nowrap">
                    {formatDateDdMmYyyy(meal.date)} · {formatTime24h(meal.time)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#1F2937] whitespace-nowrap">
                    Bữa {meal.mealType}
                  </td>
                  <td className="py-3 px-3 font-bold text-[#1F2937]">{meal.foodName}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-extrabold text-[#0F766E] whitespace-nowrap">
                    {meal.calories} kcal
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-stone-700 whitespace-nowrap">
                    {meal.proteinG} g
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-stone-700 whitespace-nowrap">
                    {meal.carbsG} g
                  </td>
                  <td className="py-3 pl-3 text-right tabular-nums text-stone-700 whitespace-nowrap">
                    {meal.fatG} g
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

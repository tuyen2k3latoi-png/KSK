import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Eye,
  FileJson,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
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
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [exportScope, setExportScope] = useState<ExportScope>('all');
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>('csv');
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
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
    setExportScope(targetScope);
    setPreviewFormat('csv');
    setExportMessage(`Đã tải tệp ${filename}.`);
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
    setExportScope(targetScope);
    setPreviewFormat('json');
    setExportMessage(`Đã tải bản sao lưu ${filename}.`);
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
    <div className="space-y-4">
      {/* 1. Tải sổ gửi bác sĩ */}
      <Card className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#1F2937]">Tải sổ gửi bác sĩ</h3>
            <p className="text-sm text-stone-600 tabular-nums">
              {filteredRecords.length} lần đo · {meals.length} bữa ăn
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadCsv()}
              className="min-h-[44px] px-4 py-2 text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5F57] rounded-2xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Tải bảng CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadJson()}
              className="min-h-[44px] px-4 py-2 text-sm font-bold text-[#1F2937] bg-[#FAF7F2] hover:bg-stone-200/70 border border-stone-300 rounded-2xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileJson className="w-4 h-4 text-[#0F766E] shrink-0" />
              <span>Tải JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setShowExportOptions((prev) => !prev)}
              className="min-h-[44px] px-3 py-2 text-xs font-bold text-[#0B5F57] bg-[#FAF7F2] border border-stone-200 hover:bg-stone-200/60 rounded-2xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Tùy chọn</span>
            </button>
          </div>
        </div>

        {showExportOptions && (
          <div className="pt-3 border-t border-stone-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FAF7F2] border border-stone-200 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setExportScope('all')}
                  className={`min-h-[38px] px-3 py-1 text-xs font-bold rounded-xl cursor-pointer ${
                    exportScope === 'all' ? 'bg-white text-[#0B5F57] shadow-2xs' : 'text-stone-600'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setExportScope('vitals')}
                  className={`min-h-[38px] px-3 py-1 text-xs font-bold rounded-xl cursor-pointer ${
                    exportScope === 'vitals' ? 'bg-white text-[#0B5F57] shadow-2xs' : 'text-stone-600'
                  }`}
                >
                  Chỉ số ({filteredRecords.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExportScope('meals')}
                  className={`min-h-[38px] px-3 py-1 text-xs font-bold rounded-xl cursor-pointer ${
                    exportScope === 'meals' ? 'bg-white text-[#0B5F57] shadow-2xs' : 'text-stone-600'
                  }`}
                >
                  Bữa ăn ({meals.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="min-h-[38px] px-3 py-1 text-xs font-bold text-[#1F2937] bg-white border border-stone-300 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>{showPreview ? 'Ẩn xem trước' : 'Xem trước'}</span>
                </button>
                <button
                  type="button"
                  onClick={onResetSampleData}
                  className="min-h-[38px] px-3 py-1 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục mẫu</span>
                </button>
              </div>
            </div>

            {showPreview && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span>Xem trước ({previewFormat.toUpperCase()})</span>
                  <button
                    type="button"
                    onClick={handleCopyPreview}
                    className="px-3 py-1 text-xs font-bold text-[#1F2937] bg-[#FAF7F2] border border-stone-300 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedPreview ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
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
          </div>
        )}

        {exportMessage && (
          <div
            role="status"
            data-testid="export-status-banner"
            className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-900"
          >
            {exportMessage}
          </div>
        )}
      </Card>

      {/* 2. Nhật ký Chỉ số */}
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
          <h3 className="text-lg font-bold text-[#1F2937]">
            Nhật ký đo ({filteredRecords.length} lần)
          </h3>

          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="min-h-[40px] px-3.5 py-1.5 text-xs font-bold text-[#0B5F57] bg-[#FAF7F2] border border-stone-300 hover:bg-stone-200/70 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showFilters ? 'Ẩn lọc' : 'Tìm & Lọc'}</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pb-2">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Tìm theo ngày hoặc ghi chú"
                placeholder="Tìm ngày (10/11/2026)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white"
              />
            </div>

            <select
              aria-label="Lọc theo thiết bị đo"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold"
            >
              <option value="all">Tất cả nguồn ({records.length})</option>
              <option value="Smartwatch BLE">Đồng bộ thiết bị</option>
              <option value="Máy đo Omron">Máy Omron</option>
              <option value="Nhập thủ công">Tự ghi</option>
            </select>

            <select
              aria-label="Lọc theo mức huyết áp"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-stone-300 rounded-2xl bg-white font-semibold"
            >
              <option value="all">Tất cả mức HA</option>
              <option value="normal">Bình thường (&le; 120/80)</option>
              <option value="elevated">Hơi cao (121–129/&lt;80)</option>
              <option value="warning">Độ 1 (130–139/80–89)</option>
              <option value="critical">Độ 2 (&ge; 140/90)</option>
            </select>
          </div>
        )}

        {filteredRecords.length === 0 ? (
          <EmptyState
            title="Không có lần đo nào khớp"
            description="Xóa bộ lọc hoặc ghi nhận số đo mới."
            actionLabel="Ghi nhận chỉ số"
            onAction={onOpenLogModal}
          />
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden divide-y divide-stone-100">
              {mobileVisibleRecords.map((rec) => {
                const bpEval = classifyBloodPressure(rec.systolic, rec.diastolic);
                const gluEval = classifyBloodGlucose(rec.bloodGlucose, rec.glucoseContext);
                return (
                  <div key={rec.id} className="py-3 space-y-2">
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
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-stone-500 hover:text-[#DC2626] hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 min-[380px]:grid-cols-4 gap-2 text-sm tabular-nums">
                      <div>
                        <span className="text-xs text-stone-500 block">Huyết áp</span>
                        <strong className="text-[#1F2937]">{rec.systolic}/{rec.diastolic}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-stone-500 block">Nhịp tim</span>
                        <strong className="text-[#1F2937]">{rec.heartRate}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-stone-500 block">Đường</span>
                        <strong className="text-[#1F2937]">{rec.bloodGlucose}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-stone-500 block">Cân nặng</span>
                        <strong className="text-[#1F2937]">{rec.weightKg} kg</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Chip label={bpEval.label} variant={bpEval.status} className="text-xs px-2 py-0.5" />
                      <span className="text-xs text-stone-600">{gluEval.label}</span>
                    </div>
                  </div>
                );
              })}

              {filteredRecords.length > 5 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllMobileVitals((prev) => !prev)}
                    className="w-full min-h-[44px] px-4 py-2 rounded-2xl bg-[#FAF7F2] text-sm font-bold text-[#0B5F57] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>
                      {showAllMobileVitals ? 'Thu gọn' : `Xem thêm ${filteredRecords.length - 5} lần đo`}
                    </span>
                    <ChevronDown className={`w-4 h-4 ${showAllMobileVitals ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-xs font-bold text-stone-600">
                    <th className="py-2.5 pr-4">Ngày &amp; Giờ</th>
                    <th className="py-2.5 px-3 text-right">Huyết áp</th>
                    <th className="py-2.5 px-3 text-right">Nhịp tim</th>
                    <th className="py-2.5 px-3 text-right">SpO2</th>
                    <th className="py-2.5 px-3 text-right">Đường huyết</th>
                    <th className="py-2.5 px-3 text-right">Cân nặng</th>
                    <th className="py-2.5 px-3">Đánh giá</th>
                    <th className="py-2.5 pl-3 text-right">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {filteredRecords.map((rec) => {
                    const bpEval = classifyBloodPressure(rec.systolic, rec.diastolic);
                    const gluEval = classifyBloodGlucose(rec.bloodGlucose, rec.glucoseContext);
                    return (
                      <tr key={rec.id} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="py-2.5 pr-4 whitespace-nowrap">
                          <div className="font-bold text-[#1F2937] tabular-nums">
                            {formatDateDdMmYyyy(rec.date)} · {formatTime24h(rec.time)}
                          </div>
                          <div className="text-xs text-stone-600">
                            {humanizeDeviceSource(rec.deviceSource)}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-extrabold text-[#1F2937] whitespace-nowrap">
                          {rec.systolic}/{rec.diastolic}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#1F2937] whitespace-nowrap">
                          {rec.heartRate}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#1F2937] whitespace-nowrap">
                          {rec.spo2}%
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#1F2937] whitespace-nowrap">
                          {rec.bloodGlucose} mg/dL
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#1F2937] whitespace-nowrap">
                          {rec.weightKg} kg
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Chip label={bpEval.label} variant={bpEval.status} className="text-xs px-2 py-0.5" />
                            <span className="text-xs text-stone-600">{gluEval.label}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(rec.id)}
                            aria-label={`Xóa bản ghi ngày ${rec.date} lúc ${rec.time}`}
                            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl text-stone-500 hover:text-[#DC2626] hover:bg-red-50 cursor-pointer"
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
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
          <h3 className="text-lg font-bold text-[#1F2937]">
            Nhật ký bữa ăn ({meals.length} bữa)
          </h3>
        </div>

        <div className="md:hidden divide-y divide-stone-100">
          {mobileVisibleMeals.map((meal) => (
            <div key={meal.id} className="py-2.5 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#1F2937]">{meal.foodName}</span>
                <span className="text-sm font-extrabold text-[#0F766E] tabular-nums shrink-0">
                  {meal.calories} kcal
                </span>
              </div>
              <p className="text-xs text-stone-600 tabular-nums">
                Bữa {meal.mealType} · {formatDateDdMmYyyy(meal.date)} {formatTime24h(meal.time)}
              </p>
            </div>
          ))}
          {meals.length > 4 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAllMobileMeals((prev) => !prev)}
                className="w-full min-h-[44px] px-4 py-2 rounded-2xl bg-[#FAF7F2] text-sm font-bold text-[#0B5F57] inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{showAllMobileMeals ? 'Thu gọn' : `Xem thêm ${meals.length - 4} bữa`}</span>
                <ChevronDown className={`w-4 h-4 ${showAllMobileMeals ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-bold text-stone-600">
                <th className="py-2.5 pr-4">Ngày &amp; Giờ</th>
                <th className="py-2.5 px-3">Bữa</th>
                <th className="py-2.5 px-3">Món ăn</th>
                <th className="py-2.5 px-3 text-right">Calo</th>
                <th className="py-2.5 px-3 text-right">Đạm</th>
                <th className="py-2.5 px-3 text-right">Tinh bột</th>
                <th className="py-2.5 pl-3 text-right">Béo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {meals.map((meal) => (
                <tr key={meal.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-2.5 pr-4 tabular-nums text-stone-700 whitespace-nowrap">
                    {formatDateDdMmYyyy(meal.date)} · {formatTime24h(meal.time)}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#1F2937] whitespace-nowrap">
                    {meal.mealType}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[#1F2937]">{meal.foodName}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-extrabold text-[#0F766E] whitespace-nowrap">
                    {meal.calories} kcal
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-stone-700 whitespace-nowrap">
                    {meal.proteinG} g
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-stone-700 whitespace-nowrap">
                    {meal.carbsG} g
                  </td>
                  <td className="py-2.5 pl-3 text-right tabular-nums text-stone-700 whitespace-nowrap">
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

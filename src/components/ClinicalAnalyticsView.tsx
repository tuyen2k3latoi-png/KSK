import React, { useState } from 'react';
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
  Check,
  Copy,
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';

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

  const filteredRecords = records.filter((rec) => {
    const bp = classifyBloodPressure(rec.systolic, rec.diastolic);
    const matchesSearch =
      rec.date.includes(searchQuery) ||
      (rec.notes && rec.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      rec.deviceSource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || rec.deviceSource === sourceFilter;
    const matchesStatus = statusFilter === 'all' || bp.status === statusFilter;
    return matchesSearch && matchesSource && matchesStatus;
  });

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
    <div className="space-y-4 sm:space-y-6">
      {/* Offline Export Center for Vitals & Meals (CSV / JSON) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              Tải Sổ Sức khỏe Đưa Bác sĩ Xem hoặc Lưu trữ Về máy
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lưu về điện thoại hoặc máy tính toàn bộ lịch sử đo Huyết áp, Đường huyết ({filteredRecords.length} lần đo) và Nhật ký Bữa ăn ({meals.length} bữa) để gửi cho bác sĩ hoặc con cháu.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadCsv()}
              className="min-h-[40px] justify-center px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              Tải Sổ Bảng biểu (CSV)
            </button>
            <button
              type="button"
              onClick={() => handleDownloadJson()}
              className="min-h-[40px] justify-center px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <FileJson className="w-4 h-4 text-amber-400 shrink-0" />
              Tải Bản Sao lưu (JSON)
            </button>
            <button
              type="button"
              onClick={onResetSampleData}
              className="col-span-2 sm:col-span-1 min-h-[40px] justify-center px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              Khôi phục Dữ liệu Mẫu
            </button>
          </div>
        </div>

        {/* Scope Selection & Format Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 md:flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setExportScope('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                exportScope === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trọn bộ Sổ Sức khỏe ({filteredRecords.length} lần đo + {meals.length} bữa ăn)
            </button>
            <button
              type="button"
              onClick={() => setExportScope('vitals')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                exportScope === 'vitals'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chỉ riêng Huyết áp &amp; Sinh hiệu ({filteredRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setExportScope('meals')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                exportScope === 'meals'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chỉ riêng Nhật ký Bữa ăn ({meals.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-teal-600" />
              {showPreview ? 'Ẩn nội dung tệp' : 'Xem trước nội dung tệp'}
            </button>
          </div>
        </div>

        {exportMessage && (
          <div
            role="status"
            data-testid="export-status-banner"
            className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
          >
            <span>{exportMessage}</span>
            <span className="font-mono-tabular text-[11px] text-emerald-700 shrink-0">
              UTF-8 Offline Ready
            </span>
          </div>
        )}

        {/* Live Data Export Preview Box */}
        {showPreview && (
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                Bản xem trước dữ liệu ngoại tuyến ({previewFormat.toUpperCase()} · Phạm vi:{' '}
                <strong className="text-slate-800">
                  {exportScope === 'all'
                    ? 'Vitals + Meals'
                    : exportScope === 'vitals'
                    ? 'Vitals'
                    : 'Meals'}
                </strong>
                )
              </span>
              <button
                type="button"
                onClick={handleCopyPreview}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                {copiedPreview ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép nội dung
                  </>
                )}
              </button>
            </div>
            <pre
              data-testid="export-preview-content"
              className="p-3 sm:p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono-tabular overflow-x-auto max-h-48 leading-relaxed"
            >
              {activePreviewContent}
            </pre>
          </div>
        )}
      </div>

      {/* Clinical Vitals Section (Self-Adapting Cards on Mobile, Table on Laptop) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              Nhật ký Sinh hiệu Lâm sàng (Vitals — {filteredRecords.length} bản ghi)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tra cứu lịch sử đo lường, lọc theo nguồn cảm biến hoặc phân tầng nguy cơ huyết áp AHA
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadCsv('vitals')}
              className="flex-1 sm:flex-initial justify-center px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              CSV Vitals
            </button>
            <button
              type="button"
              onClick={() => handleDownloadJson('vitals')}
              className="flex-1 sm:flex-initial justify-center px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-600" />
              JSON Vitals
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 py-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Tìm kiếm theo ngày hoặc ghi chú"
              placeholder="Tìm theo ngày (2026-11-10) hoặc triệu chứng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <select
              aria-label="Lọc theo thiết bị đo"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">Tất cả nguồn thiết bị ({records.length})</option>
              <option value="Smartwatch BLE">Thiết bị đeo Smartwatch BLE</option>
              <option value="Máy đo Omron">Máy đo huyết áp Omron</option>
              <option value="Nhập thủ công">Nhập thủ công</option>
            </select>
          </div>

          <div>
            <select
              aria-label="Lọc theo phân loại huyết áp"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">Tất cả mức phân loại lâm sàng</option>
              <option value="normal">Huyết áp tối ưu (&le; 120/80)</option>
              <option value="elevated">Bình thường cao (121–129/&lt;80)</option>
              <option value="warning">Tăng huyết áp Độ 1 (130–139/80–89)</option>
              <option value="critical">Tăng huyết áp Độ 2 (&ge; 140/90)</option>
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-10 text-center border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700">
              Không tìm thấy bản ghi sinh hiệu nào khớp với điều kiện lọc.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Bạn có thể xóa bộ lọc tìm kiếm hoặc ghi nhận phép đo mới ngay bây giờ.
            </p>
            <button
              type="button"
              onClick={onOpenLogModal}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
            >
              Ghi nhận Chỉ số Đầu tiên
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Adaptive View (< 768px): Touch-Friendly Clinical Record Cards */}
            <div className="md:hidden divide-y divide-slate-100 border-t border-slate-100">
              {filteredRecords.map((rec) => {
                const bpEval = classifyBloodPressure(rec.systolic, rec.diastolic);
                const gluEval = classifyBloodGlucose(rec.bloodGlucose, rec.glucoseContext);
                return (
                  <div key={rec.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-xs text-slate-900 font-mono-tabular">
                          {rec.date} · {rec.time}
                        </span>
                        <span className="text-[11px] text-slate-500"> · {rec.deviceSource}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(rec.id)}
                        aria-label={`Xóa bản ghi ngày ${rec.date} lúc ${rec.time}`}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 min-[380px]:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs font-mono-tabular">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">Huyết áp</span>
                        <strong className="text-slate-900">
                          {rec.systolic}/{rec.diastolic}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">Nhịp tim</span>
                        <strong className="text-slate-900">{rec.heartRate} bpm</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">SpO2 &amp; Đường</span>
                        <strong className="text-slate-900">
                          {rec.spo2}% · {rec.bloodGlucose}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">Cân nặng</span>
                        <strong className="text-slate-900">{rec.weightKg} kg</strong>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700">
                      <span
                        className={`font-semibold ${
                          bpEval.status === 'normal'
                            ? 'text-emerald-700'
                            : bpEval.status === 'elevated'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {bpEval.label}
                      </span>
                      <span className="text-slate-400"> · </span>
                      <span className="text-slate-600">{gluEval.label}</span>
                    </div>
                    {rec.notes && (
                      <p className="text-[11px] text-slate-500 leading-relaxed">{rec.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Laptop / Tablet View (>= 768px): High-Density Clinical Table */}
            <div className="hidden md:block overflow-x-auto border-t border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                    <th className="py-3 pr-4">Thời gian đo</th>
                    <th className="py-3 px-3 text-right">Huyết áp (mmHg)</th>
                    <th className="py-3 px-3 text-right">Nhịp tim</th>
                    <th className="py-3 px-3 text-right">SpO2</th>
                    <th className="py-3 px-3 text-right">Đường huyết</th>
                    <th className="py-3 px-3 text-right">Cân nặng</th>
                    <th className="py-3 px-3">Phân loại Lâm sàng (AHA / ADA)</th>
                    <th className="py-3 pl-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRecords.map((rec) => {
                    const bpEval = classifyBloodPressure(rec.systolic, rec.diastolic);
                    const gluEval = classifyBloodGlucose(rec.bloodGlucose, rec.glucoseContext);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 font-mono-tabular">
                            {rec.date} · {rec.time}
                          </div>
                          <div className="text-[11px] text-slate-500">{rec.deviceSource}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular font-semibold text-slate-900 whitespace-nowrap">
                          {rec.systolic}/{rec.diastolic}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular text-slate-700 whitespace-nowrap">
                          {rec.heartRate} bpm
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular text-slate-700 whitespace-nowrap">
                          {rec.spo2}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular text-slate-700 whitespace-nowrap">
                          {rec.bloodGlucose} mg/dL
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular text-slate-700 whitespace-nowrap">
                          {rec.weightKg} kg
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-xs text-slate-800">
                            <span
                              className={`font-semibold ${
                                bpEval.status === 'normal'
                                  ? 'text-emerald-700'
                                  : bpEval.status === 'elevated'
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {bpEval.label}
                            </span>
                            <span className="text-slate-400"> · </span>
                            <span className="text-slate-600">{gluEval.label}</span>
                          </div>
                          {rec.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                              {rec.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pl-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(rec.id)}
                            aria-label={`Xóa bản ghi ngày ${rec.date} lúc ${rec.time}`}
                            className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
      </div>

      {/* Meals Export Summary Section (Cards on Mobile, Table on Laptop) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              Nhật ký Dinh dưỡng &amp; Khẩu phần Ăn (Meals — {meals.length} bữa ăn)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dữ liệu khẩu phần ăn và đa lượng (Protein, Carbs, Fat) sẵn sàng trích xuất ngoại tuyến
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadCsv('meals')}
              className="flex-1 sm:flex-initial justify-center px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              CSV Meals
            </button>
            <button
              type="button"
              onClick={() => handleDownloadJson('meals')}
              className="flex-1 sm:flex-initial justify-center px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-600" />
              JSON Meals
            </button>
          </div>
        </div>

        {/* Mobile Cards for Meals */}
        <div className="md:hidden divide-y divide-slate-100">
          {meals.map((meal) => (
            <div key={meal.id} className="py-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900">{meal.foodName}</span>
                <span className="text-xs font-bold text-teal-700 font-mono-tabular shrink-0">
                  {meal.calories} kcal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono-tabular">
                Bữa {meal.mealType} · {meal.date} {meal.time} · Đạm {meal.proteinG}g · Carb{' '}
                {meal.carbsG}g · Béo {meal.fatG}g
              </p>
            </div>
          ))}
        </div>

        {/* Laptop Table for Meals */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <th className="py-3 pr-4">Ngày &amp; Giờ</th>
                <th className="py-3 px-3">Bữa ăn</th>
                <th className="py-3 px-3">Tên món ăn / Khẩu phần</th>
                <th className="py-3 px-3 text-right">Năng lượng</th>
                <th className="py-3 px-3 text-right">Đạm (Protein)</th>
                <th className="py-3 px-3 text-right">Tinh bột (Carbs)</th>
                <th className="py-3 pl-3 text-right">Chất béo (Fat)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {meals.map((meal) => (
                <tr key={meal.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pr-4 font-mono-tabular text-slate-700 whitespace-nowrap">
                    {meal.date} · {meal.time}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                    Bữa {meal.mealType}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{meal.foodName}</td>
                  <td className="py-3 px-3 text-right font-mono-tabular font-semibold text-teal-700 whitespace-nowrap">
                    {meal.calories} kcal
                  </td>
                  <td className="py-3 px-3 text-right font-mono-tabular text-slate-700 whitespace-nowrap">
                    {meal.proteinG} g
                  </td>
                  <td className="py-3 px-3 text-right font-mono-tabular text-slate-700 whitespace-nowrap">
                    {meal.carbsG} g
                  </td>
                  <td className="py-3 pl-3 text-right font-mono-tabular text-slate-700 whitespace-nowrap">
                    {meal.fatG} g
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

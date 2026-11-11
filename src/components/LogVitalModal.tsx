import React, { useState } from 'react';
import { VitalRecord } from '../types/health';
import {
  classifyBloodGlucose,
  classifyBloodPressure,
  validateVitalEntry,
} from '../utils/healthCalculations';
import { Activity, Bluetooth, CheckCircle2, X } from 'lucide-react';

interface LogVitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<VitalRecord, 'id'>) => void;
  defaultWeightKg: number;
}

export const LogVitalModal: React.FC<LogVitalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultWeightKg,
}) => {
  const [systolic, setSystolic] = useState<string>('120');
  const [diastolic, setDiastolic] = useState<string>('78');
  const [heartRate, setHeartRate] = useState<string>('70');
  const [spo2, setSpo2] = useState<string>('98');
  const [bloodGlucose, setBloodGlucose] = useState<string>('95');
  const [glucoseContext, setGlucoseContext] = useState<'fasting' | 'post_meal'>('fasting');
  const [temperatureC, setTemperatureC] = useState<string>('36.6');
  const [weightKg, setWeightKg] = useState<string>(String(defaultWeightKg));
  const [sleepHours, setSleepHours] = useState<string>('7.5');
  const [steps, setSteps] = useState<string>('7500');
  const [deviceSource, setDeviceSource] = useState<VitalRecord['deviceSource']>('Nhập thủ công');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSyncingWearable, setIsSyncingWearable] = useState(false);

  if (!isOpen) return null;

  const numSys = Number(systolic);
  const numDia = Number(diastolic);
  const numGlu = Number(bloodGlucose);

  const liveBpEval =
    Number.isFinite(numSys) && Number.isFinite(numDia) && numSys > numDia
      ? classifyBloodPressure(numSys, numDia)
      : null;

  const liveGluEval = Number.isFinite(numGlu)
    ? classifyBloodGlucose(numGlu, glucoseContext)
    : null;

  const handleSimulateBleSync = () => {
    setIsSyncingWearable(true);
    setErrorMessage(null);
    setTimeout(() => {
      setSystolic('119');
      setDiastolic('76');
      setHeartRate('67');
      setSpo2('99');
      setBloodGlucose('92');
      setTemperatureC('36.6');
      setSteps('8420');
      setSleepHours('7.6');
      setDeviceSource('Smartwatch BLE');
      setNotes('Đồng bộ tự động qua giao thức Bluetooth GATT (Heart Rate & Pulse Oximeter Profile).');
      setIsSyncingWearable(false);
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = {
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      heartRate: Number(heartRate),
      spo2: Number(spo2),
      bloodGlucose: Number(bloodGlucose),
      weightKg: Number(weightKg),
      sleepHours: Number(sleepHours),
    };

    const validation = validateVitalEntry(parsed);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Dữ liệu nhập không hợp lệ.');
      return;
    }

    const now = new Date();
    const dateStr = '2026-11-10';
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    onSave({
      date: dateStr,
      time: timeStr,
      systolic: parsed.systolic,
      diastolic: parsed.diastolic,
      heartRate: parsed.heartRate,
      spo2: parsed.spo2,
      bloodGlucose: parsed.bloodGlucose,
      glucoseContext,
      temperatureC: Number(temperatureC) || 36.6,
      weightKg: parsed.weightKg,
      sleepHours: parsed.sleepHours,
      steps: Math.max(0, Math.round(Number(steps) || 0)),
      deviceSource,
      notes: notes.trim() || 'Ghi nhận chỉ số định kỳ trong ngày.',
    });

    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-vital-title"
    >
      {/* Self-adapts as a Bottom Sheet on Mobile and a Centered Dialog on Laptop */}
      <div className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-xl max-h-[92dvh] overflow-y-auto pb-safe">
        {/* Mobile Pull Handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-vital-title" className="text-base sm:text-lg font-semibold text-slate-900">
                Ghi nhận Chỉ số Sinh tồn Mới
              </h2>
              <p className="text-xs text-slate-500">
                Nhập từ thiết bị y tế gia đình hoặc đồng bộ cảm biến đeo tay BLE
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ ghi nhận chỉ số"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wearable BLE Quick Sync Bar */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Thiết bị Đeo (IoT Wearable BLE):</span>{' '}
            Đồng bộ nhanh Nhịp tim, SpO2, Giấc ngủ và Bước chân.
          </div>
          <button
            type="button"
            onClick={handleSimulateBleSync}
            disabled={isSyncingWearable}
            className="min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-medium bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Bluetooth className="w-3.5 h-3.5 text-teal-600" />
            {isSyncingWearable ? 'Đang đọc cảm biến...' : 'Đồng bộ Smartwatch BLE'}
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-3.5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="input-systolic"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                HA Tâm thu (mmHg)
              </label>
              <input
                id="input-systolic"
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>

            <div>
              <label
                htmlFor="input-diastolic"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                HA Tâm trương (mmHg)
              </label>
              <input
                id="input-diastolic"
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label
                htmlFor="input-heart-rate"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nhịp tim (bpm)
              </label>
              <input
                id="input-heart-rate"
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="input-spo2" className="block text-xs font-medium text-slate-700 mb-1">
                Oxy máu SpO2 (%)
              </label>
              <input
                id="input-spo2"
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>

            <div>
              <label
                htmlFor="input-glucose"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Đường huyết (mg/dL)
              </label>
              <input
                id="input-glucose"
                type="number"
                value={bloodGlucose}
                onChange={(e) => setBloodGlucose(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label
                htmlFor="select-glucose-context"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Thời điểm đo đường
              </label>
              <select
                id="select-glucose-context"
                value={glucoseContext}
                onChange={(e) => setGlucoseContext(e.target.value as 'fasting' | 'post_meal')}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="fasting">Lúc đói (Nhịn ăn &ge; 8h)</option>
                <option value="post_meal">Sau ăn 2 giờ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="input-weight"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Cân nặng (kg)
              </label>
              <input
                id="input-weight"
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>

            <div>
              <label htmlFor="input-temp" className="block text-xs font-medium text-slate-700 mb-1">
                Thân nhiệt (°C)
              </label>
              <input
                id="input-temp"
                type="number"
                step="0.1"
                value={temperatureC}
                onChange={(e) => setTemperatureC(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label
                htmlFor="input-sleep"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Giấc ngủ (giờ)
              </label>
              <input
                id="input-sleep"
                type="number"
                step="0.1"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label
                htmlFor="input-steps"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Số bước chân
              </label>
              <input
                id="input-steps"
                type="number"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="select-device-source"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nguồn thiết bị đo
              </label>
              <select
                id="select-device-source"
                value={deviceSource}
                onChange={(e) => setDeviceSource(e.target.value as VitalRecord['deviceSource'])}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="Nhập thủ công">Nhập thủ công</option>
                <option value="Smartwatch BLE">Smartwatch BLE</option>
                <option value="Máy đo Omron">Máy đo Omron</option>
              </select>
            </div>

            <div>
              <label htmlFor="input-notes" className="block text-xs font-medium text-slate-700 mb-1">
                Ghi chú lâm sàng / Triệu chứng
              </label>
              <input
                id="input-notes"
                type="text"
                placeholder="VD: Đo sau khi nghỉ ngơi 10 phút..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {liveBpEval && liveGluEval && (
            <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 text-xs text-slate-700 space-y-1">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                Nhận định Tự động (Chuẩn AHA &amp; ADA):
              </div>
              <p>
                <span>Huyết áp: </span>
                <strong className="text-slate-900">{liveBpEval.label}</strong> ·{' '}
                <span>{liveBpEval.recommendation}</span>
              </p>
              <p>
                <span>Đường huyết: </span>
                <strong className="text-slate-900">{liveGluEval.label}</strong> ·{' '}
                <span>{liveGluEval.recommendation}</span>
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl sm:rounded-lg transition-colors whitespace-nowrap"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-initial min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl sm:rounded-lg transition-colors whitespace-nowrap"
            >
              Lưu Chỉ số Sinh tồn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

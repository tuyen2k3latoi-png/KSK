import React, { useState } from 'react';
import { VitalRecord } from '../types/health';

interface VitalsTrendChartProps {
  records: VitalRecord[];
}

type ChartMetric = 'bp' | 'hr_spo2' | 'glucose_weight' | 'sleep_steps';

export const VitalsTrendChart: React.FC<VitalsTrendChartProps> = ({ records }) => {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('bp');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chronological = [...records]
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(-7);

  if (chronological.length === 0) {
    return (
      <div className="p-6 sm:p-8 text-center border border-slate-200 rounded-xl bg-white">
        <p className="text-sm text-slate-500">Chưa có dữ liệu đo lường để hiển thị biểu đồ xu hướng.</p>
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const padLeft = 38;
  const padRight = 20;
  const padTop = 24;
  const padBottom = 32;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) => {
    if (chronological.length === 1) return padLeft + plotW / 2;
    return padLeft + (idx / (chronological.length - 1)) * plotW;
  };

  let minY = 55;
  let maxY = 160;
  let unit = 'mmHg';
  let primaryLabel = 'Huyết áp Tâm thu';
  let secondaryLabel = 'Huyết áp Tâm trương';

  if (activeMetric === 'bp') {
    minY = 55;
    maxY = 160;
    unit = 'mmHg';
    primaryLabel = 'Huyết áp Tâm thu';
    secondaryLabel = 'Huyết áp Tâm trương';
  } else if (activeMetric === 'hr_spo2') {
    minY = 50;
    maxY = 115;
    unit = 'bpm / %';
    primaryLabel = 'Nhịp tim (bpm)';
    secondaryLabel = 'SpO2 (%)';
  } else if (activeMetric === 'glucose_weight') {
    minY = 50;
    maxY = 145;
    unit = 'mg/dL / kg';
    primaryLabel = 'Đường huyết (mg/dL)';
    secondaryLabel = 'Cân nặng (kg)';
  } else {
    minY = 0;
    maxY = 12;
    unit = 'giờ / nghìn bước';
    primaryLabel = 'Giấc ngủ (giờ)';
    secondaryLabel = 'Bước chân (x1000)';
  }

  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    const ratio = (clamped - minY) / (maxY - minY);
    return padTop + plotH - ratio * plotH;
  };

  const primaryPoints = chronological.map((r, i) => {
    const val =
      activeMetric === 'bp'
        ? r.systolic
        : activeMetric === 'hr_spo2'
        ? r.heartRate
        : activeMetric === 'glucose_weight'
        ? r.bloodGlucose
        : r.sleepHours;
    return { x: getX(i), y: getY(val), val, record: r };
  });

  const secondaryPoints = chronological.map((r, i) => {
    const val =
      activeMetric === 'bp'
        ? r.diastolic
        : activeMetric === 'hr_spo2'
        ? r.spo2
        : activeMetric === 'glucose_weight'
        ? r.weightKg
        : Number((r.steps / 1000).toFixed(1));
    return { x: getX(i), y: getY(val), val, record: r };
  });

  const buildPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const gridTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(minY + t * (maxY - minY)));

  const activePointIndex = hoveredIndex !== null ? hoveredIndex : chronological.length - 1;
  const activeRecord = chronological[activePointIndex] || chronological[chronological.length - 1];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900">
            Biểu đồ Xu hướng Sinh hiệu Lâm sàng (7 lần đo gần nhất)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Đơn vị đo: {unit} · Chạm hoặc di chuột vào từng điểm để xem chi tiết
          </p>
        </div>

        {/* Self-Adapting Filter Tabs (2x2 grid on small phones, single row on tablet/laptop) */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveMetric('bp')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
              activeMetric === 'bp'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Huyết áp
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('hr_spo2')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
              activeMetric === 'hr_spo2'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhịp tim &amp; SpO2
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('glucose_weight')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
              activeMetric === 'glucose_weight'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đường &amp; Cân nặng
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('sleep_steps')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
              activeMetric === 'sleep_steps'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ngủ &amp; Bước chân
          </button>
        </div>
      </div>

      {/* Legend & Selected Day Summary Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <span className="flex items-center gap-1.5 font-medium text-slate-800">
            <span className="w-3 h-0.5 bg-teal-600 inline-block" />
            {primaryLabel}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-0.5 bg-indigo-500 inline-block" />
            {secondaryLabel}
          </span>
          {activeMetric === 'bp' && (
            <span className="text-slate-500 hidden sm:inline">
              Chuẩn khuyến nghị AHA: &le; 120/80 mmHg
            </span>
          )}
        </div>

        {activeRecord && (
          <div className="font-mono-tabular text-[11px] sm:text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200/80">
            {activeRecord.date} ({activeRecord.time}) · HA:{' '}
            <strong>
              {activeRecord.systolic}/{activeRecord.diastolic}
            </strong>{' '}
            · Tim: <strong>{activeRecord.heartRate}</strong> · Đường:{' '}
            <strong>{activeRecord.bloodGlucose}</strong>
          </div>
        )}
      </div>

      {/* Fluid Responsive SVG Chart (Fits 100% width on both mobile and desktop) */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
          role="img"
          aria-label={`Biểu đồ xu hướng ${primaryLabel} và ${secondaryLabel}`}
        >
          {activeMetric === 'bp' && (
            <rect
              x={padLeft}
              y={getY(120)}
              width={plotW}
              height={getY(80) - getY(120)}
              fill="#0D9488"
              fillOpacity="0.06"
            />
          )}

          {gridTicks.map((tick) => {
            const yPos = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={width - padRight}
                  y2={yPos}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={yPos + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono-tabular"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          <path
            d={buildPath(primaryPoints)}
            fill="none"
            stroke="#0D9488"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={buildPath(secondaryPoints)}
            fill="none"
            stroke="#6366F1"
            strokeWidth="2"
            strokeDasharray="4 2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {primaryPoints.map((pt, idx) => {
            const secPt = secondaryPoints[idx];
            const isHovered = activePointIndex === idx;
            const shortDate = pt.record.date.slice(5);
            return (
              <g
                key={pt.record.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onClick={() => setHoveredIndex(idx)}
              >
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={padTop}
                    x2={pt.x}
                    y2={height - padBottom}
                    stroke="#94A3B8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 4}
                  fill="#FFFFFF"
                  stroke="#0D9488"
                  strokeWidth={isHovered ? 3 : 2}
                />
                <text
                  x={pt.x}
                  y={pt.y - 9}
                  textAnchor="middle"
                  className="fill-teal-800 text-[10px] font-semibold font-mono-tabular"
                >
                  {pt.val}
                </text>

                <circle
                  cx={secPt.x}
                  cy={secPt.y}
                  r={isHovered ? 5 : 3.5}
                  fill="#FFFFFF"
                  stroke="#6366F1"
                  strokeWidth={isHovered ? 2.5 : 2}
                />
                <text
                  x={secPt.x}
                  y={secPt.y + 15}
                  textAnchor="middle"
                  className="fill-indigo-700 text-[10px] font-medium font-mono-tabular"
                >
                  {secPt.val}
                </text>

                <text
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  className={`text-[11px] font-mono-tabular ${
                    isHovered ? 'fill-slate-900 font-semibold' : 'fill-slate-500'
                  }`}
                >
                  {shortDate}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

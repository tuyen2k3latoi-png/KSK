import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { VitalRecord } from '../types/health';
import { prepareSevenDayVitalsBarData } from '../utils/healthCalculations';

interface VitalsBarChartPanelProps {
  records: VitalRecord[];
}

type BarMetricGroup = 'bp' | 'cardio' | 'metabolic' | 'activity';

interface BarMetricConfig {
  id: BarMetricGroup;
  tabLabel: string;
  title: string;
  unitLabel: string;
  primaryKey: 'systolic' | 'heartRate' | 'bloodGlucose' | 'steps';
  primaryName: string;
  primaryColor: string;
  secondaryKey: 'diastolic' | 'spo2' | 'weightKg' | 'sleepHours';
  secondaryName: string;
  secondaryColor: string;
  referenceValue?: number;
  referenceLabel?: string;
  useDualAxis?: boolean;
}

const BAR_METRIC_CONFIGS: Record<BarMetricGroup, BarMetricConfig> = {
  bp: {
    id: 'bp',
    tabLabel: 'Huyết áp',
    title: 'Biểu đồ Theo dõi 7 Ngày: Huyết áp (mmHg)',
    unitLabel: 'mmHg',
    primaryKey: 'systolic',
    primaryName: 'Huyết áp Tâm thu (mmHg)',
    primaryColor: '#0D9488',
    secondaryKey: 'diastolic',
    secondaryName: 'Huyết áp Tâm trương (mmHg)',
    secondaryColor: '#4F46E5',
    referenceValue: 120,
    referenceLabel: 'Ngưỡng chuẩn 120 mmHg',
  },
  cardio: {
    id: 'cardio',
    tabLabel: 'Nhịp tim & SpO2',
    title: 'Biểu đồ Theo dõi 7 Ngày: Nhịp tim & Oxy máu SpO2',
    unitLabel: 'bpm / %',
    primaryKey: 'heartRate',
    primaryName: 'Nhịp tim (bpm)',
    primaryColor: '#E11D48',
    secondaryKey: 'spo2',
    secondaryName: 'SpO2 (%)',
    secondaryColor: '#0284C7',
    referenceValue: 95,
    referenceLabel: 'SpO2 tối thiểu 95%',
  },
  metabolic: {
    id: 'metabolic',
    tabLabel: 'Đường & Cân nặng',
    title: 'Biểu đồ Theo dõi 7 Ngày: Đường huyết & Cân nặng',
    unitLabel: 'mg/dL / kg',
    primaryKey: 'bloodGlucose',
    primaryName: 'Đường huyết (mg/dL)',
    primaryColor: '#D97706',
    secondaryKey: 'weightKg',
    secondaryName: 'Cân nặng (kg)',
    secondaryColor: '#7C3AED',
    referenceValue: 100,
    referenceLabel: 'Đường đói chuẩn < 100 mg/dL',
  },
  activity: {
    id: 'activity',
    tabLabel: 'Bước chân & Ngủ',
    title: 'Biểu đồ Theo dõi 7 Ngày: Bước chân & Giấc ngủ',
    unitLabel: 'Bước / Giờ',
    primaryKey: 'steps',
    primaryName: 'Số bước chân (bước)',
    primaryColor: '#059669',
    secondaryKey: 'sleepHours',
    secondaryName: 'Giấc ngủ (giờ)',
    secondaryColor: '#6366F1',
    useDualAxis: true,
  },
};

export const VitalsBarChartPanel: React.FC<VitalsBarChartPanelProps> = ({ records }) => {
  const [selectedGroup, setSelectedGroup] = useState<BarMetricGroup>('bp');
  const { items, averages } = prepareSevenDayVitalsBarData(records);
  const config = BAR_METRIC_CONFIGS[selectedGroup];

  return (
    <section
      aria-label="Bảng điều khiển biểu đồ thanh chỉ số sinh tồn 7 ngày"
      data-testid="vitals-recharts-bar-panel"
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4"
    >
      {/* Panel Header & Metric Switcher */}
      <div className="flex flex-col gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {config.title}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            So sánh 7 lần đo gần nhất
          </span>
        </div>

        {/* 2x2 Grid on Mobile, Segmented Bar on Tablet/Desktop */}
        <div
          role="tablist"
          aria-label="Chọn nhóm chỉ số biểu đồ thanh"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-100 p-1 rounded-lg"
        >
          {(Object.keys(BAR_METRIC_CONFIGS) as BarMetricGroup[]).map((key) => {
            const item = BAR_METRIC_CONFIGS[key];
            const isActive = selectedGroup === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-testid={`bar-tab-${key}`}
                onClick={() => setSelectedGroup(key)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap text-center cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.tabLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* 7-Day Average KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200/70">
          <p className="text-[11px] text-slate-500">TB Huyết áp (7 ngày)</p>
          <p
            data-testid="bar-avg-bp"
            className="text-sm sm:text-base font-bold text-slate-900 font-mono-tabular mt-0.5"
          >
            {averages.systolic}/{averages.diastolic}{' '}
            <span className="text-[11px] font-normal text-slate-500">mmHg</span>
          </p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200/70">
          <p className="text-[11px] text-slate-500">TB Nhịp tim &amp; SpO2</p>
          <p className="text-sm sm:text-base font-bold text-slate-900 font-mono-tabular mt-0.5">
            {averages.heartRate}{' '}
            <span className="text-[11px] font-normal text-slate-500">bpm</span> ·{' '}
            <span className="text-teal-700">{averages.spo2}%</span>
          </p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200/70">
          <p className="text-[11px] text-slate-500">TB Đường huyết &amp; Cân nặng</p>
          <p className="text-sm sm:text-base font-bold text-slate-900 font-mono-tabular mt-0.5">
            {averages.bloodGlucose}{' '}
            <span className="text-[11px] font-normal text-slate-500">mg/dL</span> ·{' '}
            <span className="text-indigo-700">{averages.weightKg}kg</span>
          </p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200/70">
          <p className="text-[11px] text-slate-500">TB Bước chân &amp; Giấc ngủ</p>
          <p className="text-sm sm:text-base font-bold text-slate-900 font-mono-tabular mt-0.5">
            {averages.steps.toLocaleString('vi-VN')} ·{' '}
            <span className="text-emerald-700">{averages.sleepHours}h</span>
          </p>
        </div>
      </div>

      {/* Recharts BarChart Container */}
      <div className="w-full h-64 sm:h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={items}
            margin={{ top: 10, right: 12, left: -12, bottom: 4 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: '#475569', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={{ stroke: '#CBD5E1' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            {config.useDualAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#6366F1', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
              />
            )}
            <Tooltip
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                borderRadius: '0.75rem',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
              }}
              labelFormatter={(_label, payload) => {
                const first = payload && payload[0] && payload[0].payload;
                return first ? `Thời điểm đo: ${first.fullDate} (${first.deviceSource})` : '';
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              iconType="circle"
            />
            {config.referenceValue !== undefined && (
              <ReferenceLine
                yAxisId="left"
                y={config.referenceValue}
                stroke="#0F766E"
                strokeDasharray="4 4"
                label={{
                  value: config.referenceLabel,
                  position: 'insideTopRight',
                  fill: '#0F766E',
                  fontSize: 11,
                }}
              />
            )}
            <Bar
              yAxisId="left"
              dataKey={config.primaryKey}
              name={config.primaryName}
              fill={config.primaryColor}
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              yAxisId={config.useDualAxis ? 'right' : 'left'}
              dataKey={config.secondaryKey}
              name={config.secondaryName}
              fill={config.secondaryColor}
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

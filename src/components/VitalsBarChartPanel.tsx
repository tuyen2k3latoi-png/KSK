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
import {
  formatDateDdMmYyyy,
  formatShortDateDdMm,
  formatTime24h,
  humanizeDeviceSource,
} from '../utils/formatters';
import { prepareSevenDayVitalsBarData } from '../utils/healthCalculations';
import { Card } from './ui/Primitives';

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
    title: 'Biểu đồ 7 ngày',
    unitLabel: 'mmHg',
    primaryKey: 'systolic',
    primaryName: 'Tâm thu (mmHg)',
    primaryColor: '#0F766E',
    secondaryKey: 'diastolic',
    secondaryName: 'Tâm trương (mmHg)',
    secondaryColor: '#0284C7',
    referenceValue: 120,
    referenceLabel: 'Chuẩn 120',
  },
  cardio: {
    id: 'cardio',
    tabLabel: 'Nhịp tim & SpO2',
    title: 'Biểu đồ 7 ngày',
    unitLabel: 'bpm / %',
    primaryKey: 'heartRate',
    primaryName: 'Nhịp tim (bpm)',
    primaryColor: '#DC2626',
    secondaryKey: 'spo2',
    secondaryName: 'SpO2 (%)',
    secondaryColor: '#0F766E',
    referenceValue: 95,
    referenceLabel: 'SpO2 ≥ 95%',
  },
  metabolic: {
    id: 'metabolic',
    tabLabel: 'Đường huyết',
    title: 'Biểu đồ 7 ngày',
    unitLabel: 'mg/dL / kg',
    primaryKey: 'bloodGlucose',
    primaryName: 'Đường huyết (mg/dL)',
    primaryColor: '#F59E0B',
    secondaryKey: 'weightKg',
    secondaryName: 'Cân nặng (kg)',
    secondaryColor: '#0B5F57',
    referenceValue: 100,
    referenceLabel: 'Đói < 100',
  },
  activity: {
    id: 'activity',
    tabLabel: 'Bước & Ngủ',
    title: 'Biểu đồ 7 ngày',
    unitLabel: 'Bước / Giờ',
    primaryKey: 'steps',
    primaryName: 'Bước chân',
    primaryColor: '#0F766E',
    secondaryKey: 'sleepHours',
    secondaryName: 'Giấc ngủ (giờ)',
    secondaryColor: '#D97706',
    useDualAxis: true,
  },
};

export const VitalsBarChartPanel: React.FC<VitalsBarChartPanelProps> = ({ records }) => {
  const [selectedGroup, setSelectedGroup] = useState<BarMetricGroup>('bp');
  const { items, averages } = prepareSevenDayVitalsBarData(records);
  const config = BAR_METRIC_CONFIGS[selectedGroup];

  const chartItems = items.map((item) => {
    const rawParts = item.fullDate.split(' ');
    const datePart = formatDateDdMmYyyy(rawParts[0] || '');
    const timePart = formatTime24h(rawParts[1] || '07:00');
    return {
      ...item,
      displayDateLabel: formatShortDateDdMm(item.dateLabel),
      formattedFullDate: `${datePart} lúc ${timePart}`,
      humanDeviceSource: humanizeDeviceSource(item.deviceSource),
    };
  });

  const activeAverageLabel =
    selectedGroup === 'bp'
      ? `Trung bình: ${averages.systolic}/${averages.diastolic} mmHg`
      : selectedGroup === 'cardio'
      ? `Trung bình: ${averages.heartRate} bpm · ${averages.spo2}%`
      : selectedGroup === 'metabolic'
      ? `Trung bình: ${averages.bloodGlucose} mg/dL · ${averages.weightKg} kg`
      : `Trung bình: ${averages.steps.toLocaleString('vi-VN')} bước · ${averages.sleepHours} giờ`;

  return (
    <Card
      as="section"
      ariaLabel="Biểu đồ 7 ngày gần nhất"
      testId="vitals-recharts-bar-panel"
      className="space-y-3.5"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0F766E] shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">
              {config.title}
            </h2>
          </div>
          <span
            data-testid="bar-avg-bp"
            className="text-sm font-bold text-[#0B5F57] bg-[#FAF7F2] px-3 py-1 rounded-xl border border-stone-200 tabular-nums"
          >
            {activeAverageLabel}
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Chọn chỉ số xem biểu đồ"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#FAF7F2] p-1.5 rounded-2xl border border-stone-200/80"
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
                className={`min-h-[42px] px-3 py-1.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap text-center cursor-pointer ${
                  isActive
                    ? 'bg-[#0F766E] text-white shadow-2xs'
                    : 'text-[#1F2937] hover:bg-white'
                }`}
              >
                {item.tabLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Biểu đồ cột Recharts (font Be Vietnam Pro, ngày dd/mm) */}
      <div className="w-full h-60 sm:h-68 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartItems}
            margin={{ top: 10, right: 12, left: -10, bottom: 4 }}
            barGap={5}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
            <XAxis
              dataKey="displayDateLabel"
              tick={{ fill: '#1F2937', fontSize: 13, fontFamily: 'Be Vietnam Pro, sans-serif' }}
              axisLine={{ stroke: '#D6D3D1' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#57534E', fontSize: 13, fontFamily: 'Be Vietnam Pro, sans-serif' }}
              axisLine={false}
              tickLine={false}
            />
            {config.useDualAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#D97706', fontSize: 13, fontFamily: 'Be Vietnam Pro, sans-serif' }}
                axisLine={false}
                tickLine={false}
              />
            )}
            <Tooltip
              cursor={{ fill: '#FAF7F2' }}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E7E5E4',
                borderRadius: '16px',
                fontSize: '14px',
                fontFamily: 'Be Vietnam Pro, sans-serif',
                boxShadow: '0 8px 24px rgba(11, 95, 87, 0.12)',
              }}
              labelFormatter={(_label, payload) => {
                const first = payload && payload[0] && payload[0].payload;
                return first
                  ? `Ngày đo: ${first.formattedFullDate} (${first.humanDeviceSource})`
                  : '';
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '14px', paddingTop: '8px', fontFamily: 'Be Vietnam Pro, sans-serif' }}
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
                  fill: '#0B5F57',
                  fontSize: 12,
                }}
              />
            )}
            <Bar
              yAxisId="left"
              dataKey={config.primaryKey}
              name={config.primaryName}
              fill={config.primaryColor}
              radius={[8, 8, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              yAxisId={config.useDualAxis ? 'right' : 'left'}
              dataKey={config.secondaryKey}
              name={config.secondaryName}
              fill={config.secondaryColor}
              radius={[8, 8, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

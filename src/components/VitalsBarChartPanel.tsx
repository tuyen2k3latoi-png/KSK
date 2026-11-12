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
    title: 'Biểu đồ 7 ngày gần nhất: Huyết áp (mmHg)',
    unitLabel: 'mmHg',
    primaryKey: 'systolic',
    primaryName: 'Tâm thu (mmHg)',
    primaryColor: '#0F766E',
    secondaryKey: 'diastolic',
    secondaryName: 'Tâm trương (mmHg)',
    secondaryColor: '#0284C7',
    referenceValue: 120,
    referenceLabel: 'Ngưỡng chuẩn 120 mmHg',
  },
  cardio: {
    id: 'cardio',
    tabLabel: 'Nhịp tim & Oxy',
    title: 'Biểu đồ 7 ngày gần nhất: Nhịp tim & Oxy máu SpO2',
    unitLabel: 'bpm / %',
    primaryKey: 'heartRate',
    primaryName: 'Nhịp tim (bpm)',
    primaryColor: '#DC2626',
    secondaryKey: 'spo2',
    secondaryName: 'Oxy máu SpO2 (%)',
    secondaryColor: '#0F766E',
    referenceValue: 95,
    referenceLabel: 'SpO2 tối thiểu 95%',
  },
  metabolic: {
    id: 'metabolic',
    tabLabel: 'Đường huyết',
    title: 'Biểu đồ 7 ngày gần nhất: Đường huyết & Cân nặng',
    unitLabel: 'mg/dL / kg',
    primaryKey: 'bloodGlucose',
    primaryName: 'Đường huyết (mg/dL)',
    primaryColor: '#F59E0B',
    secondaryKey: 'weightKg',
    secondaryName: 'Cân nặng (kg)',
    secondaryColor: '#0B5F57',
    referenceValue: 100,
    referenceLabel: 'Đường đói chuẩn < 100 mg/dL',
  },
  activity: {
    id: 'activity',
    tabLabel: 'Bước chân & Ngủ',
    title: 'Biểu đồ 7 ngày gần nhất: Bước chân & Giấc ngủ',
    unitLabel: 'Bước / Giờ',
    primaryKey: 'steps',
    primaryName: 'Số bước chân (bước)',
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

  return (
    <Card
      as="section"
      ariaLabel="Bảng điều khiển biểu đồ thanh chỉ số sinh tồn 7 ngày"
      testId="vitals-recharts-bar-panel"
      className="space-y-4"
    >
      {/* Tiêu đề & Thanh chọn nhóm chỉ số */}
      <div className="flex flex-col gap-3 pb-3 border-b border-stone-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0F766E] shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">
              {config.title}
            </h2>
          </div>
          <span className="text-sm font-medium text-stone-600">
            So sánh 7 lần đo gần nhất
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Chọn nhóm chỉ số biểu đồ thanh"
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
                className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap text-center cursor-pointer ${
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

      {/* Dải trung bình 7 ngày (Dùng đường kẻ mảnh thay vì hộp lồng hộp rườm rà) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1 pb-2 border-b border-stone-100">
        <div>
          <p className="text-sm text-stone-600">Trung bình Huyết áp</p>
          <p
            data-testid="bar-avg-bp"
            className="text-lg font-extrabold text-[#1F2937] tabular-nums mt-0.5"
          >
            {averages.systolic}/{averages.diastolic}{' '}
            <span className="text-sm font-semibold text-stone-500">mmHg</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-stone-600">Trung bình Nhịp tim &amp; Oxy</p>
          <p className="text-lg font-extrabold text-[#1F2937] tabular-nums mt-0.5">
            {averages.heartRate}{' '}
            <span className="text-sm font-semibold text-stone-500">bpm</span> ·{' '}
            <span className="text-[#0F766E]">{averages.spo2}%</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-stone-600">Trung bình Đường huyết</p>
          <p className="text-lg font-extrabold text-[#1F2937] tabular-nums mt-0.5">
            {averages.bloodGlucose}{' '}
            <span className="text-sm font-semibold text-stone-500">mg/dL</span> ·{' '}
            <span className="text-[#0B5F57]">{averages.weightKg} kg</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-stone-600">Trung bình Bước chân &amp; Ngủ</p>
          <p className="text-lg font-extrabold text-[#1F2937] tabular-nums mt-0.5">
            {averages.steps.toLocaleString('vi-VN')} ·{' '}
            <span className="text-[#0F766E]">{averages.sleepHours} giờ</span>
          </p>
        </div>
      </div>

      {/* Biểu đồ cột Recharts (font Be Vietnam Pro, ngày dd/mm) */}
      <div className="w-full h-64 sm:h-72 pt-2">
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

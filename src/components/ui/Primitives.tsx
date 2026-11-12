import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Inbox,
} from 'lucide-react';
import { HealthStatusLevel } from '../../types/health';
import { MetricTrendInfo } from '../../utils/formatters';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
  as?: 'div' | 'section' | 'article';
  ariaLabel?: string;
}

/**
 * Thẻ chuẩn của Hệ thống Thiết kế VitaPulse:
 * - Nền trắng (#FFFFFF) trên nền kem (#FAF7F2)
 * - Bo góc 20px (rounded-[20px]), bóng đổ nhẹ ấm áp, không lồng thẻ quá 2 cấp
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  testId,
  as: Tag = 'div',
  ariaLabel,
}) => {
  return (
    <Tag
      data-testid={testId}
      aria-label={ariaLabel}
      className={`bg-white rounded-[20px] border border-stone-200/85 shadow-[0_6px_24px_-6px_rgba(11,95,87,0.08)] p-4 sm:p-5 text-[#1F2937] ${className}`}
    >
      {children}
    </Tag>
  );
};

export type ChipVariant = HealthStatusLevel | 'neutral' | 'teal';

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  icon?: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * Nhãn trạng thái / bệnh lý luôn đi kèm icon + chữ rõ ràng (không bao giờ chỉ dựa vào màu sắc).
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'neutral',
  icon,
  className = '',
  testId,
}) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'normal':
        return {
          classes: 'bg-emerald-50 text-emerald-900 border-emerald-200',
          defaultIcon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
        };
      case 'elevated':
      case 'warning':
        return {
          classes: 'bg-amber-50 text-amber-950 border-[#F59E0B]/50',
          defaultIcon: <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />,
        };
      case 'critical':
        return {
          classes: 'bg-red-50 text-[#DC2626] border-red-300',
          defaultIcon: <AlertOctagon className="w-4 h-4 text-[#DC2626] shrink-0" />,
        };
      case 'teal':
        return {
          classes: 'bg-[#0F766E]/10 text-[#0B5F57] border-[#0F766E]/25',
          defaultIcon: null,
        };
      case 'neutral':
      default:
        return {
          classes: 'bg-stone-100 text-[#1F2937] border-stone-200',
          defaultIcon: null,
        };
    }
  };

  const cfg = getVariantConfig();
  const renderedIcon = icon !== undefined ? icon : cfg.defaultIcon;

  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-sm font-bold leading-snug ${cfg.classes} ${className}`}
    >
      {renderedIcon}
      <span>{label}</span>
    </span>
  );
};

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  testId?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  testId,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#0F766E] shrink-0">{icon}</span>}
          <h2
            data-testid={testId}
            className="text-lg sm:text-xl font-bold text-[#1F2937] leading-snug"
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-sm text-stone-600 mt-0.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export interface StatTileProps {
  testId: string;
  title: string;
  icon: React.ReactNode;
  valueNode: React.ReactNode;
  unit?: string;
  status?: HealthStatusLevel;
  statusLabel: string;
  trend?: MetricTrendInfo;
  priorityBadge?: string;
  footerNode?: React.ReactNode;
  actionNode?: React.ReactNode;
}

/**
 * Ô chỉ số lớn (2x2 Grid) cho người 45–70 tuổi:
 * - Số liệu chính 28–36px đậm, tabular-nums, không dùng monospace
 * - Nhãn trạng thái kèm icon + màu sắc chuẩn WCAG AA
 * - Mũi tên xu hướng (↑ / ↓ / →)
 */
export const StatTile: React.FC<StatTileProps> = ({
  testId,
  title,
  icon,
  valueNode,
  unit,
  status = 'normal',
  statusLabel,
  trend,
  priorityBadge,
  footerNode,
  actionNode,
}) => {
  const renderTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') {
      return <ArrowUpRight className="w-4 h-4 text-amber-700 shrink-0" />;
    }
    if (trend.direction === 'down') {
      return <ArrowDownRight className="w-4 h-4 text-[#0F766E] shrink-0" />;
    }
    return <ArrowRight className="w-4 h-4 text-stone-500 shrink-0" />;
  };

  return (
    <div
      data-testid={testId}
      className={`bg-white rounded-[20px] border p-4 flex flex-col justify-between gap-2.5 shadow-[0_6px_20px_-6px_rgba(11,95,87,0.08)] ${
        priorityBadge
          ? 'border-[#0F766E]/45 ring-1 ring-[#0F766E]/15'
          : 'border-stone-200/90'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {priorityBadge && (
            <span className="inline-block text-sm font-bold text-[#0B5F57] mb-0.5">
              {priorityBadge}
            </span>
          )}
          <h3 className="text-base font-bold text-[#1F2937] leading-snug">{title}</h3>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-stone-200/80 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 flex-wrap my-0.5">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <div className="text-[28px] sm:text-[32px] font-extrabold text-[#1F2937] tabular-nums leading-none tracking-tight">
            {valueNode}
          </div>
          {unit && <span className="text-sm font-semibold text-stone-600">{unit}</span>}
        </div>
        {actionNode}
      </div>

      <div className="space-y-1.5 pt-2 border-t border-stone-100">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <Chip label={statusLabel} variant={status} className="px-2.5 py-0.5 text-sm" />
          {trend && (
            <span
              title={trend.label}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-stone-600 bg-[#FAF7F2] px-2 py-0.5 rounded-lg border border-stone-200/80"
            >
              {renderTrendIcon()}
              <span>
                {trend.direction === 'up'
                  ? 'Tăng nhẹ'
                  : trend.direction === 'down'
                  ? 'Giảm nhẹ'
                  : 'Ổn định'}
              </span>
            </span>
          )}
        </div>
        {footerNode && (
          <div className="text-sm text-stone-600 leading-snug">{footerNode}</div>
        )}
      </div>
    </div>
  );
};

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="py-8 px-4 text-center rounded-[20px] bg-[#FAF7F2] border border-dashed border-stone-300 space-y-3">
    <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/12 text-[#0F766E] mx-auto flex items-center justify-center">
      <Inbox className="w-6 h-6" />
    </div>
    <div className="space-y-1 max-w-md mx-auto">
      <p className="text-base font-bold text-[#1F2937]">{title}</p>
      <p className="text-sm text-stone-600 leading-relaxed">{description}</p>
    </div>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-base font-bold transition-colors cursor-pointer"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

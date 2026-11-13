import React from 'react';
import {
  Activity,
  BookOpen,
  ClipboardList,
  PhoneCall,
  Pill,
  Plus,
  Utensils,
} from 'lucide-react';
import { ActiveModule } from '../layout/AppTopHeaderAndNav';

export interface BottomNavProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
}

interface NavItemDef {
  id: ActiveModule;
  label: string;
  icon: React.FC<{ className?: string }>;
  mobileTestId?: string;
  desktopTestId?: string;
}

export const NAV_ITEMS: NavItemDef[] = [
  {
    id: 'dashboard',
    label: 'Sức khỏe',
    icon: Activity,
    mobileTestId: 'mobile-nav-dashboard-btn',
    desktopTestId: 'nav-dashboard-btn',
  },
  {
    id: 'nutrition',
    label: 'Ăn & Tập',
    icon: Utensils,
    mobileTestId: 'mobile-nav-nutrition-btn',
    desktopTestId: 'nav-nutrition-btn',
  },
  {
    id: 'medications',
    label: 'Thuốc',
    icon: Pill,
    mobileTestId: 'mobile-nav-medications-btn',
    desktopTestId: 'nav-medications-btn',
  },
  {
    id: 'records',
    label: 'Sổ BHYT',
    icon: ClipboardList,
    mobileTestId: 'mobile-nav-records-btn',
    desktopTestId: 'nav-records-bhyt-btn',
  },
  {
    id: 'guide',
    label: 'Hướng dẫn',
    icon: BookOpen,
    mobileTestId: 'mobile-nav-guide-btn',
    desktopTestId: 'nav-user-guide-btn',
  },
];

/**
 * Thanh điều hướng dưới 5 mục cho Mobile:
 * - Nhãn 1 dòng ngắn: Sức khỏe, Ăn & Tập, Thuốc, Sổ BHYT, Hướng dẫn
 * - Icon 24px (w-6 h-6)
 * - Mục đang chọn có nền viên thuốc xanh nhạt
 * - Hỗ trợ safe-area iPhone (pb-safe)
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeModule,
  onSelectModule,
}) => {
  return (
    <nav
      aria-label="Điều hướng di động"
      data-testid="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(11,95,87,0.08)] grid grid-cols-5 items-center min-h-[68px] px-1 py-1.5 pb-safe"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeModule === item.id;
        return (
          <button
            key={item.id}
            type="button"
            data-testid={item.mobileTestId}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelectModule(item.id)}
            className={`flex flex-col items-center justify-center min-h-[52px] px-0.5 rounded-2xl transition-colors cursor-pointer ${
              isActive
                ? 'text-[#0B5F57] font-bold'
                : 'text-[#1F2937]/75 hover:text-[#1F2937] font-medium'
            }`}
          >
            <span
              className={`inline-flex items-center justify-center px-3 sm:px-3.5 py-1 rounded-full transition-colors ${
                isActive ? 'bg-[#0F766E]/15 text-[#0F766E]' : 'text-stone-600'
              }`}
            >
              <Icon className="w-6 h-6 shrink-0" />
            </span>
            <span className="text-[11px] min-[360px]:text-[12.5px] mt-0.5 leading-tight whitespace-nowrap tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

/**
 * Thanh điều hướng bên trái cho Desktop (md trở lên):
 * Giúp bố cục máy tính gọn gàng, chữ lớn rõ ràng cho người 45–70 tuổi.
 */
export const DesktopSidebarNav: React.FC<
  BottomNavProps & {
    onOpenLogModal: () => void;
    onOpenEmergencyCall?: () => void;
    isEmergencyAlarming?: boolean;
  }
> = ({
  activeModule,
  onSelectModule,
  onOpenLogModal,
  onOpenEmergencyCall,
  isEmergencyAlarming = false,
}) => {
  return (
    <aside
      aria-label="Điều hướng chính trên máy tính"
      className="hidden md:flex flex-col w-60 shrink-0 gap-2 sticky top-20 self-start"
    >
      <div className="bg-white rounded-[20px] border border-stone-200/85 p-3 shadow-[0_6px_24px_-6px_rgba(11,95,87,0.08)] space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={item.desktopTestId}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectModule(item.id)}
              className={`w-full min-h-[50px] px-4 py-2.5 rounded-2xl flex items-center gap-3 text-base transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#0F766E]/14 text-[#0B5F57] font-bold'
                  : 'text-[#1F2937] hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              <Icon
                className={`w-6 h-6 shrink-0 ${
                  isActive ? 'text-[#0F766E]' : 'text-stone-600'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-2 mt-2 border-t border-stone-100 space-y-2">
          <button
            type="button"
            onClick={onOpenLogModal}
            className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F57] text-white text-base font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5] shrink-0" />
            <span>Ghi nhận chỉ số</span>
          </button>
          {onOpenEmergencyCall && (
            <button
              type="button"
              onClick={onOpenEmergencyCall}
              data-testid="sidebar-emergency-call-btn"
              className={`w-full min-h-[50px] px-4 py-2.5 rounded-2xl border text-base font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isEmergencyAlarming
                  ? 'bg-[#DC2626] hover:bg-red-700 border-red-700 text-white shadow-sm'
                  : 'bg-red-50 hover:bg-red-100 border-red-200 text-[#DC2626]'
              }`}
            >
              <PhoneCall className="w-5 h-5 shrink-0" />
              <span>Gọi khẩn cấp</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

/**
 * Nút nổi (FAB) hình tròn xanh ngọc có dấu "+", cố định phía trên thanh điều hướng dưới.
 */
export const FloatingLogVitalFab: React.FC<{ onClick: () => void }> = ({
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ghi nhận chỉ số"
      title="Ghi nhận chỉ số huyết áp, đường huyết mới"
      data-testid="fab-log-vital-btn"
      className="fixed bottom-[82px] md:bottom-7 right-4 sm:right-6 z-40 w-14 h-14 sm:w-auto sm:h-14 sm:px-5 rounded-full bg-[#0F766E] hover:bg-[#0B5F57] active:scale-95 text-white shadow-[0_12px_28px_rgba(11,95,87,0.38)] border-2 border-white/90 flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:ring-4 focus-visible:ring-[#0F766E]/40 outline-none"
    >
      <Plus className="w-7 h-7 stroke-[2.6] shrink-0" />
      <span className="hidden sm:inline text-base font-bold whitespace-nowrap">
        Ghi nhận chỉ số
      </span>
    </button>
  );
};

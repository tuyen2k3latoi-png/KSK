import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  HeartPulse,
  HelpCircle,
  Phone,
  PhoneCall,
  Pill,
  Plus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { UserMedicalProfile } from '../types/health';
import { Card, Chip, SectionHeader } from './ui/Primitives';

interface UserGuideViewProps {
  profile: UserMedicalProfile;
  onOpenLogModal: () => void;
  onNavigateModule: (module: 'dashboard' | 'nutrition' | 'medications' | 'records') => void;
}

const GUIDE_STEPS = [
  {
    step: '1',
    title: 'Đo xong bấm nút "+" xanh để lưu số',
    body: 'Điền huyết áp, đường huyết hoặc chụp ảnh máy đo.',
    ctaLabel: 'Nhập số đo →',
    action: 'log' as const,
  },
  {
    step: '2',
    title: 'Nhìn màu Xanh · Vàng · Đỏ để biết mức sức khỏe',
    body: 'Xanh lá là tốt, Vàng cần nghỉ ngơi ăn nhạt, Đỏ cần hỏi bác sĩ.',
    ctaLabel: 'Xem Sức khỏe →',
    action: 'dashboard' as const,
  },
  {
    step: '3',
    title: 'Bấm "Đã uống" ở Tủ thuốc & mang Sổ BHYT đi khám',
    body: 'Không sợ quên thuốc hay uống trùng. Mở Sổ BHYT cho bác sĩ xem lịch sử 7 ngày.',
    ctaLabel: 'Mở Tủ thuốc →',
    action: 'medications' as const,
  },
];

const FAQ_ITEMS = [
  {
    q: 'Lỡ nhập nhầm số huyết áp thì xóa ở đâu?',
    a: 'Mở Sổ BHYT → Nhật ký đo → bấm biểu tượng thùng rác ở dòng bị nhầm.',
  },
  {
    q: 'Làm sao để chữ trên màn hình to hơn?',
    a: 'Bấm nút "Tài khoản" góc trên phải → chọn cỡ chữ "Lớn" hoặc "Rất lớn".',
  },
  {
    q: 'Đổi điện thoại có mất sổ sức khỏe không?',
    a: 'Bạn có thể đăng ký bằng số điện thoại để đồng bộ đám mây hoặc vào Tài khoản → Tải về dữ liệu (JSON/CSV) để cất giữ.',
  },
];

export const UserGuideView: React.FC<UserGuideViewProps> = ({
  profile,
  onOpenLogModal,
  onNavigateModule,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showBpTips, setShowBpTips] = useState(false);

  return (
    <div className="space-y-4" data-testid="user-guide-view">
      {/* 1. Banner gọn & Thao tác nhanh */}
      <div className="rounded-[20px] bg-gradient-to-br from-[#0B5F57] to-[#0F766E] text-white p-4 sm:p-5 shadow-[0_12px_28px_-8px_rgba(11,95,87,0.32)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-teal-100 text-xs font-bold">
            <BookOpen className="w-4 h-4" />
            <span>Hướng dẫn nhanh</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Dùng VitaPulse chỉ với 3 bước
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenLogModal}
            className="min-h-[48px] px-4 py-2 rounded-2xl bg-white hover:bg-[#FAF7F2] text-[#0B5F57] text-sm sm:text-base font-extrabold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Nhập số đo</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateModule('medications')}
            className="min-h-[48px] px-4 py-2 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Pill className="w-4 h-4" />
            <span>Tủ thuốc</span>
          </button>
        </div>
      </div>

      {/* 2. Gọi khẩn cấp 115 & Người thân */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <Card className="lg:col-span-7 border-[#DC2626]/35 bg-red-50/60 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#DC2626] font-extrabold text-base sm:text-lg">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Khi nào cần gọi Cấp cứu 115?</span>
            </div>
            <p className="text-sm text-[#1F2937] leading-relaxed">
              Huyết áp từ <strong className="tabular-nums text-[#DC2626]">180/120 mmHg</strong> trở lên, hoặc <strong>đau tức ngực, khó thở, tê yếu tay chân</strong> — hãy nằm nghỉ và gọi ngay:
            </p>
          </div>
          <a
            href="tel:115"
            className="min-h-[50px] px-5 py-2.5 rounded-2xl bg-[#DC2626] hover:bg-red-700 text-white text-base font-extrabold inline-flex items-center justify-center gap-2 tabular-nums shadow-xs"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Gọi Cấp cứu 115</span>
          </a>
        </Card>

        <Card className="lg:col-span-5 flex flex-col justify-between space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 font-bold text-base text-[#1F2937]">
              <Phone className="w-5 h-5 text-[#0F766E] shrink-0" />
              <span>Liên hệ nhanh</span>
            </div>
            <p className="text-stone-700">
              Bác sĩ: <strong className="text-[#1F2937]">{profile.primaryDoctor}</strong>
            </p>
            <p className="text-stone-700">
              Người thân: <strong className="text-[#1F2937]">{profile.emergencyContactName}</strong>
            </p>
          </div>
          <a
            href={`tel:${profile.emergencyContactPhone.replace(/\s+/g, '')}`}
            className="min-h-[48px] px-4 py-2 rounded-2xl bg-[#FAF7F2] hover:bg-[#0F766E]/10 border border-[#0F766E]/35 text-sm font-extrabold text-[#0B5F57] inline-flex items-center justify-center gap-2 tabular-nums"
          >
            <Phone className="w-4 h-4 text-[#0F766E]" />
            <span>Gọi {profile.emergencyContactPhone}</span>
          </a>
        </Card>
      </div>

      {/* 3. 3 Bước sử dụng đơn giản */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {GUIDE_STEPS.map((item) => (
          <Card key={item.step} className="flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-start gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-[#0F766E] text-white font-extrabold text-base flex items-center justify-center shrink-0 tabular-nums">
                  {item.step}
                </span>
                <h3 className="text-base font-bold text-[#1F2937] leading-snug">
                  {item.title}
                </h3>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">{item.body}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                item.action === 'log' ? onOpenLogModal() : onNavigateModule(item.action)
              }
              className="min-h-[42px] px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#0F766E]/10 text-[#0B5F57] text-sm font-bold cursor-pointer transition-colors text-left"
            >
              {item.ctaLabel}
            </button>
          </Card>
        ))}
      </div>

      {/* 4. Bảng tra cứu nhanh chỉ số chuẩn */}
      <Card className="space-y-3.5">
        <SectionHeader
          title="Số đo bao nhiêu là Tốt?"
          icon={<HeartPulse className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between font-bold text-base text-[#1F2937]">
              <span>Huyết áp (mmHg)</span>
              <Activity className="w-4 h-4 text-[#0F766E]" />
            </div>
            <div className="divide-y divide-stone-200/70 text-sm tabular-nums">
              <div className="py-1.5 flex items-center justify-between gap-2">
                <span>Tốt:</span>
                <Chip label="< 120/80" variant="normal" />
              </div>
              <div className="py-1.5 flex items-center justify-between gap-2">
                <span>Lưu ý:</span>
                <Chip label="130/80 – 139/89" variant="warning" />
              </div>
              <div className="py-1.5 flex items-center justify-between gap-2">
                <span>Cao:</span>
                <Chip label="≥ 140/90" variant="critical" />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between font-bold text-base text-[#1F2937]">
              <span>Đường huyết</span>
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="divide-y divide-stone-200/70 text-sm tabular-nums">
              <div className="py-1.5 flex items-center justify-between gap-2">
                <span>Lúc đói:</span>
                <Chip label="70 – 99 mg/dL" variant="normal" />
              </div>
              <div className="py-1.5 flex items-center justify-between gap-2">
                <span>Sau ăn 2h:</span>
                <Chip label="< 140 mg/dL" variant="normal" />
              </div>
              <div className="py-1.5 flex items-center justify-between gap-2">
                <span>Cần kiêng ngọt:</span>
                <Chip label="100 – 125" variant="warning" />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between font-bold text-base text-[#1F2937]">
              <span>Nhịp tim &amp; SpO2</span>
              <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
            </div>
            <div className="divide-y divide-stone-200/70 text-sm tabular-nums">
              <div className="py-1.5 flex items-center justify-between gap-2">
                <span>Nhịp tim:</span>
                <strong className="text-[#0B5F57]">60 – 90 bpm</strong>
              </div>
              <div className="py-1.5 flex items-center justify-between gap-2">
                <span>Oxy máu (SpO2):</span>
                <strong className="text-[#0B5F57]">95% – 100%</strong>
              </div>
              <div className="py-1.5 flex items-center justify-between gap-2">
                <span>Nước &amp; Ngủ:</span>
                <strong className="text-[#1F2937]">1.5–2 L · 7–8 giờ</strong>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Mẹo đo huyết áp & Câu hỏi (Thu gọn mặc định) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <Card className="lg:col-span-6 space-y-2.5">
          <button
            type="button"
            onClick={() => setShowBpTips((prev) => !prev)}
            className="w-full min-h-[44px] flex items-center justify-between gap-2 text-left font-bold text-base text-[#1F2937] cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#0F766E]" />
              <span>Mẹo đo huyết áp tại nhà chính xác</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-[#0F766E] transition-transform ${showBpTips ? 'rotate-180' : ''}`} />
          </button>
          {showBpTips && (
            <ol className="pt-2 border-t border-stone-100 space-y-1.5 text-sm text-[#1F2937] list-decimal list-inside leading-relaxed">
              <li>Ngồi nghỉ yên tĩnh 5 phút trước khi đo.</li>
              <li>Không uống trà đặc, cà phê trước đó 30 phút.</li>
              <li>Đặt bắp tay ngang tim, lưng tựa ghế.</li>
              <li>Đo vào buổi sáng trước khi uống thuốc.</li>
            </ol>
          )}
        </Card>

        <Card className="lg:col-span-6 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base text-[#1F2937] pb-1">
            <HelpCircle className="w-5 h-5 text-[#0F766E]" />
            <span>Câu hỏi thường gặp</span>
          </div>
          <div className="divide-y divide-stone-200/80">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={item.q} className="py-2">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full min-h-[42px] flex items-center justify-between gap-3 text-left font-bold text-sm text-[#1F2937] cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#0F766E] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="pt-1 text-sm text-stone-600 leading-relaxed">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

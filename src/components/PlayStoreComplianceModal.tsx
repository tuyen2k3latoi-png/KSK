import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCheck2,
  Globe,
  Lock,
  PackageCheck,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';

interface PlayStoreComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteAllUserData: () => Promise<void> | void;
  onExportAllUserData?: () => void;
  nd13ConsentAcceptedAt?: string | null;
  onWithdrawNd13Consent?: () => void;
}

type ComplianceTab = 'privacy_delete' | 'disclaimer' | 'chplay_guide';

const SHARED_APP_URL =
  'https://ais-pre-dkb5d7szdcv2stdi3jnqym-590109565317.asia-east1.run.app';

export const PlayStoreComplianceModal: React.FC<PlayStoreComplianceModalProps> = ({
  isOpen,
  onClose,
  onDeleteAllUserData,
  onExportAllUserData,
  nd13ConsentAcceptedAt,
  onWithdrawNd13Consent,
}) => {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('privacy_delete');
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const currentWebUrl =
    typeof window !== 'undefined' &&
    window.location.origin &&
    !window.location.origin.includes('localhost')
      ? window.location.origin
      : SHARED_APP_URL;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentWebUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleExportMyData = () => {
    if (onExportAllUserData) {
      onExportAllUserData();
      setExportedSuccess(true);
      setTimeout(() => setExportedSuccess(false), 4000);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAllUserData();
      setConfirmDeleteStep(false);
      setDeletedSuccess(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cài đặt Quyền riêng tư (Nghị định 13/2023/NĐ-CP), Miễn trừ Y khoa & Chia sẻ Web"
      data-testid="play-store-compliance-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
    >
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Cài đặt &gt; Quyền Riêng tư (NĐ 13/2023/NĐ-CP) &amp; Tiện ích
              </h2>
              <p className="text-xs text-slate-300">
                Xuất dữ liệu cá nhân, xóa toàn bộ dữ liệu &amp; tài khoản (localStorage + Firestore), miễn trừ y khoa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ cài đặt quyền riêng tư"
            data-testid="close-compliance-modal-btn"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 px-4 sm:px-6 pt-3 border-b border-slate-200 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('privacy_delete')}
            data-testid="compliance-tab-privacy"
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'privacy_delete'
                ? 'bg-white text-teal-800 border-slate-200'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>1. Quyền Riêng tư (NĐ 13/2023) &amp; Dữ liệu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('disclaimer')}
            data-testid="compliance-tab-disclaimer"
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'disclaimer'
                ? 'bg-white text-teal-800 border-slate-200'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>2. Miễn trừ Y khoa &amp; BHYT Độc lập</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chplay_guide')}
            data-testid="compliance-tab-chplay"
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chplay_guide'
                ? 'bg-white text-teal-800 border-slate-200'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3. Lấy Link Web &amp; Xuất File CH Play</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700">
          {activeTab === 'privacy_delete' && (
            <div className="space-y-4">
              {/* Nghị định 13/2023/NĐ-CP Summary & Consent Status */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Bảo vệ Dữ liệu Cá nhân Nhạy cảm theo Nghị định 13/2023/NĐ-CP
                  </h3>
                  <span className="px-2.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                    {nd13ConsentAcceptedAt
                      ? `Đã đồng ý (${nd13ConsentAcceptedAt.slice(0, 10)})`
                      : 'Chưa xác nhận'}
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Nơi lưu trữ dữ liệu:</strong> Mặc định lưu cục bộ trên trình duyệt của thiết bị bạn đang dùng (<code>localStorage</code>). Chỉ khi bạn chủ động bấm đăng nhập Google, dữ liệu mới được sao lưu lên phân vùng riêng tư <code>users/&#123;uid&#125;</code> trên Google Cloud Firestore.
                  </li>
                  <li>
                    <strong>Mục đích xử lý:</strong> Chỉ phục vụ việc hiển thị biểu đồ theo dõi huyết áp, đường huyết, dinh dưỡng, lưu mã thẻ BHYT cá nhân và phát chuông nhắc uống thuốc cho chính bạn.
                  </li>
                  <li>
                    <strong>Quyền của chủ thể dữ liệu (Điều 9 NĐ 13/2023/NĐ-CP):</strong> Bạn có quyền xem, xuất toàn bộ dữ liệu của mình, rút lại sự đồng ý hoặc xóa vĩnh viễn toàn bộ dữ liệu trên cả thiết bị và đám mây bất cứ lúc nào.
                  </li>
                </ul>
                {nd13ConsentAcceptedAt && onWithdrawNd13Consent && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={onWithdrawNd13Consent}
                      data-testid="withdraw-nd13-consent-btn"
                      className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline underline-offset-4 cursor-pointer"
                    >
                      Rút lại sự đồng ý xử lý dữ liệu sức khỏe (hiện lại màn hình xác nhận)
                    </button>
                  </div>
                )}
              </div>

              {/* Action 1: Export My Data ("Xuất dữ liệu của tôi") */}
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-teal-950 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>Xuất dữ liệu của tôi (Bản sao lưu cá nhân JSON)</span>
                    </h4>
                    <p className="text-xs text-teal-900 mt-0.5">
                      Tải về toàn bộ hồ sơ cá nhân, lịch sử chỉ số huyết áp, đường huyết, bữa ăn, lịch tập và danh sách thuốc hiện có.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportMyData}
                    data-testid="privacy-export-my-data-btn"
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất dữ liệu của tôi</span>
                  </button>
                </div>
                {exportedSuccess && (
                  <p
                    role="status"
                    data-testid="privacy-export-success-msg"
                    className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Đã tải xuống tệp dữ liệu sức khỏe cá nhân (.json) thành công.</span>
                  </p>
                )}
              </div>

              {/* Action 2: Delete All Data & Account ("Xóa toàn bộ dữ liệu & tài khoản") */}
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Xóa toàn bộ dữ liệu &amp; tài khoản (localStorage + Firestore)</span>
                  </h4>
                  <p className="text-xs text-rose-900 mt-1">
                    Thao tác này sẽ xóa sạch toàn bộ dữ liệu sức khỏe lưu trên thiết bị (<code>localStorage</code>) đồng thời xóa toàn bộ bản ghi đám mây (<code>Firestore</code>) nếu bạn đang đăng nhập Google, và đăng xuất tài khoản.
                  </p>
                </div>

                {deletedSuccess && (
                  <div
                    role="status"
                    data-testid="data-deleted-confirmation"
                    className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Đã xóa sạch toàn bộ dữ liệu trên thiết bị (localStorage) và đám mây (Firestore).
                    </span>
                  </div>
                )}

                {!confirmDeleteStep ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteStep(true)}
                    data-testid="delete-all-user-data-btn"
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa toàn bộ dữ liệu &amp; tài khoản</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleConfirmDelete}
                      data-testid="confirm-delete-all-data-btn"
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
                    >
                      {isDeleting
                        ? 'Đang xóa localStorage & Firestore...'
                        : 'Xác nhận Xóa vĩnh viễn toàn bộ dữ liệu & tài khoản'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteStep(false)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-amber-950 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>Tuyên bố Miễn trừ Trách nhiệm Y khoa (Medical Disclaimer)</span>
                </h3>
                <p className="leading-relaxed text-amber-950">
                  <strong>VitaPulse Health</strong> là sổ tay điện tử hỗ trợ cá nhân và gia đình tự
                  ghi chép chỉ số sinh tồn (huyết áp, nhịp tim, đường huyết, SpO2), theo dõi dinh
                  dưỡng và cài đặt chuông nhắc uống thuốc.
                </p>
                <ul className="list-disc list-inside space-y-1 text-amber-900">
                  <li>
                    Ứng dụng <strong>không phải là thiết bị y tế chẩn đoán</strong> và không thay thế bác sĩ.
                  </li>
                  <li>
                    Mọi chỉ số tổng hợp và gợi ý trong ứng dụng chỉ mang tính tham khảo. Bạn nên trao đổi với bác sĩ chuyên khoa trước khi thay đổi lối sống hoặc thuốc điều trị.
                  </li>
                  <li>
                    Khi có dấu hiệu bất thường nghiêm trọng (đau ngực, khó thở, yếu liệt tay chân, huyết áp &ge; 180/120 mmHg), vui lòng gọi ngay cấp cứu{' '}
                    <strong>115</strong> hoặc đến cơ sở y tế gần nhất.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-teal-600 shrink-0" />
                  <span>
                    Tự nhập mã thẻ BHYT để lưu trữ cá nhân – không kết nối cơ quan BHXH/VNeID
                  </span>
                </h3>
                <p className="leading-relaxed">
                  Tính năng lưu mã thẻ BHYT giúp người dùng tự ghi nhớ mã thẻ, nơi đăng ký khám chữa bệnh ban đầu và ghi chú các đợt đi khám bệnh viện của chính mình.
                </p>
                <p className="leading-relaxed font-semibold text-slate-900">
                  Ứng dụng độc lập, KHÔNG đại diện và KHÔNG kết nối cơ quan BHXH Việt Nam hay ứng dụng VNeID.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'chplay_guide' && (
            <div className="space-y-4">
              {/* Direct Web Link Copy Box */}
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Link Web Trực tuyến (HTTPS) của App Hiện tại:</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-teal-800">
                    Sẵn sàng mở trên Điện thoại &amp; Máy tính
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentWebUrl}
                    data-testid="live-web-url-input"
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-teal-300 text-xs sm:text-sm font-mono-tabular text-slate-900 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    data-testid="copy-web-link-btn"
                    className="min-h-[38px] px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đã sao chép Link!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Sao chép Link Web</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Hướng dẫn Chia sẻ Link Web &amp; Đóng Gói Lên CH Play:</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    <strong>Cách 1 — Chia sẻ trực tiếp:</strong> Sao chép đường link <code>{SHARED_APP_URL}</code> gửi cho người thân mở trên điện thoại.
                  </li>
                  <li>
                    <strong>Cách 2 — Đẩy lên tên miền riêng:</strong> Tải mã nguồn ZIP và triển khai trên Vercel, Netlify hoặc Cloud Run.
                  </li>
                  <li>
                    <strong>Cách 3 — Xuất file .AAB / .APK đưa lên CH Play:</strong> Dán Link Web vào PWABuilder.com để đóng gói TWA chuẩn Google Play.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Tuân thủ Nghị định 13/2023/NĐ-CP · Không thay thế chẩn đoán y khoa
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
          >
            Đã hiểu &amp; Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

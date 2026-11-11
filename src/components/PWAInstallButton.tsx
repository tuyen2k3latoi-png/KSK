import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import {
  readStorageString,
  STORAGE_KEYS,
  writeStorageIfChanged,
} from '../utils/storage';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallGuideModal: React.FC<{
  isOpen: boolean;
  isIOS: boolean;
  onClose: () => void;
}> = ({ isOpen, isIOS, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hướng dẫn cài đặt ứng dụng vào màn hình chính điện thoại"
      data-testid="pwa-install-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cài đặt VitaPulse lên Màn hình Chính
              </h3>
              <p className="text-sm text-slate-700">
                Sử dụng toàn màn hình như ứng dụng tải từ CH Play / App Store
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hướng dẫn cài đặt"
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isIOS ? (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 space-y-2">
            <p className="font-semibold text-slate-900">
              Trên iPhone / iPad (Trình duyệt Safari):
            </p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>
                Bấm vào biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh công cụ dưới cùng.
              </li>
              <li>
                Cuộn xuống và chọn{' '}
                <strong>&ldquo;Thêm vào Màn hình chính&rdquo; (Add to Home Screen)</strong>.
              </li>
              <li>
                Bấm <strong>Thêm (Add)</strong> ở góc trên bên phải để hoàn tất.
              </li>
            </ol>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 space-y-2">
            <p className="font-semibold text-slate-900">
              Trên Điện thoại Android (Chrome / Samsung) hoặc Máy tính:
            </p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>
                Bấm vào biểu tượng <strong>Menu 3 chấm (⋮)</strong> ở góc trên bên phải trình duyệt Chrome.
              </li>
              <li>
                Chọn <strong>&ldquo;Cài đặt ứng dụng&rdquo; (Install app)</strong> hoặc{' '}
                <strong>&ldquo;Thêm vào màn hình chính&rdquo;</strong>.
              </li>
              <li>
                Biểu tượng <strong>VitaPulse</strong> sẽ xuất hiện ngay trên màn hình điện thoại để mở 1 chạm cả khi không có mạng.
              </li>
            </ol>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[44px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          Đã hiểu cách cài đặt
        </button>
      </div>
    </div>
  );
};

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        data-testid="pwa-install-app-btn"
        className={
          compact
            ? 'min-h-[38px] px-3 py-1.5 rounded-lg text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer'
            : 'min-h-[40px] px-3.5 py-2 rounded-xl text-sm font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer'
        }
      >
        <Download className="w-4 h-4 text-teal-700 shrink-0" />
        <span>{isIOS ? 'Cài vào iPhone' : 'Cài App vào Điện thoại'}</span>
      </button>

      <PWAInstallGuideModal
        isOpen={showGuideModal}
        isIOS={isIOS}
        onClose={() => setShowGuideModal(false)}
      />
    </>
  );
};

/**
 * Dismissible Banner for "Cài App vào Điện thoại" (Stage 2 requirement:
 * "'Cài App' chuyển thành banner có thể tắt")
 */
export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(
    () => readStorageString(STORAGE_KEYS.PWA_BANNER_DISMISSED, 'false') === 'true'
  );
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    writeStorageIfChanged(STORAGE_KEYS.PWA_BANNER_DISMISSED, 'true');
  };

  return (
    <>
      <div
        role="region"
        aria-label="Gợi ý cài đặt ứng dụng lên màn hình điện thoại"
        data-testid="pwa-install-dismissible-banner"
        className="bg-teal-50 border border-teal-200 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-sm text-teal-950"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Smartphone className="w-4 h-4 text-teal-700 shrink-0" />
          <span className="font-medium">
            Mẹo tiện lợi: Cài <strong>VitaPulse</strong> ra màn hình chính điện thoại để mở nhanh 1 chạm như ứng dụng.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            data-testid="pwa-install-app-btn"
            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{isIOS ? 'Cài vào iPhone' : 'Cài App'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Đóng thông báo cài đặt ứng dụng"
            data-testid="dismiss-pwa-banner-btn"
            className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-teal-300 text-slate-800 text-sm font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Tắt</span>
          </button>
        </div>
      </div>

      <PWAInstallGuideModal
        isOpen={showGuideModal}
        isIOS={isIOS}
        onClose={() => setShowGuideModal(false)}
      />
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      data-testid="pwa-offline-indicator"
      className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-700 px-3.5 py-2 text-sm font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Chế độ Ngoại tuyến — Đang dùng dữ liệu lưu sẵn trên máy</span>
    </div>
  );
};

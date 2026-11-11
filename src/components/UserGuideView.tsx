import React from 'react';
import {
  Activity,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  Heart,
  HelpCircle,
  PhoneCall,
  Pill,
  PlusCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { UserMedicalProfile } from '../types/health';

interface UserGuideViewProps {
  profile: UserMedicalProfile;
  onOpenLogModal: () => void;
  onNavigateModule: (module: 'dashboard' | 'nutrition' | 'medications' | 'records') => void;
}

export const UserGuideView: React.FC<UserGuideViewProps> = ({
  profile,
  onOpenLogModal,
  onNavigateModule,
}) => {
  return (
    <div className="space-y-5 sm:space-y-6" data-testid="user-guide-view">
      {/* Friendly Hero Header for Middle-Aged & Older Adults */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs sm:text-sm font-semibold">
              <BookOpen className="w-4 h-4 text-teal-600" />
              Cẩm nang Hướng dẫn Dễ hiểu
            </span>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 leading-snug">
              Hướng dẫn Sử dụng Sổ Sức khỏe VitaPulse Hằng ngày
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Ứng dụng được thiết kế với chữ rõ ràng, thao tác đơn giản giúp Cô Chú, Anh Chị dễ dàng ghi lại huyết áp, đường huyết, kiểm tra lịch uống thuốc và mang sổ sức khỏe đi khám bác sĩ mà không cần rành về công nghệ.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenLogModal}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nhập Số đo Hôm nay</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('medications')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Pill className="w-4 h-4 text-teal-700" />
              <span>Xem Lịch Uống thuốc</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Step-by-Step Daily Usage Cards */}
      <section className="space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 px-1">
          4 Bước Sử dụng Đơn giản Mỗi Ngày
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-teal-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                  1
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Bước 1: Ghi lại Huyết áp &amp; Đường huyết sau khi đo
                </h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sau khi đo bằng máy đo huyết áp tại nhà hoặc đi khám về, bấm vào nút màu xanh{' '}
                <strong className="text-teal-700">&ldquo;Ghi nhận Chỉ số&rdquo;</strong> ở góc trên cùng bên phải màn hình. Điền số đo vào ô rồi bấm{' '}
                <strong>&ldquo;Lưu chỉ số&rdquo;</strong>.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Mẹo: Có thể kết nối máy đo Bluetooth để tự động điền số.</span>
              <button
                type="button"
                onClick={onOpenLogModal}
                className="font-semibold text-teal-700 hover:underline shrink-0 ml-2 cursor-pointer"
              >
                Mở bảng nhập →
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                  2
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Bước 2: Nhìn Màu sắc để Biết Ngay Sức khỏe Tốt hay Cần Lưu ý
                </h4>
              </div>
              <div className="space-y-1.5 text-sm text-slate-700">
                <p className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <span>
                    <strong className="text-emerald-800">Màu Xanh lá:</strong> Chỉ số tốt, ổn định, yên tâm sinh hoạt bình thường.
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <span>
                    <strong className="text-amber-800">Màu Vàng cam:</strong> Chỉ số hơi cao, cần nghỉ ngơi, uống nước và ăn nhạt hơn.
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                  <span>
                    <strong className="text-red-700">Màu Đỏ:</strong> Chỉ số cao bất thường, cần nằm nghỉ và báo ngay cho bác sĩ hoặc con cháu.
                  </span>
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Hệ thống tự động tính điểm sức khỏe trên thang 100.</span>
              <button
                type="button"
                onClick={() => onNavigateModule('dashboard')}
                className="font-semibold text-indigo-700 hover:underline shrink-0 ml-2 cursor-pointer"
              >
                Xem trang chính →
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-amber-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                  3
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Bước 3: Đánh dấu Đã Uống Thuốc để Không Quên hoặc Uống Trùng
                </h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Mỗi khi uống xong cữ thuốc buổi sáng, buổi trưa hoặc buổi tối, hãy bấm vào nút{' '}
                <strong className="text-teal-700">&ldquo;Xác nhận uống&rdquo;</strong> bên cạnh tên thuốc. Nút sẽ đổi thành{' '}
                <strong>&ldquo;Đã uống&rdquo;</strong> màu xanh giúp nhớ chính xác đã uống thuốc hay chưa.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Tự động trừ số viên thuốc còn lại trong hộp để nhắc mua thêm.</span>
              <button
                type="button"
                onClick={() => onNavigateModule('medications')}
                className="font-semibold text-amber-700 hover:underline shrink-0 ml-2 cursor-pointer"
              >
                Mở Tủ thuốc →
              </button>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                  4
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Bước 4: Đưa Sổ Sức khỏe cho Bác sĩ Xem mỗi lần Đi Khám
                </h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Khi đi tái khám tại bệnh viện, chỉ cần mở mục{' '}
                <strong className="text-sky-700">&ldquo;Sổ Khám &amp; Báo cáo&rdquo;</strong> để bác sĩ nhìn thấy toàn bộ lịch sử huyết áp, đường huyết nhiều ngày qua, hoặc bấm{' '}
                <strong>&ldquo;Tải Sổ Sức khỏe&rdquo;</strong> để gửi cho con cháu lưu giữ.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Hỗ trợ hẹn lịch tái khám tự động nhắc trên điện thoại.</span>
              <button
                type="button"
                onClick={() => onNavigateModule('records')}
                className="font-semibold text-sky-700 hover:underline shrink-0 ml-2 cursor-pointer"
              >
                Xem Sổ khám →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Easy-to-Understand Reference Table for Normal Health Numbers */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="space-y-1 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600 shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Bảng Tra cứu Nhanh: Số đo Bao nhiêu là Tốt &amp; An toàn?
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Giải thích ngắn gọn, dễ nhớ theo khuyến nghị y tế dành cho người trưởng thành và người trung tuổi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Blood Pressure Reference */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">1. Huyết áp (mmHg)</span>
              <Activity className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-xs text-slate-600">
              Gồm <strong>Số trên</strong> (Tâm thu) và <strong>Số dưới</strong> (Tâm trương):
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
              <li className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                <span>Tốt nhất:</span>
                <strong className="font-mono-tabular text-emerald-800">Dưới 120 / 80</strong>
              </li>
              <li className="flex items-center justify-between bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                <span>Hơi cao (Cần lưu ý):</span>
                <strong className="font-mono-tabular text-amber-800">130/80 – 139/89</strong>
              </li>
              <li className="flex items-center justify-between bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg">
                <span>Cao (Cần khám):</span>
                <strong className="font-mono-tabular text-red-700">Từ 140 / 90 trở lên</strong>
              </li>
            </ul>
          </div>

          {/* Blood Glucose Reference */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">2. Đường huyết (mg/dL)</span>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs text-slate-600">
              Lưu ý chọn đúng thời điểm đo <strong>Lúc đói</strong> hay <strong>Sau ăn</strong>:
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
              <li className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                <span>Sáng lúc đói:</span>
                <strong className="font-mono-tabular text-emerald-800">70 – 99 mg/dL</strong>
              </li>
              <li className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                <span>Sau ăn 2 tiếng:</span>
                <strong className="font-mono-tabular text-emerald-800">Dưới 140 mg/dL</strong>
              </li>
              <li className="flex items-center justify-between bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                <span>Cần kiêng ngọt:</span>
                <strong className="font-mono-tabular text-amber-800">Từ 100 – 125 (Đói)</strong>
              </li>
            </ul>
          </div>

          {/* Heart Rate, SpO2 & Daily Habits */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">3. Nhịp tim &amp; Oxy máu</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xs text-slate-600">
              Chỉ số tim mạch và thói quen sinh hoạt lành mạnh mỗi ngày:
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
              <li className="flex items-center justify-between bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">
                <span>Nhịp tim nghỉ ngơi:</span>
                <strong className="font-mono-tabular text-slate-900">60 – 90 nhịp/phút</strong>
              </li>
              <li className="flex items-center justify-between bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">
                <span>Oxy trong máu (SpO2):</span>
                <strong className="font-mono-tabular text-teal-700">95% – 100%</strong>
              </li>
              <li className="flex items-center justify-between bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">
                <span>Uống nước &amp; Ngủ:</span>
                <strong className="font-mono-tabular text-sky-700">1.5–2 Lít · 7–8 giờ</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Practical Home Measurement Tips & Emergency Contact Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* 5 Golden Tips for Accurate Home Blood Pressure Measurement */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
            <h3 className="text-base font-bold text-slate-900">
              5 Lưu ý Để Đo Huyết áp Tại nhà Chính xác Nhất
            </h3>
          </div>
          <ol className="space-y-2.5 text-sm text-slate-700 list-decimal list-inside leading-relaxed">
            <li>
              <strong>Ngồi nghỉ ngơi ít nhất 5 phút</strong> ở nơi yên tĩnh trước khi bấm máy đo; không đo ngay khi vừa đi bộ nhanh hoặc vừa leo cầu thang.
            </li>
            <li>
              <strong>Không uống trà đặc, cà phê</strong> trong vòng 30 phút trước khi đo vì sẽ làm huyết áp và nhịp tim tăng tạm thời.
            </li>
            <li>
              <strong>Đặt bắp tay ngang tầm tim</strong> trên mặt bàn phẳng, lưng tựa nhẹ vào ghế, hai chân đặt phẳng trên sàn nhà (không bắt chéo chân).
            </li>
            <li>
              <strong>Đo vào cùng một khung giờ cố định mỗi ngày</strong> (tốt nhất là buổi sáng sau khi thức dậy, trước khi ăn sáng và trước khi uống thuốc huyết áp).
            </li>
            <li>
              <strong>Nếu thấy số đo cao bất thường</strong>, hãy nằm thư giãn hít thở sâu 5–10 phút rồi đo lại lần thứ hai để kiểm tra chính xác.
            </li>
          </ol>
        </div>

        {/* Emergency Contact & Doctor Info Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <PhoneCall className="w-5 h-5 text-rose-600 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Thông tin Bác sĩ &amp; Người thân Liên hệ Nhanh
              </h3>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-xs text-slate-500">Họ tên Người sử dụng &amp; Nhóm máu</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {profile.fullName} · Nhóm máu {profile.bloodType}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-xs text-slate-500">Bác sĩ Điều trị &amp; Bệnh viện</p>
                <p className="font-bold text-slate-900 mt-0.5">{profile.primaryDoctor}</p>
                <p className="text-xs text-slate-600 mt-0.5">{profile.hospitalName}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                <p className="text-xs text-rose-700 font-medium">
                  Người thân Liên hệ Khẩn cấp
                </p>
                <p className="font-bold text-rose-950 mt-0.5">
                  {profile.emergencyContactName} —{' '}
                  <span className="font-mono-tabular">{profile.emergencyContactPhone}</span>
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 border-t border-slate-100 pt-2.5">
            Cô Chú / Anh Chị có thể cập nhật số điện thoại người thân hoặc tên bác sĩ bất cứ lúc nào trong mục{' '}
            <button
              type="button"
              onClick={() => onNavigateModule('medications')}
              className="font-semibold text-teal-700 underline cursor-pointer"
            >
              Tủ thuốc &amp; Hồ sơ
            </button>
            .
          </p>
        </div>
      </div>

      {/* Frequently Asked Questions for Middle-Aged Users */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Câu hỏi Thường gặp Khi Sử dụng Ứng dụng
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <p className="font-bold text-slate-900">
              1. Tôi lỡ nhập nhầm số huyết áp thì xóa đi làm sao?
            </p>
            <p className="text-slate-600 leading-relaxed">
              Rất đơn giản: Mở mục <strong>&ldquo;Sổ Khám &amp; Báo cáo&rdquo;</strong>, tìm dòng số đo bị nhầm và bấm vào biểu tượng thùng rác ở cuối dòng để xóa đi, sau đó nhập lại số đúng.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <p className="font-bold text-slate-900">
              2. Làm sao để không bị mất sổ sức khỏe khi đổi điện thoại?
            </p>
            <p className="text-slate-600 leading-relaxed">
              Tại trang chính, chỉ cần bấm nút <strong>&ldquo;Đăng nhập với Google&rdquo;</strong> rồi bấm <strong>&ldquo;Sao lưu Sổ Sức khỏe&rdquo;</strong>. Toàn bộ lịch sử đo và đơn thuốc sẽ được cất giữ an toàn trên tài khoản cá nhân.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <p className="font-bold text-slate-900">
              3. Làm sao để điện thoại tự động báo nhắc giờ đi khám?
            </p>
            <p className="text-slate-600 leading-relaxed">
              Ở khung <strong>&ldquo;Hẹn Lịch Tái khám&rdquo;</strong> tại trang chính, chọn ngày giờ bác sĩ hẹn rồi bấm <strong>&ldquo;Đặt lịch Tái khám&rdquo;</strong>. Điện thoại sẽ tự động nhắc trước 30 phút.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

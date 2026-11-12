# VitaPulse — Sổ Theo dõi Sức khỏe Cá nhân & Gia đình

Ứng dụng web & PWA quản lý chỉ số sinh tồn (huyết áp, đường huyết, nhịp tim, SpO2, cân nặng), nhắc lịch uống thuốc/tập luyện định kỳ và tự lưu trữ thông tin thẻ BHYT cá nhân dành cho người 45–70 tuổi và gia đình tại Việt Nam.

## Kiến trúc & Tổ chức Thư mục

- `server.ts`: Máy chủ Express + Vite middleware phục vụ ứng dụng trên cổng `3000` và cung cấp các endpoint AI phía server (`/api/ai/weekly-summary`, `/api/ai/extract-medical-image`) sử dụng `@google/genai`. Khóa `GEMINI_API_KEY` chỉ nằm ở biến môi trường máy chủ.
- `src/hooks/`:
  - `useProfile.ts`: Quản lý trạng thái đăng nhập, hồ sơ y tế cá nhân vs. hồ sơ Demo, đồng ý quyền riêng tư theo Nghị định 13/2023/NĐ-CP, xuất/xóa toàn bộ dữ liệu và đồng bộ Firebase Cloud.
  - `useVitals.ts`: Quản lý chỉ số sinh tồn, bữa ăn, lịch tập luyện định kỳ, lượng nước uống và cấu hình ưu tiên thẻ chỉ số theo mã ICD-10 (`I10`, `E11`, `K21`/`K76`).
  - `useMedications.ts`: Quản lý lịch uống thuốc, tỷ lệ tuân thủ, bộ đếm thời gian và hệ thống thông báo đẩy cục bộ (Local Push Notification).
- `src/components/`:
  - `layout/`: `AppTopHeaderAndNav.tsx`, `PatientIdentityBar.tsx` (bộ chọn cỡ chữ *Vừa / Lớn / Rất lớn*, menu hồ sơ gộp gọn).
  - `dashboard/`: `DashboardOverviewView.tsx`, `CompositeIndexCard.tsx`, `PriorityMetricsGrid.tsx`, `DashboardDailyChecklists.tsx`.
  - `AiHealthAssistantPanel.tsx`: Tóm tắt sức khỏe 7 ngày ẩn danh (5 dòng) và đọc ảnh đơn thuốc/máy đo huyết áp có bước xác nhận bắt buộc trước khi lưu, kèm Guardrail cảnh báo gọi **115**.
- `src/utils/`:
  - `healthCalculations.ts`: Các hàm tính toán chỉ số y khoa tham khảo, quy tắc chặn mức "Tối ưu" (Cap Rule), ẩn bớt mã BHYT/CCCD và ưu tiên thẻ theo ICD-10.
  - `aiHealthGuardrails.ts`: Ẩn danh hóa dữ liệu 7 ngày (cắt bỏ tên, mã BHYT/CCCD) và bộ lọc từ khóa/ngưỡng nguy cấp gọi 115.
  - `storage.ts`: Module đọc/ghi `localStorage` có debounce và chỉ ghi khóa thay đổi.

## Hướng dẫn Cấu hình `assetlinks.json` khi Đóng gói TWA lên Google Play (CH Play)

File `public/.well-known/assetlinks.json` hiện đang đặt giá trị giữ chỗ (placeholder) rõ ràng:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "vn.vitapulse.health.twa",
      "sha256_cert_fingerprints": [
        "GHI_SHA256_THAT_VAO_DAY"
      ]
    }
  }
]
```

**Lưu ý bắt buộc trước khi xuất bản lên Google Play Console:**
1. Tạo keystore ký ứng dụng Android (`.jks` hoặc `.keystore`) bằng Bubblewrap CLI hoặc PWABuilder, hoặc lấy mã SHA-256 trong mục **Setup > App signing** trên Google Play Console.
2. Chạy lệnh kiểm tra fingerprint:
   ```bash
   keytool -list -v -keystore my-release-key.jks -alias my-key-alias
   ```
3. Thay thế chuỗi `"GHI_SHA256_THAT_VAO_DAY"` trong file `public/.well-known/assetlinks.json` bằng mã `SHA-256` thật của chứng chỉ ký app (dạng `AA:BB:CC:...`) để Android xác thực Digital Asset Links và ẩn thanh địa chỉ trình duyệt khi chạy ở chế độ Trusted Web Activity (TWA).

## Chạy Kiểm thử & Phát triển

```bash
# Chạy máy chủ phát triển (cổng 3000)
npm run dev

# Chạy toàn bộ Unit Test
npm test

# Kiểm tra kiểu TypeScript và biên dịch bản Production
npm run lint
npm run build
```

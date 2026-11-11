import React, { useState } from 'react';
import {
  MealEntry,
  MedicationSchedule,
  UserMedicalProfile,
  VitalRecord,
} from '../types/health';
import { Check, Copy, Cpu, Database, FileCode2, Layers, Play } from 'lucide-react';

interface SystemBlueprintViewProps {
  profile: UserMedicalProfile;
  vitals: VitalRecord[];
  meals: MealEntry[];
  medications: MedicationSchedule[];
}

type BlueprintTab = 'requirements' | 'architecture' | 'database' | 'api';

const SQL_SCHEMA = `-- HỆ QUẢN TRỊ CƠ SỞ DỮ LIỆU: PostgreSQL 16 + TimescaleDB (Chuỗi thời gian Sinh hiệu)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    birth_year INT NOT NULL,
    gender VARCHAR(16) NOT NULL,
    height_cm NUMERIC(5,2) NOT NULL,
    weight_kg NUMERIC(5,2) NOT NULL,
    blood_type VARCHAR(5) NOT NULL,
    primary_doctor VARCHAR(150),
    emergency_contact_phone VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vital_measurements (
    measurement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    systolic_mmhg SMALLINT NOT NULL CHECK (systolic_mmhg BETWEEN 60 AND 250),
    diastolic_mmhg SMALLINT NOT NULL CHECK (diastolic_mmhg BETWEEN 40 AND 160),
    heart_rate_bpm SMALLINT NOT NULL CHECK (heart_rate_bpm BETWEEN 35 AND 220),
    spo2_percent NUMERIC(4,1) NOT NULL CHECK (spo2_percent BETWEEN 70 AND 100),
    blood_glucose_mgdl SMALLINT CHECK (blood_glucose_mgdl BETWEEN 40 AND 500),
    glucose_context VARCHAR(20) DEFAULT 'fasting',
    device_source VARCHAR(60) DEFAULT 'Smartwatch BLE',
    clinical_notes TEXT
);

CREATE TABLE nutrition_logs (
    meal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    logged_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    food_name VARCHAR(200) NOT NULL,
    calories_kcal INT NOT NULL,
    protein_g NUMERIC(5,1) DEFAULT 0,
    carbs_g NUMERIC(5,1) DEFAULT 0,
    fat_g NUMERIC(5,1) DEFAULT 0
);

CREATE TABLE medication_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    medication_name VARCHAR(160) NOT NULL,
    dosage VARCHAR(60) NOT NULL,
    time_slot TIME NOT NULL,
    meal_instruction VARCHAR(100),
    remaining_pills INT NOT NULL DEFAULT 30
);`;

export const SystemBlueprintView: React.FC<SystemBlueprintViewProps> = ({
  profile,
  vitals,
  meals,
  medications,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<BlueprintTab>('requirements');
  const [copiedSql, setCopiedSql] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<
    'GET /api/v1/vitals/latest' | 'GET /api/v1/patient/ehr-summary' | 'POST /api/v1/vitals/evaluate'
  >('GET /api/v1/vitals/latest');

  const handleCopySql = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(SQL_SCHEMA);
    }
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const getLiveApiResponse = () => {
    if (selectedEndpoint === 'GET /api/v1/vitals/latest') {
      return JSON.stringify(
        {
          status: 200,
          standard: 'HL7 FHIR R4 Observation',
          patientId: profile.id,
          latestObservation: vitals[0] || null,
          totalRecordsCount: vitals.length,
        },
        null,
        2
      );
    }
    if (selectedEndpoint === 'GET /api/v1/patient/ehr-summary') {
      return JSON.stringify(
        {
          status: 200,
          patient: {
            fullName: profile.fullName,
            bloodType: profile.bloodType,
            allergies: profile.allergies,
            chronicConditions: profile.chronicConditions,
            primaryDoctor: profile.primaryDoctor,
          },
          activeMedicationsCount: medications.length,
          loggedMealsToday: meals.length,
        },
        null,
        2
      );
    }
    return JSON.stringify(
      {
        status: 200,
        engine: 'Clinical Rule Engine (AHA 2025 / ADA / WHO Asian BMI)',
        alertTriggered: (vitals[0]?.systolic ?? 120) >= 130,
        evaluatedAt: new Date().toISOString(),
        recommendation:
          'Duy trì đo huyết áp định kỳ 07:00 sáng và đồng bộ cảm biến Smartwatch qua Bluetooth BLE.',
      },
      null,
      2
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Section Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Hồ sơ Phân tích & Thiết kế Hệ thống Theo dõi Sức khỏe Cá nhân (Mobile & Web)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tài liệu đặc tả kỹ thuật toàn diện phục vụ triển khai thực tế: Use Cases, Kiến trúc Đa tầng, Cơ sở dữ liệu ERD & RESTful API
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setActiveSubTab('requirements')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSubTab === 'requirements'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              1. Phân tích Yêu cầu & Use Cases
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('architecture')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSubTab === 'architecture'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              2. Kiến trúc Hệ thống
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('database')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSubTab === 'database'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              3. Thiết kế CSDL (ERD & SQL)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('api')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSubTab === 'api'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5 text-amber-600" />
              4. Đặc tả API & Thử nghiệm
            </button>
          </div>
        </div>

        {/* SUB-TAB 1: REQUIREMENTS & USE CASES */}
        {activeSubTab === 'requirements' && (
          <div className="pt-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-900">
                  01. Tác nhân Người dùng Cá nhân (Mobile App)
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Sử dụng ứng dụng di động hàng ngày để đồng bộ đồng hồ thông minh (BLE), ghi nhận huyết áp, đường huyết, nhật ký bữa ăn, lượng nước uống và nhận thông báo nhắc uống thuốc đúng giờ.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-900">
                  02. Bác sĩ Gia đình / Chuyên gia Y tế (Web Portal)
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Truy cập Web Quản lý để theo dõi biểu đồ xu hướng sinh hiệu dài hạn của bệnh nhân, nhận cảnh báo sớm khi huyết áp/SpO2 vượt ngưỡng, và điều chỉnh phác đồ thuốc từ xa.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-900">
                  03. Thiết bị IoT Wearable & Cảm biến Y tế
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Đồng hồ thông minh (Apple HealthKit / Google Health Connect), máy đo huyết áp bắp tay Bluetooth Omron và máy đo đường huyết liên tục (CGM) truyền dữ liệu tự động.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
                  Danh mục Yêu cầu Chức năng Cốt lõi (Functional Requirements)
                </h4>
                <ul className="mt-3 space-y-2.5 text-xs text-slate-700">
                  <li>
                    <strong>FR-01 (Quản lý Sinh hiệu Đa chiều):</strong> Thu thập, kiểm tra tính hợp lệ và phân loại tự động Huyết áp (AHA), Đường huyết (ADA), Nhịp tim, SpO2, Thân nhiệt và BMI chuẩn châu Á.
                  </li>
                  <li>
                    <strong>FR-02 (Cân bằng Dinh dưỡng & Vận động):</strong> Tính toán chỉ số trao đổi chất cơ bản (BMR Mifflin-St Jeor), theo dõi đa lượng (Protein, Carbs, Fat), lượng nước uống và calo đốt cháy.
                  </li>
                  <li>
                    <strong>FR-03 (Quản lý Phác đồ Thuốc & Cảnh báo):</strong> Lên lịch nhắc thuốc theo khung giờ, kiểm soát số lượng viên thuốc tồn kho và cảnh báo tương tác dược lâm sàng.
                  </li>
                  <li>
                    <strong>FR-04 (Trích xuất & Liên thông Bệnh án EHR):</strong> Xuất báo cáo CSV/JSON chuẩn hóa phục vụ khám chữa bệnh từ xa (Telehealth).
                  </li>
                </ul>
              </div>

              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
                  Yêu cầu Phi chức năng & Tiêu chuẩn Y tế (Non-Functional Requirements)
                </h4>
                <ul className="mt-3 space-y-2.5 text-xs text-slate-700">
                  <li>
                    <strong>NFR-01 (Hoạt động Offline-First trên Di động):</strong> Lưu trữ cục bộ bằng SQLite/IndexedDB khi mất mạng và đồng bộ nền (Background Sync) khi có kết nối Internet.
                  </li>
                  <li>
                    <strong>NFR-02 (Bảo mật Dữ liệu Y tế nhạy cảm):</strong> Mã hóa AES-256 ở tầng lưu trữ, TLS 1.3 khi truyền tải, phân quyền RBAC giữa Bệnh nhân và Bác sĩ theo chuẩn HIPAA / Nghị định 13/2023/NĐ-CP.
                  </li>
                  <li>
                    <strong>NFR-03 (Hiệu năng & Trải nghiệm Chạm):</strong> Thời gian phản hồi cảnh báo sinh hiệu &lt; 150ms; vùng chạm tối thiểu 44x44px tối ưu thao tác một tay cho người cao tuổi.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: MULTI-TIER SYSTEM ARCHITECTURE */}
        {activeSubTab === 'architecture' && (
          <div className="pt-5 space-y-5">
            <p className="text-xs text-slate-600">
              Sơ đồ kiến trúc hệ thống kết hợp <strong>Ứng dụng Di động Đa nền tảng (React Native / PWA)</strong>, <strong>Web Quản lý Bác sĩ/Cá nhân</strong>, và <strong>Tầng Xử lý Dữ liệu Y tế Chuỗi thời gian</strong>:
            </p>

            {/* Clean Vector Architecture Diagram */}
            <div className="w-full overflow-x-auto bg-slate-50 border border-slate-200 rounded-xl p-4">
              <svg
                viewBox="0 0 860 280"
                className="w-full h-auto min-w-[680px]"
                role="img"
                aria-label="Sơ đồ Kiến trúc Hệ thống Theo dõi Sức khỏe Cá nhân VitaPulse"
              >
                {/* Layer 1: Edge & Device Layer */}
                <rect x="20" y="25" width="180" height="230" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                <text x="110" y="50" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
                  1. Tầng Cảm biến & Thiết bị
                </text>
                <rect x="36" y="70" width="148" height="44" rx="8" fill="#F0FDFA" stroke="#0D9488" />
                <text x="110" y="96" textAnchor="middle" className="fill-teal-900 text-[11px] font-semibold">
                  Smartwatch (BLE GATT)
                </text>
                <rect x="36" y="128" width="148" height="44" rx="8" fill="#F0FDFA" stroke="#0D9488" />
                <text x="110" y="154" textAnchor="middle" className="fill-teal-900 text-[11px] font-semibold">
                  Máy đo HA / Đường huyết
                </text>
                <rect x="36" y="186" width="148" height="44" rx="8" fill="#F8FAFC" stroke="#94A3B8" />
                <text x="110" y="212" textAnchor="middle" className="fill-slate-700 text-[11px] font-medium">
                  Apple Health / Google Fit
                </text>

                {/* Arrow 1 -> 2 */}
                <line x1="200" y1="140" x2="245" y2="140" stroke="#64748B" strokeWidth="2" />
                <polygon points="245,135 255,140 245,145" fill="#64748B" />

                {/* Layer 2: Client Applications */}
                <rect x="255" y="25" width="190" height="230" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                <text x="350" y="50" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
                  2. Tầng Ứng dụng (Client)
                </text>
                <rect x="272" y="75" width="156" height="68" rx="8" fill="#EEF2FF" stroke="#6366F1" />
                <text x="350" y="102" textAnchor="middle" className="fill-indigo-950 text-[11px] font-semibold">
                  Mobile App (iOS / Android)
                </text>
                <text x="350" y="120" textAnchor="middle" className="fill-indigo-700 text-[10px]">
                  Offline SQLite + Push Alert
                </text>
                <rect x="272" y="162" width="156" height="68" rx="8" fill="#EEF2FF" stroke="#6366F1" />
                <text x="350" y="189" textAnchor="middle" className="fill-indigo-950 text-[11px] font-semibold">
                  Web Dashboard Quản lý
                </text>
                <text x="350" y="207" textAnchor="middle" className="fill-indigo-700 text-[10px]">
                  React 19 + Phân tích EHR
                </text>

                {/* Arrow 2 -> 3 */}
                <line x1="445" y1="140" x2="490" y2="140" stroke="#64748B" strokeWidth="2" />
                <polygon points="490,135 500,140 490,145" fill="#64748B" />

                {/* Layer 3: API Gateway & Services */}
                <rect x="500" y="25" width="175" height="230" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                <text x="587" y="50" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
                  3. Dịch vụ Xử lý Nghiệp vụ
                </text>
                <rect x="516" y="70" width="143" height="44" rx="8" fill="#FFFBEB" stroke="#D97706" />
                <text x="587" y="96" textAnchor="middle" className="fill-amber-900 text-[11px] font-semibold">
                  REST / FHIR API Gateway
                </text>
                <rect x="516" y="128" width="143" height="44" rx="8" fill="#FFFBEB" stroke="#D97706" />
                <text x="587" y="154" textAnchor="middle" className="fill-amber-900 text-[11px] font-semibold">
                  Clinical Rule Engine
                </text>
                <rect x="516" y="186" width="143" height="44" rx="8" fill="#FFFBEB" stroke="#D97706" />
                <text x="587" y="212" textAnchor="middle" className="fill-amber-900 text-[11px] font-semibold">
                  Medication Reminder Cron
                </text>

                {/* Arrow 3 -> 4 */}
                <line x1="675" y1="140" x2="710" y2="140" stroke="#64748B" strokeWidth="2" />
                <polygon points="710,135 720,140 710,145" fill="#64748B" />

                {/* Layer 4: Storage Layer */}
                <rect x="720" y="25" width="125" height="230" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                <text x="782" y="50" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
                  4. Lưu trữ Dữ liệu
                </text>
                <rect x="732" y="80" width="100" height="64" rx="8" fill="#F1F5F9" stroke="#475569" />
                <text x="782" y="108" textAnchor="middle" className="fill-slate-900 text-[11px] font-semibold">
                  PostgreSQL 16
                </text>
                <text x="782" y="124" textAnchor="middle" className="fill-slate-600 text-[10px]">
                  Hồ sơ & Thuốc
                </text>
                <rect x="732" y="160" width="100" height="64" rx="8" fill="#F1F5F9" stroke="#475569" />
                <text x="782" y="188" textAnchor="middle" className="fill-slate-900 text-[11px] font-semibold">
                  TimescaleDB
                </text>
                <text x="782" y="204" textAnchor="middle" className="fill-slate-600 text-[10px]">
                  Chuỗi Sinh hiệu
                </text>
              </svg>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: DATABASE SCHEMA & ERD */}
        {activeSubTab === 'database' && (
          <div className="pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600">
                Lược đồ Cơ sở dữ liệu Quan hệ chuẩn hóa 3NF kết hợp bảng phân vùng thời gian (Hypertable) cho hàng triệu bản ghi cảm biến:
              </p>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Đã sao chép SQL
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép DDL SQL
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono-tabular overflow-x-auto leading-relaxed">
              {SQL_SCHEMA}
            </pre>
          </div>
        )}

        {/* SUB-TAB 4: INTERACTIVE API SPECIFICATION */}
        {activeSubTab === 'api' && (
          <div className="pt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Danh sách Điểm cuối RESTful API (Chuẩn HL7 FHIR)
              </h4>
              <p className="text-xs text-slate-500">
                Chọn một Endpoint bên dưới để kiểm tra phản hồi JSON thời gian thực dựa trên dữ liệu bạn vừa nhập trong ứng dụng:
              </p>

              {(
                [
                  'GET /api/v1/vitals/latest',
                  'GET /api/v1/patient/ehr-summary',
                  'POST /api/v1/vitals/evaluate',
                ] as const
              ).map((ep) => (
                <button
                  key={ep}
                  type="button"
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-center justify-between ${
                    selectedEndpoint === ep
                      ? 'border-teal-600 bg-teal-50/40 text-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="font-mono-tabular text-xs font-semibold">{ep}</span>
                  <span className="text-xs font-medium text-teal-700 flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    Thực thi
                  </span>
                </button>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">
                Phản hồi JSON Trực tiếp từ Hệ thống ({selectedEndpoint})
              </h4>
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-300 text-xs font-mono-tabular overflow-x-auto leading-relaxed">
                {getLiveApiResponse()}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

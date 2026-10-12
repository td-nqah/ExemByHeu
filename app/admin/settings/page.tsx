"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getAllProfiles,
  adminResetUserPassword,
  getExams,
  getSubmissions,
} from "@/lib/store";
import { Profile, AccountSecurity } from "@/types/exam";
import {
  HardDrive,
  Database,
  KeyRound,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  FolderArchive,
  Layers,
  Copy,
  Check,
  Monitor,
  Globe,
  Power,
} from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // =========================================================================
  // SECTION 1: STORAGE & RESOURCE MEASUREMENT (DOWN TO EACH MB)
  // =========================================================================
  const maxStorageMB = 500.0;
  const [isScanning, setIsScanning] = useState(false);

  // Granular MB measurements
  const [stats, setStats] = useState({ exams: 0, questions: 0, submissions: 0 });
  const [dbTablesMB, setDbTablesMB] = useState(0);
  const [filesStorageMB, setFilesStorageMB] = useState(0);
  const [cacheLogsMB, setCacheLogsMB] = useState(0);
  const [rpcConfigured, setRpcConfigured] = useState<boolean | null>(null);
  const [rpcSqlScript, setRpcSqlScript] = useState<string>(
    "CREATE OR REPLACE FUNCTION get_db_size()\nRETURNS bigint AS $$\n SELECT pg_database_size(current_database());\n$$ LANGUAGE sql SECURITY DEFINER;"
  );
  const [copiedSql, setCopiedSql] = useState(false);

  const usedStorageMB = useMemo(() => {
    return Number((dbTablesMB + filesStorageMB + cacheLogsMB).toFixed(1));
  }, [dbTablesMB, filesStorageMB, cacheLogsMB]);

  const storagePercentage = useMemo(() => {
    return Number(((usedStorageMB / maxStorageMB) * 100).toFixed(1));
  }, [usedStorageMB, maxStorageMB]);

  const isHighStorage = storagePercentage >= 80.0;

  // Measure client browser cache using navigator.storage.estimate()
  const getClientCacheEstimateMB = async (): Promise<number> => {
    if (typeof window !== "undefined" && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageBytes = estimate.usage || 0;
        return Number((usageBytes / (1024 * 1024)).toFixed(2));
      } catch {
        // fallback
      }
    }
    if (typeof window !== "undefined" && window.localStorage) {
      let totalLen = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalLen += (localStorage.getItem(key) || "").length * 2;
        }
      }
      return Number(Math.max(0.1, totalLen / (1024 * 1024)).toFixed(2));
    }
    return 0.5;
  };

  // Real-time Storage calculation based on database records, storage buckets and browser cache
  const handleRecalculateStorage = async () => {
    setIsScanning(true);
    try {
      const [statsRes, clientCacheMB] = await Promise.all([
        fetch("/api/admin/system-stats").then((r) => r.json()).catch(() => null),
        getClientCacheEstimateMB(),
      ]);

      if (statsRes && statsRes.success) {
        setDbTablesMB(statsRes.database.mb);
        setFilesStorageMB(statsRes.storage.mb);
        setCacheLogsMB(clientCacheMB);
        setStats({
          exams: statsRes.stats.exams,
          questions: statsRes.stats.questions,
          submissions: statsRes.stats.submissions,
        });
        setRpcConfigured(statsRes.rpcConfigured);
        if (statsRes.rpcSqlScript) {
          setRpcSqlScript(statsRes.rpcSqlScript);
        }
      } else {
        setCacheLogsMB(clientCacheMB);
      }
    } finally {
      setTimeout(() => setIsScanning(false), 300);
    }
  };

  // =========================================================================
  // SECTION 2: ACCOUNTS SECURITY & USER PASSWORD MANAGEMENT
  // =========================================================================
  // 1. Accounts Security & Device/IP Limiting State
  const [accountsSecurity, setAccountsSecurity] = useState<AccountSecurity[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountActionNotice, setAccountActionNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchAccountsSecurity = async () => {
    try {
      const res = await fetch("/api/admin/accounts");
      const data = await res.json();
      if (res.ok && data.success && data.accounts) {
        setAccountsSecurity(data.accounts);
      }
    } catch {}
  };

  // 2. User Password Reset State
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("tth");
  const [emergencyNewPassword, setEmergencyNewPassword] = useState("");
  const [showEmergencyPass, setShowEmergencyPass] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyNotice, setEmergencyNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Security Check: Only admin allowed
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    async function loadInitialData() {
      const profiles = await getAllProfiles();
      setAllProfiles(profiles);
      if (profiles.length > 0 && !profiles.some((p) => p.username === selectedUser)) {
        setSelectedUser(profiles[0].username);
      }
      handleRecalculateStorage();
      fetchAccountsSecurity();
    }
    loadInitialData();
  }, [router, selectedUser]);

  // Handle Toggle Active status
  const handleToggleActive = async (username: string, currentActive: boolean) => {
    setAccountsLoading(true);
    setAccountActionNotice(null);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_active",
          username,
          is_active: !currentActive,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccountActionNotice({
          type: "success",
          message: data.message,
        });
        await fetchAccountsSecurity();
      } else {
        setAccountActionNotice({
          type: "error",
          message: data.error || "Không thể cập nhật trạng thái tài khoản.",
        });
      }
    } catch {
      setAccountActionNotice({
        type: "error",
        message: "Lỗi kết nối khi cập nhật tài khoản.",
      });
    } finally {
      setAccountsLoading(false);
    }
  };

  // Handle Reset Devices and IPs
  const handleResetSecurity = async (username: string) => {
    setAccountsLoading(true);
    setAccountActionNotice(null);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_security",
          username,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccountActionNotice({
          type: "success",
          message: data.message,
        });
        await fetchAccountsSecurity();
      } else {
        setAccountActionNotice({
          type: "error",
          message: data.error || "Không thể đặt lại thiết bị cho tài khoản.",
        });
      }
    } catch {
      setAccountActionNotice({
        type: "error",
        message: "Lỗi kết nối khi đặt lại thiết bị.",
      });
    } finally {
      setAccountsLoading(false);
    }
  };

  // Handle User Password Reset
  const handleUserPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmergencyNotice(null);

    if (!selectedUser) {
      setEmergencyNotice({
        type: "error",
        message: "Vui lòng chọn tài khoản cần đặt lại mật khẩu.",
      });
      return;
    }

    if (!emergencyNewPassword || emergencyNewPassword.trim().length === 0) {
      setEmergencyNotice({
        type: "error",
        message: "Vui lòng nhập mật khẩu mới cho tài khoản được chọn.",
      });
      return;
    }

    setEmergencyLoading(true);
    try {
      const result = await adminResetUserPassword(
        selectedUser,
        emergencyNewPassword.trim()
      );

      if (result.success) {
        setEmergencyNotice({
          type: "success",
          message: `Đã cập nhật mật khẩu cho tài khoản '${selectedUser}' thành công!`,
        });
        setEmergencyNewPassword("");
      } else {
        setEmergencyNotice({
          type: "error",
          message: result.message || "Không thể cập nhật mật khẩu.",
        });
      }
    } catch {
      setEmergencyNotice({
        type: "error",
        message: "Lỗi kết nối khi cập nhật mật khẩu.",
      });
    } finally {
      setEmergencyLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* =========================================================================
          CHỨC NĂNG 1: THEO DÕI BỘ NHỚ TÀI NGUYÊN THỰC TẾ (ĐO TỪNG MB)
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="h-4.5 w-4.5 text-indigo-400" />
            <span>1. Theo dõi Bộ nhớ Tài nguyên Thực tế (Đo lường từng MB)</span>
          </h2>
          <span className="text-xs text-slate-400">Giới hạn: {maxStorageMB} MB</span>
        </div>

        <div className="rounded-2xl bg-[#151b27] border border-white/[0.06] p-6 space-y-5">
          {/* Automatic Alert if > 80% */}
          {isHighStorage ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-rose-300">
                  CẢNH BÁO: Dung lượng bộ nhớ đã vượt quá 80% ({storagePercentage}%)!
                </h4>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  Bộ nhớ đã dùng {usedStorageMB} MB trên tổng {maxStorageMB} MB. Vui lòng dọn dẹp các bài nộp cũ hoặc tệp đính kèm để tránh gián đoạn các kỳ thi tiếp theo.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#1a2232] border border-white/[0.06] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-semibold text-xs text-white">Dung lượng trong ngưỡng an toàn</h4>
                  <p className="text-[11px] text-slate-400">
                    Đang sử dụng {isScanning ? "..." : usedStorageMB} MB / {maxStorageMB} MB ({isScanning ? "..." : storagePercentage}% khả dụng).
                  </p>
                </div>
              </div>

              {/* Recalculate Button */}
              <button
                type="button"
                onClick={handleRecalculateStorage}
                disabled={isScanning}
                className="px-3 py-1.5 rounded-lg bg-[#4f57ea] hover:bg-[#434ac9] active:bg-[#3d43b6] text-xs text-white font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
                <span>{isScanning ? "Đang đo thực tế..." : "Đo lại thực tế"}</span>
              </button>
            </div>
          )}

          {/* Progress Bar Container */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Database className="h-4 w-4 text-indigo-400" />
                Tổng dung lượng lưu trữ đã sử dụng:
              </span>
              <span className="font-mono font-bold text-white">
                {isScanning ? (
                  <span className="inline-block h-4 w-20 bg-slate-700/60 rounded animate-pulse" />
                ) : (
                  <>
                    <span className={isHighStorage ? "text-rose-400" : "text-[#818cf8]"}>
                      {usedStorageMB.toFixed(1)} MB
                    </span>{" "}
                    / {maxStorageMB.toFixed(1)} MB{" "}
                    <span className="text-slate-400 font-normal">({storagePercentage}%)</span>
                  </>
                )}
              </span>
            </div>

            {/* Visual Bar Track */}
            <div className="w-full h-3 bg-[#111622] rounded-full overflow-hidden p-0.5 border border-white/[0.08]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isHighStorage ? "bg-rose-500" : "bg-[#4f57ea]"
                } ${isScanning ? "animate-pulse opacity-70" : ""}`}
                style={{ width: `${Math.min(100, storagePercentage)}%` }}
              />
            </div>
          </div>

          {/* Granular Resource Breakdown Cards (Measured to each MB) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* 1. Database Tables */}
            <div className="rounded-xl bg-[#1b2230] border border-white/[0.06] p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Database className="h-3.5 w-3.5 text-indigo-400" />
                  Bảng CSDL PostgreSQL
                </span>
                {isScanning ? (
                  <span className="inline-block h-3.5 w-14 bg-slate-700/60 rounded animate-pulse" />
                ) : (
                  <span className="font-mono font-bold text-white">{dbTablesMB.toFixed(1)} MB</span>
                )}
              </div>
              <div className="w-full bg-[#111622] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`bg-indigo-400 h-full rounded-full transition-all duration-500 ${isScanning ? "animate-pulse opacity-70" : ""}`}
                  style={{ width: `${((dbTablesMB / maxStorageMB) * 100).toFixed(0)}%` }}
                />
              </div>
              <p className="text-[10.5px] text-slate-400 pt-0.5">
                {rpcConfigured
                  ? "Đo trực tiếp qua pg_database_size() RPC"
                  : `Đo thực tế theo ${stats.exams} đề thi & ${stats.questions} câu hỏi`}
              </p>
            </div>

            {/* 2. Storage Buckets & Attachments */}
            <div className="rounded-xl bg-[#1b2230] border border-white/[0.06] p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <FolderArchive className="h-3.5 w-3.5 text-purple-400" />
                  Kho Tệp & Đính kèm
                </span>
                {isScanning ? (
                  <span className="inline-block h-3.5 w-14 bg-slate-700/60 rounded animate-pulse" />
                ) : (
                  <span className="font-mono font-bold text-white">{filesStorageMB.toFixed(1)} MB</span>
                )}
              </div>
              <div className="w-full bg-[#111622] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`bg-purple-400 h-full rounded-full transition-all duration-500 ${isScanning ? "animate-pulse opacity-70" : ""}`}
                  style={{ width: `${((filesStorageMB / maxStorageMB) * 100).toFixed(0)}%` }}
                />
              </div>
              <p className="text-[10.5px] text-slate-400 pt-0.5">
                Đo thực tế qua Supabase Storage Buckets
              </p>
            </div>

            {/* 3. Cache & Temp Logs */}
            <div className="rounded-xl bg-[#1b2230] border border-white/[0.06] p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Layers className="h-3.5 w-3.5 text-emerald-400" />
                  Bộ nhớ Đệm & Tạm
                </span>
                {isScanning ? (
                  <span className="inline-block h-3.5 w-14 bg-slate-700/60 rounded animate-pulse" />
                ) : (
                  <span className="font-mono font-bold text-white">{cacheLogsMB.toFixed(1)} MB</span>
                )}
              </div>
              <div className="w-full bg-[#111622] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`bg-emerald-400 h-full rounded-full transition-all duration-500 ${isScanning ? "animate-pulse opacity-70" : ""}`}
                  style={{ width: `${((cacheLogsMB / maxStorageMB) * 100).toFixed(0)}%` }}
                />
              </div>
              <p className="text-[10.5px] text-slate-400 pt-0.5">
                Đo thực tế qua navigator.storage.estimate()
              </p>
            </div>
          </div>

          {/* RPC Setup Banner if RPC not yet created in Supabase */}
          {rpcConfigured === false && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Kích hoạt RPC get_db_size() trên Supabase</span>
                </p>
                <p className="text-[11px] text-amber-200/80">
                  Hệ thống đang đo dung lượng theo số liệu bản ghi thực tế. Để lấy trực tiếp 100% từ PostgreSQL, hãy dán lệnh SQL sau vào Supabase SQL Editor.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(rpcSqlScript);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 font-medium text-xs flex items-center gap-1.5 shrink-0 transition cursor-pointer active:scale-95"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSql ? "Đã sao chép" : "Sao chép lệnh SQL"}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          CHỨC NĂNG 2: KIỂM SOÁT HOẠT ĐỘNG TÀI KHOẢN & BẢO MẬT
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-indigo-400" />
            <span>2. Quản lý Tài khoản & Kiểm soát Bảo mật (Giới hạn IP / Thiết bị)</span>
          </h2>
          <span className="text-xs text-slate-400">Tự động khóa khi &gt;3 IP / Thiết bị</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KHỐI 1: Quản lý Kích hoạt & Thiết bị Đăng nhập (Thay thế card Đổi mật khẩu Admin) */}
          <div className="rounded-2xl bg-[#151b27] border border-white/[0.06] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e2538] text-indigo-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Kiểm soát Kích hoạt & Thiết bị</h3>
                    <p className="text-xs text-slate-400">
                      Tự động tắt Active nếu đăng nhập quá 3 IP hoặc 3 thiết bị
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchAccountsSecurity}
                  disabled={accountsLoading}
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Làm mới trạng thái"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${accountsLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {accountActionNotice && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
                    accountActionNotice.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                  }`}
                >
                  {accountActionNotice.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span>{accountActionNotice.message}</span>
                </div>
              )}

              {/* Accounts list table / rows */}
              <div className="space-y-3 mt-4">
                {(accountsSecurity.length > 0
                  ? accountsSecurity
                  : [
                      { username: "adm", role: "admin", is_active: true, ips: [], devices: [] },
                      { username: "tth", role: "user", is_active: true, ips: [], devices: [] },
                      { username: "tmh", role: "user", is_active: true, ips: [], devices: [] },
                      { username: "user", role: "user", is_active: true, ips: [], devices: [] },
                    ]
                ).map((acc) => {
                  const ipCount = acc.ips?.length || 0;
                  const devCount = acc.devices?.length || 0;
                  const isActive = acc.is_active !== false;

                  return (
                    <div
                      key={acc.username}
                      className="rounded-xl bg-[#1b2230] border border-white/[0.06] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white">
                            {acc.username}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 font-medium">
                            {acc.role === "admin" ? "Admin" : "Thí sinh"}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                              isActive
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {isActive ? "Đang hoạt động (Active)" : "Đã khóa (Tắt Active)"}
                          </span>
                        </div>

                        {/* IP and Device counters */}
                        <div className="flex items-center gap-4 text-[11px] text-slate-400">
                          <span
                            className={`flex items-center gap-1 ${
                              ipCount > 3 ? "text-rose-400 font-bold" : ""
                            }`}
                            title={acc.ips?.join(", ") || "Chưa có IP nào ghi nhận"}
                          >
                            <Globe className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                            <span>IP: <strong className="font-mono text-white">{ipCount}</strong>/3</span>
                          </span>

                          <span
                            className={`flex items-center gap-1 ${
                              devCount > 3 ? "text-rose-400 font-bold" : ""
                            }`}
                            title={acc.devices?.join(", ") || "Chưa có thiết bị nào ghi nhận"}
                          >
                            <Monitor className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                            <span>Thiết bị: <strong className="font-mono text-white">{devCount}</strong>/3</span>
                          </span>
                        </div>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Toggle Active Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(acc.username, isActive)}
                          disabled={accountsLoading}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                            isActive
                              ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>{isActive ? "Tắt Active" : "Mở Active"}</span>
                        </button>

                        {/* Reset IP / Device Counters Button */}
                        <button
                          type="button"
                          onClick={() => handleResetSecurity(acc.username)}
                          disabled={accountsLoading}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          title="Đặt lại bộ đếm thiết bị & IP về 0/3 và mở khóa tài khoản"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Đặt lại (0/3)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mt-4 text-[11px] text-slate-500 border-t border-white/[0.06] pt-2.5">
              * Quản trị viên có thể bật/tắt kích hoạt tài khoản thủ công, hoặc ấn &ldquo;Đặt lại (0/3)&rdquo; để gỡ khóa khi thí sinh đổi thiết bị.
            </p>
          </div>

          {/* KHỐI 2: Đổi / Đặt lại Mật khẩu cho Tài khoản Người dùng */}
          <div className="rounded-2xl bg-[#151b27] border border-white/[0.06] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e2538] text-amber-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Đặt lại Mật khẩu cho Người dùng
                  </h3>
                  <p className="text-xs text-slate-400">
                    Toàn quyền cập nhật mật khẩu cho <code className="text-amber-400">user1, user2...</code>
                  </p>
                </div>
              </div>

              <form onSubmit={handleUserPasswordReset} className="space-y-3.5 mt-4">
                {emergencyNotice && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                      emergencyNotice.type === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                    }`}
                  >
                    {emergencyNotice.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <span>{emergencyNotice.message}</span>
                  </div>
                )}

                {/* Select User */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      Chọn tài khoản cần đổi mật khẩu
                    </label>
                    <span className="text-[10px] text-slate-500">
                      ({allProfiles.length} tài khoản)
                    </span>
                  </div>

                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1b2230] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {allProfiles.map((p) => (
                      <option key={p.username} value={p.username} className="bg-[#151b27] text-white">
                        {p.username} ({p.role === "admin" ? "Quản trị viên" : "Người dùng"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* New Password for Selected User */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    Mật khẩu mới cho <strong className="text-amber-400 font-mono">[{selectedUser}]</strong>
                  </label>
                  <div className="relative">
                    <input
                      type={showEmergencyPass ? "text" : "password"}
                      value={emergencyNewPassword}
                      onChange={(e) => setEmergencyNewPassword(e.target.value)}
                      placeholder={`Nhập mật khẩu mới cho ${selectedUser}`}
                      className="w-full px-3 py-2 bg-[#1b2230] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmergencyPass(!showEmergencyPass)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-white"
                    >
                      {showEmergencyPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={emergencyLoading}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {emergencyLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Đang cập nhật...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>Cập nhật mật khẩu ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <p className="mt-4 text-[11px] text-slate-500 border-t border-white/[0.06] pt-2.5">
              * Quản trị viên có thể đổi mật khẩu trực tiếp cho thí sinh khi quên mật khẩu.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

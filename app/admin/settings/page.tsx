"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getAllProfiles,
  adminResetUserPassword,
  adminCreateAccount,
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
  User,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [emergencyNewPassword, setEmergencyNewPassword] = useState("");
  const [showEmergencyPass, setShowEmergencyPass] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyNotice, setEmergencyNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Unified Account Management Card (Tabs & Account Creation)
  const [activeAccountTab, setActiveAccountTab] = useState<"reset" | "create">("reset");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createNotice, setCreateNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Close custom user dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserDropdownOpen(false);
      }
    }
    if (isUserDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserDropdownOpen]);

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

  // Handle Create New Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateNotice(null);

    const cleanUser = newUsername.trim().toLowerCase();
    if (!cleanUser) {
      setCreateNotice({
        type: "error",
        message: "Vui lòng nhập tên tài khoản mới.",
      });
      return;
    }

    if (cleanUser.length < 2) {
      setCreateNotice({
        type: "error",
        message: "Tên tài khoản phải có ít nhất 2 ký tự.",
      });
      return;
    }

    if (!newPassword || newPassword.trim().length === 0) {
      setCreateNotice({
        type: "error",
        message: "Vui lòng nhập mật khẩu cho tài khoản mới.",
      });
      return;
    }

    setCreateLoading(true);
    try {
      const result = await adminCreateAccount(
        cleanUser,
        newPassword.trim(),
        newRole
      );
      if (result.success) {
        setCreateNotice({
          type: "success",
          message: result.message,
        });
        setNewUsername("");
        setNewPassword("");
        // Reload profiles & security statuses
        const profiles = await getAllProfiles();
        setAllProfiles(profiles);
        setSelectedUser(cleanUser);
        await fetchAccountsSecurity();
      } else {
        setCreateNotice({
          type: "error",
          message: result.message,
        });
      }
    } catch {
      setCreateNotice({
        type: "error",
        message: "Lỗi kết nối khi tạo tài khoản.",
      });
    } finally {
      setCreateLoading(false);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* KHỐI 1: Quản lý Kích hoạt & Thiết bị Đăng nhập */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#121826]/95 via-[#0d121c]/95 to-[#090d16] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 backdrop-blur-xl flex flex-col justify-between ring-1 ring-white/[0.04]">
            {/* Ambient glow accent line at top */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#5852d6]/60 via-indigo-500/40 to-transparent" />
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Kiểm soát Kích hoạt & Thiết bị</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tự động tắt Active nếu đăng nhập quá 3 IP hoặc 3 thiết bị
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchAccountsSecurity}
                  disabled={accountsLoading}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
                  title="Làm mới trạng thái bảo mật"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${accountsLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {accountActionNotice && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs flex items-start gap-2 shadow-sm ${
                    accountActionNotice.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                      : "bg-rose-500/10 border border-rose-500/25 text-rose-300"
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
              <div className="space-y-2.5 mt-4">
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
                      className="rounded-xl bg-[#141b29]/80 hover:bg-[#182133]/90 border border-white/[0.06] hover:border-white/[0.12] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-150"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-white">
                            {acc.username}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                            {acc.role === "admin" ? "Admin" : "Thí sinh"}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                              isActive
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                                : "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                            }`}
                          >
                            {isActive ? "Đang hoạt động" : "Đã khóa (Tắt Active)"}
                          </span>
                        </div>

                        {/* IP and Device counters */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 active:scale-95 ${
                            isActive
                              ? "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
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
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium transition cursor-pointer flex items-center gap-1 disabled:opacity-50 active:scale-95"
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

            <div className="mt-4 pt-3 border-t border-white/[0.07] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>Chính sách: Khóa bảo vệ khi vượt ngưỡng 3 IP / 3 máy</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500">Auto-Enforced</span>
            </div>
          </div>

          {/* KHỐI 2: THÍCH HỢP CHUNG CẢ TẠO TÀI KHOẢN VÀ ĐẶT LẠI MẬT KHẨU */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#121826]/95 via-[#0d121c]/95 to-[#090d16] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 backdrop-blur-xl flex flex-col justify-between ring-1 ring-white/[0.04]">
            {/* Ambient glow accent line at top */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 via-purple-500/30 to-transparent" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-white/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                    {activeAccountTab === "reset" ? (
                      <KeyRound className="h-5 w-5" />
                    ) : (
                      <UserPlus className="h-5 w-5 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Quản lý & Cấp phát Tài khoản
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tạo tài khoản mới hoặc đổi mật khẩu cho người dùng
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex text-[10px] px-2.5 py-1 rounded-full font-mono bg-white/[0.04] border border-white/10 text-slate-300">
                  {allProfiles.length} tài khoản
                </span>
              </div>

              {/* Segmented Tab Switcher */}
              <div className="grid grid-cols-2 p-1 mt-4 rounded-xl bg-[#090d16] border border-white/[0.07] shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAccountTab("reset");
                    setEmergencyNotice(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                    activeAccountTab === "reset"
                      ? "bg-gradient-to-r from-amber-500/20 to-amber-600/25 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Đặt lại Mật khẩu</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveAccountTab("create");
                    setCreateNotice(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                    activeAccountTab === "create"
                      ? "bg-gradient-to-r from-indigo-500/20 to-purple-600/25 text-indigo-300 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Tạo tài khoản mới</span>
                </button>
              </div>

              {/* TAB 1: ĐẶT LẠI MẬT KHẨU */}
              {activeAccountTab === "reset" && (
                <form onSubmit={handleUserPasswordReset} className="space-y-3.5 mt-4">
                  {emergencyNotice && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-start gap-2 shadow-sm ${
                        emergencyNotice.type === "success"
                          ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                          : "bg-rose-500/10 border border-rose-500/25 text-rose-300"
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

                  {/* Custom User Dropdown Selector */}
                  <div className="space-y-1.5 relative" ref={userDropdownRef}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">
                        Chọn tài khoản cần đổi mật khẩu
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({allProfiles.length} tài khoản)
                      </span>
                    </div>

                    {/* Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={isUserDropdownOpen}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs text-left transition-all duration-200 flex items-center justify-between gap-3 shadow-inner cursor-pointer select-none ${
                        isUserDropdownOpen
                          ? "bg-[#182133] border-amber-500/80 ring-2 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                          : "bg-[#141b29] hover:bg-[#1a2336] border-white/[0.08] hover:border-amber-500/40 text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {(() => {
                          const prof = allProfiles.find((p) => p.username === selectedUser);
                          const isAdmin = prof?.role === "admin";
                          return (
                            <div
                              className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                isAdmin
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                  : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                              }`}
                            >
                              {isAdmin ? (
                                <Shield className="h-3.5 w-3.5" />
                              ) : (
                                <User className="h-3.5 w-3.5" />
                              )}
                            </div>
                          );
                        })()}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-xs tracking-wide">
                              {selectedUser}
                            </span>
                            {(() => {
                              const prof = allProfiles.find((p) => p.username === selectedUser);
                              const isAdmin = prof?.role === "admin";
                              return (
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold border ${
                                    isAdmin
                                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                      : "bg-slate-800 text-slate-300 border-white/10"
                                  }`}
                                >
                                  {isAdmin ? "Quản trị viên" : "Thí sinh"}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {(() => {
                          const sec = accountsSecurity.find((a) => a.username === selectedUser);
                          const isActive = sec ? sec.is_active !== false : true;
                          return (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border ${
                                isActive
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/25"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isActive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                                }`}
                              />
                              <span>{isActive ? "Active" : "Khóa"}</span>
                            </span>
                          );
                        })()}
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform duration-200 transform ${
                            isUserDropdownOpen ? "rotate-180 text-amber-400" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Dropdown Floating Popover */}
                    <AnimatePresence>
                      {isUserDropdownOpen && (
                        <motion.div
                          role="listbox"
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-[#121826]/98 backdrop-blur-2xl border border-white/12 shadow-[0_20px_45px_rgba(0,0,0,0.7)] p-1.5 space-y-1 ring-1 ring-black/50"
                        >
                          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/[0.06] flex items-center justify-between">
                            <span>Danh sách tài khoản</span>
                            <span className="font-mono text-slate-500 lowercase">
                              {allProfiles.length} tài khoản
                            </span>
                          </div>

                          <div className="max-h-56 overflow-y-auto space-y-1 py-0.5 custom-scrollbar">
                            {allProfiles.map((p) => {
                              const isSelected = p.username === selectedUser;
                              const sec = accountsSecurity.find((a) => a.username === p.username);
                              const isActive = sec ? sec.is_active !== false : true;
                              const isAdmin = p.role === "admin";

                              return (
                                <button
                                  key={p.username}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => {
                                    setSelectedUser(p.username);
                                    setIsUserDropdownOpen(false);
                                  }}
                                  className={`w-full px-2.5 py-2 rounded-lg text-left transition-all duration-150 flex items-center justify-between gap-2.5 group cursor-pointer ${
                                    isSelected
                                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-200 ring-1 ring-amber-500/20"
                                      : "hover:bg-white/[0.06] text-slate-300 hover:text-white border border-transparent"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-150 group-hover:scale-105 ${
                                        isAdmin
                                          ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                          : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                                      }`}
                                    >
                                      {isAdmin ? (
                                        <Shield className="h-3.5 w-3.5" />
                                      ) : (
                                        <User className="h-3.5 w-3.5" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`font-mono text-xs font-bold tracking-wide ${
                                            isSelected
                                              ? "text-amber-300"
                                              : "text-white group-hover:text-amber-200"
                                          }`}
                                        >
                                          {p.username}
                                        </span>
                                        <span
                                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                                            isAdmin
                                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                              : "bg-slate-800 text-slate-400 border-white/5"
                                          }`}
                                        >
                                          {isAdmin ? "Quản trị viên" : "Thí sinh"}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                        <span
                                          className={`flex items-center gap-1 ${
                                            isActive ? "text-emerald-400/90" : "text-rose-400/90"
                                          }`}
                                        >
                                          <span
                                            className={`h-1 w-1 rounded-full ${
                                              isActive ? "bg-emerald-400" : "bg-rose-400"
                                            }`}
                                          />
                                          <span>{isActive ? "Đang hoạt động" : "Đã khóa"}</span>
                                        </span>
                                        {sec && (
                                          <span className="text-slate-500 font-mono text-[9px]">
                                            • {sec.devices?.length || 0}/3 máy • {sec.ips?.length || 0}/3 IP
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="shrink-0 pl-1">
                                    {isSelected ? (
                                      <div className="h-5 w-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-sm">
                                        <Check className="h-3 w-3" />
                                      </div>
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border border-white/10 opacity-0 group-hover:opacity-60 transition-opacity flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* New Password for Selected User */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Mật khẩu mới cho <strong className="text-amber-400 font-mono">[{selectedUser}]</strong>
                    </label>
                    <div className="relative">
                      <input
                        type={showEmergencyPass ? "text" : "password"}
                        value={emergencyNewPassword}
                        onChange={(e) => setEmergencyNewPassword(e.target.value)}
                        placeholder={`Nhập mật khẩu mới cho ${selectedUser}`}
                        className="w-full px-3 py-2.5 bg-[#141b29] border border-white/[0.08] hover:border-amber-500/40 focus:border-amber-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors pr-10 shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmergencyPass(!showEmergencyPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                      >
                        {showEmergencyPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={emergencyLoading}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-xs rounded-xl shadow-[0_4px_18px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_22px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
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
              )}

              {/* TAB 2: TẠO TÀI KHOẢN MỚI */}
              {activeAccountTab === "create" && (
                <form onSubmit={handleCreateAccount} className="space-y-3.5 mt-4">
                  {createNotice && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-start gap-2 shadow-sm ${
                        createNotice.type === "success"
                          ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                          : "bg-rose-500/10 border border-rose-500/25 text-rose-300"
                      }`}
                    >
                      {createNotice.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                      )}
                      <span>{createNotice.message}</span>
                    </div>
                  )}

                  {/* Username Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">
                        Tên đăng nhập mới
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Viết liền, không dấu
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) =>
                          setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))
                        }
                        placeholder="Ví dụ: student4, user5..."
                        className="w-full pl-9 pr-3 py-2.5 bg-[#141b29] border border-white/[0.08] hover:border-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Mật khẩu khởi tạo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu cho tài khoản mới"
                        className="w-full pl-9 pr-10 py-2.5 bg-[#141b29] border border-white/[0.08] hover:border-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Phân quyền tài khoản
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewRole("user")}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                          newRole === "user"
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 ring-1 ring-indigo-500/30"
                            : "bg-[#141b29] border-white/[0.06] text-slate-400 hover:text-white"
                        }`}
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>Thí sinh (User)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewRole("admin")}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                          newRole === "admin"
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30"
                            : "bg-[#141b29] border-white/[0.06] text-slate-400 hover:text-white"
                        }`}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span>Quản trị viên (Admin)</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-[0_4px_18px_rgba(99,102,241,0.25)] hover:shadow-[0_6px_22px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                    >
                      {createLoading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Đang tạo tài khoản...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Tạo tài khoản mới ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.07] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>
                  {activeAccountTab === "reset"
                    ? "Quản trị viên có toàn quyền đổi mật khẩu cho mọi tài khoản"
                    : "Tài khoản mới sẽ tự động đồng bộ bảo mật & quyền truy cập"}
                </span>
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                {activeAccountTab === "reset" ? "Instant Reset" : "Auto Seed"}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

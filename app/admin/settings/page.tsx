"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getAllProfiles,
  adminResetUserPassword,
  adminCreateAccount,
} from "@/lib/store";
import { Profile, AccountSecurity } from "@/types/exam";
import { THEMES, SystemTheme, getSystemTheme, setSystemTheme } from "@/lib/theme";
import {
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  UserPlus,
  ChevronDown,
  Check,
  RefreshCw,
  Settings,
  Palette,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AdminSettingsPage() {
  const router = useRouter();

  // Profiles and accounts state
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [accountsSecurity, setAccountsSecurity] = useState<AccountSecurity[]>([]);

  // Card 1: Create Account State
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createNotice, setCreateNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Card 2: Edit Account (Username & Password) State
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [editNewUsername, setEditNewUsername] = useState("");
  const [emergencyNewPassword, setEmergencyNewPassword] = useState("");
  const [showEmergencyPass, setShowEmergencyPass] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  // Card 3: Theme Switcher State
  const [currentTheme, setCurrentTheme] = useState<SystemTheme>("obsidian");
  const [themeNotice, setThemeNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setCurrentTheme(getSystemTheme());
  }, []);

  const handleSelectTheme = (themeId: SystemTheme) => {
    const res = setSystemTheme(themeId);
    if (res.success) {
      setCurrentTheme(themeId);
      const thName = THEMES.find((t) => t.id === themeId)?.name || themeId;
      setThemeNotice({
        type: "success",
        message: `Đã đổi chủ đề giao diện thành '${thName}'. (Lưu ý: Chỉ tài khoản Admin mới áp dụng chủ đề tùy chỉnh, các tài khoản User khác luôn giữ màu Obsidian mặc định).`,
      });
    } else {
      setThemeNotice({
        type: "error",
        message: res.message || "Không thể đổi giao diện.",
      });
    }
  };

  const [emergencyNotice, setEmergencyNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (selectedUser) {
      setEditNewUsername(selectedUser);
    }
  }, [selectedUser]);

  const selectedProfile = useMemo(
    () => allProfiles.find((p) => p.username === selectedUser),
    [allProfiles, selectedUser]
  );
  const selectedSecurity = useMemo(
    () => accountsSecurity.find((s) => s.username === selectedUser),
    [accountsSecurity, selectedUser]
  );

  const fetchAccountsSecurity = async () => {
    try {
      const res = await fetch("/api/admin/accounts");
      const data = await res.json();
      if (res.ok && data.accounts) {
        setAccountsSecurity(data.accounts);
      }
    } catch (err) {
      console.error("Failed to fetch accounts security:", err);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    async function loadInitialData() {
      const profiles = await getAllProfiles();
      setAllProfiles(profiles);
      if (profiles.length > 0 && !selectedUser) {
        setSelectedUser(profiles[0].username);
      }
      fetchAccountsSecurity();
    }
    loadInitialData();
  }, [router, selectedUser]);

  // Handle Create Account
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
        message: "Vui lòng nhập mật khẩu khởi tạo cho tài khoản.",
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
          message: `Đã tạo thành công tài khoản '${cleanUser}' với vai trò ${
            newRole === "admin" ? "Quản trị viên" : "User"
          }!`,
        });
        setNewUsername("");
        setNewPassword("");
        setNewRole("user");

        // Reload profiles and security
        const profiles = await getAllProfiles();
        setAllProfiles(profiles);
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

  // Handle Reset Password & Username
  const handleUserPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmergencyNotice(null);

    if (!selectedUser) {
      setEmergencyNotice({
        type: "error",
        message: "Vui lòng chọn tài khoản cần thay đổi.",
      });
      return;
    }

    const trimmedUser = editNewUsername.trim();
    const trimmedPass = emergencyNewPassword.trim();

    const usernameChanged = trimmedUser.length > 0 && trimmedUser !== selectedUser;
    const passwordChanged = trimmedPass.length > 0;

    if (!usernameChanged && !passwordChanged) {
      setEmergencyNotice({
        type: "error",
        message: "Vui lòng nhập Username mới hoặc Mật khẩu mới để cập nhật.",
      });
      return;
    }

    setEmergencyLoading(true);
    try {
      const result = await adminResetUserPassword(
        selectedUser,
        passwordChanged ? trimmedPass : undefined,
        usernameChanged ? trimmedUser : undefined
      );

      if (result.success) {
        setEmergencyNotice({
          type: "success",
          message: `Đã cập nhật thông tin tài khoản '${selectedUser}'${usernameChanged ? ` -> '${trimmedUser}'` : ""} thành công!`,
        });
        setEmergencyNewPassword("");
        if (usernameChanged) {
          setSelectedUser(trimmedUser);
        }
        const profiles = await getAllProfiles();
        setAllProfiles(profiles);
        await fetchAccountsSecurity();
      } else {
        setEmergencyNotice({
          type: "error",
          message: result.message || "Không thể cập nhật thông tin tài khoản.",
        });
      }
    } catch {
      setEmergencyNotice({
        type: "error",
        message: "Lỗi kết nối khi cập nhật thông tin tài khoản.",
      });
    } finally {
      setEmergencyLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-indigo-500/20">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Settings className="h-7 w-7 text-[#6366f1]" />
            <span>Cài đặt & Cấp phát Tài khoản</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#9ca3af]">
            Quản lý cấp phát tài khoản mới và đặt lại mật khẩu cho các tài khoản trong hệ thống.
          </p>
        </div>
      </div>

      {/* 2 CARDS SEPARATE LAYOUT (EQUAL HEIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* =========================================================================
            CARD 1: TẠO TÀI KHOẢN MỚI
            ========================================================================= */}
        <div className="relative rounded-2xl obsidian-card p-6 flex flex-col justify-between h-full">
          {/* Ambient glow accent line & blur circle */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#4f46e5]/60 via-[#6366f1]/40 to-transparent" />
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#4f46e5]/10 rounded-full blur-3xl" />
          </div>

          <div>
            <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4f46e5]/10 border border-[#4f46e5]/30 text-indigo-400 shadow-[0_0_12px_rgba(79,70,229,0.15)]">
                  <UserPlus className="h-5 w-5 text-[#6366f1]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Tạo tài khoản mới
                  </h3>
                  <p className="text-xs text-[#9ca3af]">
                    Cấp phát tài khoản đăng nhập cho Quản trị viên hoặc User
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 mt-5">
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

              {/* Tên tài khoản */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#6366f1]" />
                  <span>Tên đăng nhập (Username)</span>
                </label>
                <input
                  type="text"
                  name="new_account_username"
                  autoComplete="off"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                  placeholder="VD: sinhvien_01 hoặc trogiang"
                  className="w-full px-3.5 py-2.5 bg-[#080718]/80 hover:bg-[#04030e] focus:bg-[#04030e] border border-indigo-500/25 hover:border-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] font-mono"
                />
              </div>

              {/* Mật khẩu khởi tạo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-[#6366f1]" />
                  <span>Mật khẩu khởi tạo</span>
                </label>
                <div className="relative">
                  <input
                    type={showCreatePass ? "text" : "password"}
                    name="new_account_password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (tối thiểu 4 ký tự)"
                    className="w-full px-3.5 py-2.5 bg-[#080718]/80 hover:bg-[#04030e] focus:bg-[#04030e] border border-indigo-500/25 hover:border-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all pr-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePass(!showCreatePass)}
                    className="absolute right-3 top-2.5 text-[#9ca3af] hover:text-white transition-colors"
                  >
                    {showCreatePass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Vai trò / Phân quyền */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-[#6366f1]" />
                  <span>Vai trò phân quyền</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole("user")}
                    className={`py-2.5 px-3 rounded-xl border text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer select-none ${
                      newRole === "user"
                        ? "bg-gradient-to-b from-[#18133b] to-[#0a071e] border-indigo-500/70 text-white font-bold shadow-[0_4px_16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-indigo-500/40"
                        : "bg-[#060513]/70 hover:bg-[#02010a] border-indigo-500/20 hover:border-indigo-500/40 text-slate-400 hover:text-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                    }`}
                  >
                    <User className="h-3.5 w-3.5 text-indigo-300" />
                    <span>User</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole("admin")}
                    className={`py-2.5 px-3 rounded-xl border text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer select-none ${
                      newRole === "admin"
                        ? "bg-gradient-to-b from-[#18133b] to-[#0a071e] border-indigo-500/70 text-white font-bold shadow-[0_4px_16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-indigo-500/40"
                        : "bg-[#060513]/70 hover:bg-[#02010a] border-indigo-500/20 hover:border-indigo-500/40 text-slate-400 hover:text-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Quản trị viên (Admin)</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-b from-[#4f46e5] to-[#3730a3] hover:from-[#4338ca] hover:to-[#2b247c] active:from-[#3730a3] active:to-[#221c60] text-white font-semibold text-xs rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.25)] border border-indigo-400/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  {createLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Tạo tài khoản ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 pt-3 border-t border-indigo-500/20 text-[11px] text-[#9ca3af] flex items-center justify-between">
            <span>Bảo mật: Mật khẩu được mã hóa an toàn qua Bcrypt</span>
            <span className="font-mono text-[10px] text-slate-500">Auto-Hashed</span>
          </div>
        </div>

        {/* =========================================================================
            CARD 2: ĐỔI MẬT KHẨU CÁC TÀI KHOẢN
            ========================================================================= */}
        <div className="relative rounded-2xl obsidian-card p-6 flex flex-col justify-between h-full">
          {/* Ambient glow accent line & blur circle */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#4f46e5]/60 via-[#6366f1]/40 to-transparent" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#4f46e5]/10 rounded-full blur-3xl" />
          </div>

          <div>
            <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4f46e5]/10 border border-[#4f46e5]/30 text-indigo-400 shadow-[0_0_12px_rgba(79,70,229,0.15)]">
                  <KeyRound className="h-5 w-5 text-[#6366f1]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Đổi Username &amp; Mật khẩu
                  </h3>
                  <p className="text-xs text-[#9ca3af]">
                    Đổi tên đăng nhập hoặc đặt lại mật khẩu cho bất kỳ tài khoản nào trong hệ thống
                  </p>
                </div>
              </div>

              <span className="text-[10px] px-2.5 py-1 rounded-full font-mono bg-indigo-950/40 border border-indigo-500/25 text-[#9ca3af]">
                {allProfiles.length} tài khoản
              </span>
            </div>

            <form onSubmit={handleUserPasswordReset} className="space-y-4 mt-5">
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

              {/* Custom Popover Select User */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Chọn tài khoản cần đổi mật khẩu:</span>
                  <span className="text-[10px] font-mono text-[#9ca3af]">
                    ({allProfiles.length} tài khoản)
                  </span>
                </label>

                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="w-full px-3.5 py-2.5 bg-[#080718]/80 hover:bg-[#04030e] border border-indigo-500/25 hover:border-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs text-white flex items-center justify-between transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {(() => {
                      const prof = allProfiles.find((p) => p.username === selectedUser);
                      const isAdmin = prof?.role === "admin";
                      return (
                        <div
                          className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border ${
                            isAdmin
                              ? "bg-[#4f46e5]/15 border-[#4f46e5]/30 text-indigo-400"
                              : "bg-[#0284c7]/15 border-[#0284c7]/30 text-[#38bdf8]"
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

                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-white">
                        {selectedUser || "Chưa chọn tài khoản"}
                      </span>
                      {(() => {
                        const prof = allProfiles.find((p) => p.username === selectedUser);
                        const isAdmin = prof?.role === "admin";
                        return (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                              isAdmin
                                ? "bg-[#4f46e5]/20 text-indigo-300 border-[#4f46e5]/30"
                                : "bg-[#1f2937] text-[#9ca3af] border-[#1f2937]"
                            }`}
                          >
                            {isAdmin ? "Quản trị viên" : "User"}
                          </span>
                        );
                      })()}
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
                              ? "bg-[#064e3b]/70 text-[#34d399] border-[#064e3b]"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/25"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? "bg-[#34d399] animate-pulse" : "bg-rose-400"
                            }`}
                          />
                          <span>{isActive ? "Active" : "Khóa"}</span>
                        </span>
                      );
                    })()}
                    <ChevronDown
                      className={`h-4 w-4 text-[#9ca3af] transition-transform duration-200 transform ${
                        isUserDropdownOpen ? "rotate-180 text-[#6366f1]" : ""
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
                      className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-[#0b0f19] backdrop-blur-2xl border border-[#1f2937] shadow-[0_20px_45px_rgba(0,0,0,0.7)] p-1.5 space-y-1 ring-1 ring-black/50"
                    >
                      <div className="px-2.5 py-1.5 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider border-b border-indigo-500/20 flex items-center justify-between">
                        <span>Danh sách tài khoản</span>
                        <span className="font-mono text-slate-500 lowercase">
                          {allProfiles.length} tài khoản
                        </span>
                      </div>

                      {/* Limited to 2 items visible initially with smooth scroll */}
                      <div className="max-h-[114px] overflow-y-auto space-y-1 py-0.5 pr-1 custom-scrollbar">
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
                                  ? "bg-[#4f46e5]/15 border border-[#4f46e5]/30 text-indigo-200 ring-1 ring-[#4f46e5]/20"
                                  : "hover:bg-[#1f2937] text-slate-300 hover:text-white border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-150 group-hover:scale-105 ${
                                    isAdmin
                                      ? "bg-[#4f46e5]/15 border-[#4f46e5]/30 text-indigo-400"
                                      : "bg-[#0284c7]/15 border-[#0284c7]/30 text-[#38bdf8]"
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
                                          ? "text-indigo-300"
                                          : "text-white group-hover:text-indigo-200"
                                      }`}
                                    >
                                      {p.username}
                                    </span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                                        isAdmin
                                          ? "bg-[#4f46e5]/20 text-indigo-300 border-[#4f46e5]/30"
                                          : "bg-[#1f2937] text-[#9ca3af] border-[#1f2937]"
                                      }`}
                                    >
                                      {isAdmin ? "Quản trị viên" : "User"}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#9ca3af] flex items-center gap-2 mt-0.5">
                                    <span
                                      className={`flex items-center gap-1 ${
                                        isActive ? "text-[#34d399]" : "text-rose-400/90"
                                      }`}
                                    >
                                      <span
                                        className={`h-1 w-1 rounded-full ${
                                          isActive ? "bg-[#34d399]" : "bg-rose-400"
                                        }`}
                                      />
                                      <span>{isActive ? "Active" : "Đã khóa"}</span>
                                    </span>
                                    {sec && (
                                      <span className="text-slate-500 font-mono text-[9px]">
                                        • {sec.devices?.length || 0}/3 thiết bị
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 pl-1">
                                {isSelected ? (
                                  <div className="h-5 w-5 rounded-full bg-[#4f46e5]/20 border border-[#4f46e5]/40 flex items-center justify-center text-indigo-300 shadow-sm">
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

              {/* Thông tin & Phân quyền hiện tại của tài khoản được chọn */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-[#6366f1]" />
                  <span>Vai trò &amp; Trạng thái tài khoản</span>
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/25 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">
                      {selectedUser || "..."}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        selectedProfile?.role === "admin"
                          ? "bg-[#4f46e5]/15 border-[#4f46e5]/30 text-indigo-300"
                          : "bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                    >
                      {selectedProfile?.role === "admin" ? "Quản trị viên (Admin)" : "User"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#9ca3af]">
                    <span className="inline-flex items-center gap-1 text-[#34d399] font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      <span>{selectedSecurity?.is_active !== false ? "Active" : "Đã khóa"}</span>
                    </span>
                    {selectedSecurity && (
                      <span className="text-slate-500 font-mono text-[10px]">
                        • {selectedSecurity.devices?.length || 0}/3 thiết bị
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tên đăng nhập mới */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Tên đăng nhập (Username)</span>
                  <span className="text-[10px] text-slate-400">Có thể đổi mới hoặc giữ nguyên</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editNewUsername}
                    onChange={(e) => setEditNewUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập mới"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#080718]/80 hover:bg-[#04030e] focus:bg-[#04030e] border border-indigo-500/25 hover:border-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] font-mono"
                  />
                  <User className="pointer-events-none absolute left-3 top-2.5 z-10 h-4 w-4 text-[#818cf8]" strokeWidth={2.2} />
                </div>
              </div>

              {/* Mật khẩu mới cho tài khoản */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Mật khẩu mới</span>
                  <span className="text-[10px] text-slate-400">Để trống nếu không đổi mật khẩu</span>
                </label>
                <div className="relative">
                  <input
                    type={showEmergencyPass ? "text" : "password"}
                    name="emergency_new_password"
                    autoComplete="new-password"
                    value={emergencyNewPassword}
                    onChange={(e) => setEmergencyNewPassword(e.target.value)}
                    placeholder="Để trống nếu không đổi mật khẩu"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#080718]/80 hover:bg-[#04030e] focus:bg-[#04030e] border border-indigo-500/25 hover:border-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all pr-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                  />
                  <Lock className="pointer-events-none absolute left-3 top-2.5 z-10 h-4 w-4 text-[#818cf8]" strokeWidth={2.2} />
                  <button
                    type="button"
                    onClick={() => setShowEmergencyPass(!showEmergencyPass)}
                    className="absolute right-3 top-2.5 z-10 text-[#9ca3af] hover:text-white transition-colors"
                  >
                    {showEmergencyPass ? <EyeOff className="h-4 w-4" strokeWidth={2.2} /> : <Eye className="h-4 w-4" strokeWidth={2.2} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={emergencyLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-b from-[#4f46e5] to-[#3730a3] hover:from-[#4338ca] hover:to-[#2b247c] active:from-[#3730a3] active:to-[#221c60] text-white font-semibold text-xs rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.25)] border border-indigo-400/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  {emergencyLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang lưu thay đổi...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Lưu thay đổi (Username &amp; Mật khẩu)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 pt-3 border-t border-indigo-500/20 text-[11px] text-[#9ca3af] flex items-center justify-between">
            <span>Hiệu lực: Cập nhật thông tin tài khoản ngay tức thì</span>
            <span className="font-mono text-[10px] text-slate-500">Instant-Sync</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CARD 3: CHỦ ĐỀ GIAO DIỆN HỆ THỐNG (THEME SWITCHER)
          ========================================================================= */}
      <div className="relative rounded-2xl obsidian-card p-6">
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#818cf8]/60 via-[#6366f1]/40 to-transparent" />
          <div className="absolute -top-24 right-0 w-48 h-48 bg-[#818cf8]/10 rounded-full blur-3xl" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-indigo-500/20 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#818cf8]/15 border border-[#818cf8]/30 text-[#818cf8] shadow-[0_0_12px_rgba(129,140,248,0.2)]">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Chủ đề Giao diện Hệ thống
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <Shield className="h-3 w-3" />
                  Chỉ quyền Admin
                </span>
              </div>
              <p className="text-xs text-[#9ca3af]">
                Lựa chọn chủ đề màu sắc cho giao diện. Các tài khoản người dùng khác sẽ luôn sử dụng giao diện mặc định Obsidian.
              </p>
            </div>
          </div>
        </div>

        {themeNotice && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-start gap-2 shadow-sm ${
              themeNotice.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/25 text-rose-300"
            }`}
          >
            {themeNotice.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <span>{themeNotice.message}</span>
          </div>
        )}

        {/* 3 Theme Options Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {THEMES.map((th) => {
            const isSelected = currentTheme === th.id;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => handleSelectTheme(th.id)}
                className={`relative flex flex-col justify-between p-4 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-[#181335] border-2 border-[#818cf8] shadow-[0_0_25px_rgba(129,140,248,0.25)] ring-1 ring-[#818cf8]/50"
                    : "bg-[#0b0f19]/80 border border-[#1f2937] hover:border-indigo-500/40 hover:bg-[#121829]"
                }`}
              >
                <div>
                  {/* Top: Header + Active Check */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sm text-white">
                        {th.name}
                      </span>
                      {th.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            th.id === "obsidian"
                              ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {th.badge}
                        </span>
                      )}
                    </div>
                    {isSelected ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#818cf8] text-[#0b0f19] shadow-sm">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="h-5 w-5 rounded-full border border-slate-700 bg-slate-900/50" />
                    )}
                  </div>

                  {/* Gradient & Swatches Preview Bar */}
                  <div className="space-y-2 mb-3">
                    <div
                      className="h-10 w-full rounded-lg border border-white/10 shadow-inner flex items-center justify-end pr-2"
                      style={{ background: th.gradientPreview }}
                    >
                      <div className="flex items-center gap-1.5 p-1 rounded-md bg-black/40 backdrop-blur-sm">
                        {th.previewColors.map((color, i) => (
                          <span
                            key={i}
                            className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Subtitle / Description */}
                  <p className="text-xs text-[#9ca3af] leading-relaxed">
                    {th.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className={isSelected ? "font-bold text-[#818cf8]" : "text-slate-500"}>
                    {isSelected ? "● Đang kích hoạt" : "Nhấn để kích hoạt"}
                  </span>
                  {th.id !== "obsidian" && (
                    <span className="text-[10px] text-amber-400/80">
                      Chờ mã màu chi tiết
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

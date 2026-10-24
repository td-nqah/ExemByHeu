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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-black/[0.06]">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] flex items-center gap-3">
            <Settings className="h-7 w-7 text-[#111827]" />
            <span>Cài đặt & Cấp phát Tài khoản</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B7280]">
            Quản lý cấp phát tài khoản mới và đặt lại mật khẩu cho các tài khoản trong hệ thống.
          </p>
        </div>
      </div>

      {/* 2 CARDS SEPARATE LAYOUT (EQUAL HEIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* =========================================================================
            CARD 1: TẠO TÀI KHOẢN MỚI
            ========================================================================= */}
        <div className="relative rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)] shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 flex flex-col justify-between h-full">
          {/* Ambient glow accent line & blur circle */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-black/[0.08]" />
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#F6F6F8] rounded-full blur-3xl" />
          </div>

          <div>
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6F6F8] border border-black/[0.08] text-[#111827] shadow-[0_0_12px_rgba(79,70,229,0.15)]">
                  <UserPlus className="h-5 w-5 text-[#111827]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    Tạo tài khoản mới
                  </h3>
                  <p className="text-xs text-[#6B7280]">
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
                      : "bg-rose-50 text-rose-600 border border-rose-500/25 text-[#111827]"
                  }`}
                >
                  {createNotice.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2E9E5B] mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-[#111827] mt-0.5" />
                  )}
                  <span>{createNotice.message}</span>
                </div>
              )}

              {/* Tên tài khoản */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#111827]" />
                  <span>Tên đăng nhập (Username)</span>
                </label>
                <input
                  type="text"
                  name="new_account_username"
                  autoComplete="off"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                  placeholder="VD: sinhvien_01 hoặc trogiang"
                  className="w-full px-3.5 py-2.5 bg-[#F6F6F8] border border-black/[0.06] hover:border-[#4f46e5]/40 focus:border-[#4f46e5] rounded-xl text-xs text-[#111827] placeholder-[#9ca3af] focus:outline-none transition-colors shadow-inner font-mono"
                />
              </div>

              {/* Mật khẩu khởi tạo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-[#111827]" />
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
                    className="w-full px-3.5 py-2.5 bg-[#F6F6F8] border border-black/[0.06] hover:border-[#4f46e5]/40 focus:border-[#4f46e5] rounded-xl text-xs text-[#111827] placeholder-[#9ca3af] focus:outline-none transition-colors pr-10 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePass(!showCreatePass)}
                    className="absolute right-3 top-2.5 text-[#6B7280] hover:text-[#111827] transition-colors"
                  >
                    {showCreatePass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Vai trò / Phân quyền */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-[#111827]" />
                  <span>Vai trò phân quyền</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole("user")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                      newRole === "user"
                        ? "bg-[#F6F6F8] border-black/[0.08] text-[#111827] font-bold shadow-xs"
                        : "bg-[#F6F6F8] border-black/[0.06] text-[#6B7280] hover:text-[#111827] hover:bg-black/[0.04]"
                    }`}
                  >
                    <User className="h-3.5 w-3.5 text-[#38bdf8]" />
                    <span>User</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole("admin")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                      newRole === "admin"
                        ? "bg-[#F6F6F8] border-black/[0.08] text-[#111827] font-bold shadow-xs"
                        : "bg-[#F6F6F8] border-black/[0.06] text-[#6B7280] hover:text-[#111827] hover:bg-black/[0.04]"
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5 text-[#111827]" />
                    <span>Quản trị viên (Admin)</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full py-2.5 px-4 glass-btn text-[#111827] font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:-translate-y-0.5 active:scale-98"
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

          <div className="mt-5 pt-3 border-t border-black/[0.06] text-[11px] text-[#6B7280] flex items-center justify-between">
            <span>Bảo mật: Mật khẩu được mã hóa an toàn qua Bcrypt</span>
            <span className="font-mono text-[10px] text-slate-500">Auto-Hashed</span>
          </div>
        </div>

        {/* =========================================================================
            CARD 2: ĐỔI MẬT KHẨU CÁC TÀI KHOẢN
            ========================================================================= */}
        <div className="relative rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)] shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 flex flex-col justify-between h-full">
          {/* Ambient glow accent line & blur circle */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-black/[0.08]" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#F6F6F8] rounded-full blur-3xl" />
          </div>

          <div>
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6F6F8] border border-black/[0.08] text-[#111827] shadow-[0_0_12px_rgba(79,70,229,0.15)]">
                  <KeyRound className="h-5 w-5 text-[#111827]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    Đổi Username &amp; Mật khẩu
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Đổi tên đăng nhập hoặc đặt lại mật khẩu cho bất kỳ tài khoản nào trong hệ thống
                  </p>
                </div>
              </div>

              <span className="text-[10px] px-2.5 py-1 rounded-full font-mono bg-[#F6F6F8] border border-black/[0.06] text-[#6B7280]">
                {allProfiles.length} tài khoản
              </span>
            </div>

            <form onSubmit={handleUserPasswordReset} className="space-y-4 mt-5">
              {emergencyNotice && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 shadow-sm ${
                    emergencyNotice.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                      : "bg-rose-50 text-rose-600 border border-rose-500/25 text-[#111827]"
                  }`}
                >
                  {emergencyNotice.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2E9E5B] mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-[#111827] mt-0.5" />
                  )}
                  <span>{emergencyNotice.message}</span>
                </div>
              )}

              {/* Custom Popover Select User */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-semibold text-[#111827] flex items-center justify-between">
                  <span>Chọn tài khoản cần đổi mật khẩu:</span>
                  <span className="text-[10px] font-mono text-[#6B7280]">
                    ({allProfiles.length} tài khoản)
                  </span>
                </label>

                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="w-full px-3.5 py-2.5 bg-[#F6F6F8] border border-black/[0.06] hover:border-[#4f46e5]/40 focus:border-[#4f46e5] rounded-xl text-xs text-[#111827] flex items-center justify-between transition-colors shadow-inner cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {(() => {
                      const prof = allProfiles.find((p) => p.username === selectedUser);
                      const isAdmin = prof?.role === "admin";
                      return (
                        <div
                          className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border ${
                            isAdmin
                              ? "bg-[#F6F6F8] border-black/[0.08] text-[#111827]"
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
                      <span className="font-mono font-bold text-[#111827]">
                        {selectedUser || "Chưa chọn tài khoản"}
                      </span>
                      {(() => {
                        const prof = allProfiles.find((p) => p.username === selectedUser);
                        const isAdmin = prof?.role === "admin";
                        return (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                              isAdmin
                                ? "glass-badge text-[#111827] border-black/[0.08]"
                                : "bg-[#F6F6F8] text-[#111827] border border-black/[0.08]"
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
                              ? "bg-[#DDF2E5]/70 text-[#2E9E5B] border-[#2E9E5B]/20"
                              : "glass-badge text-[#111827] border-rose-500/25"
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
                      className={`h-4 w-4 text-[#6B7280] transition-transform duration-200 transform ${
                        isUserDropdownOpen ? "rotate-180 text-[#111827]" : ""
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
                      className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-white backdrop-blur-2xl border border-black/[0.08] shadow-[0_20px_45px_rgba(0,0,0,0.7)] p-1.5 space-y-1 ring-1 ring-black/50"
                    >
                      <div className="px-2.5 py-1.5 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-black/[0.06] flex items-center justify-between">
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
                                  ? "bg-[#F6F6F8] border border-black/[0.08] text-indigo-200 ring-1 ring-[#4f46e5]/20"
                                  : "hover:bg-[#1f2937] text-[#111827] hover:text-[#111827] border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-150 group-hover:scale-105 ${
                                    isAdmin
                                      ? "bg-[#F6F6F8] border-black/[0.08] text-[#111827]"
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
                                          ? "text-[#111827]"
                                          : "text-[#111827] group-hover:text-indigo-200"
                                      }`}
                                    >
                                      {p.username}
                                    </span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                                        isAdmin
                                          ? "glass-badge text-[#111827] border-black/[0.08]"
                                          : "bg-[#F6F6F8] text-[#111827] border border-black/[0.08]"
                                      }`}
                                    >
                                      {isAdmin ? "Quản trị viên" : "User"}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#6B7280] flex items-center gap-2 mt-0.5">
                                    <span
                                      className={`flex items-center gap-1 ${
                                        isActive ? "text-[#2E9E5B]" : "text-[#111827]/90"
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
                                  <div className="h-5 w-5 rounded-full bg-[#F6F6F8] border border-[#4f46e5]/40 flex items-center justify-center text-[#111827] shadow-sm">
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
                <label className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-[#111827]" />
                  <span>Vai trò &amp; Trạng thái tài khoản</span>
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#F6F6F8] border border-black/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#111827] text-xs">
                      {selectedUser || "..."}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        selectedProfile?.role === "admin"
                          ? "bg-[#F6F6F8] border-black/[0.08] text-[#111827]"
                          : "bg-slate-800 border-slate-700 text-[#111827]"
                      }`}
                    >
                      {selectedProfile?.role === "admin" ? "Quản trị viên (Admin)" : "User"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                    <span className="inline-flex items-center gap-1 text-[#2E9E5B] font-medium">
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
                <label className="text-xs font-semibold text-[#111827] flex items-center justify-between">
                  <span>Tên đăng nhập (Username)</span>
                  <span className="text-[10px] text-[#6B7280]">Có thể đổi mới hoặc giữ nguyên</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editNewUsername}
                    onChange={(e) => setEditNewUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập mới"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#F6F6F8] border border-black/[0.06] hover:border-[#4f46e5]/40 focus:border-[#4f46e5] rounded-xl text-xs text-[#111827] placeholder-[#9ca3af] focus:outline-none transition-colors shadow-inner font-mono"
                  />
                  <User className="pointer-events-none absolute left-3 top-2.5 z-10 h-4 w-4 text-[#111827]" strokeWidth={2.2} />
                </div>
              </div>

              {/* Mật khẩu mới cho tài khoản */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111827] flex items-center justify-between">
                  <span>Mật khẩu mới</span>
                  <span className="text-[10px] text-[#6B7280]">Để trống nếu không đổi mật khẩu</span>
                </label>
                <div className="relative">
                  <input
                    type={showEmergencyPass ? "text" : "password"}
                    name="emergency_new_password"
                    autoComplete="new-password"
                    value={emergencyNewPassword}
                    onChange={(e) => setEmergencyNewPassword(e.target.value)}
                    placeholder="Để trống nếu không đổi mật khẩu"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#F6F6F8] border border-black/[0.06] hover:border-[#4f46e5]/40 focus:border-[#4f46e5] rounded-xl text-xs text-[#111827] placeholder-[#9ca3af] focus:outline-none transition-colors shadow-inner"
                  />
                  <Lock className="pointer-events-none absolute left-3 top-2.5 z-10 h-4 w-4 text-[#111827]" strokeWidth={2.2} />
                  <button
                    type="button"
                    onClick={() => setShowEmergencyPass(!showEmergencyPass)}
                    className="absolute right-3 top-2.5 z-10 text-[#6B7280] hover:text-[#111827] transition-colors"
                  >
                    {showEmergencyPass ? <EyeOff className="h-4 w-4" strokeWidth={2.2} /> : <Eye className="h-4 w-4" strokeWidth={2.2} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={emergencyLoading}
                  className="w-full py-2.5 px-4 glass-btn text-[#111827] font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:-translate-y-0.5 active:scale-98"
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

          <div className="mt-5 pt-3 border-t border-black/[0.06] text-[11px] text-[#6B7280] flex items-center justify-between">
            <span>Hiệu lực: Cập nhật thông tin tài khoản ngay tức thì</span>
            <span className="font-mono text-[10px] text-slate-500">Instant-Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
}

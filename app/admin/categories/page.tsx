"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  getCurrentUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getExams,
} from "@/lib/store";
import { Category, Exam } from "@/types/exam";
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  BookText,
  Boxes,
  Code2,
  Cpu,
  Sparkles,
  Languages,
  BookOpen,
  GraduationCap,
  FileText,
  StickyNote,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PopoverSelect } from "@/components/ui/PopoverSelect";

// Icon options for categories
const AVAILABLE_ICONS = [
  { label: "Sách giáo trình (BookText)", value: "BookText", icon: BookText },
  { label: "Hộp đối tượng (Boxes)", value: "Boxes", icon: Boxes },
  { label: "Mã nguồn Web (Code2)", value: "Code2", icon: Code2 },
  { label: "Lập trình & Phần cứng (Cpu)", value: "Cpu", icon: Cpu },
  { label: "Ghi chú & Cẩm nang (StickyNote)", value: "StickyNote", icon: StickyNote },
  { label: "Văn bản & Tài liệu (FileText)", value: "FileText", icon: FileText },
  { label: "Lấp lánh / Triết học (Sparkles)", value: "Sparkles", icon: Sparkles },
  { label: "Ngoại ngữ (Languages)", value: "Languages", icon: Languages },
  { label: "Mở sách (BookOpen)", value: "BookOpen", icon: BookOpen },
  { label: "Mũ cử nhân (GraduationCap)", value: "GraduationCap", icon: GraduationCap },
];

export default function AdminCategoriesPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [categories, setCategories] = useState<Category[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formIcon, setFormIcon] = useState("BookText");
  const [formStatus, setFormStatus] = useState<"active" | "hidden">("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    async function loadData() {
      try {
        const [cats, allExams] = await Promise.all([
          getCategories(false),
          getExams(false),
        ]);
        setCategories(cats);
        setExams(allExams);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormIcon("BookText");
    setFormStatus("active");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormIcon(cat.icon || "BookText");
    setFormStatus(cat.status);
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormName(name);
    if (!editingCategory) {
      // Auto-suggest slug
      const slugCandidate = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormSlug(slugCandidate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, {
          name: formName.trim(),
          slug: formSlug.trim(),
          icon: formIcon,
          status: formStatus,
        });
        if (updated) {
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? updated : c))
          );
        }
      } else {
        const created = await createCategory({
          name: formName.trim(),
          slug: formSlug.trim(),
          icon: formIcon,
          status: formStatus,
        });
        setCategories((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    const nextStatus = cat.status === "active" ? "hidden" : "active";
    const updated = await updateCategory(cat.id, { status: nextStatus });
    if (updated) {
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? updated : c))
      );
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirmId(null);
  };

  const getExamCountForCategory = (slug: string) => {
    return exams.filter(
      (e) =>
        e.category_slug === slug ||
        (slug === "cnxh" &&
          (e.title.toLowerCase().includes("cnxh") ||
            e.title.toLowerCase().includes("chủ nghĩa xã hội")))
    ).length;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Header Block */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
              Quản lý Danh mục Học phần
              <span className="text-xs bg-[#18191E] text-zinc-300 border border-white/[0.08] px-2.5 py-1 rounded-full font-normal">
                Course Management
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Tạo mới, cập nhật hoặc điều chỉnh trạng thái hiển thị các danh mục học phần trong chương trình đào tạo.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold px-4 py-2.5 text-xs transition-colors shadow-sm self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Học phần mới</span>
          </button>
        </div>
      </motion.div>

      {/* 2. Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 px-5 shadow-xl">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Tổng số học phần</span>
          <div className="mt-2 text-2xl font-bold text-white">{categories.length}</div>
        </div>
        <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 px-5 shadow-xl">
          <span className="text-xs text-emerald-400 uppercase tracking-wider font-medium">Đang kích hoạt (Active)</span>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {categories.filter((c) => c.status === "active").length}
          </div>
        </div>
        <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 px-5 shadow-xl">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Đang ẩn (Hidden)</span>
          <div className="mt-2 text-2xl font-bold text-slate-400">
            {categories.filter((c) => c.status === "hidden").length}
          </div>
        </div>
      </div>

      {/* 3. Categories Table */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-indigo-400" />
            <span>Danh sách Học phần ({categories.length})</span>
          </h2>
          <span className="text-xs text-slate-400">Đồng bộ với phân hệ khảo thí và điều hướng</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Đang tải danh mục học phần...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-slate-400">Chưa có học phần nào trong danh mục.</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs shadow-sm"
            >
              Thêm học phần đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/50 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-4">Tên Học phần</th>
                  <th className="py-3 px-4">Mã Học phần (Slug)</th>
                  <th className="py-3 px-4">Biểu tượng đại diện</th>
                  <th className="py-3 px-4 text-center">Số đề đánh giá</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((cat) => {
                  const examCount = getExamCountForCategory(cat.slug);
                  return (
                    <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <span className="p-1.5 rounded-lg bg-[#18191E] text-zinc-300 border border-white/[0.08]">
                            <BookText className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-bold text-white">{cat.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-[11px]">
                          {cat.slug}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {cat.icon || "BookText"}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-white font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-xs">
                          {examCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                            cat.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
                          )}
                          title="Bấm để đổi trạng thái"
                        >
                          {cat.status === "active" ? (
                            <>
                              <Eye className="h-3 w-3" />
                              <span>Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              <span>Đang ẩn</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Chỉnh sửa học phần"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {deleteConfirmId === cat.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(cat.id)}
                                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                              >
                                Xóa ngay
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-1 rounded text-slate-400 hover:text-white"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(cat.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                              title="Xóa học phần"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* 4. Modal: Create / Edit Category */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-slate-950 border border-white/10 p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-indigo-400" />
                  <span>
                    {editingCategory ? "Cập nhật Học phần" : "Thêm Học phần mới"}
                  </span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-5">
                {/* Category Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Tên Học phần *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ví dụ: Chủ nghĩa xã hội khoa học"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Slug / Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Mã Học phần (Slug / Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="Ví dụ: cnxh"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Dùng trong định danh và lọc đề: <code>/dashboard?category={formSlug || "slug"}</code>
                  </p>
                </div>

                {/* Icon Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Biểu tượng đại diện (Icon)
                  </label>
                  <PopoverSelect
                    className="w-full"
                    buttonClassName="w-full"
                    menuClassName="w-full"
                    value={formIcon}
                    onChange={(val) => setFormIcon(val)}
                    options={AVAILABLE_ICONS.map((opt) => {
                      const Icon = opt.icon;
                      return {
                        value: opt.value,
                        label: opt.label,
                        icon: <Icon className="h-4 w-4 text-indigo-400" />,
                      };
                    })}
                  />
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Trạng thái hiển thị (Status)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormStatus("active")}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-medium transition-all",
                        formStatus === "active"
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold"
                          : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
                      )}
                    >
                      Kích hoạt (Active)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus("hidden")}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-medium transition-all",
                        formStatus === "hidden"
                          ? "bg-slate-800 border-slate-600 text-white font-semibold"
                          : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
                      )}
                    >
                      Ẩn (Hidden)
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{editingCategory ? "Lưu thay đổi" : "Tạo học phần"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

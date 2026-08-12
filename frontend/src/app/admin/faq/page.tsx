"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GripVertical, 
  Plus, 
  Pencil, 
  Trash2, 
  HelpCircle, 
  X, 
  Tag, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";
import { faqService, type FaqItemDto } from "@/src/services/faqService";
import { ConfirmModal } from "@/src/components/ui/ConfirmModal";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { api } from "@/src/lib/api";

interface CategoryDto {
  id: string;
  name: string;
}

// 🌟 SWR / Bellek Önbelleği (Giriş-Çıkışlarda anında yüklenme sağlar)
let cachedFaqs: FaqItemDto[] | null = null;
let cachedCategories: CategoryDto[] | null = null;

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<FaqItemDto[]>(() => cachedFaqs || []);
  const [categories, setCategories] = useState<CategoryDto[]>(() => cachedCategories || []);
  const [loading, setLoading] = useState<boolean>(() => !cachedFaqs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<{ id: string; question: string } | null>(null);

  const [deletingFaq, setDeletingFaq] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    isActive: true,
  });

  const loadData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner || !cachedFaqs) {
      setLoading(true);
    }

    try {
      const [faqData, catResponse] = await Promise.all([
        faqService.getAllFaqsForAdmin(),
        api.get<CategoryDto[]>("/categories").catch(() => ({ data: [] })),
      ]);

      // Cache güncelleme
      cachedFaqs = faqData;
      cachedCategories = catResponse.data || [];

      setFaqs(faqData);
      setCategories(cachedCategories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Drag & Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updatedFaqs = [...faqs];
    const [movedItem] = updatedFaqs.splice(draggedIndex, 1);
    updatedFaqs.splice(targetIndex, 0, movedItem);

    setFaqs(updatedFaqs);
    cachedFaqs = updatedFaqs; // Cache senkronizasyonu
    setDraggedIndex(targetIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);

    const reorderedList = faqs.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    try {
      await faqService.reorderFaqs(
        reorderedList.map((item) => ({ id: item.id, displayOrder: item.displayOrder }))
      );
    } catch (err) {
      console.error("Failed to save new order", err);
      await loadData();
    }
  };

  const handleOpenModal = (faq?: FaqItemDto) => {
    const defaultCategory = categories.length > 0 ? categories[0].name : "General";

    if (faq) {
      setEditingId(faq.id);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || defaultCategory,
        isActive: faq.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        question: "",
        answer: "",
        category: defaultCategory,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        displayOrder: editingId
          ? faqs.find((f) => f.id === editingId)?.displayOrder || 0
          : faqs.length + 1,
      };

      if (editingId) {
        await faqService.updateFaq(editingId, payload);
      } else {
        await faqService.createFaq(payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleDelete = (faq: { id: string; question: string }) => {
    setFaqToDelete({
      id: faq.id,
      question: faq.question,
    });
  };

  const handleConfirmDelete = async () => {
    if (!faqToDelete) return;

    setDeletingFaq(true);

    try {
      await faqService.deleteFaq(faqToDelete.id);
      setFaqToDelete(null);
      await loadData();
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeletingFaq(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Üst Başlık & Ekleme Butonu */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">
            FAQ Management
          </h1>
          <p className="mt-1 text-xs font-medium text-stone-500 dark:text-slate-400">
            Drag items to reorder. Create and edit frequently asked questions for users.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New FAQ</span>
        </button>
      </div>

      {/* Ana Tablo Kartı */}
      <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 overflow-hidden shadow-xl backdrop-blur-2xl">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner label="Loading FAQ entries..." />
          </div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 dark:bg-slate-800 text-stone-400 dark:text-slate-500">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-800 dark:text-slate-200">
                No FAQ entries found
              </p>
              <p className="text-xs font-medium text-stone-400 dark:text-slate-500 mt-1">
                Click "+ Add New FAQ" to create your first question.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm table-fixed min-w-[750px]">
              <thead className="bg-stone-50/80 dark:bg-slate-800/50 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 border-b border-stone-100 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-3.5 w-10 text-center"></th>
                  <th className="px-2 py-3.5 w-10 text-center">#</th>
                  <th className="px-4 py-3.5 w-[24%]">Category</th>
                  <th className="px-4 py-3.5 w-[44%]">Question & Answer</th>
                  <th className="px-4 py-3.5 w-28 text-center">Status</th>
                  <th className="px-5 py-3.5 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60 font-medium relative">
                {faqs.map((f, index) => (
                  <motion.tr
                    key={f.id}
                    layout
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragOver={handleDragOver}
                    onDragEnd={() => void handleDragEnd()}
                    className={`hover:bg-stone-50/60 dark:hover:bg-slate-800/50 transition-colors ${
                      draggedIndex === index
                        ? "opacity-30 bg-emerald-500/20 dark:bg-purple-500/30 scale-[0.99] shadow-inner"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-4 text-center">
                      <GripVertical className="h-4 w-4 text-stone-400 dark:text-slate-500 cursor-grab active:cursor-grabbing mx-auto hover:text-stone-700 dark:hover:text-slate-300 transition-colors" />
                    </td>
                    <td className="px-2 py-4 text-center font-mono text-xs font-black text-stone-400 dark:text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 min-w-0">
                      <span
                        title={f.category}
                        className="inline-flex items-center gap-1.5 max-w-full rounded-full bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700/80 text-stone-700 dark:text-slate-300 px-3 py-1 text-xs font-bold"
                      >
                        <Tag className="h-3 w-3 shrink-0 text-stone-400 dark:text-slate-500" />
                        <span className="truncate">{f.category}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm">
                        {f.question}
                      </div>
                      <div className="text-xs font-medium text-stone-500 dark:text-slate-400 line-clamp-1 mt-1">
                        {f.answer}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                          f.isActive
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40"
                            : "bg-stone-200/70 text-stone-700 border-stone-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        }`}
                      >
                        {f.isActive ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5 text-stone-500 dark:text-slate-400" />
                            Disabled
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(f)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-stone-400 hover:text-emerald-600 dark:hover:text-purple-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit FAQ"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(f)}
                          disabled={deletingFaq}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-30 cursor-pointer"
                          title="Delete FAQ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 dark:bg-slate-950/80 backdrop-blur-md p-4">
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onSubmit={(e) => void handleSubmit(e)}
              className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-purple-900/40 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl transition-all"
            >
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">
                  {editingId ? "Edit FAQ Entry" : "Add New FAQ Entry"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1">
                    Category
                  </label>
                  {categories.length > 0 ? (
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-stone-300/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-bold text-stone-900 dark:text-white px-3 py-2.5 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500 cursor-pointer"
                    >
                      <option value="" disabled>Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id || cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Account, Technical"
                      className="w-full rounded-xl border border-stone-300/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 px-3 py-2.5 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter the question..."
                    className="w-full rounded-xl border border-stone-300/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 px-3 py-2.5 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1">
                    Answer
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Enter detailed answer..."
                    className="w-full rounded-xl border border-stone-300/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 p-3 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="pt-1">
                  <label className="inline-flex items-center gap-2.5 text-xs font-bold text-stone-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded-md border-stone-300 dark:border-slate-700 text-emerald-600 dark:text-purple-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Is Active (Visible to users)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-stone-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Save
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Silme Onay Modalı */}
      <ConfirmModal
        open={Boolean(faqToDelete)}
        title="Delete FAQ Entry"
        description={`Are you sure you want to permanently delete "${faqToDelete?.question ?? ""}"?`}
        confirmText="Yes, Delete FAQ"
        cancelText="Cancel"
        variant="danger"
        loading={deletingFaq}
        onClose={() => {
          if (!deletingFaq) {
            setFaqToDelete(null);
          }
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
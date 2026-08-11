"use client";

import { useEffect, useState } from "react";
import { faqService, type FaqItemDto } from "@/src/services/faqService";
import { Card } from "@/src/components/ui/Card";
import { ConfirmModal } from "@/src/components/ui/ConfirmModal";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { api } from "@/src/lib/api";

interface CategoryDto {
  id: string;
  name: string;
}

// Inline SVG Ikonlar
const DragHandleIcon = () => (
  <svg className="w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const QuestionCircleIcon = () => (
  <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<FaqItemDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<{id: string; question: string;} | null>(null);

  const [deletingFaq, setDeletingFaq] = useState(false);
  const [formData, setFormData] = useState({question: "", answer: "", category: "", isActive: true,});

  const loadData = async () => {
    setLoading(true);
    try {
      const [faqData, catResponse] = await Promise.all([
        faqService.getAllFaqsForAdmin(),
        api.get<CategoryDto[]>("/categories").catch(() => ({ data: [] })),
      ]);
      setFaqs(faqData);
      setCategories(catResponse.data || []);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updatedFaqs = [...faqs];
    const [movedItem] = updatedFaqs.splice(draggedIndex, 1);
    updatedFaqs.splice(targetIndex, 0, movedItem);

    const reorderedList = updatedFaqs.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    setFaqs(reorderedList);
    setDraggedIndex(null);

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
    const defaultCategory =
      categories.length > 0 ? categories[0].name : "General";

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
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            FAQ Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Drag items to reorder. Create and edit frequently asked questions for users.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-sm btn-primary flex items-center gap-2"
        >
          <PlusIcon />
          <span>Add New FAQ</span>
        </button>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner label="Loading FAQ entries..." />
          </div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <QuestionCircleIcon />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No FAQ entries found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Click "+ Add New FAQ" to create your first question.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-3 w-10"></th>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3 w-32">Category</th>
                  <th className="p-3">Question</th>
                  <th className="p-3 w-28 text-center">Status</th>
                  <th className="p-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {faqs.map((f, index) => (
                  <tr
                    key={f.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => void handleDrop(index)}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                      draggedIndex === index ? "opacity-40 bg-blue-50 dark:bg-blue-950/30" : ""
                    }`}
                  >
                    <td className="p-3 text-center">
                      <DragHandleIcon />
                    </td>
                    <td className="p-3 text-center font-mono text-xs font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        {f.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {f.question}
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-normal">
                        {f.answer}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                          f.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {f.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(f)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(f)}
                          disabled={deletingFaq}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl transition-all"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? "Edit FAQ Entry" : "Add New FAQ Entry"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Category
              </label>
              {categories.length > 0 ? (
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="select select-sm select-bordered w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs mt-1"
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
                  className="input input-sm input-bordered w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs mt-1"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Question
              </label>
              <input
                type="text"
                required
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the question..."
                className="input input-sm input-bordered w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Answer
              </label>
              <textarea
                required
                rows={4}
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter detailed answer..."
                className="textarea textarea-bordered w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs mt-1"
              />
            </div>

            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="checkbox checkbox-xs"
                />
                Is Active (Visible to users)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-ghost text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary text-xs"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
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
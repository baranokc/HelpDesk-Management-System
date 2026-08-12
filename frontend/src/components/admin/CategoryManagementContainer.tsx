"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { 
  RotateCw, Plus, Search, Pencil, Trash2, 
  Route, X, ChevronDown, Layers 
} from "lucide-react";
import { Alert } from "@/src/components/ui/Alert";
import { ConfirmModal } from "@/src/components/ui/ConfirmModal";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { getApiErrorMessage } from "@/src/lib/api";
import { categoryService } from "@/src/services/categoryService";
import { teamService } from "@/src/services/teamService";
import type {
  CategoryDto,
  CategoryUpsertDto,
  SubcategoryDto,
  SubcategoryUpsertDto,
} from "@/src/types/category";
import type { TeamDto } from "@/src/types/team";

const emptyForm: CategoryUpsertDto = {
  name: "",
  description: "",
  defaultTeamId: null,
};

interface SubcategoryDraft extends SubcategoryUpsertDto {
  id: string | null;
}

interface SubcategoryMenuState {
  categoryId: string;
  left: number;
  top?: number;
  bottom?: number;
  width: number;
  maxHeight: number;
}

const emptySubcategoryDraft: SubcategoryDraft = {
  id: null,
  name: "",
  description: "",
};

export function CategoryManagementContainer() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [routeSelections, setRouteSelections] = useState<
    Record<string, string>
  >({});
  const [routingCategoryId, setRoutingCategoryId] = useState<string | null>(
    null,
  );
  const [subcategoryMenu, setSubcategoryMenu] =
    useState<SubcategoryMenuState | null>(null);
  const subcategoryMenuRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(
    null,
  );
  const [formData, setFormData] = useState<CategoryUpsertDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [subcategoryDraft, setSubcategoryDraft] =
    useState<SubcategoryDraft | null>(null);
  const [savingSubcategory, setSavingSubcategory] = useState(false);
  const [deletingSubcategoryId, setDeletingSubcategoryId] = useState<
    string | null
  >(null);
  const [subcategoryToDelete, setSubcategoryToDelete] =
    useState<SubcategoryDto | null>(null);
  const [categoryToDelete, setCategoryToDelete] =
    useState<CategoryDto | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const applyLoadedData = (
    categoryData: CategoryDto[],
    teamData: TeamDto[],
  ) => {
    setCategories(categoryData);
    setTeams(teamData);
    setRouteSelections(
      Object.fromEntries(
        categoryData.map((category) => [
          category.id,
          category.defaultTeamId ?? "",
        ]),
      ),
    );
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [categoryData, teamData] = await Promise.all([
        categoryService.getAll(),
        teamService.getAllTeams(),
      ]);

      applyLoadedData(categoryData, teamData);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(
          requestError,
          "Failed to load categories and support teams.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const [categoryData, teamData] = await Promise.all([
          categoryService.getAll(),
          teamService.getAllTeams(),
        ]);

        if (cancelled) return;
        applyLoadedData(categoryData, teamData);
      } catch (requestError: unknown) {
        if (cancelled) return;

        setError(
          getApiErrorMessage(
            requestError,
            "Failed to load categories and support teams.",
          ),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!subcategoryMenu) return;

    const closeMenu = () => setSubcategoryMenu(null);

    const handlePointerDown = (event: PointerEvent) => {
      const eventPath = event.composedPath();
      const menuElement = subcategoryMenuRef.current;

      if (menuElement && eventPath.includes(menuElement)) {
        return;
      }

      const clickedTrigger = eventPath.some(
        (element) =>
          element instanceof Element &&
          element.closest('[data-subcategory-menu-trigger="true"]'),
      );

      if (clickedTrigger) {
        return;
      }

      closeMenu();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", closeMenu);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", closeMenu);
    };
  }, [subcategoryMenu]);

  const filteredCategories = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return categories;

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(search) ||
        category.description.toLowerCase().includes(search) ||
        (category.defaultTeamName ?? "").toLowerCase().includes(search) ||
        category.subcategories.some(
          (subcategory) =>
            subcategory.name.toLowerCase().includes(search) ||
            subcategory.description.toLowerCase().includes(search),
        ),
    );
  }, [categories, searchTerm]);

  const routedCount = categories.filter((category) =>
    Boolean(category.defaultTeamId),
  ).length;

  const menuCategory = subcategoryMenu
    ? categories.find((category) => category.id === subcategoryMenu.categoryId)
    : null;

  const toggleSubcategoryMenu = (
    categoryId: string,
    trigger: HTMLButtonElement,
  ) => {
    if (subcategoryMenu?.categoryId === categoryId) {
      setSubcategoryMenu(null);
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 8;
    const width = Math.min(
      288,
      Math.max(0, window.innerWidth - viewportPadding * 2),
    );
    const category = categories.find((item) => item.id === categoryId);
    const preferredHeight = Math.min(
      320,
      64 + Math.max(1, category?.subcategories.length ?? 0) * 48,
    );
    const spaceBelow = Math.max(
      0,
      window.innerHeight - triggerRect.bottom - gap - viewportPadding,
    );
    const spaceAbove = Math.max(
      0,
      triggerRect.top - gap - viewportPadding,
    );
    const openAbove =
      spaceBelow < preferredHeight && spaceAbove > spaceBelow;
    const availableHeight = openAbove ? spaceAbove : spaceBelow;
    const maxLeft = Math.max(
      viewportPadding,
      window.innerWidth - width - viewportPadding,
    );

    setSubcategoryMenu({
      categoryId,
      left: Math.min(
        Math.max(viewportPadding, triggerRect.left),
        maxLeft,
      ),
      top: openAbove ? undefined : triggerRect.bottom + gap,
      bottom: openAbove
        ? window.innerHeight - triggerRect.top + gap
        : undefined,
      width,
      maxHeight: Math.min(320, availableHeight),
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setSubcategoryDraft(null);
    setSubcategoryToDelete(null);
    setModalError(null);
    setModalSuccess(null);
  };

  const openCreateModal = () => {
    setSubcategoryMenu(null);
    setEditingCategory(null);
    setFormData(emptyForm);
    setSubcategoryDraft(null);
    setSubcategoryToDelete(null);
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryDto) => {
    setSubcategoryMenu(null);
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      defaultTeamId: category.defaultTeamId,
    });
    setSubcategoryDraft(null);
    setSubcategoryToDelete(null);
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const replaceCategory = (updatedCategory: CategoryDto) => {
    setCategories((current) =>
      current
        .map((category) =>
          category.id === updatedCategory.id ? updatedCategory : category,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    setEditingCategory((current) =>
      current?.id === updatedCategory.id ? updatedCategory : current,
    );
    setRouteSelections((current) => ({
      ...current,
      [updatedCategory.id]: updatedCategory.defaultTeamId ?? "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    const payload: CategoryUpsertDto = {
      name: formData.name.trim(),
      description: formData.description?.trim() || "",
      defaultTeamId: formData.defaultTeamId || null,
    };

    try {
      if (editingCategory) {
        const updated = await categoryService.update(
          editingCategory.id,
          payload,
        );
        replaceCategory(updated);
        setSuccess(`Category "${updated.name}" was updated.`);
      } else {
        const created = await categoryService.create(payload);
        setCategories((current) =>
          [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setRouteSelections((current) => ({
          ...current,
          [created.id]: created.defaultTeamId ?? "",
        }));
        setSuccess(`Category "${created.name}" was created.`);
      }

      closeModal();
    } catch (requestError: unknown) {
      setModalError(
        getApiErrorMessage(requestError, "Failed to save category."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubcategorySubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!editingCategory || !subcategoryDraft?.name.trim()) return;

    setSavingSubcategory(true);
    setModalError(null);
    setModalSuccess(null);

    const payload: SubcategoryUpsertDto = {
      name: subcategoryDraft.name.trim(),
      description: subcategoryDraft.description?.trim() || "",
    };

    try {
      const updatedCategory = subcategoryDraft.id
        ? await categoryService.updateSubcategory(
            editingCategory.id,
            subcategoryDraft.id,
            payload,
          )
        : await categoryService.createSubcategory(editingCategory.id, payload);

      replaceCategory(updatedCategory);
      setModalSuccess(
        subcategoryDraft.id
          ? `Subcategory "${payload.name}" was updated.`
          : `Subcategory "${payload.name}" was added.`,
      );
      setSubcategoryDraft(null);
    } catch (requestError: unknown) {
      setModalError(
        getApiErrorMessage(requestError, "Failed to save subcategory."),
      );
    } finally {
      setSavingSubcategory(false);
    }
  };

  const handleDeleteSubcategory = (subcategory: SubcategoryDto) => {
    setSubcategoryToDelete(subcategory);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleConfirmDeleteSubcategory = async () => {
    if (
      !editingCategory ||
      !subcategoryToDelete ||
      deletingSubcategoryId
    ) {
      return;
    }

    const subcategory = subcategoryToDelete;
    setDeletingSubcategoryId(subcategory.id);
    setModalError(null);
    setModalSuccess(null);

    try {
      const updatedCategory = await categoryService.deleteSubcategory(
        editingCategory.id,
        subcategory.id,
      );
      replaceCategory(updatedCategory);
      setSubcategoryDraft((current) =>
        current?.id === subcategory.id ? null : current,
      );
      setModalSuccess(`Subcategory "${subcategory.name}" was removed.`);
      setSubcategoryToDelete(null);
    } catch (requestError: unknown) {
      setModalError(
        getApiErrorMessage(requestError, "Failed to delete subcategory."),
      );
      setSubcategoryToDelete(null);
    } finally {
      setDeletingSubcategoryId(null);
    }
  };

  const handleSaveRouting = async (category: CategoryDto) => {
    setRoutingCategoryId(category.id);
    setError(null);
    setSuccess(null);

    try {
      const updated = await categoryService.setDefaultTeam(category.id, {
        teamId: routeSelections[category.id] || null,
      });
      replaceCategory(updated);
      setSuccess(
        updated.defaultTeamName
          ? `New "${updated.name}" tickets will be routed to ${updated.defaultTeamName}.`
          : `Automatic routing was removed from "${updated.name}".`,
      );
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Failed to update category routing."),
      );
    } finally {
      setRoutingCategoryId(null);
    }
  };

  const handleUnassign = async (category: CategoryDto) => {
    setRouteSelections((current) => ({ ...current, [category.id]: "" }));
    setRoutingCategoryId(category.id);
    setError(null);
    setSuccess(null);

    try {
      const updated = await categoryService.setDefaultTeam(category.id, {
        teamId: null,
      });
      replaceCategory(updated);
      setSuccess(`Automatic routing was removed from "${updated.name}".`);
    } catch (requestError: unknown) {
      setRouteSelections((current) => ({
        ...current,
        [category.id]: category.defaultTeamId ?? "",
      }));
      setError(
        getApiErrorMessage(requestError, "Failed to remove category routing."),
      );
    } finally {
      setRoutingCategoryId(null);
    }
  };

  const handleDelete = (category: CategoryDto) => {
    setSubcategoryMenu(null);
    setCategoryToDelete(category);
    setError(null);
    setSuccess(null);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete || deletingCategory) return;

    const category = categoryToDelete;
    setDeletingCategory(true);
    setError(null);
    setSuccess(null);

    try {
      await categoryService.delete(category.id);
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
      setSubcategoryMenu((current) =>
        current?.categoryId === category.id ? null : current,
      );
      setSuccess(`Category "${category.name}" was removed.`);
      setCategoryToDelete(null);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Failed to delete category."));
      setCategoryToDelete(null);
    } finally {
      setDeletingCategory(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* ÜST BİLGİ VE AKSİYONLAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">
            Category Management
          </h1>
          <p className="mt-1 text-xs font-medium text-stone-500 dark:text-slate-400">
            Create ticket categories, manage their subcategories and control
            automatic team routing.
          </p>
        </div>

        {/* 🌟 YÜKSEKLİKLERİ VE BOYUTLARI DÜZELTİLEN BUTONLAR (h-9) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-stone-300/80 dark:border-purple-900/40 bg-stone-100 dark:bg-slate-800 px-3.5 text-xs font-bold text-stone-800 dark:text-slate-200 shadow-sm transition-all hover:bg-stone-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600 dark:text-pink-400" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* BİLGİ BANNERİ */}
      <div className="rounded-3xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/80 dark:bg-blue-950/30 p-4 shadow-lg backdrop-blur-2xl text-blue-900 dark:text-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Route className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-xs sm:text-sm">Automatic ticket routing</p>
            <p className="mt-0.5 text-xs font-medium opacity-80 leading-relaxed">
              A category assigned to a team is shown in the ticket form, and
              every new ticket in that category is routed to that team.
              Unassigned categories stay hidden from the ticket form until a
              team is selected.
            </p>
          </div>
        </div>
      </div>

      {/* ARAMA VE METRİKLER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-stone-200/80 dark:border-purple-900/40 shadow-xl backdrop-blur-2xl">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by category, subcategory, description or team..."
            className="w-full rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-300/80 dark:border-slate-700 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 text-xs pl-9 pr-3 py-2 font-medium focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400 dark:text-slate-500" />
        </div>

        <div className="flex gap-4 text-xs font-semibold text-stone-500 dark:text-slate-400 self-end sm:self-auto">
          <span>
            Total: <b className="text-stone-800 dark:text-slate-200">{categories.length}</b>
          </span>
          <span className="text-emerald-600 dark:text-emerald-400">
            Routed: <b>{routedCount}</b>
          </span>
          <span className="text-amber-600 dark:text-amber-400">
            Unassigned: <b>{categories.length - routedCount}</b>
          </span>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* ANA TABLO */}
      <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 overflow-hidden shadow-xl backdrop-blur-2xl">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner label="Loading categories and routing settings..." />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-sm font-semibold text-stone-500 dark:text-slate-400">
            {categories.length === 0
              ? "No active categories exist yet."
              : "No categories match your search."}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            {/* 🌟 MİNİMUM GENİŞLİK 920px YAPILDI VE SÜTUN ORANLARI YENİDEN DÜZENLENDİ */}
            <table className="w-full text-left text-sm table-fixed min-w-[920px]">
              <thead className="bg-stone-50/80 dark:bg-slate-800/50 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 border-b border-stone-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 w-[20%]">Category</th>
                  <th className="px-4 py-3.5 w-[20%]">Description</th>
                  <th className="px-4 py-3.5 w-[12%]">Subcategories</th>
                  {/* ROUTING SÜTUNUNA %36 ALAN VERİLEREK UNASSIGN BUTONU SIKIŞMAKTAN KURTARILDI */}
                  <th className="px-4 py-3.5 w-[36%]">Automatic Team Routing</th>
                  <th className="pr-6 pl-2 py-3.5 w-[12%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60 font-medium">
                {filteredCategories.map((category) => {
                  const selectedTeamId = routeSelections[category.id] ?? "";
                  const routeChanged =
                    selectedTeamId !== (category.defaultTeamId ?? "");
                  const routing = routingCategoryId === category.id;
                  const subcategoriesOpen =
                    subcategoryMenu?.categoryId === category.id;

                  return (
                    <tr
                      key={category.id}
                      className="hover:bg-stone-50/60 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-stone-900 dark:text-white truncate">
                          {category.name}
                        </div>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider border ${
                            category.defaultTeamId
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40"
                              : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
                          }`}
                        >
                          {category.defaultTeamId ? "ROUTED" : "UNASSIGNED"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-stone-500 dark:text-slate-400 truncate">
                        {category.description || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          data-subcategory-menu-trigger="true"
                          onClick={(event) =>
                            toggleSubcategoryMenu(
                              category.id,
                              event.currentTarget,
                            )
                          }
                          aria-expanded={subcategoriesOpen}
                          aria-controls={`subcategories-${category.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-stone-200 dark:border-slate-700 bg-stone-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-stone-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:border-purple-500 dark:hover:text-purple-300 transition-colors cursor-pointer"
                        >
                          <span>{category.subcategoryCount}</span>
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${subcategoriesOpen ? "rotate-180" : ""}`} />
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        {/* 🌟 BUTONLARIN DARALMASINI VEYA SAĞA TAŞMASINI ENGELLEYEN YAPI (shrink-0) */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <select
                            aria-label={`Default team for ${category.name}`}
                            value={selectedTeamId}
                            onChange={(event) =>
                              setRouteSelections((current) => ({
                                ...current,
                                [category.id]: event.target.value,
                              }))
                            }
                            disabled={routing}
                            className="min-w-0 flex-1 truncate rounded-xl border border-stone-300/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-stone-800 dark:text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500 disabled:opacity-50 cursor-pointer"
                          >
                            <option value="">No team assigned</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => void handleSaveRouting(category)}
                            disabled={!routeChanged || routing}
                            className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:hover:scale-100"
                          >
                            {routing ? "Saving..." : "Save"}
                          </button>
                          {category.defaultTeamId && (
                            <button
                              type="button"
                              onClick={() => void handleUnassign(category)}
                              disabled={routing}
                              className="shrink-0 rounded-xl border border-stone-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              Unassign
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="pr-6 pl-2 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(category)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-stone-400 hover:text-emerald-600 dark:hover:text-purple-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            disabled={deletingCategory}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-30"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SUBCATEGORY SÜZÜLEN PORTAL MENÜSÜ */}
      {subcategoryMenu &&
        menuCategory &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={subcategoryMenuRef}
            id={`subcategories-${menuCategory.id}`}
            role="menu"
            aria-label={`${menuCategory.name} subcategories`}
            onPointerDown={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
            style={{
              left: subcategoryMenu.left,
              top: subcategoryMenu.top,
              bottom: subcategoryMenu.bottom,
              width: subcategoryMenu.width,
              maxHeight: subcategoryMenu.maxHeight,
            }}
            className="fixed z-[60] overscroll-contain overflow-y-auto rounded-2xl border border-stone-200/80 dark:border-purple-900/40 bg-white/95 dark:bg-slate-900/95 p-3 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in duration-150"
          >
            <div className="mb-2 border-b border-stone-100 dark:border-slate-800 pb-2 px-1">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-purple-300/50">
                {menuCategory.name}
              </p>
              <p className="text-xs font-black text-stone-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-purple-400" />
                Subcategories
              </p>
            </div>

            {menuCategory.subcategories.length === 0 ? (
              <p className="px-1 py-2 text-xs font-medium text-stone-400 dark:text-slate-400">
                No subcategories yet. Use Edit Category to add one.
              </p>
            ) : (
              <ul className="space-y-1">
                {menuCategory.subcategories.map((subcategory) => (
                  <li
                    key={subcategory.id}
                    role="menuitem"
                    className="rounded-xl px-2.5 py-2 hover:bg-stone-100/70 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <p className="text-xs font-bold text-stone-800 dark:text-slate-200">
                      {subcategory.name}
                    </p>
                    {subcategory.description && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] font-medium text-stone-500 dark:text-slate-400">
                        {subcategory.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body,
        )}

      {/* KATEGORİ EKLE / DÜZENLE MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close category dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">
                {editingCategory ? "Edit Category" : "Create New Category"}
              </h3>
              <p className="text-xs font-medium text-stone-400 dark:text-slate-400 mt-1">
                {editingCategory
                  ? "Update the category settings and manage the subcategories shown in ticket forms."
                  : "Choose a default team to make this category immediately available for new tickets."}
              </p>
            </div>

            {modalError && (
              <div className="mt-4">
                <Alert variant="error">{modalError}</Alert>
              </div>
            )}
            {modalSuccess && (
              <div className="mt-4">
                <Alert variant="success">{modalSuccess}</Alert>
              </div>
            )}

            <form
              id="category-management-form"
              onSubmit={(event) => void handleSubmit(event)}
              className="space-y-4 mt-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Security, Billing, Infrastructure"
                    className="w-full rounded-xl border border-stone-300/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 px-3 py-2.5 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1">
                    Default Support Team
                  </label>
                  <select
                    value={formData.defaultTeamId || ""}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        defaultTeamId: event.target.value || null,
                      }))
                    }
                    className="w-full rounded-xl border border-stone-300/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-bold text-stone-900 dark:text-white px-3 py-2.5 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">No team assigned yet</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={formData.description || ""}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Describe the kinds of requests included in this category..."
                  className="w-full rounded-xl border border-stone-300/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 p-3 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500 resize-none"
                />
                <p className="mt-1.5 text-[11px] font-medium text-stone-400 dark:text-slate-400">
                  Without a team, the category is saved for admin configuration
                  but hidden from the ticket form.
                </p>
              </div>
            </form>

            {/* SUBCATEGORY DÜZENLEME SEKSİYONU */}
            {editingCategory && (
              <section className="mt-6 rounded-2xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-800/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                      Subcategories
                    </h4>
                    <p className="mt-0.5 text-[11px] font-medium text-stone-400 dark:text-slate-400">
                      Changes in this section are saved immediately.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubcategoryDraft(emptySubcategoryDraft);
                      setModalError(null);
                      setModalSuccess(null);
                    }}
                    disabled={Boolean(subcategoryDraft)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300/80 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Subcategory
                  </button>
                </div>

                {subcategoryDraft && (
                  <form
                    onSubmit={(event) => void handleSubcategorySubmit(event)}
                    className="mt-4 rounded-2xl border border-emerald-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 p-4 shadow-md space-y-3"
                  >
                    <p className="text-xs font-bold text-stone-900 dark:text-white">
                      {subcategoryDraft.id
                        ? "Edit Subcategory"
                        : "New Subcategory"}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          required
                          autoFocus
                          maxLength={100}
                          value={subcategoryDraft.name}
                          onChange={(event) =>
                            setSubcategoryDraft((current) =>
                              current
                                ? { ...current, name: event.target.value }
                                : current,
                            )
                          }
                          placeholder="e.g. Password Reset"
                          className="w-full rounded-xl border border-stone-300/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 px-3 py-2 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          maxLength={500}
                          value={subcategoryDraft.description || ""}
                          onChange={(event) =>
                            setSubcategoryDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    description: event.target.value,
                                  }
                                : current,
                            )
                          }
                          placeholder="Optional short description"
                          className="w-full rounded-xl border border-stone-300/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 px-3 py-2 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSubcategoryDraft(null)}
                        disabled={savingSubcategory}
                        className="rounded-xl border border-stone-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          savingSubcategory || !subcategoryDraft.name.trim()
                        }
                        className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:scale-105 transition-all cursor-pointer disabled:opacity-40"
                      >
                        {savingSubcategory ? "Saving..." : "Save Subcategory"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-4 space-y-2">
                  {editingCategory.subcategories.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stone-300 dark:border-slate-700 px-4 py-6 text-center text-xs font-medium text-stone-400 dark:text-slate-500">
                      No active subcategories. Add one to make ticket
                      classification more specific.
                    </div>
                  ) : (
                    editingCategory.subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-stone-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-stone-900 dark:text-white">
                            {subcategory.name}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-stone-400 dark:text-slate-400">
                            {subcategory.description || "No description"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSubcategoryDraft({
                                id: subcategory.id,
                                name: subcategory.name,
                                description: subcategory.description,
                              });
                              setModalError(null);
                              setModalSuccess(null);
                            }}
                            disabled={
                              savingSubcategory ||
                              Boolean(deletingSubcategoryId)
                            }
                            className="inline-flex items-center justify-center h-7 w-8 rounded-xl text-stone-400 hover:text-emerald-600 dark:hover:text-purple-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={`Edit ${subcategory.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubcategory(subcategory)}
                            disabled={
                              savingSubcategory ||
                              Boolean(deletingSubcategoryId)
                            }
                            className="inline-flex items-center justify-center h-7 w-8 rounded-xl text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-30"
                            title={`Delete ${subcategory.name}`}
                          >
                            {deletingSubcategoryId === subcategory.id ? (
                              <RotateCw className="h-3.5 w-3.5 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-stone-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-stone-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="category-management-form"
                disabled={
                  submitting ||
                  savingSubcategory ||
                  Boolean(deletingSubcategoryId)
                }
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting
                  ? "Saving..."
                  : editingCategory
                    ? "Update Category"
                    : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SİLME ONAY MODALLARI */}
      <ConfirmModal
        open={Boolean(subcategoryToDelete)}
        title="Delete Subcategory"
        description={`Are you sure you want to delete "${subcategoryToDelete?.name ?? ""}"? Existing tickets will keep their subcategory history, but it will no longer be selectable.`}
        confirmText="Yes, Delete Subcategory"
        cancelText="Cancel"
        variant="danger"
        loading={Boolean(deletingSubcategoryId)}
        onClose={() => {
          if (!deletingSubcategoryId) {
            setSubcategoryToDelete(null);
          }
        }}
        onConfirm={() => void handleConfirmDeleteSubcategory()}
      />

      <ConfirmModal
        open={Boolean(categoryToDelete)}
        title="Delete Category"
        description={`Are you sure you want to delete "${categoryToDelete?.name ?? ""}"? Its subcategories will also be hidden. Existing tickets will keep their category history.`}
        confirmText="Yes, Delete Category"
        cancelText="Cancel"
        variant="danger"
        loading={deletingCategory}
        onClose={() => {
          if (!deletingCategory) {
            setCategoryToDelete(null);
          }
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
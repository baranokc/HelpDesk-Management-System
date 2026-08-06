"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Alert } from "@/src/components/ui/Alert";
import { Card } from "@/src/components/ui/Card";
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

const RefreshIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="h-4 w-4 text-slate-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const EditIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const RouteIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h6m0 0v6m0-6L9 17l-4-4"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

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
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (subcategoryMenuRef.current?.contains(target)) return;

      if (
        target instanceof Element &&
        target.closest('[data-subcategory-menu-trigger="true"]')
      ) {
        return;
      }

      closeMenu();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
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
    setModalError(null);
    setModalSuccess(null);
  };

  const openCreateModal = () => {
    setSubcategoryMenu(null);
    setEditingCategory(null);
    setFormData(emptyForm);
    setSubcategoryDraft(null);
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

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
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
    event: React.SubmitEvent<HTMLFormElement>,
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

  const handleDeleteSubcategory = async (subcategory: SubcategoryDto) => {
    if (!editingCategory) return;

    const confirmed = confirm(
      `Delete "${subcategory.name}"? Existing tickets will keep their subcategory history, but it will no longer be selectable.`,
    );
    if (!confirmed) return;

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
    } catch (requestError: unknown) {
      setModalError(
        getApiErrorMessage(requestError, "Failed to delete subcategory."),
      );
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

  const handleDelete = async (category: CategoryDto) => {
    const confirmed = confirm(
      `Delete "${category.name}"? Its subcategories will also be hidden. Existing tickets will keep their category history.`,
    );
    if (!confirmed) return;

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
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Failed to delete category."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Category Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create ticket categories, manage their subcategories and control
            automatic team routing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadData()}
            className="btn btn-sm btn-ghost flex items-center gap-2 border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshIcon />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn btn-sm btn-primary flex items-center gap-2 text-white"
          >
            <PlusIcon />
            <span>New Category</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
        <div className="flex items-start gap-3">
          <span className="mt-0.5">
            <RouteIcon />
          </span>
          <div>
            <p className="font-semibold">Automatic ticket routing</p>
            <p className="mt-1 text-xs opacity-80">
              A category assigned to a team is shown in the ticket form, and
              every new ticket in that category is routed to that team.
              Unassigned categories stay hidden from the ticket form until a
              team is selected.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by category, subcategory, description or team..."
            className="input input-sm input-bordered w-full border-slate-300 bg-slate-50 pl-8 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <span className="absolute left-2.5 top-2.5">
            <SearchIcon />
          </span>
        </div>

        <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Total: <b>{categories.length}</b>
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

      <Card className="overflow-hidden border border-slate-200 bg-white p-0 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-8">
            <LoadingSpinner label="Loading categories and routing settings..." />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {categories.length === 0
              ? "No active categories exist yet."
              : "No categories match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Subcategories</th>
                  <th className="min-w-80">Automatic Team Routing</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
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
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {category.name}
                        </div>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            category.defaultTeamId
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {category.defaultTeamId ? "ROUTED" : "UNASSIGNED"}
                        </span>
                      </td>
                      <td className="max-w-sm text-slate-500 dark:text-slate-400">
                        {category.description || "-"}
                      </td>
                      <td>
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
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"
                        >
                          <span>{category.subcategoryCount}</span>
                          <ChevronDownIcon open={subcategoriesOpen} />
                        </button>
                      </td>
                      <td>
                        <div className="flex min-w-80 items-center gap-2">
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
                            className="select select-sm select-bordered min-w-44 flex-1 border-slate-300 bg-slate-50 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                            className="btn btn-xs btn-primary text-white"
                          >
                            {routing ? "Saving..." : "Save"}
                          </button>
                          {category.defaultTeamId && (
                            <button
                              type="button"
                              onClick={() => void handleUnassign(category)}
                              disabled={routing}
                              className="btn btn-xs btn-ghost border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                            >
                              Unassign
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(category)}
                            className="btn btn-xs btn-ghost text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                            title="Edit Category"
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(category)}
                            className="btn btn-xs btn-ghost text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                            title="Delete Category"
                          >
                            <TrashIcon />
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
      </Card>

      {subcategoryMenu &&
        menuCategory &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={subcategoryMenuRef}
            id={`subcategories-${menuCategory.id}`}
            role="menu"
            aria-label={`${menuCategory.name} subcategories`}
            style={{
              left: subcategoryMenu.left,
              top: subcategoryMenu.top,
              bottom: subcategoryMenu.bottom,
              width: subcategoryMenu.width,
              maxHeight: subcategoryMenu.maxHeight,
            }}
            className="fixed z-[60] overscroll-contain overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10"
          >
            <div className="mb-1 border-b border-slate-100 px-2 py-2 dark:border-slate-800">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {menuCategory.name}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                Subcategories
              </p>
            </div>

            {menuCategory.subcategories.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
                No subcategories yet. Use Edit Category to add one.
              </p>
            ) : (
              <ul className="space-y-1">
                {menuCategory.subcategories.map((subcategory) => (
                  <li
                    key={subcategory.id}
                    role="menuitem"
                    className="rounded-lg px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {subcategory.name}
                    </p>
                    {subcategory.description && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Close category dialog"
            >
              <CloseIcon />
            </button>

            <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </h3>
            <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
              {editingCategory
                ? "Update the category settings and manage the subcategories shown in ticket forms."
                : "Choose a default team to make this category immediately available for new tickets."}
            </p>

            {modalError && (
              <div className="mb-4">
                <Alert variant="error">{modalError}</Alert>
              </div>
            )}
            {modalSuccess && (
              <div className="mb-4">
                <Alert variant="success">{modalSuccess}</Alert>
              </div>
            )}

            <form
              id="category-management-form"
              onSubmit={(event) => void handleSubmit(event)}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
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
                    className="input input-sm input-bordered w-full border-slate-300 bg-slate-50 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
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
                    className="select select-sm select-bordered w-full border-slate-300 bg-slate-50 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
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
                  className="textarea textarea-bordered w-full border-slate-300 bg-slate-50 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Without a team, the category is saved for admin configuration
                  but hidden from the ticket form.
                </p>
              </div>
            </form>

            {editingCategory && (
              <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Subcategories
                    </h4>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
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
                    className="btn btn-xs btn-ghost flex items-center gap-1 border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                  >
                    <PlusIcon />
                    Add Subcategory
                  </button>
                </div>

                {subcategoryDraft && (
                  <form
                    onSubmit={(event) => void handleSubcategorySubmit(event)}
                    className="mt-4 rounded-xl border border-blue-200 bg-white p-4 dark:border-blue-900 dark:bg-slate-900"
                  >
                    <p className="mb-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {subcategoryDraft.id
                        ? "Edit Subcategory"
                        : "New Subcategory"}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
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
                          className="input input-sm input-bordered w-full border-slate-300 bg-slate-50 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
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
                          className="input input-sm input-bordered w-full border-slate-300 bg-slate-50 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSubcategoryDraft(null)}
                        disabled={savingSubcategory}
                        className="btn btn-xs btn-ghost border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          savingSubcategory || !subcategoryDraft.name.trim()
                        }
                        className="btn btn-xs btn-primary text-white"
                      >
                        {savingSubcategory ? "Saving..." : "Save Subcategory"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-4 space-y-2">
                  {editingCategory.subcategories.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No active subcategories. Add one to make ticket
                      classification more specific.
                    </div>
                  ) : (
                    editingCategory.subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {subcategory.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
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
                            className="btn btn-xs btn-ghost text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                            title={`Edit ${subcategory.name}`}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteSubcategory(subcategory)
                            }
                            disabled={
                              savingSubcategory ||
                              Boolean(deletingSubcategoryId)
                            }
                            className="btn btn-xs btn-ghost text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                            title={`Delete ${subcategory.name}`}
                          >
                            {deletingSubcategoryId === subcategory.id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <TrashIcon />
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={closeModal}
                className="btn btn-sm btn-ghost border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
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
                className="btn btn-sm btn-primary text-white"
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
    </div>
  );
}
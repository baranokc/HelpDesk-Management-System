"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/src/components/ui/Alert";
import { Card } from "@/src/components/ui/Card";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { getApiErrorMessage } from "@/src/lib/api";
import { categoryService } from "@/src/services/categoryService";
import { teamService } from "@/src/services/teamService";
import type {
  CategoryDto,
  CategoryUpsertDto,
} from "@/src/types/category";
import type { TeamDto } from "@/src/types/team";

const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EditIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const RouteIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h6m0 0v6m0-6L9 17l-4-4" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const emptyForm: CategoryUpsertDto = {
  name: "",
  description: "",
  defaultTeamId: null,
};

export function CategoryManagementContainer() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [routeSelections, setRouteSelections] = useState<Record<string, string>>({});
  const [routingCategoryId, setRoutingCategoryId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [formData, setFormData] = useState<CategoryUpsertDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [categoryData, teamData] = await Promise.all([
        categoryService.getAll(),
        teamService.getAllTeams(),
      ]);

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

  const filteredCategories = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return categories;

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(search) ||
        category.description.toLowerCase().includes(search) ||
        (category.defaultTeamName ?? "").toLowerCase().includes(search),
    );
  }, [categories, searchTerm]);

  const routedCount = categories.filter(
    (category) => Boolean(category.defaultTeamId),
  ).length;

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryDto) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      defaultTeamId: category.defaultTeamId,
    });
    setIsModalOpen(true);
  };

  const replaceCategory = (updatedCategory: CategoryDto) => {
    setCategories((current) =>
      current.map((category) =>
        category.id === updatedCategory.id ? updatedCategory : category,
      ),
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
    setError(null);
    setSuccess(null);

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

      setIsModalOpen(false);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Failed to save category."));
    } finally {
      setSubmitting(false);
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
        getApiErrorMessage(
          requestError,
          "Failed to update category routing.",
        ),
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
        getApiErrorMessage(
          requestError,
          "Failed to remove category routing.",
        ),
      );
    } finally {
      setRoutingCategoryId(null);
    }
  };

  const handleDelete = async (category: CategoryDto) => {
    const confirmed = confirm(
      `Delete "${category.name}"? Existing tickets will keep their category history, but users will no longer be able to select it.`,
    );
    if (!confirmed) return;

    setError(null);
    setSuccess(null);

    try {
      await categoryService.delete(category.id);
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
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
            Create ticket categories and control their automatic team routing.
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
          <span className="mt-0.5"><RouteIcon /></span>
          <div>
            <p className="font-semibold">Automatic ticket routing</p>
            <p className="mt-1 text-xs opacity-80">
              A category assigned to a team is shown in the ticket form, and every new ticket in that category is routed to that team. Unassigned categories stay hidden from the ticket form until a team is selected.
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
            placeholder="Search by category, description or team..."
            className="input input-sm input-bordered w-full border-slate-300 bg-slate-50 pl-8 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <span className="absolute left-2.5 top-2.5"><SearchIcon /></span>
        </div>

        <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Total: <b>{categories.length}</b></span>
          <span className="text-emerald-600 dark:text-emerald-400">Routed: <b>{routedCount}</b></span>
          <span className="text-amber-600 dark:text-amber-400">Unassigned: <b>{categories.length - routedCount}</b></span>
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
                  const routeChanged = selectedTeamId !== (category.defaultTeamId ?? "");
                  const routing = routingCategoryId === category.id;

                  return (
                    <tr key={category.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {category.name}
                        </div>
                        <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          category.defaultTeamId
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}>
                          {category.defaultTeamId ? "ROUTED" : "UNASSIGNED"}
                        </span>
                      </td>
                      <td className="max-w-sm text-slate-500 dark:text-slate-400">
                        {category.description || "-"}
                      </td>
                      <td>
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {category.subcategoryCount}
                        </span>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Close category dialog"
            >
              <CloseIcon />
            </button>

            <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </h3>
            <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
              Choose a default team to make this category immediately available for new tickets.
            </p>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
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
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Without a team, the category is saved for admin configuration but hidden from the ticket form.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  rows={4}
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
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-sm btn-ghost border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-sm btn-primary text-white"
                >
                  {submitting
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

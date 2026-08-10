"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Calendar,
  Layers,
  AlertCircle,
  BarChart3,
  ListFilter,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  X,
} from "lucide-react";
import { api } from "@/src/lib/api";
import type { TicketFilterDto } from "@/src/types/ticket";

const STATUS_OPTIONS = [
  { itemId: "109a1501-c342-4c4c-b357-c0f7b428345a", name: "Open" },
  { itemId: "69414a74-392a-4e87-b578-7875ef685520", name: "Cancelled" },
  { itemId: "26d22be0-bb7b-418a-87ac-da1c63ca14ca", name: "Closed" },
  { itemId: "a80aabb1-9d33-499b-998b-82e9c555fdcd", name: "In Progress" },
  { itemId: "c04275e7-53d4-480f-b5b3-49327be3df7c", name: "On Hold" },
  { itemId: "33b68e76-f679-4b4d-ab7b-fb8b1f72c049", name: "Resolved" },
  { itemId: "6cd0dd25-e695-498b-9b51-f90f08d9c843", name: "Waiting for User" },
];

const URGENCY_OPTIONS = [
  { itemId: "8aef38f8-600d-4ff6-ba16-020048b7723c", name: "Low" },
  { itemId: "f3d500c9-a18c-4de2-b4c5-878e638271db", name: "Normal" },
  { itemId: "8fd27669-4526-4f30-b39a-6e100d73226d", name: "High" },
  { itemId: "5d814d17-667b-4dc2-8ebe-f0f40007bee5", name: "Urgent" },
];

// Priority adıyla görünen ancak arka planda ImpactLevel GUID'lerini taşıyan liste
const PRIORITY_OPTIONS = [
  { itemId: "3a1d571f-732c-4618-b1e2-96f72544533d", name: "Critical" },
  { itemId: "2141d95a-7069-4167-92d6-780fa2f7232e", name: "High" },
  { itemId: "fa02063a-a289-43d7-a4c9-bfabd4b9c030", name: "Medium" },
  { itemId: "8faaaa7c-2f82-4f28-a2e0-05e73c3669f6", name: "Low" },
];

interface CategoryItem {
  id?: string;
  itemId?: string;
  name: string;
}

interface TicketFiltersProps {
  value: TicketFilterDto;
  onApply: (filters: TicketFilterDto) => void;
}

export function TicketFilters({ value, onApply }: TicketFiltersProps) {
  const [localFilter, setLocalFilter] = useState<TicketFilterDto>(value);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await api
          .get<CategoryItem[]>("/categories")
          .catch(() => api.get<CategoryItem[]>("/ticket-categories"));

        if (!cancelled && response?.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };

    void fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLocalFilter(value);
  }, [value]);

  const activeSelectFiltersCount = [
    localFilter.statusId,
    localFilter.urgencyLevelId,
    localFilter.impactLevelId,
    localFilter.categoryId,
    localFilter.createdFrom,
    localFilter.createdTo,
  ].filter(Boolean).length;

  const handleValueChange = (key: keyof TicketFilterDto, val: string) => {
    const updated: TicketFilterDto = {
      ...localFilter,
      [key]: val.trim() === "" ? undefined : val,
      pageNumber: 1,
    };
    setLocalFilter(updated);
    onApply(updated);
  };

  const handlePageSizeChange = (val: string) => {
    const updated: TicketFilterDto = {
      ...localFilter,
      pageSize: val === "" ? 25 : Number(val),
      pageNumber: 1,
    };
    setLocalFilter(updated);
    onApply(updated);
  };

  const handleClear = () => {
    const cleared: TicketFilterDto = {
      pageNumber: 1,
      pageSize: localFilter.pageSize ?? 25,
      sortBy: localFilter.sortBy,
      sortDirection: localFilter.sortDirection
    };
    setLocalFilter(cleared);
    onApply(cleared);
  };

  const isSearchExpanded = searchFocused || Boolean(localFilter.search);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg transition-all overflow-hidden">
      {/* MINIMAL ÜST BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5">
        <div
          className={`relative flex items-center transition-all duration-300 ease-out rounded-xl border ${
            isSearchExpanded
              ? "w-full sm:w-80 border-indigo-500/80 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-950 shadow-md shadow-indigo-500/5"
              : "w-full sm:w-52 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <Search className="h-3.5 w-3.5 text-indigo-500 pl-0.5 ml-3 shrink-0" />
          <input
            type="text"
            placeholder={isSearchExpanded ? "Search ticket # or title..." : "Search tickets..."}
            value={localFilter.search ?? ""}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onChange={(e) => handleValueChange("search", e.target.value)}
            className="w-full bg-transparent px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {localFilter.search && (
            <button
              type="button"
              onClick={() => handleValueChange("search", "")}
              className="pr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {(localFilter.search || activeSelectFiltersCount > 0) && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPanelOpen((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isPanelOpen || activeSelectFiltersCount > 0
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shadow-sm"
                : "bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-500" />
            <span>Filters</span>
            {activeSelectFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {activeSelectFiltersCount}
              </span>
            )}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isPanelOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* AÇILIR PANEL */}
      {isPanelOpen && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/20 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Filter className="h-3 w-3 text-sky-500" />
                Status
              </label>
              <select
                value={localFilter.statusId?.toString() ?? ""}
                onChange={(e) => handleValueChange("statusId", e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.itemId} value={item.itemId}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3 text-amber-500" />
                Urgency
              </label>
              <select
                value={localFilter.urgencyLevelId?.toString() ?? ""}
                onChange={(e) => handleValueChange("urgencyLevelId", e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                <option value="">All Urgencies</option>
                {URGENCY_OPTIONS.map((item) => (
                  <option key={item.itemId} value={item.itemId}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority (Arka planda ImpactLevelId alanına yazar) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3 text-emerald-500" />
                Priority
              </label>
              <select
                value={localFilter.impactLevelId?.toString() ?? ""}
                onChange={(e) => handleValueChange("impactLevelId", e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                <option value="">All Priorities</option>
                {PRIORITY_OPTIONS.map((item) => (
                  <option key={item.itemId} value={item.itemId}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-purple-400" />
                Category
              </label>
              <select
                value={localFilter.categoryId?.toString() ?? ""}
                onChange={(e) => handleValueChange("categoryId", e.target.value)}
                disabled={categoriesLoading && categories.length === 0}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => {
                  const catId = cat.id || cat.itemId;
                  return (
                    <option key={catId} value={catId}>
                      {cat.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-indigo-400" />
                Creation Date
              </label>
              <input
                type="date"
                value={localFilter.createdFrom ?? ""}
                onChange={(e) => handleValueChange("createdFrom", e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-violet-400" />
                End Date
              </label>
              <input
                type="date"
                value={localFilter.createdTo ?? ""}
                onChange={(e) => handleValueChange("createdTo", e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ListFilter className="h-3 w-3 text-blue-400" />
                Page Size
              </label>
              <select
                value={localFilter.pageSize ?? 25}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                <option value="10">10 tickets</option>
                <option value="25">25 tickets</option>
                <option value="50">50 tickets</option>
                <option value="100">100 tickets</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
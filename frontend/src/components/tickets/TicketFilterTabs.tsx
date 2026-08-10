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
import { lookupService } from "@/src/services/lookupService";
import type { LookupItemDto } from "@/src/types/common";
import type { TicketFilterDto } from "@/src/types/ticket";

interface TicketFiltersProps {
  value: TicketFilterDto;
  onApply: (filters: TicketFilterDto) => void;
}

export function TicketFilters({ value, onApply }: TicketFiltersProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const [statuses, setStatuses] = useState<LookupItemDto[]>([]);
  const [urgencyLevels, setUrgencyLevels] = useState<LookupItemDto[]>([]);
  const [priorities, setPriorities] = useState<LookupItemDto[]>([]);
  const [categories, setCategories] = useState<LookupItemDto[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchLookups = async () => {
      setLookupsLoading(true);
      try {
        const [statusItems, urgencyItems, priorityItems, categoryItems] =
          await Promise.all([
            lookupService.getStatuses(),
            lookupService.getUrgencyLevels(),
            lookupService.getPriorities(),
            lookupService.getCategories(),
          ]);

        if (!cancelled) {
          setStatuses(statusItems);
          setUrgencyLevels(urgencyItems);
          setPriorities(priorityItems);
          setCategories(categoryItems);
        }
      } catch (error) {
        console.error("Failed to load ticket filter lookups:", error);
      } finally {
        if (!cancelled) {
          setLookupsLoading(false);
        }
      }
    };

    void fetchLookups();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeSelectFiltersCount = [
    value.statusId,
    value.urgencyLevelId,
    value.priorityId,
    value.categoryId,
    value.createdFrom,
    value.createdTo,
  ].filter(Boolean).length;

  const handleValueChange = (key: keyof TicketFilterDto, val: string) => {
    const updated: TicketFilterDto = {
      ...value,
      [key]: val.trim() === "" ? undefined : val,
      pageNumber: 1,
    };
    onApply(updated);
  };

  const handlePageSizeChange = (val: string) => {
    const updated: TicketFilterDto = {
      ...value,
      pageSize: val === "" ? 25 : Number(val),
      pageNumber: 1,
    };
    onApply(updated);
  };

  const handleClear = () => {
    const cleared: TicketFilterDto = {
      pageNumber: 1,
      pageSize: value.pageSize ?? 25,
      sortBy: value.sortBy,
      sortDirection: value.sortDirection
    };
    onApply(cleared);
  };

  const isSearchExpanded = searchFocused || Boolean(value.search);

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
            value={value.search ?? ""}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onChange={(e) => handleValueChange("search", e.target.value)}
            className="w-full bg-transparent px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {value.search && (
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
          {(value.search || activeSelectFiltersCount > 0) && (
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
                value={value.statusId?.toString() ?? ""}
                onChange={(e) => handleValueChange("statusId", e.target.value)}
                disabled={lookupsLoading}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                {statuses.map((item) => (
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
                value={value.urgencyLevelId?.toString() ?? ""}
                onChange={(e) => handleValueChange("urgencyLevelId", e.target.value)}
                disabled={lookupsLoading}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                <option value="">All Urgencies</option>
                {urgencyLevels.map((item) => (
                  <option key={item.itemId} value={item.itemId}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3 text-emerald-500" />
                Priority
              </label>
              <select
                value={value.priorityId?.toString() ?? ""}
                onChange={(e) => handleValueChange("priorityId", e.target.value)}
                disabled={lookupsLoading}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                <option value="">All Priorities</option>
                {priorities.map((item) => (
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
                value={value.categoryId?.toString() ?? ""}
                onChange={(e) => handleValueChange("categoryId", e.target.value)}
                disabled={lookupsLoading}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.itemId} value={cat.itemId}>
                    {cat.name}
                  </option>
                ))}
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
                value={value.createdFrom ?? ""}
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
                value={value.createdTo ?? ""}
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
                value={value.pageSize ?? 25}
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

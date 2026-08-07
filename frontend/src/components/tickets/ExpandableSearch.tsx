"use client";

import { useState, useRef } from "react";
import { Search, X } from "lucide-react";

interface ExpandableSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
}

export function ExpandableSearch({
  value,
  onChange,
  onSearch,
  placeholder = "Search ticket number or title...",
}: ExpandableSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isExpanded = isFocused || value.length > 0;

  return (
    <div className="relative inline-flex items-center">
      <div
        className={`relative flex items-center transition-all duration-300 ease-out rounded-xl border backdrop-blur-md overflow-hidden ${
          isExpanded
            ? "w-72 sm:w-80 bg-white dark:bg-slate-900 border-indigo-500/50 dark:border-indigo-500/50 ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-500/5"
            : "w-40 sm:w-48 bg-slate-100/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
        }`}
      >
        {/* Arama İkonu */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="pl-3.5 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0 cursor-pointer"
        >
          <Search className={`h-4 w-4 transition-colors ${isExpanded ? "text-indigo-500" : ""}`} />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSearch) {
              onSearch();
            }
          }}
          placeholder={isExpanded ? placeholder : "Search..."}
          className="w-full bg-transparent px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        />

        {/* Temizle Butonu (Yazı Varsa) */}
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Kısayol Rozeti (Boşken) */}
        {!value && !isFocused && (
          <div className="pr-2.5 hidden sm:flex items-center shrink-0 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800/80 rounded border border-slate-300/50 dark:border-slate-700/50">
              ⌘K
            </kbd>
          </div>
        )}
      </div>
    </div>
  );
}
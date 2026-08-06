"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";

interface FileInputProps {
  label?: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSizeMb?: number;
  error?: string;
}

function getFileKey(file: File): string {
  return [file.name, file.size, file.type, file.lastModified].join("-");
}

export function FileInput({
  label = "Files",
  files,
  onChange,
  accept,
  multiple = true,
  maxFiles = 10,
  maxFileSizeMb = 10,
  error,
}: FileInputProps) {
  const [selectionError, setSelectionError] = useState<string>();
  const effectiveMaxFiles = multiple ? maxFiles : 1;
  const visibleError = error ?? (files.length > 0 ? selectionError : undefined);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    // Reset the native input so the same file can be selected again after
    // removing it, and so later selections can be added to the existing list.
    event.target.value = "";

    if (selectedFiles.length === 0) return;

    const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
    const validFiles = selectedFiles.filter(
      (file) => file.size > 0 && file.size <= maxFileSizeBytes,
    );
    const candidateFiles = multiple ? [...files, ...validFiles] : validFiles;
    const uniqueFiles = candidateFiles.filter(
      (file, index, allFiles) =>
        allFiles.findIndex(
          (candidate) => getFileKey(candidate) === getFileKey(file),
        ) === index,
    );

    onChange(uniqueFiles.slice(0, effectiveMaxFiles));

    if (validFiles.length !== selectedFiles.length) {
      setSelectionError(
        `Each file must be between 1 byte and ${maxFileSizeMb} MB.`,
      );
    } else if (uniqueFiles.length > effectiveMaxFiles) {
      setSelectionError(
        `You can select a maximum of ${effectiveMaxFiles} files.`,
      );
    } else {
      setSelectionError(undefined);
    }
  };

  const removeFile = (fileIndex: number) => {
    onChange(files.filter((_, index) => index !== fileIndex));
    setSelectionError(undefined);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </span>
        {files.length > 0 && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {files.length}/{effectiveMaxFiles} selected
          </span>
        )}
      </div>
      <input
        accept={accept}
        aria-invalid={Boolean(visibleError)}
        className={`file-input file-input-sm h-9 w-full text-xs ${
          visibleError ? "file-input-error" : ""
        }`}
        multiple={multiple && effectiveMaxFiles > 1}
        onChange={handleChange}
        type="file"
      />

      <p
        className={`max-w-full break-words text-[11px] leading-4 ${
          visibleError
            ? "text-error"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {visibleError ??
          `Maximum ${effectiveMaxFiles} files; each file can be up to ${maxFileSizeMb} MB. You can select files together or add them in multiple selections.`}
      </p>
      {files.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white text-xs dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
          {files.map((file, index) => (
            <li
              className="flex items-center gap-2 px-3 py-2"
              key={getFileKey(file)}
            >
              <span className="min-w-0 flex-1 truncate text-xs">
                {file.name}
              </span>
              <span className="badge badge-ghost badge-sm shrink-0 text-[10px]">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              <button
                aria-label={`Remove ${file.name}`}
                className="btn btn-ghost btn-xs h-6 min-h-0 shrink-0 px-2 text-[10px] text-error"
                onClick={() => removeFile(index)}
                type="button"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

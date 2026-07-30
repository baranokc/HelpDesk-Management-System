"use client";

import type { ReactNode } from "react";

export interface DropdownItem {
  id: string;
  label: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  label: ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
}

export function Dropdown({
  label,
  items,
  align = "end",
}: DropdownProps) {
  return (
    <details className={`dropdown ${align === "end" ? "dropdown-end" : ""}`}>
      <summary className="btn btn-outline" role="button">
        {label}
      </summary>
      <ul className="menu dropdown-content z-40 mt-2 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
        {items.map((item) => (
          <li key={item.id}>
            <button
              className={item.danger ? "text-error" : ""}
              disabled={item.disabled}
              onClick={(event) => {
                item.onSelect();
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
              type="button"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

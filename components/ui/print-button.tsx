"use client";

import { buttonClass } from "./button";

export function PrintButton({ label, backLabel }: { label: string; backLabel: string }) {
  return (
    <div className="no-print mb-6 flex gap-2">
      <button type="button" onClick={() => window.print()} className={buttonClass("primary", "md")}>
        {label}
      </button>
      <button type="button" onClick={() => history.back()} className={buttonClass("ghost", "md")}>
        {backLabel}
      </button>
    </div>
  );
}

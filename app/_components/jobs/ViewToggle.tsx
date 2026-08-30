"use client";

import type { ComponentType } from "react";

import { Grid, ListView } from "@/app/_components/Icons";

export type JobView = "list" | "grid";

type Props = {
  value: JobView;
  onChange: (view: JobView) => void;
};

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Switch between list and grid view"
      className="border-line bg-surface inline-flex items-center gap-1 rounded-full border p-1"
    >
      <ToggleButton
        label="List view"
        active={value === "list"}
        onClick={() => onChange("list")}
        Icon={ListView}
      />
      <ToggleButton
        label="Grid view"
        active={value === "grid"}
        onClick={() => onChange("grid")}
        Icon={Grid}
      />
    </div>
  );
}

function ToggleButton({
  label,
  active,
  onClick,
  Icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  Icon: ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
        active ? "bg-brand-soft text-brand" : "text-muted hover:text-ink"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

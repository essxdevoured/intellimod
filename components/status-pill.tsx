import { ReactNode } from "react";

interface StatusPillProps {
  color?: "emerald" | "slate" | "amber" | "rose";
  children: ReactNode;
}

const COLORS: Record<NonNullable<StatusPillProps["color"]>, string> = {
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  slate: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  rose: "bg-rose-500/15 text-rose-300 border-rose-500/40",
};

export function StatusPill({ color = "slate", children }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${COLORS[color]}`}>
      {children}
    </span>
  );
}

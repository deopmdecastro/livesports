"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils";

type AdminActionTone = "neutral" | "view" | "edit" | "success" | "warning" | "danger";

interface AdminActionButtonProps {
  title: string;
  children: ReactNode;
  onClick?: () => void;
  tone?: AdminActionTone;
}

const toneClasses: Record<AdminActionTone, string> = {
  neutral: "hover:border-white/20 hover:bg-white/10 hover:text-white",
  view: "hover:border-sky-400/30 hover:bg-sky-400/10 hover:text-sky-300",
  edit: "hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300",
  success: "hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300",
  warning: "hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300",
  danger: "hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300",
};

export default function AdminActionButton({
  title,
  children,
  onClick,
  tone = "neutral",
}: AdminActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-gray-500 transition-colors",
        toneClasses[tone]
      )}
    >
      {children}
    </button>
  );
}

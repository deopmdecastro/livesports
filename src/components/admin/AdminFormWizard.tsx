"use client";

import type { ElementType, ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/utils";

export type WizardStep = {
  key: string;
  label: string;
  icon?: ElementType;
  description?: string;
};

interface AdminFormWizardProps {
  open: boolean;
  title: string;
  subtitle?: string;
  icon?: ElementType;
  tone?: "create" | "edit" | "view";
  /** Pass [] or omit for a simple modal without steps */
  steps?: WizardStep[];
  stepKey?: string;
  onStepChange?: (key: string) => void;
  onClose: () => void;
  children: ReactNode;
  footerLeft?: ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  showStepNav?: boolean;
  /** Hide primary button (e.g. view-only) */
  hidePrimary?: boolean;
  /** When set, replaces the default footer entirely */
  customFooter?: ReactNode;
  maxWidthClass?: string;
}

const toneIcon: Record<NonNullable<AdminFormWizardProps["tone"]>, string> = {
  create: "bg-red-500/10 border-red-500/20 text-red-400",
  edit: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  view: "bg-sky-500/10 border-sky-500/20 text-sky-400",
};

export default function AdminFormWizard({
  open,
  title,
  subtitle,
  icon: Icon,
  tone = "create",
  steps = [],
  stepKey = "",
  onStepChange,
  onClose,
  children,
  footerLeft,
  primaryLabel = "Guardar",
  onPrimary = () => {},
  primaryDisabled,
  primaryLoading,
  secondaryLabel = "Cancelar",
  showStepNav = true,
  hidePrimary = false,
  customFooter,
  maxWidthClass = "max-w-2xl",
}: AdminFormWizardProps) {
  if (!open) return null;

  const hasSteps = steps.length > 1;
  const index = hasSteps ? Math.max(0, steps.findIndex((s) => s.key === stepKey)) : 0;
  const isFirst = index <= 0;
  const isLast = !hasSteps || index >= steps.length - 1;
  const progress = hasSteps ? ((index + 1) / steps.length) * 100 : 100;

  const goPrev = () => {
    if (!isFirst && onStepChange) onStepChange(steps[index - 1].key);
  };
  const goNext = () => {
    if (!isLast && onStepChange) onStepChange(steps[index + 1].key);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={cn(
          "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[#1E1E2A] bg-[#0E0E16] shadow-2xl sm:rounded-2xl",
          maxWidthClass
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#1E1E2A] bg-gradient-to-r from-[#0C0C14] to-[#111118] px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {Icon ? (
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", toneIcon[tone])}>
                  <Icon className="h-5 w-5" />
                </div>
              ) : null}
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black tracking-tight text-white">{title}</h3>
                {subtitle ? <p className="mt-0.5 text-[11px] text-gray-500">{subtitle}</p> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2.5 text-gray-500 transition-all hover:bg-white/5 hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {hasSteps ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                <span>
                  Passo {index + 1} de {steps.length}
                </span>
                <span className="text-gray-400">{steps[index]?.label}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#E50914] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex gap-1 overflow-x-auto scrollbar-hide">
                {steps.map((step, i) => {
                  const StepIcon = step.icon;
                  const active = step.key === stepKey;
                  const done = i < index;
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => onStepChange?.(step.key)}
                      className={cn(
                        "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-bold transition-all sm:px-3",
                        active && "bg-[#E50914]/15 text-[#ff6b73] ring-1 ring-[#E50914]/30",
                        done && !active && "bg-emerald-500/10 text-emerald-400",
                        !active && !done && "bg-white/[0.03] text-gray-500 hover:text-gray-300"
                      )}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : StepIcon ? (
                        <StepIcon className="h-3.5 w-3.5 shrink-0" />
                      ) : null}
                      <span className="truncate">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#1E1E2A] bg-[#0A0A10] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-4">
          {customFooter ? (
            customFooter
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">{footerLeft}</div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2.5 text-sm font-semibold text-gray-300 transition-all hover:border-white/15 hover:text-white"
                >
                  {secondaryLabel}
                </button>
                {showStepNav && hasSteps && !isFirst ? (
                  <button
                    type="button"
                    onClick={goPrev}
                    className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                ) : null}
                {showStepNav && hasSteps && !isLast ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/15"
                  >
                    Seguinte
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : null}
                {!hidePrimary ? (
                  <button
                    type="button"
                    onClick={onPrimary}
                    disabled={primaryDisabled || primaryLoading}
                    className="inline-flex min-w-[7.5rem] items-center justify-center rounded-xl bg-[#E50914] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.25)] transition-all hover:bg-[#C50010] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {primaryLoading ? "A guardar…" : primaryLabel}
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/utils";

interface AdminSelectOption {
  value: string;
  label: string;
}

interface AdminSelectProps {
  value: string;
  options: AdminSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
}

export default function AdminSelect({
  value,
  options,
  onChange,
  disabled = false,
  className,
  buttonClassName,
  ariaLabel,
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <div
      className={cn("relative", className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-md border border-[#2A2A2A] bg-[#1A1A1A] px-3 text-left text-sm font-semibold text-white transition-colors hover:border-white/20 focus:border-[#E50914] focus:outline-none focus:ring-2 focus:ring-[#E50914]/25",
          disabled && "cursor-not-allowed opacity-60 hover:border-[#2A2A2A]",
          buttonClassName
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-lg border border-[#343434] bg-[#181818] shadow-2xl shadow-black/50">
          <div className="max-h-64 overflow-y-auto p-1" role="listbox">
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors",
                    active
                      ? "bg-[#E50914] text-white"
                      : "text-gray-200 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {active && <Check className="h-4 w-4 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

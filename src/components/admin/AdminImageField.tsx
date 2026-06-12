"use client";

import { ImageIcon, Trash2, Upload } from "lucide-react";

interface AdminImageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  aspectClassName?: string;
  className?: string;
}

export default function AdminImageField({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = "https://...",
  aspectClassName = "aspect-video",
  className = "",
}: AdminImageFieldProps) {
  const isSquarePreview = aspectClassName.includes("aspect-square");
  const previewFrameClass = isSquarePreview ? "h-24 w-24" : "h-32 w-full";

  const handleFile = (file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <label className="block text-xs font-medium text-gray-300">
          {label}{required ? " *" : ""}
        </label>
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Apagar
          </button>
        )}
      </div>

      {value ? (
        <div className="rounded-lg border border-[#2A2A2A] bg-[#111] p-3">
          <div className={`overflow-hidden rounded-md bg-black/20 ${previewFrameClass} ${aspectClassName}`}>
            <img src={value} alt="" className="h-full w-full object-contain" />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#343434] bg-[#111] p-3">
          <div className={`flex items-center justify-center rounded-md bg-black/20 ${previewFrameClass} ${aspectClassName}`}>
          <div className="text-center text-gray-500">
            <ImageIcon className="mx-auto mb-2 h-8 w-8" />
            <p className="text-xs font-medium">Sem imagem selecionada</p>
          </div>
          </div>
        </div>
      )}

      {!disabled && (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={value.startsWith("data:") ? "" : value}
            onChange={(event) => onChange(event.target.value)}
            className="input-dark w-full px-3 py-2.5 text-sm"
            placeholder={placeholder}
          />
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#202020] px-3 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:bg-[#2A2A2A]">
            <Upload className="h-4 w-4" />
            Carregar
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>
        </div>
      )}
    </div>
  );
}

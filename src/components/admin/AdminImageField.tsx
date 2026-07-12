"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ImageIcon, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import {
  checkImageDimensions,
  formatSizeHint,
  validateImageFileSize,
  type ImageSizeHint,
} from "@/lib/image-upload-hints";

interface AdminImageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  aspectClassName?: string;
  className?: string;
  sizeHint?: ImageSizeHint;
  compact?: boolean;
}

function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    img.src = src;
  });
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
  sizeHint,
  compact = false,
}: AdminImageFieldProps) {
  const [uploadInfo, setUploadInfo] = useState<{
    width: number;
    height: number;
    ok: boolean;
  } | null>(null);

  const isSquarePreview = aspectClassName.includes("aspect-square");
  const previewFrameClass = isSquarePreview ? "min-h-28 w-full" : "h-32 w-full";
  const previewAspectClass = isSquarePreview ? "" : aspectClassName;

  useEffect(() => {
    if (!value || !sizeHint) {
      setUploadInfo(null);
      return;
    }

    let cancelled = false;
    loadImageDimensions(value)
      .then(({ width, height }) => {
        if (cancelled) return;
        const result = checkImageDimensions(width, height, sizeHint);
        setUploadInfo({ width, height, ok: result.ok });
      })
      .catch(() => {
        if (!cancelled) setUploadInfo(null);
      });

    return () => {
      cancelled = true;
    };
  }, [value, sizeHint]);

  const handleValueChange = (nextValue: string) => {
    onChange(nextValue);
  };

  const handleFile = (file?: File) => {
    if (!file) return;

    if (sizeHint) {
      const validation = validateImageFileSize(file, sizeHint);
      if (!validation.valid) {
        toast.error(validation.error ?? "Ficheiro inválido.");
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        void handleValueChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const [dragOver, setDragOver] = useState(false);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <label className="block text-xs font-semibold text-gray-300">
          {label}
          {required ? " *" : ""}
        </label>
        {value && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setUploadInfo(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Apagar
          </button>
        )}
      </div>

      {!compact && sizeHint ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2">
          <p className="text-[11px] font-semibold text-red-300">Tamanho recomendado</p>
          <p className="mt-0.5 text-[11px] text-gray-400">{formatSizeHint(sizeHint)}</p>
          {sizeHint.notes ? <p className="mt-1 text-[10px] text-gray-500">{sizeHint.notes}</p> : null}
        </div>
      ) : null}

      {value ? (
        <div className={`rounded-xl border border-[#242433] bg-[#111118] ${compact ? "p-2" : "p-3"}`}>
          <div
            className={`flex items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-black/25 ${compact ? (isSquarePreview ? "h-20 w-20 mx-auto" : "h-24 w-full") : previewFrameClass} ${compact ? "" : previewAspectClass}`}
          >
            <div className={isSquarePreview ? `overflow-hidden rounded-lg bg-black/30 ${compact ? "h-16 w-16 p-1" : "h-24 w-24 p-2"}` : "h-full w-full"}>
              <img src={value} alt="" className="h-full w-full object-contain" />
            </div>
          </div>
          {!compact && uploadInfo ? (
            <div
              className={`mt-2 flex items-center gap-1.5 text-[11px] ${
                uploadInfo.ok ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {uploadInfo.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span>
                Carregada: {uploadInfo.width}×{uploadInfo.height}px
                {uploadInfo.ok
                  ? " — dimensões adequadas"
                  : sizeHint
                    ? ` — ideal: ${sizeHint.width}×${sizeHint.height}px`
                    : ""}
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (disabled) return;
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`rounded-xl border border-dashed p-3 transition-colors ${
            dragOver ? "border-[#E50914]/50 bg-[#E50914]/[0.04]" : "border-[#2A2A38] bg-[#111118]"
          }`}
        >
          <div className={`flex rounded-lg bg-black/20 ${compact ? "h-20 w-20 mx-auto" : previewFrameClass} ${compact ? "" : previewAspectClass}`}>
            <div
              className={`flex w-full items-center ${
                compact ? "justify-center p-2" : isSquarePreview ? "justify-start gap-3 px-3 py-3" : "flex-col justify-center px-4 text-center"
              }`}
            >
              <div
                className={`flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#191922] text-gray-500 transition-colors ${
                  dragOver ? "border-[#E50914]/40 text-[#E50914]" : ""
                } ${compact ? "h-10 w-10" : isSquarePreview ? "h-14 w-14" : "mx-auto mb-2 h-11 w-11"}`}
              >
                <ImageIcon className={compact ? "h-5 w-5" : isSquarePreview ? "h-7 w-7" : "h-6 w-6"} />
              </div>
              {!compact && (
              <div className={isSquarePreview ? "min-w-0 flex-1 text-left" : "text-center"}>
                <p className="text-xs font-semibold leading-tight text-gray-400">
                  {dragOver ? "Larga aqui para carregar" : "Arrasta uma imagem ou clica em carregar"}
                </p>
                {sizeHint ? (
                  <p className="mt-1 max-w-full break-words text-[10px] leading-snug text-gray-600">
                    {formatSizeHint(sizeHint)}
                  </p>
                ) : null}
              </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!disabled && (
        <div className={`grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-[1fr_auto]"}`}>
          <input
            value={value.startsWith("data:") ? "" : value}
            onChange={(event) => handleValueChange(event.target.value)}
            className={`input-dark w-full ${compact ? "px-2 py-1.5 text-[11px]" : "px-3 py-2.5 text-sm"}`}
            placeholder={placeholder}
          />
          {!compact && (
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#2A2A38] bg-gradient-to-b from-[#1D1D28] to-[#16161F] px-3.5 py-2.5 text-sm font-semibold text-gray-200 transition-all hover:border-[#E50914]/30 hover:text-white">
            <Upload className="h-4 w-4" />
            Carregar
            <input
              type="file"
              accept={sizeHint?.formats?.includes("SVG") ? "image/*" : "image/jpeg,image/png,image/webp,image/gif"}
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>
          )}
        </div>
      )}
    </div>
  );
}

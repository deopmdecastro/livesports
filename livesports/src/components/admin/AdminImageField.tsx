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

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <label className="block text-xs font-medium text-gray-300">
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
            className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Apagar
          </button>
        )}
      </div>

      {sizeHint ? (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
          <p className="text-[11px] font-semibold text-blue-300">Tamanho recomendado</p>
          <p className="mt-0.5 text-[11px] text-gray-400">{formatSizeHint(sizeHint)}</p>
          {sizeHint.notes ? <p className="mt-1 text-[10px] text-gray-500">{sizeHint.notes}</p> : null}
        </div>
      ) : null}

      {value ? (
        <div className="rounded-lg border border-[#2A2A2A] bg-[#111] p-3">
          <div
            className={`flex items-center justify-center overflow-hidden rounded-md border border-white/5 bg-black/25 ${previewFrameClass} ${previewAspectClass}`}
          >
            <div className={isSquarePreview ? "h-24 w-24 overflow-hidden rounded-md bg-black/30 p-2" : "h-full w-full"}>
              <img src={value} alt="" className="h-full w-full object-contain" />
            </div>
          </div>
          {uploadInfo ? (
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
        <div className="rounded-lg border border-dashed border-[#343434] bg-[#111] p-3">
          <div className={`flex rounded-md bg-black/25 ${previewFrameClass} ${previewAspectClass}`}>
            <div
              className={`flex w-full items-center ${
                isSquarePreview ? "justify-start gap-3 px-3 py-3" : "flex-col justify-center px-4 text-center"
              }`}
            >
              <div
                className={`flex shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#151515] text-gray-500 ${
                  isSquarePreview ? "h-14 w-14" : "mx-auto mb-2 h-10 w-10"
                }`}
              >
                <ImageIcon className={isSquarePreview ? "h-7 w-7" : "h-6 w-6"} />
              </div>
              <div className={isSquarePreview ? "min-w-0 flex-1 text-left" : "text-center"}>
                <p className="text-xs font-semibold leading-tight text-gray-400">Sem imagem selecionada</p>
                {sizeHint ? (
                  <p className="mt-1 max-w-full break-words text-[10px] leading-snug text-gray-600">
                    {formatSizeHint(sizeHint)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {!disabled && (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={value.startsWith("data:") ? "" : value}
            onChange={(event) => handleValueChange(event.target.value)}
            className="input-dark w-full px-3 py-2.5 text-sm"
            placeholder={placeholder}
          />
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#202020] px-3 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:bg-[#2A2A2A]">
            <Upload className="h-4 w-4" />
            Carregar
            <input
              type="file"
              accept={sizeHint?.formats?.includes("SVG") ? "image/*" : "image/jpeg,image/png,image/webp,image/gif"}
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>
        </div>
      )}
    </div>
  );
}

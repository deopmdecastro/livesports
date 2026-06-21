"use client";

import { useState } from "react";
import { Edit2, Eye, Image, Plus, Search, Trash2, X } from "lucide-react";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminImageField from "@/components/admin/AdminImageField";
import { IMAGE_SIZE_PRESETS } from "@/lib/image-upload-hints";
import AdminActionButton from "@/components/admin/AdminActionButton";
import type { Banner } from "@/types";
import toast from "react-hot-toast";

const positionOptions = [
  { value: "hero", label: "Hero principal" },
  { value: "sidebar", label: "Sidebar" },
  { value: "in-content", label: "Entre conteudos" },
];

const activeOptions = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];

const initialBanners: Banner[] = [
  { id: "1", title: "Hero Champions Night", imageUrl: "https://picsum.photos/seed/banner1/900/360", linkUrl: "/ao-vivo", position: "hero", active: true, startDate: "2026-06-10", endDate: "2026-06-30", createdAt: "2026-06-01T10:00:00.000Z" },
  { id: "2", title: "NBA Finals Countdown", imageUrl: "https://picsum.photos/seed/banner2/900/360", linkUrl: "/basquete", position: "in-content", active: true, startDate: "2026-06-11", endDate: "2026-06-20", createdAt: "2026-06-02T10:00:00.000Z" },
  { id: "3", title: "F1 GP Weekend", imageUrl: "https://picsum.photos/seed/banner3/900/360", linkUrl: "/f1", position: "sidebar", active: false, createdAt: "2026-06-03T10:00:00.000Z" },
];

const emptyForm = { title: "", imageUrl: "", linkUrl: "", position: "hero", active: "true", startDate: "", endDate: "" };

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = banners.filter((banner) => banner.title.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setModalMode("create");
  };

  const openModal = (mode: "edit" | "view", banner: Banner) => {
    setSelected(banner);
    setForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || "",
      position: banner.position,
      active: String(banner.active),
      startDate: banner.startDate || "",
      endDate: banner.endDate || "",
    });
    setModalMode(mode);
  };

  const saveBanner = () => {
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast.error("Informe titulo e imagem.");
      return;
    }

    const payload = {
      title: form.title,
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl,
      position: form.position as Banner["position"],
      active: form.active === "true",
      startDate: form.startDate,
      endDate: form.endDate,
    };

    if (modalMode === "edit" && selected) {
      setBanners((current) => current.map((banner) => banner.id === selected.id ? { ...banner, ...payload } : banner));
      toast.success("Banner atualizado!");
    } else {
      setBanners((current) => [{ id: Date.now().toString(), ...payload, createdAt: new Date().toISOString() }, ...current]);
      toast.success("Banner criado!");
    }

    setModalMode(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Banners</h2>
          <p className="text-xs text-gray-400">{banners.length} banners cadastrados</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">
          <Plus className="h-4 w-4" />
          Novo Banner
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-white">{banners.length}</p><p className="text-xs text-gray-400">Total</p></div>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-green-400">{banners.filter((banner) => banner.active).length}</p><p className="text-xs text-gray-400">Ativos</p></div>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-blue-400">{banners.filter((banner) => banner.position === "hero").length}</p><p className="text-xs text-gray-400">Hero</p></div>
      </div>

      <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar banners..." className="input-dark w-full py-2.5 pl-9 pr-4 text-sm" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((banner) => (
          <div key={banner.id} className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            <div className="aspect-[16/7] bg-[#2A2A2A]">
              <img src={banner.imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${banner.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{banner.active ? "Ativo" : "Inativo"}</span>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">{positionOptions.find((item) => item.value === banner.position)?.label}</span>
              </div>
              <h3 className="text-sm font-semibold text-white">{banner.title}</h3>
              <p className="mt-1 truncate text-xs text-gray-400">{banner.linkUrl || "Sem link"}</p>
              <div className="mt-4 flex justify-end gap-1.5">
                <AdminActionButton title="Visualizar" onClick={() => openModal("view", banner)} tone="view"><Eye className="h-3.5 w-3.5" /></AdminActionButton>
                <AdminActionButton title="Editar" onClick={() => openModal("edit", banner)} tone="edit"><Edit2 className="h-3.5 w-3.5" /></AdminActionButton>
                <AdminActionButton title="Remover" onClick={() => { setBanners((current) => current.filter((item) => item.id !== banner.id)); toast.success("Banner removido!"); }} tone="danger"><Trash2 className="h-3.5 w-3.5" /></AdminActionButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] p-5">
              <h3 className="font-bold text-white">{modalMode === "create" ? "Novo Banner" : modalMode === "edit" ? "Editar Banner" : "Visualizar Banner"}</h3>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Titulo *</label>
                <input disabled={modalMode === "view"} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" />
              </div>
              <AdminImageField
                label="Imagem"
                required
                disabled={modalMode === "view"}
                value={form.imageUrl}
                onChange={(value) => setForm({ ...form, imageUrl: value })}
                aspectClassName="aspect-[16/7]"
                sizeHint={IMAGE_SIZE_PRESETS.siteBanner}
              />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Link de destino</label>
                <input disabled={modalMode === "view"} value={form.linkUrl} onChange={(event) => setForm({ ...form, linkUrl: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Posicao</label><AdminSelect disabled={modalMode === "view"} value={form.position} onChange={(value) => setForm({ ...form, position: value })} options={positionOptions} /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Status</label><AdminSelect disabled={modalMode === "view"} value={form.active} onChange={(value) => setForm({ ...form, active: value })} options={activeOptions} /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Inicio</label><input disabled={modalMode === "view"} type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Fim</label><input disabled={modalMode === "view"} type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#2A2A2A] p-5">
              <button onClick={() => setModalMode(null)} className="rounded-lg bg-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-[#3A3A3A]">Fechar</button>
              {modalMode !== "view" && <button onClick={saveBanner} className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">Salvar</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

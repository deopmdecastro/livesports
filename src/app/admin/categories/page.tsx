"use client";

import { useState } from "react";
import { Edit2, Eye, Plus, Search, Tag, Trash2, X } from "lucide-react";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminActionButton from "@/components/admin/AdminActionButton";
import { slugify } from "@/utils";
import type { Category, SportCategory } from "@/types";
import toast from "react-hot-toast";

const sportOptions = [
  { value: "football", label: "Futebol" },
  { value: "basketball", label: "Basquete" },
  { value: "tennis", label: "Tenis" },
  { value: "ufc", label: "UFC" },
  { value: "f1", label: "Formula 1" },
  { value: "volleyball", label: "Volei" },
  { value: "baseball", label: "Beisebol" },
  { value: "other", label: "Outros" },
];

const initialCategories: Category[] = [
  { id: "1", name: "Futebol", slug: "futebol", description: "Premier League, La Liga e Brasileirao", sport: "football", color: "#22C55E", livesCount: 4, eventsCount: 12, createdAt: "2026-06-01T10:00:00.000Z" },
  { id: "2", name: "Basquete", slug: "basquete", description: "NBA e torneios internacionais", sport: "basketball", color: "#F59E0B", livesCount: 1, eventsCount: 5, createdAt: "2026-06-02T10:00:00.000Z" },
  { id: "3", name: "Tenis", slug: "tenis", description: "ATP, WTA e Grand Slams", sport: "tennis", color: "#84CC16", livesCount: 1, eventsCount: 4, createdAt: "2026-06-03T10:00:00.000Z" },
];

const emptyForm = { name: "", slug: "", description: "", sport: "football", color: "#E50914" };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = categories.filter((category) =>
    [category.name, category.slug, category.description || ""].some((value) => value.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setModalMode("create");
  };

  const openModal = (mode: "edit" | "view", category: Category) => {
    setSelected(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      sport: category.sport,
      color: category.color || "#E50914",
    });
    setModalMode(mode);
  };

  const saveCategory = () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome da categoria.");
      return;
    }

    if (modalMode === "edit" && selected) {
      setCategories((current) =>
        current.map((category) =>
          category.id === selected.id
            ? { ...category, ...form, slug: form.slug || slugify(form.name), sport: form.sport as SportCategory }
            : category
        )
      );
      toast.success("Categoria atualizada!");
    } else {
      setCategories((current) => [
        {
          id: Date.now().toString(),
          ...form,
          slug: form.slug || slugify(form.name),
          sport: form.sport as SportCategory,
          livesCount: 0,
          eventsCount: 0,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
      toast.success("Categoria criada!");
    }

    setModalMode(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Categorias</h2>
          <p className="text-xs text-gray-400">{categories.length} categorias cadastradas</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Categorias", categories.length],
          ["Com lives", categories.filter((category) => category.livesCount > 0).length],
          ["Eventos", categories.reduce((sum, category) => sum + category.eventsCount, 0)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar categorias..." className="input-dark w-full py-2.5 pl-9 pr-4 text-sm" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2A2A2A]">
              {["Categoria", "Slug", "Desporto", "Lives", "Eventos", "Acoes"].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((category) => (
              <tr key={category.id} className="table-row-hover border-b border-[#2A2A2A] last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                    <div>
                      <p className="text-sm font-semibold text-white">{category.name}</p>
                      <p className="text-xs text-gray-400">{category.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-300">/{category.slug}</td>
                <td className="px-4 py-3 text-xs text-gray-300">{sportOptions.find((sport) => sport.value === category.sport)?.label}</td>
                <td className="px-4 py-3 text-xs text-gray-300">{category.livesCount}</td>
                <td className="px-4 py-3 text-xs text-gray-300">{category.eventsCount}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <AdminActionButton title="Visualizar" onClick={() => openModal("view", category)} tone="view"><Eye className="h-3.5 w-3.5" /></AdminActionButton>
                    <AdminActionButton title="Editar" onClick={() => openModal("edit", category)} tone="edit"><Edit2 className="h-3.5 w-3.5" /></AdminActionButton>
                    <AdminActionButton title="Remover" onClick={() => { setCategories((current) => current.filter((item) => item.id !== category.id)); toast.success("Categoria removida!"); }} tone="danger"><Trash2 className="h-3.5 w-3.5" /></AdminActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] p-5">
              <h3 className="font-bold text-white">{modalMode === "create" ? "Nova Categoria" : modalMode === "edit" ? "Editar Categoria" : "Visualizar Categoria"}</h3>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Nome *</label>
                <input disabled={modalMode === "view"} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: slugify(event.target.value) })} className="input-dark w-full px-3 py-2.5 text-sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-300">Slug</label>
                  <input disabled={modalMode === "view"} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-300">Cor</label>
                  <input disabled={modalMode === "view"} type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="input-dark h-10 w-full px-2" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Desporto</label>
                <AdminSelect disabled={modalMode === "view"} value={form.sport} onChange={(value) => setForm({ ...form, sport: value })} options={sportOptions} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Descricao</label>
                <textarea disabled={modalMode === "view"} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="input-dark w-full resize-none px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#2A2A2A] p-5">
              <button onClick={() => setModalMode(null)} className="rounded-lg bg-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-[#3A3A3A]">Fechar</button>
              {modalMode !== "view" && <button onClick={saveCategory} className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">Salvar</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Edit2, Eye, Plus, Search, Trash2, X } from "lucide-react";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminActionButton from "@/components/admin/AdminActionButton";
import { slugify } from "@/utils";
import type { Category, SportCategory } from "@/types";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

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

const emptyForm = { name: "", slug: "", description: "", sport: "football", color: "#E50914" };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    apiRequest<Category[]>("/categories")
      .then(setCategories)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar categorias."))
      .finally(() => setLoading(false));
  }, []);

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

  const saveCategory = async () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome da categoria.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug || slugify(form.name),
        description: form.description || null,
        sport: form.sport as SportCategory,
        color: form.color,
      };

      if (modalMode === "edit" && selected) {
        const updated = await apiRequest<Category>(`/categories/${selected.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setCategories((current) => current.map((category) => (category.id === selected.id ? updated : category)));
        toast.success("Categoria atualizada!");
      } else {
        const created = await apiRequest<Category>("/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setCategories((current) => [created, ...current]);
        toast.success("Categoria criada!");
      }
      setModalMode(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel guardar a categoria.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    try {
      await apiRequest(`/categories/${category.id}`, { method: "DELETE" });
      setCategories((current) => current.filter((item) => item.id !== category.id));
      toast.success("Categoria removida!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover a categoria.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Categorias</h2>
          <p className="text-xs text-gray-400">{loading ? "A carregar categorias..." : `${categories.length} categorias cadastradas`}</p>
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
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">A carregar categorias...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  {categories.length === 0 ? "Nenhuma categoria cadastrada ainda." : "Nenhuma categoria encontrada para esta pesquisa."}
                </td>
              </tr>
            ) : (
              filtered.map((category) => (
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
                      <AdminActionButton title="Remover" onClick={() => deleteCategory(category)} tone="danger"><Trash2 className="h-3.5 w-3.5" /></AdminActionButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
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
              {modalMode !== "view" && (
                <button onClick={saveCategory} disabled={saving} className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000] disabled:opacity-50">
                  {saving ? "A guardar..." : "Salvar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

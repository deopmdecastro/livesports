"use client";

import { useState } from "react";
import { Edit2, Eye, Plus, Search, Trash2, X } from "lucide-react";
import { mockNews, mockUsers } from "@/lib/mock-data";
import { formatDate, slugify } from "@/utils";
import type { NewsArticle, SportCategory } from "@/types";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminImageField from "@/components/admin/AdminImageField";
import AdminActionButton from "@/components/admin/AdminActionButton";
import toast from "react-hot-toast";

const sportOptions = [
  { value: "football", label: "Futebol" },
  { value: "basketball", label: "Basquete" },
  { value: "tennis", label: "Tenis" },
  { value: "ufc", label: "UFC" },
  { value: "f1", label: "Formula 1" },
  { value: "volleyball", label: "Volei" },
  { value: "other", label: "Outros" },
];

const booleanOptions = [
  { value: "true", label: "Sim" },
  { value: "false", label: "Nao" },
];

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  thumbnail: "",
  sport: "football",
  published: "true",
  featured: "false",
  tags: "",
};

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>(mockNews);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<NewsArticle | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = news.filter((article) => article.title.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setModalMode("create");
  };

  const openModal = (mode: "edit" | "view", article: NewsArticle) => {
    setSelected(article);
    setForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || "",
      content: article.content,
      thumbnail: article.thumbnail || "",
      sport: article.sport || "football",
      published: String(article.published),
      featured: String(article.featured),
      tags: article.tags?.join(", ") || "",
    });
    setModalMode(mode);
  };

  const saveArticle = () => {
    if (!form.title.trim()) {
      toast.error("Informe o titulo da noticia.");
      return;
    }

    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt,
      content: form.content,
      thumbnail: form.thumbnail,
      sport: form.sport as SportCategory,
      published: form.published === "true",
      featured: form.featured === "true",
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };

    if (modalMode === "edit" && selected) {
      setNews((current) => current.map((article) => article.id === selected.id ? { ...article, ...payload } : article));
      toast.success("Noticia atualizada!");
    } else {
      setNews((current) => [{
        id: Date.now().toString(),
        ...payload,
        author: mockUsers[0],
        views: 0,
        publishedAt: payload.published ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
      }, ...current]);
      toast.success("Noticia criada!");
    }

    setModalMode(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Noticias</h2>
          <p className="text-xs text-gray-400">{news.length} artigos cadastrados</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]"><Plus className="h-4 w-4" />Nova Noticia</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-white">{news.length}</p><p className="text-xs text-gray-400">Total</p></div>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-green-400">{news.filter((article) => article.published).length}</p><p className="text-xs text-gray-400">Publicadas</p></div>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-yellow-400">{news.filter((article) => article.featured).length}</p><p className="text-xs text-gray-400">Destaques</p></div>
      </div>

      <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar noticias..." className="input-dark w-full py-2.5 pl-9 pr-4 text-sm" /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((article) => (
          <div key={article.id} className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            <div className="aspect-video bg-[#2A2A2A]"><img src={article.thumbnail || "https://picsum.photos/seed/news/500/280"} alt="" className="h-full w-full object-cover" /></div>
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2">
                {article.featured && <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400">Destaque</span>}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${article.published ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{article.published ? "Publicado" : "Rascunho"}</span>
              </div>
              <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-white">{article.title}</h3>
              <p className="mb-3 line-clamp-2 text-xs text-gray-400">{article.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{formatDate(article.createdAt)} - {article.views.toLocaleString()} views</span>
                <div className="flex gap-1.5">
                  <AdminActionButton title="Visualizar" onClick={() => openModal("view", article)} tone="view"><Eye className="h-3.5 w-3.5" /></AdminActionButton>
                  <AdminActionButton title="Editar" onClick={() => openModal("edit", article)} tone="edit"><Edit2 className="h-3.5 w-3.5" /></AdminActionButton>
                  <AdminActionButton title="Remover" onClick={() => { setNews((current) => current.filter((item) => item.id !== article.id)); toast.success("Noticia removida!"); }} tone="danger"><Trash2 className="h-3.5 w-3.5" /></AdminActionButton>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] p-5">
              <h3 className="font-bold text-white">{modalMode === "create" ? "Nova Noticia" : modalMode === "edit" ? "Editar Noticia" : "Visualizar Noticia"}</h3>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-5">
              <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Titulo *</label><input disabled={modalMode === "view"} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value, slug: slugify(event.target.value) })} className="input-dark w-full px-3 py-2.5 text-sm" /></div>
              <div>
                <AdminImageField
                  label="Imagem"
                  disabled={modalMode === "view"}
                  value={form.thumbnail}
                  onChange={(value) => setForm({ ...form, thumbnail: value })}
                />
              </div>
              <div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Slug</label><input disabled={modalMode === "view"} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Desporto</label><AdminSelect disabled={modalMode === "view"} value={form.sport} onChange={(value) => setForm({ ...form, sport: value })} options={sportOptions} /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Publicado</label><AdminSelect disabled={modalMode === "view"} value={form.published} onChange={(value) => setForm({ ...form, published: value })} options={booleanOptions} /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Destaque</label><AdminSelect disabled={modalMode === "view"} value={form.featured} onChange={(value) => setForm({ ...form, featured: value })} options={booleanOptions} /></div>
              </div>
              <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Resumo</label><textarea disabled={modalMode === "view"} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} rows={2} className="input-dark w-full resize-none px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Conteudo</label><textarea disabled={modalMode === "view"} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={6} className="input-dark w-full resize-none px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Tags</label><input disabled={modalMode === "view"} value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="futebol, liga, destaque" /></div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#2A2A2A] p-5">
              <button onClick={() => setModalMode(null)} className="rounded-lg bg-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-[#3A3A3A]">Fechar</button>
              {modalMode !== "view" && <button onClick={saveArticle} className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]">Salvar</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

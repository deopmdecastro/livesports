"use client";

import { useEffect, useState } from "react";
import { Edit2, Eye, Plus, Rss, Search, Trash2, X } from "lucide-react";
import { formatDate, slugify } from "@/utils";
import type { NewsArticle, SportCategory } from "@/types";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminImageField from "@/components/admin/AdminImageField";
import { IMAGE_SIZE_PRESETS } from "@/lib/image-upload-hints";
import AdminActionButton from "@/components/admin/AdminActionButton";
import toast from "react-hot-toast";
import { apiRequest, type ApiListResponse } from "@/lib/api";

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

const languageOptions = [
  { value: "pt,en", label: "Portugues + Ingles" },
  { value: "pt", label: "Apenas Portugues" },
  { value: "en", label: "Apenas Ingles" },
];

interface ExternalNewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string | null;
  sport: string;
  tags: string[];
  sourceUrl: string;
  sourceName: string | null;
  sourceIcon: string | null;
  language: string | null;
  country: string[];
  publishedAt: string | null;
  provider?: "newsdata" | "newsapi";
}

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
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<NewsArticle | null>(null);
  const [form, setForm] = useState(emptyForm);

  // ── External NewsData.io import panel ──
  const [importOpen, setImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importQuery, setImportQuery] = useState("sports");
  const [importLanguage, setImportLanguage] = useState("pt,en");
  const [importItems, setImportItems] = useState<ExternalNewsItem[]>([]);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Editors/admins should see drafts too, not just published articles —
    // published=undefined (omitted) lets the backend apply that rule based
    // on the caller's role.
    apiRequest<ApiListResponse<NewsArticle>>("/news?limit=100")
      .then((res) => setNews(res.items))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar noticias."))
      .finally(() => setLoading(false));
  }, []);

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

  const saveArticle = async () => {
    if (!form.title.trim()) {
      toast.error("Informe o titulo da noticia.");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Informe o conteudo da noticia.");
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
    };

    setSaving(true);
    try {
      if (modalMode === "edit" && selected) {
        const updated = await apiRequest<NewsArticle>(`/news/${selected.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setNews((current) => current.map((article) => (article.id === selected.id ? updated : article)));
        toast.success("Noticia atualizada!");
      } else {
        const created = await apiRequest<NewsArticle>("/news", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNews((current) => [created, ...current]);
        toast.success("Noticia criada!");
      }
      setModalMode(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel guardar a noticia.");
    } finally {
      setSaving(false);
    }
  };

  const deleteArticle = async (article: NewsArticle) => {
    try {
      await apiRequest(`/news/${article.id}`, { method: "DELETE" });
      setNews((current) => current.filter((item) => item.id !== article.id));
      toast.success("Noticia removida!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover a noticia.");
    }
  };

  // Existing slugs (including the "-pt"/"-en" translated siblings) so re-opening the
  // import panel or reloading the page doesn't lose track of what's already imported.
  const existingSlugs = new Set(news.map((article) => article.slug));

  const fetchExternalNews = async () => {
    setImportLoading(true);
    setImportError(null);
    try {
      const params = new URLSearchParams({ q: importQuery || "sports", language: importLanguage, category: "sports" });
      const res = await apiRequest<{ items: ExternalNewsItem[] }>(`/news/external?${params.toString()}`);
      const items = res.items || [];
      setImportItems(items);
      setImportedIds((current) => {
        const next = new Set(current);
        items.forEach((item) => {
          if (existingSlugs.has(item.slug)) next.add(item.id);
        });
        return next;
      });
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Nao foi possivel obter noticias externas.");
      setImportItems([]);
    } finally {
      setImportLoading(false);
    }
  };

  const openImportPanel = () => {
    setImportOpen(true);
    if (importItems.length === 0) void fetchExternalNews();
  };

  const importExternalArticle = async (item: ExternalNewsItem) => {
    setImportingIds((current) => new Set(current).add(item.id));
    try {
      const created = await apiRequest<NewsArticle & { translationWarning?: string | null }>("/news/external/import", {
        method: "POST",
        body: JSON.stringify({
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt,
          content: item.content,
          thumbnail: item.thumbnail,
          sport: item.sport,
          tags: item.tags,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          language: item.language,
        }),
      });
      setNews((current) => [created, ...current]);
      setImportedIds((current) => new Set(current).add(item.id));
      if (created.translationWarning) {
        toast.error(created.translationWarning);
      } else if (item.language === "pt" || item.language === "en") {
        toast.success(
          `Noticia importada como rascunho, com versao ${item.language === "pt" ? "Ingles" : "Portugues"} gerada automaticamente!`
        );
      } else {
        toast.success("Noticia importada como rascunho! Edita e publica quando quiseres.");
      }
    } catch (error) {
      // A duplicate-slug 409 means this story was already imported previously
      // (e.g. the "Importada" badge was lost after a page reload) — treat it
      // as already-imported instead of a scary error.
      const status = (error as { status?: number })?.status;
      if (status === 409) {
        setImportedIds((current) => new Set(current).add(item.id));
        toast("Esta noticia ja tinha sido importada anteriormente.", { icon: "ℹ️" });
      } else {
        toast.error(error instanceof Error ? error.message : "Nao foi possivel importar esta noticia.");
      }
    } finally {
      setImportingIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Noticias</h2>
          <p className="text-xs text-gray-400">{loading ? "A carregar noticias..." : `${news.length} artigos cadastrados`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openImportPanel} className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-gray-200 hover:border-red-500/30 hover:text-white"><Rss className="h-4 w-4" />Importar Noticias</button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000]"><Plus className="h-4 w-4" />Nova Noticia</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-white">{news.length}</p><p className="text-xs text-gray-400">Total</p></div>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-green-400">{news.filter((article) => article.published).length}</p><p className="text-xs text-gray-400">Publicadas</p></div>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4"><p className="text-2xl font-black text-yellow-400">{news.filter((article) => article.featured).length}</p><p className="text-xs text-gray-400">Destaques</p></div>
      </div>

      <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar noticias..." className="input-dark w-full py-2.5 pl-9 pr-4 text-sm" /></div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-10 text-center text-sm text-gray-400">A carregar noticias...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-10 text-center text-sm text-gray-400">
          {news.length === 0 ? "Nenhuma noticia cadastrada ainda." : "Nenhuma noticia encontrada para esta pesquisa."}
        </div>
      ) : (
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
                    <AdminActionButton title="Remover" onClick={() => deleteArticle(article)} tone="danger"><Trash2 className="h-3.5 w-3.5" /></AdminActionButton>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  sizeHint={IMAGE_SIZE_PRESETS.newsThumbnail}
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
              {modalMode !== "view" && (
                <button onClick={saveArticle} disabled={saving} className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white hover:bg-[#B00000] disabled:opacity-50">
                  {saving ? "A guardar..." : "Salvar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                  <Rss className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Importar Noticias (NewsData.io)</h3>
                  <p className="text-[11px] text-gray-500">Noticias de desporto em Portugues e Ingles, prontas a rever e publicar</p>
                </div>
              </div>
              <button onClick={() => setImportOpen(false)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex flex-col gap-3 border-b border-[#2A2A2A] p-5 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Pesquisa</label>
                <input
                  value={importQuery}
                  onChange={(event) => setImportQuery(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && fetchExternalNews()}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                  placeholder="Ex: futebol, ronaldo, nba..."
                />
              </div>
              <div className="sm:w-56">
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Idioma</label>
                <AdminSelect value={importLanguage} onChange={setImportLanguage} options={languageOptions} />
              </div>
              <button
                onClick={fetchExternalNews}
                disabled={importLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E50914] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#B00000] disabled:opacity-50"
              >
                {importLoading ? "A pesquisar..." : "Pesquisar"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {importLoading ? (
                <div className="py-10 text-center text-sm text-gray-400">A carregar noticias externas...</div>
              ) : importError ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">{importError}</div>
              ) : importItems.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">Nenhuma noticia encontrada. Tenta outra pesquisa.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {importItems.map((item) => {
                    const isImporting = importingIds.has(item.id);
                    const isImported = importedIds.has(item.id);
                    return (
                      <div key={item.id} className="flex gap-3 rounded-xl border border-[#2A2A2A] bg-[#111118] p-3">
                        <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-black/30">
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-600"><Rss className="h-5 w-5" /></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-semibold text-white">{item.title}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-500">
                            {item.sourceName || "Fonte desconhecida"}
                            {item.language ? <span className="rounded bg-white/5 px-1.5 py-0.5 uppercase">{item.language}</span> : null}
                            {item.provider ? (
                              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-300">
                                {item.provider === "newsdata" ? "NewsData.io" : "NewsAPI.org"}
                              </span>
                            ) : null}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-500 hover:text-gray-300 underline">Ver original</a>
                            <button
                              onClick={() => importExternalArticle(item)}
                              disabled={isImporting || isImported}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                                isImported
                                  ? "bg-emerald-500/15 text-emerald-300 cursor-default"
                                  : "bg-[#E50914]/15 text-red-300 hover:bg-[#E50914]/25"
                              } disabled:opacity-60`}
                            >
                              {isImported ? "Importada ✓" : isImporting ? "A importar..." : "Importar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Download,
  Edit2,
  Eye,
  Filter,
  LockKeyhole,
  MailCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/utils";
import type { User, UserRole, UserStatus } from "@/types";
import toast from "react-hot-toast";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminActionButton from "@/components/admin/AdminActionButton";
import { apiRequest, type ApiListResponse } from "@/lib/api";

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderador",
  editor: "Editor",
  user: "Utilizador",
};

const roleColors: Record<UserRole, string> = {
  super_admin: "border-purple-500/30 bg-purple-500/15 text-purple-200",
  admin: "border-red-500/30 bg-red-500/15 text-red-200",
  moderator: "border-blue-500/30 bg-blue-500/15 text-blue-200",
  editor: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
  user: "border-white/10 bg-white/5 text-gray-300",
};

const roleOptions = [
  { value: "user", label: "Utilizador" },
  { value: "editor", label: "Editor" },
  { value: "moderator", label: "Moderador" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const statusOptions = [
  { value: "active", label: "Ativo" },
  { value: "suspended", label: "Suspenso" },
  { value: "banned", label: "Banido" },
  { value: "pending", label: "Pendente" },
];

const booleanOptions = [
  { value: "true", label: "Sim" },
  { value: "false", label: "Nao" },
];

const emptyForm = {
  name: "",
  email: "",
  country: "",
  phone: "",
  avatar: "",
  password: "",
  role: "user",
  status: "active",
  twoFactorEnabled: "false",
  emailVerified: "true",
};

function statusBadge(status: UserStatus) {
  if (status === "active") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  if (status === "suspended") return "border-amber-500/30 bg-amber-500/15 text-amber-200";
  if (status === "banned") return "border-red-500/30 bg-red-500/15 text-red-200";
  return "border-white/10 bg-white/5 text-gray-300";
}

function statusLabel(status: UserStatus) {
  return statusOptions.find((option) => option.value === status)?.label || status;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = users.filter((user) => {
    const query = search.toLowerCase();
    const matchSearch = user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    const matchStatus = statusFilter === "all" || user.status === statusFilter;
    const matchRole = roleFilter === "all" || user.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  const activeCount = users.filter((user) => user.status === "active").length;
  const suspendedCount = users.filter((user) => user.status === "suspended").length;
  const bannedCount = users.filter((user) => user.status === "banned").length;
  const protectedCount = users.filter((user) => user.twoFactorEnabled).length;

  useEffect(() => {
    apiRequest<ApiListResponse<User>>("/users?limit=100")
      .then((data) => setUsers(data.items))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar utilizadores."))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setModalMode("create");
  };

  const openModal = (mode: "edit" | "view", user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      country: user.country || "",
      phone: user.phone || "",
      avatar: user.avatar || "",
      password: "",
      role: user.role,
      status: user.status,
      twoFactorEnabled: String(user.twoFactorEnabled),
      emailVerified: String(user.emailVerified),
    });
    setModalMode(mode);
  };

  const saveUser = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Informe nome e email.");
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      country: form.country,
      phone: form.phone,
      avatar: form.avatar || null,
      role: form.role as UserRole,
      status: form.status as UserStatus,
      twoFactorEnabled: form.twoFactorEnabled === "true",
      emailVerified: form.emailVerified === "true",
      updatedAt: new Date().toISOString(),
    };

    try {
      if (modalMode === "edit" && editingUser) {
        const updated = await apiRequest<User>(`/users/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setUsers((current) => current.map((user) => user.id === editingUser.id ? updated : user));
        toast.success("Utilizador atualizado!");
      } else {
        const created = await apiRequest<User>("/users", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            password: form.password.trim() || "user12345",
            avatar: form.avatar || `https://i.pravatar.cc/40?u=${encodeURIComponent(form.email)}`,
          }),
        });
        setUsers((current) => [created, ...current]);
        toast.success(`Utilizador criado! Senha: ${form.password.trim() || "user12345"}`);
      }
      setModalMode(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel guardar o utilizador.");
    }
  };

  const handleStatusChange = async (id: string, status: UserStatus) => {
    try {
      const updated = await apiRequest<User>(`/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setUsers((current) => current.map((user) => user.id === id ? updated : user));
      toast.success("Status atualizado!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o status.");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#151515]">
        <div className="border-b border-white/10 bg-gradient-to-r from-[#211112] via-[#151515] to-[#111827] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-200">
                <Users className="h-3.5 w-3.5" />
                Identidade e acesso
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Gestao de Utilizadores</h2>
              <p className="mt-1 text-sm text-gray-400">{loading ? "A carregar utilizadores reais..." : `${users.length} utilizadores cadastrados - ${filtered.length} visiveis nos filtros`}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 hover:text-white">
                <Download className="h-4 w-4" />
                Exportar
              </button>
              <button onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#E50914] px-4 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition-colors hover:bg-[#B00000]">
                <Plus className="h-4 w-4" />
                Novo Utilizador
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total", value: users.length, helper: `${filtered.length} resultados ativos`, icon: Users, tone: "text-sky-300" },
              { label: "Ativos", value: activeCount, helper: `${users.length ? Math.round((activeCount / users.length) * 100) : 0}% da base`, icon: CheckCircle2, tone: "text-emerald-300" },
              { label: "Com 2FA", value: protectedCount, helper: "Contas protegidas", icon: LockKeyhole, tone: "text-violet-300" },
              { label: "Alertas", value: suspendedCount + bannedCount, helper: `${suspendedCount} suspensos · ${bannedCount} banidos`, icon: ShieldCheck, tone: "text-amber-300" },
            ].map(({ label, value, helper, icon: Icon, tone }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                    <p className="mt-2 text-2xl font-black text-white">{value}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                    <Icon className={cn("h-4 w-4", tone)} />
                  </div>
                </div>
                <p className="mt-3 truncate text-xs text-gray-400">{helper}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por nome ou email..." className="input-dark h-11 w-full pl-9 pr-4 text-sm" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <AdminSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "Todos os status" }, ...statusOptions]} className="sm:w-52" ariaLabel="Filtrar por status" />
              <AdminSelect value={roleFilter} onChange={setRoleFilter} options={[{ value: "all", label: "Todas as funcoes" }, ...roleOptions]} className="sm:w-52" ariaLabel="Filtrar por funcao" />
            </div>
          </div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#E50914]/25 bg-[#E50914]/10 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Filter className="h-4 w-4 text-red-300" />
            {selected.length} selecionado(s)
          </div>
          <button onClick={() => setSelected([])} className="self-start rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-200 transition-colors hover:bg-red-400/20 sm:self-auto">
            Limpar selecao
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#171717]">
        <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Diretorio de utilizadores</h3>
            <p className="text-xs text-gray-500">{filtered.length} registos encontrados</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-400 sm:flex">
            <MailCheck className="h-3.5 w-3.5 text-emerald-300" />
            {users.filter((user) => user.emailVerified).length} emails verificados
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px]">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={() => setSelected(selected.length === filtered.length ? [] : filtered.map((user) => user.id))} className="h-4 w-4 accent-[#E50914]" />
                </th>
                {["Utilizador", "Pais", "Funcao", "Seguranca", "Status", "Registo", "Acoes"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className={cn("table-row-hover border-t border-white/10 transition-colors", selected.includes(user.id) && "bg-[#E50914]/5")}>
                  <td className="px-4 py-4"><input type="checkbox" checked={selected.includes(user.id)} onChange={() => toggleSelect(user.id)} className="h-4 w-4 accent-[#E50914]" /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar || `https://i.pravatar.cc/40?u=${encodeURIComponent(user.email)}`} alt="" className="h-10 w-10 rounded-full border border-white/10 object-cover" />
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate text-sm font-bold text-white">{user.name}</p>
                        <p className="max-w-[220px] truncate text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-medium text-gray-300">{user.country || "-"}</td>
                  <td className="px-4 py-4"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold", roleColors[user.role])}>{roleLabels[user.role]}</span></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold", user.twoFactorEnabled ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/5 text-gray-400")}>
                        2FA {user.twoFactorEnabled ? "Ativo" : "Inativo"}
                      </span>
                      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold", user.emailVerified ? "border-sky-500/30 bg-sky-500/15 text-sky-200" : "border-amber-500/30 bg-amber-500/15 text-amber-200")}>
                        Email {user.emailVerified ? "OK" : "Pendente"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold", statusBadge(user.status))}>{statusLabel(user.status)}</span></td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-400">{formatRelativeTime(user.createdAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <AdminActionButton onClick={() => openModal("view", user)} title="Visualizar" tone="view"><Eye className="h-3.5 w-3.5" /></AdminActionButton>
                      <AdminActionButton onClick={() => openModal("edit", user)} title="Editar" tone="edit"><Edit2 className="h-3.5 w-3.5" /></AdminActionButton>
                      {user.status !== "active" && <AdminActionButton onClick={() => handleStatusChange(user.id, "active")} title="Ativar" tone="success"><UserCheck className="h-3.5 w-3.5" /></AdminActionButton>}
                      {user.status !== "suspended" && <AdminActionButton onClick={() => handleStatusChange(user.id, "suspended")} title="Suspender" tone="warning"><UserX className="h-3.5 w-3.5" /></AdminActionButton>}
                      {user.status !== "banned" && <AdminActionButton onClick={() => handleStatusChange(user.id, "banned")} title="Banir" tone="danger"><Ban className="h-3.5 w-3.5" /></AdminActionButton>}
                      <AdminActionButton onClick={() => toast.success("Email de redefinicao enviado!")} title="Reset password" tone="warning"><RefreshCw className="h-3.5 w-3.5" /></AdminActionButton>
                      <AdminActionButton onClick={async () => { try { await apiRequest(`/users/${user.id}`, { method: "DELETE" }); setUsers((current) => current.filter((item) => item.id !== user.id)); toast.success("Utilizador removido!"); } catch (error) { toast.error(error instanceof Error ? error.message : "Nao foi possivel remover o utilizador."); } }} title="Excluir" tone="danger"><Trash2 className="h-3.5 w-3.5" /></AdminActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <Users className="mx-auto mb-3 h-9 w-9 text-gray-600" />
              <p className="text-sm font-semibold text-gray-300">Nenhum utilizador encontrado</p>
              <p className="mt-1 text-xs text-gray-500">Ajuste a pesquisa ou os filtros.</p>
            </div>
          )}
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#171717] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] p-5">
              <div>
                <h3 className="text-lg font-bold text-white">{modalMode === "create" ? "Novo Utilizador" : modalMode === "edit" ? "Editar Utilizador" : "Visualizar Utilizador"}</h3>
                <p className="text-xs text-gray-500">Dados de perfil, acesso e seguranca da conta.</p>
              </div>
              <button onClick={() => setModalMode(null)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-5">
              {editingUser && (
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <img src={editingUser.avatar || `https://i.pravatar.cc/40?u=${encodeURIComponent(editingUser.email)}`} alt="" className="h-12 w-12 rounded-full border border-white/10 object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{editingUser.name}</p>
                    <p className="truncate text-xs text-gray-400">{editingUser.email}</p>
                  </div>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Nome *</label><input disabled={modalMode === "view"} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="Nome completo" /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Email *</label><input type="email" disabled={modalMode === "view"} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="email@exemplo.com" /></div>
              </div>
              {modalMode === "create" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-300">
                    Senha inicial <span className="text-gray-500 font-normal">(padrão: user12345)</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                    placeholder="Deixar vazio para usar senha padrão"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Avatar (URL da imagem)</label>
                <div className="flex items-center gap-2">
                  <input
                    disabled={modalMode === "view"}
                    value={form.avatar}
                    onChange={(event) => setForm({ ...form, avatar: event.target.value })}
                    className="input-dark w-full px-3 py-2.5 text-sm flex-1"
                    placeholder="https://exemplo.com/avatar.jpg"
                  />
                  {form.avatar && (
                    <img src={form.avatar} alt="avatar preview" className="h-10 w-10 rounded-full border border-white/10 object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Pais</label><input disabled={modalMode === "view"} value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="PT, BR, AO..." /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Telefone</label><input disabled={modalMode === "view"} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="input-dark w-full px-3 py-2.5 text-sm" placeholder="+351 999 999 999" /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Funcao</label><AdminSelect disabled={modalMode === "view"} value={form.role} onChange={(value) => setForm({ ...form, role: value })} options={roleOptions} /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Status</label><AdminSelect disabled={modalMode === "view"} value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={statusOptions} /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">2FA</label><AdminSelect disabled={modalMode === "view"} value={form.twoFactorEnabled} onChange={(value) => setForm({ ...form, twoFactorEnabled: value })} options={booleanOptions} /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-gray-300">Email verificado</label><AdminSelect disabled={modalMode === "view"} value={form.emailVerified} onChange={(value) => setForm({ ...form, emailVerified: value })} options={booleanOptions} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 p-5">
              <button onClick={() => setModalMode(null)} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white">Fechar</button>
              {modalMode !== "view" && <button onClick={saveUser} className="rounded-lg bg-[#E50914] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B00000]">Salvar</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

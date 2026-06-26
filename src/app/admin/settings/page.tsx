"use client";

import { useState } from "react";
import {
  Save, Globe, Shield, Bell,
  Tv2,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminImageField from "@/components/admin/AdminImageField";

// ─── Types ─────────────────────────────────────────────────────────────────────

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, color = "#E50914", children }: {
  title: string; icon: React.ElementType; color?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-[#1E1E2A]">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-300">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-gray-600">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", mono }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; mono?: boolean;
}) {
  return (
    <input
      type={type} value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`input-dark w-full px-3 py-2.5 text-sm ${mono ? "font-mono" : ""}`}
    />
  );
}

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <span className="text-sm text-gray-200">{label}</span>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors ${checked ? "bg-[#E50914]" : "bg-[#2A2A38]"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-0.5 ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const SETTINGS_TABS = ["Geral", "Identidade", "Segurança", "Notificações"] as const;
type SettingsTab = typeof SETTINGS_TABS[number];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Geral");

  // Branding / Identity
  const [branding, setBranding] = useState({
    logoUrl: "",
    faviconUrl: "",
    ogImageUrl: "",
    primaryColor: "#E50914",
    siteName: "LiveSports",
  });

  // Load branding from localStorage on mount (client-only)
  useState(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem("livesports_branding") || "{}");
      if (saved.logoUrl || saved.faviconUrl || saved.ogImageUrl) {
        setBranding((prev) => ({
          ...prev,
          logoUrl: saved.logoUrl || "",
          faviconUrl: saved.faviconUrl || "",
          ogImageUrl: saved.ogImageUrl || "",
        }));
      }
    } catch { /* ignore */ }
  });
  const [savingBranding, setSavingBranding] = useState(false);

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      localStorage.setItem("livesports_branding", JSON.stringify(branding));
      if (branding.faviconUrl) {
        let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (!link) { link = document.createElement("link"); document.head.appendChild(link); }
        link.type = "image/x-icon"; link.rel = "shortcut icon"; link.href = branding.faviconUrl;
      }
      toast.success("Identidade visual guardada!");
    } catch { toast.error("Erro ao guardar"); }
    finally { setSavingBranding(false); }
  };

  // General
  const [general, setGeneral] = useState({
    siteName: "LiveSports",
    siteUrl: "https://livesports.com",
    description: "A melhor plataforma de streaming desportivo ao vivo",
    email: "admin@livesports.com",
    phone: "+351 910 000 000",
    language: "pt",
    timezone: "Europe/Lisbon",
  });

  // Security
  const [security, setSecurity] = useState({
    requireEmail: true,
    allowGoogle: true,
    allowFacebook: false,
    twoFactorDefault: false,
    maxLoginAttempts: 5,
    sessionTimeout: 24,
  });

  // Notifications
  const [notifs, setNotifs] = useState({
    emailNewUser: true,
    emailNewLive: true,
    emailErrors: true,
    pushEnabled: false,
    telegramEnabled: false,
    telegramBotToken: "",
    telegramChatId: "",
  });

  const handleSave = () => toast.success("Configurações guardadas!");

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Page header */}
      <div className="rounded-2xl border border-[#1E1E2A] bg-[#0E0E16] p-5">
        <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Configurações
        </h2>
        <p className="text-sm text-gray-400 mt-1">Gerencie as configurações globais da plataforma, segurança e integrações de API.</p>

        {/* Tab bar */}
        <div className="mt-5 flex gap-1 rounded-xl border border-[#1E1E2A] bg-[#0A0A0F] p-1">
          {SETTINGS_TABS.map((tab) => {
            const icons: Record<SettingsTab, React.ElementType> = { Geral: Globe, Identidade: Tv2, Segurança: Shield, Notificações: Bell };
            const Icon = icons[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${
                  activeTab === tab ? "bg-[#E50914] text-white shadow" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB: GERAL ── */}
      {activeTab === "Geral" && (
        <Section title="Configurações Gerais" icon={Globe}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Nome do Site", k: "siteName", placeholder: "LiveSports" },
                { label: "URL do Site", k: "siteUrl", placeholder: "https://livesports.com" },
                { label: "Email de Contacto", k: "email", placeholder: "admin@livesports.com" },
                { label: "Telefone", k: "phone", placeholder: "+351 9xx xxx xxx" },
              ].map(({ label, k, placeholder }) => (
                <Field key={k} label={label}>
                  <Input
                    value={general[k as keyof typeof general]}
                    onChange={(v) => setGeneral({ ...general, [k]: v })}
                    placeholder={placeholder}
                  />
                </Field>
              ))}
            </div>
            <Field label="Descrição do Site">
              <textarea
                value={general.description}
                onChange={(e) => setGeneral({ ...general, description: e.target.value })}
                rows={3}
                className="input-dark w-full resize-none px-3 py-2.5 text-sm"
                placeholder="Descrição curta para SEO..."
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Idioma Padrão">
                <select value={general.language} onChange={(e) => setGeneral({ ...general, language: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm">
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </Field>
              <Field label="Fuso Horário">
                <select value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm">
                  <option value="Europe/Lisbon">Europe/Lisbon (UTC+0/+1)</option>
                  <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-3)</option>
                  <option value="Africa/Luanda">Africa/Luanda (UTC+1)</option>
                  <option value="UTC">UTC</option>
                </select>
              </Field>
            </div>
          </div>
        </Section>
      )}

      {/* ── TAB: IDENTIDADE ── */}
      {activeTab === "Identidade" && (
        <div className="space-y-5">
          <Section title="Logótipo do Site" icon={Tv2}>
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Logótipo exibido na navbar e barra lateral. Pode colar um URL ou carregar um ficheiro.
                Formatos recomendados: SVG, PNG transparente. Altura ideal: 40px.
              </p>
              <AdminImageField
                label="Logótipo"
                value={branding.logoUrl}
                onChange={(v) => setBranding({ ...branding, logoUrl: v })}
                placeholder="https://cdn.exemplo.com/logo.svg"
                aspectClassName="aspect-[3/1]"
                sizeHint={{ width: 200, height: 60, maxSizeKB: 500, formats: ["SVG", "PNG", "WebP"] }}
              />
              {branding.logoUrl && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                  <p className="text-[11px] text-green-400 font-semibold mb-1">✓ Logótipo definido — será aplicado após guardar</p>
                  <p className="text-[10px] text-gray-500">O logótipo é guardado localmente e aplicado na sessão atual. Para persistir entre dispositivos, use um URL de CDN.</p>
                </div>
              )}
            </div>
          </Section>

          <Section title="Favicon" icon={Globe}>
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Ícone exibido na tab do browser. Recomendado: 32×32px, formato .ico ou .png.
              </p>
              <AdminImageField
                label="Favicon"
                value={branding.faviconUrl}
                onChange={(v) => setBranding({ ...branding, faviconUrl: v })}
                placeholder="https://cdn.exemplo.com/favicon.ico"
                aspectClassName="aspect-square"
                sizeHint={{ width: 32, height: 32, maxSizeKB: 100, formats: ["ICO", "PNG", "SVG"] }}
              />
              {branding.faviconUrl && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                  <p className="text-[11px] text-green-400 font-semibold">✓ Favicon será aplicado após guardar</p>
                </div>
              )}
            </div>
          </Section>

          <Section title="Imagem OpenGraph (Redes Sociais / SEO)" icon={Globe}>
            <div className="space-y-3">
              <p className="text-xs text-gray-400">Imagem exibida ao partilhar o site nas redes sociais. Tamanho recomendado: 1200×630px.</p>
              <AdminImageField
                label="Imagem OG"
                value={branding.ogImageUrl}
                onChange={(v) => setBranding({ ...branding, ogImageUrl: v })}
                placeholder="https://cdn.exemplo.com/og-image.jpg"
                sizeHint={{ width: 1200, height: 630, maxSizeKB: 2048, formats: ["JPG", "PNG", "WebP"] }}
              />
            </div>
          </Section>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveBranding}
              disabled={savingBranding}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:from-[#FF1A24] hover:to-[#E50914] transition-all disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {savingBranding ? "A guardar..." : "Guardar Identidade Visual"}
            </button>
            {(branding.logoUrl || branding.faviconUrl) && (
              <button
                onClick={() => { setBranding({ logoUrl: "", faviconUrl: "", ogImageUrl: "", primaryColor: "#E50914", siteName: "LiveSports" }); localStorage.removeItem("livesports_branding"); toast.success("Identidade visual reposta!"); }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#2A2A2A] px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Repor padrão
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: SEGURANÇA ── */}
      {activeTab === "Segurança" && (
        <Section title="Segurança & Autenticação" icon={Shield}>
          <div className="space-y-3 divide-y divide-[#1E1E2A]">
            <Toggle checked={security.requireEmail} onChange={(v) => setSecurity({ ...security, requireEmail: v })} label="Verificação de email obrigatória" sub="Utilizadores devem confirmar email ao registar" />
            <div className="pt-3"><Toggle checked={security.allowGoogle} onChange={(v) => setSecurity({ ...security, allowGoogle: v })} label="Login com Google" /></div>
            <div className="pt-3"><Toggle checked={security.allowFacebook} onChange={(v) => setSecurity({ ...security, allowFacebook: v })} label="Login com Facebook" /></div>
            <div className="pt-3"><Toggle checked={security.twoFactorDefault} onChange={(v) => setSecurity({ ...security, twoFactorDefault: v })} label="Ativar 2FA por padrão" sub="Recomendado para contas de admin" /></div>
            <div className="pt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Tentativas máx. de login">
                <Input value={String(security.maxLoginAttempts)} onChange={(v) => setSecurity({ ...security, maxLoginAttempts: Number(v) })} type="number" />
              </Field>
              <Field label="Timeout de sessão (horas)">
                <Input value={String(security.sessionTimeout)} onChange={(v) => setSecurity({ ...security, sessionTimeout: Number(v) })} type="number" />
              </Field>
            </div>
          </div>
        </Section>
      )}

      {/* ── TAB: NOTIFICAÇÕES ── */}
      {activeTab === "Notificações" && (
        <div className="space-y-4">
          <Section title="Notificações por Email" icon={Bell}>
            <div className="space-y-3 divide-y divide-[#1E1E2A]">
              <Toggle checked={notifs.emailNewUser} onChange={(v) => setNotifs({ ...notifs, emailNewUser: v })} label="Novo utilizador registado" />
              <div className="pt-3"><Toggle checked={notifs.emailNewLive} onChange={(v) => setNotifs({ ...notifs, emailNewLive: v })} label="Nova live criada" /></div>
              <div className="pt-3"><Toggle checked={notifs.emailErrors} onChange={(v) => setNotifs({ ...notifs, emailErrors: v })} label="Erros e alertas críticos" sub="Falhas de stream, erros de API, etc." /></div>
            </div>
          </Section>

          <Section title="Telegram Bot" icon={Bell} color="#3B82F6">
            <div className="space-y-4">
              <Toggle checked={notifs.telegramEnabled} onChange={(v) => setNotifs({ ...notifs, telegramEnabled: v })} label="Ativar notificações via Telegram" />
              {notifs.telegramEnabled && (
                <div className="grid gap-4 sm:grid-cols-2 mt-3 pt-3 border-t border-[#1E1E2A]">
                  <Field label="Bot Token" hint="Obtenha com @BotFather no Telegram">
                    <Input value={notifs.telegramBotToken} onChange={(v) => setNotifs({ ...notifs, telegramBotToken: v })} placeholder="123456:ABC-DEF..." mono />
                  </Field>
                  <Field label="Chat ID">
                    <Input value={notifs.telegramChatId} onChange={(v) => setNotifs({ ...notifs, telegramChatId: v })} placeholder="-1001234567890" mono />
                  </Field>
                </div>
              )}
            </div>
          </Section>
        </div>
      )}

      {/* Save button (not on Identidade tab) */}
      {activeTab !== "Identidade" && (
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B00000] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:from-[#FF1A24] hover:to-[#E50914] transition-all"
        >
          <Save className="h-4 w-4" />
          Guardar Configurações
        </button>
      )}
    </div>
  );
}

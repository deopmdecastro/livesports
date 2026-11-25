"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowRight, UserPlus } from "lucide-react";
import { publicApiRequest, setAuthSession } from "@/lib/api";

const countries = ["Angola", "Portugal", "Brasil", "Cabo Verde", "Moçambique", "São Tomé e Príncipe", "Guiné-Bissau", "Timor-Leste", "Outro"];
const input = "input-dark w-full rounded-xl px-4 py-3 text-base sm:text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20";
export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", country: "", accept: false });
  const [visible, setVisible] = useState(false);
  const [visibleConfirm, setVisibleConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mismatch = !!form.confirm && form.password !== form.confirm;
  const bytes = new TextEncoder().encode(form.password).length;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (form.name.trim().length < 2) return setError("Indique um nome com pelo menos 2 caracteres.");
    if (form.password !== form.confirm) return setError("As palavras-passe não coincidem.");
    if (bytes > 72) return setError("A palavra-passe é demasiado longa (máximo 72 bytes).");
    if (!form.accept) return setError("Aceite os termos para continuar.");
    setLoading(true); setError("");
    try {
      const data = await publicApiRequest<{ user: unknown; accessToken: string; refreshToken: string }>("/auth/register", { method: "POST", retries: 0, body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password, country: form.country }) });
      setAuthSession(data);
      window.location.assign("/me");
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível criar a conta."); setLoading(false); }
  }
  return <div className="mx-auto w-full max-w-[490px] rounded-3xl border border-white/10 bg-[#10111b]/95 p-6 shadow-[0_28px_100px_rgba(0,0,0,.4)] sm:p-9">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-red-400">Junte-se à LiveSports</p><h1 className="mt-3 text-3xl font-black tracking-tight">Criar conta</h1><p className="mt-2 text-sm leading-6 text-gray-400">Crie a sua conta para acompanhar o seu desporto.</p>
    <form onSubmit={submit} className="mt-7 space-y-4">
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      <div><label htmlFor="reg-name" className="mb-1.5 block text-sm font-semibold text-gray-300">Nome completo</label><input id="reg-name" name="name" autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="O seu nome" className={input}/></div>
      <div><label htmlFor="reg-email" className="mb-1.5 block text-sm font-semibold text-gray-300">Email</label><input id="reg-email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="nome@exemplo.com" className={input}/></div>
      <div><label htmlFor="reg-country" className="mb-1.5 block text-sm font-semibold text-gray-300">País <span className="font-normal text-gray-500">(opcional)</span></label><select id="reg-country" name="country" value={form.country} onChange={e=>setForm({...form,country:e.target.value})} className={input}><option value="">Selecione o país</option>{countries.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
      <div><label htmlFor="reg-password" className="mb-1.5 block text-sm font-semibold text-gray-300">Palavra-passe</label><div className="relative"><input id="reg-password" name="password" type={visible?"text":"password"} autoComplete="new-password" required minLength={8} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} aria-describedby="password-help" placeholder="Pelo menos 8 caracteres" className={`${input} pr-14`}/><button type="button" aria-label={visible?"Ocultar palavra-passe":"Mostrar palavra-passe"} onClick={()=>setVisible(!visible)} className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-gray-400 hover:text-white">{visible?<EyeOff size={19}/>:<Eye size={19}/>}</button></div><p id="password-help" className="mt-1.5 text-xs text-gray-400">Mínimo 8 caracteres; use uma palavra-passe única e difícil de adivinhar.</p></div>
      <div><label htmlFor="reg-confirm" className="mb-1.5 block text-sm font-semibold text-gray-300">Confirmar palavra-passe</label><div className="relative"><input id="reg-confirm" type={visibleConfirm?"text":"password"} autoComplete="new-password" required value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} aria-invalid={mismatch} aria-describedby={mismatch?"confirm-error":undefined} placeholder="Repita a palavra-passe" className={`${input} pr-14`}/><button type="button" aria-label={visibleConfirm?"Ocultar confirmação":"Mostrar confirmação"} onClick={()=>setVisibleConfirm(!visibleConfirm)} className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-gray-400 hover:text-white">{visibleConfirm?<EyeOff size={19}/>:<Eye size={19}/>}</button></div>{mismatch&&<p id="confirm-error" className="mt-1 text-xs text-red-300">As palavras-passe não coincidem.</p>}</div>
      <div className="flex items-start gap-3 pt-1"><input id="reg-terms" type="checkbox" required checked={form.accept} onChange={e=>setForm({...form,accept:e.target.checked})} className="mt-1 h-4 w-4 accent-red-600"/><label htmlFor="reg-terms" className="text-xs leading-5 text-gray-400">Aceito os <Link href="/terms" target="_blank" className="text-red-300 underline">Termos de Uso</Link> e a <Link href="/privacy" target="_blank" className="text-red-300 underline">Política de Privacidade</Link>.</label></div>
      <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e50914] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50">{loading?<><Loader2 size={18} className="animate-spin"/>A criar conta...</>:<><UserPlus size={18}/>Criar conta</>}</button>
    </form><p className="mt-6 text-center text-sm text-gray-400">Já tem conta? <Link href="/login" className="inline-flex items-center gap-1 font-bold text-red-300 hover:text-white">Entrar <ArrowRight size={14}/></Link></p>
  </div>;
}

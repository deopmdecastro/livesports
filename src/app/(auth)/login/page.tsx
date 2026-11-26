"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn, ArrowRight } from "lucide-react";
import { publicApiRequest, setAuthSession } from "@/lib/api";

const input = "input-dark w-full rounded-xl px-4 py-3 text-base sm:text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20";
export default function LoginPage() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [visible,setVisible]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if(loading)return; setLoading(true); setError("");
    try {
      const data=await publicApiRequest<{ user: { role: string }; accessToken: string; refreshToken: string }>("/auth/login", {method:"POST",retries:0,body:JSON.stringify({email:email.trim(),password})});
      setAuthSession(data);
      const requested = new URLSearchParams(window.location.search).get("redirect");
      const safeRedirect = requested && requested.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\") ? requested : null;
      window.location.assign(safeRedirect || (["admin","super_admin"].includes(data.user.role) ? "/admin/dashboard" : data.user.role === "creator" ? "/creator" : "/me"));
    } catch(err) {setError(err instanceof Error?err.message:"Não foi possível iniciar sessão."); setLoading(false);}
  }
  return <div className="mx-auto w-full max-w-[490px] rounded-3xl border border-white/10 bg-[#10111b]/95 p-6 shadow-[0_28px_100px_rgba(0,0,0,.4)] sm:p-9">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-red-400">A sua conta LiveSports</p><h1 className="mt-3 text-3xl font-black tracking-tight">Bem-vindo de volta</h1><p className="mt-2 text-sm leading-6 text-gray-400">Inicie sessão e continue a acompanhar o seu desporto.</p>
    <form onSubmit={submit} className="mt-8 space-y-5">
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      <div><label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-gray-300">Email</label><input id="login-email" name="email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@exemplo.com" className={input}/></div>
      <div><div className="mb-1.5 flex items-center justify-between"><label htmlFor="login-password" className="text-sm font-semibold text-gray-300">Palavra-passe</label><Link href="/forgot-password" className="text-xs font-semibold text-red-300 hover:text-white">Esqueceu-se?</Link></div><div className="relative"><input id="login-password" name="password" type={visible?"text":"password"} enterKeyHint="go" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="A sua palavra-passe" className={`${input} pr-14`}/><button type="button" aria-label={visible?"Ocultar palavra-passe":"Mostrar palavra-passe"} onClick={()=>setVisible(!visible)} className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-gray-400 hover:text-white">{visible?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></div>
      <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e50914] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50">{loading?<><Loader2 size={18} className="animate-spin"/>A entrar...</>:<><LogIn size={18}/>Entrar</>}</button>
    </form><p className="mt-7 text-center text-sm text-gray-400">Ainda não tem conta? <Link href="/register" className="inline-flex items-center gap-1 font-bold text-red-300 hover:text-white">Criar conta <ArrowRight size={14}/></Link></p>
  </div>;
}

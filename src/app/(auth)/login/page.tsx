"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2, CheckCircle, AlertCircle, Zap, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, setAuthSession } from "@/lib/api";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [successMsg, setSuccessMsg] = useState("");

  const emailError = touched.email && form.email && !validateEmail(form.email) ? "Email inválido" : "";
  const passwordError = touched.password && form.password.length > 0 && form.password.length < 6 ? "Mínimo 6 caracteres" : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validateEmail(form.email)) { toast.error("Insira um email válido"); return; }
    setLoading(true);
    setSuccessMsg("");
    try {
      const data = await apiRequest<{ user: unknown; accessToken: string; refreshToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password, rememberMe: form.remember }),
      });
      setAuthSession(data);
      setSuccessMsg("Login realizado! Redirecionando...");
      toast.success("Bem-vindo de volta! 🎉");
      setTimeout(() => { window.location.href = "/admin/dashboard"; }, 600);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar sessão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Brand header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-[72px] h-[72px] bg-gradient-to-br from-[#E50914] to-[#800000] rounded-[20px] mb-5 shadow-[0_8px_32px_rgba(229,9,20,0.2)]">
          <Zap className="w-9 h-9 text-white fill-white" />
        </div>
        <h1 className="text-[26px] font-black tracking-tight text-white mb-1">Bem-vindo de volta</h1>
        <p className="text-gray-400 text-sm">Entre na sua conta e continue assistindo</p>
      </div>

      {/* Card */}
      <div className="bg-[#0C0C14] border border-[#1E1E2A] rounded-2xl p-6 shadow-xl">
        {/* Success */}
        {successMsg && (
          <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-300 font-medium">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email" required placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                className={`input-dark w-full pl-10 pr-10 py-2.5 text-sm rounded-xl ${
                  emailError ? "border-red-500/50" : form.email && validateEmail(form.email) ? "border-green-500/30" : ""
                }`}
              />
              {touched.email && form.email && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {validateEmail(form.email) ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                </div>
              )}
            </div>
            {emailError && <p className="mt-1 text-[11px] text-red-400">{emailError}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-400">Senha</label>
              <Link href="/forgot-password" className="text-[11px] text-red-400 hover:text-red-300 font-medium transition-colors">Esqueceu?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"} required placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                className={`input-dark w-full pl-10 pr-10 py-2.5 text-sm rounded-xl ${passwordError ? "border-red-500/50" : ""}`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && <p className="mt-1 text-[11px] text-red-400">{passwordError}</p>}
          </div>

          {/* Remember checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <input type="checkbox" className="sr-only"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })} />
              <div className={`w-[18px] h-[18px] rounded-md border-2 transition-all flex items-center justify-center ${
                form.remember ? "bg-[#E50914] border-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.3)]" : "border-[#2A2A35] bg-transparent group-hover:border-[#3A3A45]"
              }`}>
                {form.remember && <CheckCircle className="w-3 h-3 text-white fill-white" />}
              </div>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Lembrar-me neste dispositivo</span>
          </label>

          {/* Submit */}
          <button
            type="submit" disabled={loading || Boolean(successMsg)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#E50914] to-[#B00000] text-white font-bold rounded-xl hover:from-[#FF1A24] hover:to-[#C50000] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-[0_4px_20px_rgba(229,9,20,0.25)] hover:shadow-[0_6px_24px_rgba(229,9,20,0.35)] hover:-translate-y-0.5"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Entrando...</>
            ) : successMsg ? (
              <><CheckCircle className="w-4 h-4" />Redirecionando...</>
            ) : (
              <><LogIn className="w-4 h-4" />Entrar na conta</>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#1E1E2A]" />
          <span className="text-[11px] text-gray-600 font-medium">ou continue com</span>
          <div className="flex-1 h-px bg-[#1E1E2A]" />
        </div>

        {/* Social */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { name: "Google", icon: "G", className: "hover:border-blue-500/30 hover:bg-blue-500/5" },
            { name: "Facebook", icon: "f", className: "hover:border-blue-600/30 hover:bg-blue-600/5" },
            { name: "Apple", icon: "🍎", className: "hover:border-white/20 hover:bg-white/5" },
          ].map((p) => (
            <button key={p.name}
              className={`flex items-center justify-center gap-1.5 py-2.5 bg-[#111118] border border-[#2A2A35] rounded-xl transition-all text-sm font-bold text-white ${p.className}`}>
              <span className="text-sm">{p.icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center space-y-4">
        <p className="text-sm text-gray-500">
          Não tem conta?{" "}
          <Link href="/register" className="text-red-400 hover:text-red-300 font-semibold inline-flex items-center gap-1 transition-colors group">
            Criar conta grátis <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </p>

        {/* Demo */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#111118] border border-[#1E1E2A] rounded-xl">
          <span className="text-[10px] text-gray-500 font-mono">
            Demo: <span className="text-red-400 cursor-pointer hover:underline" onClick={() => { setForm((f) => ({ ...f, email: "admin@livesports.com", password: "admin123" })); setTouched({ email: true, password: true }); }}>admin@livesports.com / admin123</span>
          </span>
          <span className="text-[9px] text-gray-600">↑ click</span>
        </div>
      </div>
    </div>
  );
}
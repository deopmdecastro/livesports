"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, setAuthSession } from "@/lib/api";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { label: "8+ caracteres", ok: password.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Número", ok: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-red-500", "bg-yellow-500", "bg-green-500"];
  const labels = ["Fraca", "Média", "Forte"];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : "bg-[#2A2A2A]"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span key={c.label} className={`flex items-center gap-1 text-[10px] ${c.ok ? "text-green-400" : "text-gray-600"}`}>
              <CheckCircle className="w-2.5 h-2.5" />
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-[10px] font-bold ${colors[score - 1].replace("bg-", "text-")}`}>{labels[score - 1]}</span>
        )}
      </div>
    </div>
  );
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
    if (!validateEmail(form.email)) {
      toast.error("Insira um email válido");
      return;
    }
    setLoading(true);
    setSuccessMsg("");
    try {
      const data = await apiRequest<{ user: unknown; accessToken: string; refreshToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          rememberMe: form.remember,
        }),
      });
      setAuthSession(data);
      setSuccessMsg("Login realizado! Redirecionando...");
      toast.success("Bem-vindo de volta! 🎉");
      setTimeout(() => { window.location.href = "/admin/dashboard"; }, 800);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar sessão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#111118] border border-[#1E1E2A] rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#E50914] to-[#B00000] rounded-2xl mb-4 shadow-red">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-black font-heading text-white mb-1">Bem-vindo de volta</h1>
          <p className="text-gray-400 text-sm">Entre na sua conta LiveSports</p>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { name: "Google", icon: "G", color: "#4285F4" },
            { name: "Facebook", icon: "f", color: "#1877F2" },
            { name: "Apple", icon: "🍎", color: "#fff" },
          ].map((provider) => (
            <button
              key={provider.name}
              className="flex items-center justify-center gap-2 py-2.5 bg-[#1A1A22] border border-[#2A2A35] rounded-xl hover:bg-[#2A2A35] hover:border-[#E50914]/30 transition-all text-sm font-bold text-white group"
              title={`Entrar com ${provider.name}`}
            >
              <span className="text-sm">{provider.icon}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[#1E1E2A]" />
          <span className="text-xs text-gray-500 font-medium">ou continue com email</span>
          <div className="flex-1 h-px bg-[#1E1E2A]" />
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400 font-medium">{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                className={`input-dark w-full pl-10 pr-10 py-3 text-sm transition-all ${
                  emailError ? "border-red-500/60 focus:border-red-500" : form.email && validateEmail(form.email) ? "border-green-500/40" : ""
                }`}
              />
              {touched.email && form.email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validateEmail(form.email)
                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                    : <AlertCircle className="w-4 h-4 text-red-400" />
                  }
                </div>
              )}
            </div>
            {emailError && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{emailError}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                className={`input-dark w-full pl-10 pr-10 py-3 text-sm transition-all ${
                  passwordError ? "border-red-500/60" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{passwordError}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                />
                <div className={`w-4 h-4 rounded border transition-all ${form.remember ? "bg-[#E50914] border-[#E50914]" : "border-[#2A2A2A] bg-[#1A1A22]"} flex items-center justify-center`}>
                  {form.remember && <CheckCircle className="w-3 h-3 text-white fill-white" />}
                </div>
              </div>
              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Lembrar-me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-[#E50914] hover:text-red-400 transition-colors font-medium"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || Boolean(successMsg)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#E50914] to-[#B00000] text-white font-bold rounded-xl hover:from-[#FF1A24] hover:to-[#E50914] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-red hover:shadow-red-lg hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando...
              </>
            ) : successMsg ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Redirecionando...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar na conta
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Não tem conta?{" "}
          <Link href="/register" className="text-[#E50914] hover:text-red-400 font-semibold transition-colors">
            Criar conta grátis
          </Link>
        </p>

        {/* Demo credentials */}
        <div className="mt-5 p-3.5 bg-[#1A1A22] border border-[#2A2A35] rounded-xl">
          <p className="text-xs text-gray-400 text-center font-bold mb-1.5 uppercase tracking-wider">Demo Admin</p>
          <button
            type="button"
            onClick={() => {
              setForm((f) => ({ ...f, email: "admin@livesports.com", password: "admin123" }));
              setTouched({ email: true, password: true });
            }}
            className="w-full text-center text-xs text-gray-500 hover:text-[#E50914] transition-colors py-0.5 font-mono"
          >
            admin@livesports.com / admin123 <span className="text-[#E50914]">↑ clique para preencher</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, setAuthSession } from "@/lib/api";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", remember: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      toast.success("Login realizado com sucesso!");
      window.location.href = "/admin/dashboard";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel iniciar sessao.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black font-heading text-white mb-1">Bem-vindo de volta</h1>
          <p className="text-gray-400 text-sm">Entre na sua conta Live Sports</p>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { name: "Google", emoji: "🔵", bg: "#4285F4" },
            { name: "Facebook", emoji: "📘", bg: "#1877F2" },
            { name: "Apple", emoji: "🍎", bg: "#000000" },
          ].map((provider) => (
            <button
              key={provider.name}
              className="flex items-center justify-center gap-2 py-2.5 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg hover:bg-[#3A3A3A] transition-colors text-sm font-medium text-white"
            >
              <span>{provider.emoji}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[#2A2A2A]" />
          <span className="text-xs text-gray-500">ou continue com email</span>
          <div className="flex-1 h-px bg-[#2A2A2A]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="input-dark w-full pl-10 pr-4 py-3 text-sm"
              />
            </div>
          </div>

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
                className="input-dark w-full pl-10 pr-10 py-3 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#E50914]"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
              />
              <span className="text-sm text-gray-400">Lembrar-me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-[#E50914] hover:text-red-400 transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#E50914] text-white font-bold rounded-lg hover:bg-[#B00000] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Não tem conta?{" "}
          <Link href="/register" className="text-[#E50914] hover:text-red-400 font-semibold">
            Criar conta grátis
          </Link>
        </p>

        {/* Demo credentials */}
        <div className="mt-4 p-3 bg-[#2A2A2A] rounded-lg">
          <p className="text-xs text-gray-400 text-center mb-1 font-medium">Demo Admin</p>
          <p className="text-xs text-gray-500 text-center">admin@livesports.com / admin123</p>
        </div>
      </div>
    </div>
  );
}

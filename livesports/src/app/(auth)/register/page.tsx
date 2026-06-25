"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Globe, UserPlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const countries = [
  "Brasil", "Portugal", "Angola", "Cabo Verde", "Moçambique",
  "São Tomé e Príncipe", "Guiné-Bissau", "Timor-Leste", "Outro"
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "", country: "", accept: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("As senhas não coincidem!");
      return;
    }
    if (!form.accept) {
      toast.error("Aceite os termos de uso para continuar");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    toast.success("Conta criada com sucesso! Verifique o seu email.");
    window.location.href = "/login";
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black font-heading text-white mb-1">Criar Conta</h1>
          <p className="text-gray-400 text-sm">Registre-se gratuitamente e assista ao vivo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Seu nome completo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-dark w-full pl-10 pr-4 py-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
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
            <label className="block text-sm font-medium text-gray-300 mb-1.5">País</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="input-dark w-full pl-10 pr-4 py-3 text-sm appearance-none"
              >
                <option value="">Selecione seu país</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-dark w-full pl-10 pr-10 py-3 text-sm"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showConfirm ? "text" : "password"}
                required
                placeholder="Repita a senha"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="input-dark w-full pl-10 pr-10 py-3 text-sm"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 accent-[#E50914]"
              checked={form.accept}
              onChange={(e) => setForm({ ...form, accept: e.target.checked })}
            />
            <span className="text-sm text-gray-400">
              Aceito os{" "}
              <Link href="/terms" className="text-[#E50914] hover:underline">Termos de Uso</Link>
              {" "}e a{" "}
              <Link href="/privacy" className="text-[#E50914] hover:underline">Política de Privacidade</Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#E50914] text-white font-bold rounded-lg hover:bg-[#B00000] transition-all disabled:opacity-70"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Criando conta...</>
            ) : (
              <><UserPlus className="w-4 h-4" />Criar Conta Grátis</>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-[#E50914] hover:text-red-400 font-semibold">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

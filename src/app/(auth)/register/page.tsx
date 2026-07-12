"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Globe, UserPlus, Loader2, CheckCircle, ArrowRight, Zap, Shield, Tv } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/api";

const countries = [
  "Brasil", "Portugal", "Angola", "Cabo Verde", "Moçambique",
  "São Tomé e Príncipe", "Guiné-Bissau", "Timor-Leste", "Outro"
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { label: "8+ caracteres", ok: password.length >= 8 },
    { label: "Maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Número", ok: /\d/.test(password) },
    { label: "Especial", ok: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["bg-red-500", "bg-yellow-500", "bg-emerald-500", "bg-green-500"];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score-1] : "bg-[#2A2A2A]"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map(c => (
          <span key={c.label} className={`text-[10px] flex items-center gap-1 ${c.ok ? "text-green-400" : "text-gray-600"}`}>
            <CheckCircle className="w-2.5 h-2.5" /> {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "", country: "", accept: false
  });

  const passwordMismatch = form.confirm && form.password !== form.confirm;
  const canSubmit = form.name && form.email && form.password.length >= 8 && !passwordMismatch && form.accept;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordMismatch) { toast.error("As senhas não coincidem!"); return; }
    if (!form.accept) { toast.error("Aceite os termos para continuar"); return; }
    setLoading(true);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, country: form.country }),
      });
      toast.success("Conta criada com sucesso! Verifique o seu email.");
      setTimeout(() => { window.location.href = "/login"; }, 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[460px] mx-auto">
      {/* Brand */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center justify-center w-[72px] h-[72px] bg-gradient-to-br from-[#E50914] to-[#800000] rounded-[20px] mb-5 shadow-[0_8px_32px_rgba(229,9,20,0.2)]">
          <Zap className="w-9 h-9 text-white fill-white" />
        </div>
        <h1 className="text-[26px] font-black tracking-tight text-white mb-1">Criar Conta</h1>
        <p className="text-gray-400 text-sm">Registre-se e comece a assistir ao vivo</p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Tv, label: "Ao vivo HD", desc: "Sem travamentos" },
          { icon: Shield, label: "100% Grátis", desc: "Sem assinatura" },
          { icon: Zap, label: "Multi-esportes", desc: "Futebol, UFC, F1..." },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-[#0C0C14] border border-[#1E1E2A] rounded-xl p-3 text-center hover:border-red-500/20 transition-colors">
            <Icon className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <p className="text-[11px] font-bold text-white">{label}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bg-[#0C0C14] border border-[#1E1E2A] rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nome completo</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" required placeholder="Seu nome completo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-dark w-full pl-10 pr-4 py-2.5 text-sm rounded-xl" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="email" required placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-dark w-full pl-10 pr-4 py-2.5 text-sm rounded-xl" />
            </div>
          </div>

          {/* Country + ref code in one row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">País</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="input-dark w-full pl-10 pr-3 py-2.5 text-sm rounded-xl appearance-none">
                  <option value="">Selecione</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Código convite</label>
              <input type="text" placeholder="Opcional"
                className="input-dark w-full px-3 py-2.5 text-sm rounded-xl" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type={showPassword ? "text" : "password"} required minLength={8} placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-dark w-full pl-10 pr-10 py-2.5 text-sm rounded-xl" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={form.password} />
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type={showConfirm ? "text" : "password"} required placeholder="Repita a senha"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className={`input-dark w-full pl-10 pr-10 py-2.5 text-sm rounded-xl ${passwordMismatch ? "border-red-500/50" : form.confirm && !passwordMismatch ? "border-green-500/30" : ""}`} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordMismatch && <p className="mt-1 text-[11px] text-red-400">As senhas não coincidem</p>}
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
            <div className="relative mt-0.5">
              <input type="checkbox" className="sr-only"
                checked={form.accept}
                onChange={(e) => setForm({ ...form, accept: e.target.checked })} />
              <div className={`w-[18px] h-[18px] rounded-md border-2 transition-all flex items-center justify-center ${
                form.accept ? "bg-[#E50914] border-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.3)]" : "border-[#2A2A35] bg-transparent group-hover:border-[#3A3A45]"
              }`}>
                {form.accept && <CheckCircle className="w-3 h-3 text-white fill-white" />}
              </div>
            </div>
            <span className="text-xs text-gray-400 leading-relaxed">
              Aceito os{" "}
              <Link href="/terms" className="text-red-400 hover:text-red-300 font-medium">Termos de Uso</Link>
              {" "}e a{" "}
              <Link href="/privacy" className="text-red-400 hover:text-red-300 font-medium">Política de Privacidade</Link>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit" disabled={loading || !canSubmit}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#E50914] to-[#B00000] text-white font-bold rounded-xl hover:from-[#FF1A24] hover:to-[#C50000] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm shadow-[0_4px_20px_rgba(229,9,20,0.25)] hover:shadow-[0_6px_24px_rgba(229,9,20,0.35)] hover:-translate-y-0.5"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Criando conta...</>
            ) : (
              <><UserPlus className="w-4 h-4" />Criar Conta Grátis</>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Já tem conta?{" "}
        <Link href="/login" className="text-red-400 hover:text-red-300 font-semibold inline-flex items-center gap-1 transition-colors group">
          Entrar na conta <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </p>
    </div>
  );
}
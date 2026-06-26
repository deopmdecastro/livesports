"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ password: "", confirm: "" });

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-8">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-black text-white">Nova senha</h1>
          <p className="mt-2 text-sm text-gray-400">
            Defina uma nova senha para recuperar o acesso.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (form.password !== form.confirm) {
              toast.error("As senhas nao coincidem.");
              return;
            }
            toast.success("Senha atualizada com sucesso.");
          }}
        >
          {[
            { key: "password", label: "Senha", placeholder: "Minimo 8 caracteres" },
            { key: "confirm", label: "Confirmar senha", placeholder: "Repita a senha" },
          ].map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">{field.label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form[field.key as keyof typeof form]}
                  onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                  placeholder={field.placeholder}
                  className="input-dark w-full py-3 pl-10 pr-4 text-sm"
                />
              </div>
            </div>
          ))}
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E50914] py-3 font-bold text-white transition-colors hover:bg-[#B00000]">
            <Save className="h-4 w-4" />
            Salvar nova senha
          </button>
        </form>
        <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-[#E50914]">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}

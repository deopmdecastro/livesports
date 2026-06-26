"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-8">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-black text-white">Recuperar senha</h1>
          <p className="mt-2 text-sm text-gray-400">
            Informe o email da conta para receber instrucoes de recuperacao.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            toast.success("Email de recuperacao enviado.");
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                className="input-dark w-full py-3 pl-10 pr-4 text-sm"
              />
            </div>
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E50914] py-3 font-bold text-white transition-colors hover:bg-[#B00000]">
            <Send className="h-4 w-4" />
            Enviar instrucoes
          </button>
        </form>
      </div>
    </div>
  );
}

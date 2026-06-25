import Link from "next/link";
import { MailCheck } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E50914]/10 text-[#E50914]">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-2xl font-black text-white">Verifique seu email</h1>
        <p className="mt-3 text-sm text-gray-400">
          Enviamos um link de confirmacao. Depois de validar o email, voce podera acessar sua conta.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex rounded-lg bg-[#E50914] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#B00000]"
        >
          Ir para login
        </Link>
      </div>
    </div>
  );
}

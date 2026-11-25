import Link from "next/link";
import { ArrowLeft, CircleAlert } from "lucide-react";
export default function ForgotPasswordPage() {
  return <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#10111b] p-7 sm:p-9"><CircleAlert className="h-8 w-8 text-red-400"/><h1 className="mt-5 text-2xl font-black">Recuperar palavra-passe</h1><p className="mt-3 text-sm leading-6 text-gray-400">A recuperação por email ainda não está disponível. Se precisar de ajuda para aceder à conta, contacte o suporte da plataforma.</p><Link href="/login" className="mt-7 inline-flex items-center gap-2 font-semibold text-red-300 hover:text-white"><ArrowLeft size={16}/>Voltar ao login</Link></div>;
}

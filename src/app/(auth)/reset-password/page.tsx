import Link from "next/link";
export default function ResetPasswordPage() {
  return <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#10111b] p-7 sm:p-9"><h1 className="text-2xl font-black">Reposição indisponível</h1><p className="mt-3 text-sm leading-6 text-gray-400">A reposição de palavra-passe por email ainda não está configurada. Contacte o suporte para obter ajuda.</p><Link href="/login" className="mt-6 inline-flex font-semibold text-red-300 hover:text-white">Voltar ao login</Link></div>;
}

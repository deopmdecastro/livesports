import Link from "next/link";
export default function VerifyEmailPage() {
  return <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#10111b] p-7 sm:p-9"><h1 className="text-2xl font-black">Verificação de email</h1><p className="mt-3 text-sm leading-6 text-gray-400">A verificação de email ainda não está disponível. Não foi enviado nenhum link de confirmação.</p><Link href="/login" className="mt-6 inline-flex font-semibold text-red-300 hover:text-white">Ir para login</Link></div>;
}

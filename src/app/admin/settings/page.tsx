"use client";
import { useState } from "react";
import { Save, Globe, Mail, Shield, Palette, Bell, Database } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [general, setGeneral] = useState({ siteName: "Live Sports", siteUrl: "https://livesports.com", description: "A melhor plataforma de streaming esportivo", email: "admin@livesports.com", phone: "+55 11 9999-9999" });
  const [security, setSecurity] = useState({ requireEmail: true, allowGoogle: true, allowFacebook: true, twoFactorDefault: false, maxLoginAttempts: 5, sessionTimeout: 24 });
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-lg font-bold text-white">Configurações</h2>
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2A2A2A] flex items-center gap-2"><Globe className="w-4 h-4 text-[#E50914]"/><h3 className="font-semibold text-white text-sm">Configurações Gerais</h3></div>
        <div className="p-4 space-y-4">
          {[{label:"Nome do Site",key:"siteName",placeholder:"Live Sports"},{label:"URL do Site",key:"siteUrl",placeholder:"https://"},{label:"Descrição",key:"description",placeholder:"Descrição..."},{label:"Email",key:"email",placeholder:"admin@..."},{label:"Telefone",key:"phone",placeholder:"+55"}].map(({label,key,placeholder})=>(
            <div key={key}><label className="block text-xs font-medium text-gray-300 mb-1.5">{label}</label><input value={general[key as keyof typeof general] as string} onChange={e=>setGeneral({...general,[key]:e.target.value})} className="input-dark w-full px-3 py-2.5 text-sm" placeholder={placeholder}/></div>
          ))}
        </div>
      </div>
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2A2A2A] flex items-center gap-2"><Shield className="w-4 h-4 text-[#E50914]"/><h3 className="font-semibold text-white text-sm">Segurança</h3></div>
        <div className="p-4 space-y-4">
          {[{label:"Verificação de email obrigatória",key:"requireEmail"},{label:"Login com Google",key:"allowGoogle"},{label:"Login com Facebook",key:"allowFacebook"},{label:"2FA por padrão",key:"twoFactorDefault"}].map(({label,key})=>(
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={security[key as keyof typeof security] as boolean} onChange={e=>setSecurity({...security,[key]:e.target.checked})} className="sr-only peer"/>
                <div className="w-9 h-5 bg-[#2A2A2A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E50914]"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
      <button onClick={()=>toast.success("Configurações salvas!")} className="flex items-center gap-2 px-6 py-2.5 bg-[#E50914] text-white font-bold rounded-lg hover:bg-[#B00000]"><Save className="w-4 h-4"/>Salvar Configurações</button>
    </div>
  );
}

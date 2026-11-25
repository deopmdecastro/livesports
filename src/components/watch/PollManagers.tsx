"use client";
import { useEffect, useState } from 'react';
import { apiRequest, getStoredUser } from '@/lib/api';
type Manager={id:string;name:string;email:string};
export default function PollManagers({liveId}:{liveId:string}){
 const [isAdmin,setIsAdmin]=useState(false);const [items,setItems]=useState<Manager[]>([]);const [email,setEmail]=useState('');const [notice,setNotice]=useState('');
 useEffect(()=>{const u=getStoredUser<{role:string}>();const ok=!!u&&['admin','super_admin'].includes(u.role);setIsAdmin(ok);if(ok)apiRequest<Manager[]>(`/polls/${encodeURIComponent(liveId)}/managers`).then(setItems).catch(()=>setNotice('Não foi possível carregar criadores.'))},[liveId]);
 async function add(e:React.FormEvent){e.preventDefault();try{const m=await apiRequest<Manager>(`/polls/${encodeURIComponent(liveId)}/managers`,{method:'POST',retries:0,body:JSON.stringify({email})});setItems(old=>old.some(x=>x.id===m.id)?old:[...old,m]);setEmail('');setNotice('Criador autorizado a gerir as enquetes desta live.')}catch(e){setNotice(e instanceof Error?e.message:'Não foi possível atribuir.')}}
 async function remove(id:string){try{await apiRequest(`/polls/${encodeURIComponent(liveId)}/managers/${encodeURIComponent(id)}`,{method:'DELETE',retries:0});setItems(old=>old.filter(m=>m.id!==id))}catch{setNotice('Não foi possível remover.') }}
 if(!isAdmin)return null;
 return <section className="rounded-xl border border-white/10 bg-white/[.02] p-3"><h4 className="text-sm font-bold">Criadores autorizados</h4><p className="mt-1 text-xs text-gray-400">Autorize um criador ativo para gerir as enquetes desta live.</p><form onSubmit={add} className="mt-3 flex gap-2"><input type="email" aria-label="Email do criador" required placeholder="Email do criador" value={email} onChange={e=>setEmail(e.target.value)} className="input-dark min-w-0 flex-1 rounded-lg p-2 text-sm"/><button className="rounded-lg bg-red-600 px-3 text-xs font-bold">Atribuir</button></form>{items.map(m=><div key={m.id} className="mt-2 flex justify-between gap-3 text-xs text-gray-300"><span>{m.name} · {m.email}</span><button onClick={()=>void remove(m.id)} className="text-red-300">Remover</button></div>)}{notice&&<p role="status" className="mt-2 text-xs text-gray-300">{notice}</p>}</section>
}

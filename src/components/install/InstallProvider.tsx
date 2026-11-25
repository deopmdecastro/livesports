"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
interface InstallContextValue {
  canPrompt: boolean;
  installed: boolean;
  install: () => Promise<void>;
}
const InstallContext = createContext<InstallContextValue>({ canPrompt: false, installed: false, install: async () => {} });
export function useInstallApp() { return useContext(InstallContext); }

export default function InstallProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js").catch(() => { /* Site still works without offline fallback. */ });
    }
    const display = window.matchMedia("(display-mode: standalone)");
    const sync = () => setInstalled(display.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const onPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    sync();
    display.addEventListener("change", sync);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { display.removeEventListener("change", sync); window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  const install = async () => {
    if (!prompt) return;
    try { await prompt.prompt(); await prompt.userChoice; } catch { /* Browser can reject a consumed prompt. */ }
    finally { setPrompt(null); }
  };
  return <InstallContext.Provider value={{ canPrompt: !!prompt, installed, install }}>{children}</InstallContext.Provider>;
}

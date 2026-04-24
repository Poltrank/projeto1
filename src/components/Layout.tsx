import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, User as UserIcon } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout, user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased">
      <header className="bg-slate-900 text-white pt-10 pb-6 px-6 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto w-full">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-emerald-500 italic uppercase">
              Motorista Finanças
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
              Jaraguá do Sul • SC
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && profile && (
              <div className="text-right mr-2 hidden sm:block">
                <p className="text-xs font-bold leading-none">{profile.nickname}</p>
                <p className="text-[10px] text-slate-500 italic uppercase">{profile.car}</p>
              </div>
            )}
            {user && (
              <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-slate-900 border border-white/20 uppercase text-xs">
                {profile?.nickname.substring(0, 2) || "?"}
              </div>
            )}
            {user && (
              <button 
                onClick={() => logout()}
                className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white max-w-lg mx-auto w-full shadow-inner pb-32">
        {children}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-3 bg-slate-900 text-white text-center border-t border-white/10 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <p className="text-[10px] opacity-70 leading-tight">
          Site Gratuito desenvolvido por Motorista de Jaraguá do Sul<br/>
          <span className="font-bold">Suporte: (47) 97400-8115</span>
        </p>
      </footer>
    </div>
  );
}

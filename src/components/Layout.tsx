import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import { SettingsModal } from "./SettingsModal";

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout, resetProfile, user, profile, isAdmin } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const handleReset = async () => {
    const confirmed = window.confirm("CUIDADO: Isso apagará TODOS os seus lançamentos, seu perfil e seu ranking. Você precisará se cadastrar novamente. Confirma?");
    if (confirmed) {
      try {
        await resetProfile();
        alert("Sistema Resetado com Sucesso! Faça o cadastro novamente.");
      } catch (err) {
        console.error("Reset error:", err);
        alert("Erro ao resetar. Tente sair e entrar novamente.");
      }
    }
  };

  const isOwner = user?.email === 'cassiomatsuoka@gmail.com' || 
                  user?.email === 'adm@motoristafinancas.com' || 
                  user?.email === '47974008115@motoristapro.com' || 
                  user?.email === 'adm@motoristapro.com';

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
          <div className="flex items-center gap-2">
            {isOwner && (
              <button 
                onClick={handleReset}
                className="px-2 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all mr-2"
              >
                Reset System
              </button>
            )}
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
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-500 hover:text-emerald-400 transition-colors"
                title="Configurações"
              >
                <Settings size={18} />
              </button>
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

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <main className="flex-1 bg-white max-w-lg mx-auto w-full shadow-inner pb-32">
        {children}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-3 bg-slate-900 text-white text-center border-t border-white/10 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <p className="text-[10px] opacity-70 leading-tight">
          Site Gratuito desenvolvido por Motorista de Jaraguá do Sul<br/>
          <a 
            href="https://wa.me/5547974008115" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-bold hover:text-emerald-500 transition-colors"
          >
            Suporte: (47) 97400-8115
          </a>
        </p>
      </footer>
    </div>
  );
}

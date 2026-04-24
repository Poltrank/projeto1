/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { RegistrationForm } from './components/RegistrationForm';
import { Dashboard } from './components/Dashboard';
import { EntryActions } from './components/EntryActions';
import { Ranking } from './components/Ranking';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, isAdmin, signInPhone, signUpPhone } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const cleanPhone = phone.trim();
    const isAdmLogin = cleanPhone.toUpperCase() === 'ADM';
    if (!isAdmLogin && !cleanPhone.includes('@') && cleanPhone.replace(/\D/g, '').length < 10) {
      setAuthError("Número de celular inválido. Use o formato com DDD ou um email válido.");
      return;
    }
    if (password.length < 6) {
      setAuthError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await signInPhone(cleanPhone, password);
      } else {
        if (isAdmLogin) throw new Error("Ação não permitida para este usuário");
        await signUpPhone(cleanPhone, password);
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found') setAuthError("Usuário não encontrado. Verifique o número ou crie uma conta.");
      else if (error.code === 'auth/wrong-password') setAuthError("Senha incorreta. Tente novamente.");
      else if (error.code === 'auth/email-already-in-use') setAuthError("Este acesso já está cadastrado.");
      else if (error.code === 'auth/operation-not-allowed') setAuthError("O login por senha ainda não foi habilitado no Firebase.");
      else if (error.code === 'auth/invalid-email') setAuthError("O formato do identificador é inválido.");
      else setAuthError("Erro na autenticação: " + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-emerald-500 font-black uppercase tracking-[0.2em] text-sm animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-12 mb-10 w-full max-w-sm"
        >
          <div className="w-20 h-20 bg-emerald-500 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20 rotate-12">
            <LogIn size={40} className="text-slate-950 -rotate-12" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">MOTORISTA FINANÇAS</h1>
          <p className="text-slate-400 text-lg font-medium px-4">O faturamento dos parceiros de Jaraguá do Sul.</p>
        </motion.div>

        <form onSubmit={handlePhoneAuth} className="w-full max-w-sm space-y-4 bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">
            {authMode === 'login' ? 'Identifique-se' : 'Criar Conta'}
          </h2>

          {authError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs font-bold mb-4"
            >
              {authError}
            </motion.div>
          )}
          
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1">WhatsApp / Celular</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(47) 99999-9999"
                className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-slate-950 rounded-2xl font-black text-xl transition-transform active:scale-95 shadow-xl shadow-emerald-500/10"
          >
            {authLoading ? 'PROCESSANDO...' : authMode === 'login' ? 'ENTRAR AGORA' : 'FINALIZAR CADASTRO'}
          </button>

          <button
            type="button"
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="text-emerald-500 text-sm font-bold uppercase tracking-widest mt-4"
          >
            {authMode === 'login' ? 'Não tem conta? Criar conta' : 'Já tenho conta. Fazer Login'}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-sm">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">Jaraguá do Sul • SC</p>
        </div>
      </div>
    );
  }

  if (!profile && !isAdmin) {
    return (
      <Layout>
        <div className="p-4">
          <RegistrationForm />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {profile && <Dashboard profile={profile} />}
      {!isAdmin && <EntryActions />}
      <Ranking />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

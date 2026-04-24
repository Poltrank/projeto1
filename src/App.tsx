/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { RegistrationForm } from './components/RegistrationForm';
import { Dashboard } from './components/Dashboard';
import { EntryActions } from './components/EntryActions';
import { Ranking } from './components/Ranking';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, signIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-green-500 font-black uppercase tracking-[0.2em] text-sm animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12"
        >
          <div className="w-24 h-24 bg-green-500 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/20 rotate-12">
            <LogIn size={48} className="text-slate-950 -rotate-12" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">MOTORISTA PRO</h1>
          <p className="text-slate-400 text-xl font-medium px-4">Economize, Lucre e Domine o Ranking da sua cidade.</p>
        </motion.div>

        <button
          onClick={() => signIn()}
          className="w-full max-w-xs py-5 bg-white text-slate-950 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          ENTRAR COM GOOGLE
        </button>
        
        <p className="mt-8 text-slate-500 text-xs font-mono">Gratuito • Seguro • Em Tempo Real</p>
      </div>
    );
  }

  if (!profile) {
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
      <Dashboard profile={profile} />
      <EntryActions />
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

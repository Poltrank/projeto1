import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "./Modal";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const EXPENSE_CATEGORIES = ["Alimentação", "Combustível", "Manutenção", "Outros"];
const INCOME_CATEGORIES = ["99", "Uber", "Muvi", "Zopp", "Indriver", "Particular"];

export function EntryActions() {
  const { user, profile, recalculateTotals } = useAuth();
  const [modalType, setModalType] = useState<'income' | 'expense' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const category = formData.get('category') as string;
    const dateStr = formData.get('date') as string;
    const type = modalType!;

    try {
      // 1. Save Transaction
      const transRef = collection(db, 'users', user.uid, 'transactions');
      await addDoc(transRef, {
        userId: user.uid,
        type,
        category,
        amount,
        date: dateStr,
        createdAt: serverTimestamp(),
      });

      // 2. Recalculate all profile/ranking totals dynamically based on absolute database status
      await recalculateTotals();

      setModalType(null);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar lançamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-3 px-6 mb-6">
        <button 
          onClick={() => setModalType('income')}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
        >
          <span className="text-xl">+ Lucro</span>
          <span className="text-[10px] uppercase opacity-80 tracking-widest">Uber, 99, Outros</span>
        </button>
        <button 
          onClick={() => setModalType('expense')}
          className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-5 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
        >
          <span className="text-xl">- Gasto</span>
          <span className="text-[10px] uppercase opacity-80 tracking-widest">Combustível, Manut.</span>
        </button>
      </div>

      <Modal 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)} 
        title={modalType === 'income' ? "Novo Lucro" : "Novo Gasto"}
        variant={modalType || 'default'}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Data do Lançamento</label>
            <input 
              name="date"
              type="date" 
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Valor do Lançamento</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">R$</span>
              <input 
                name="amount"
                type="number" 
                step="0.01" 
                required
                className="w-full bg-slate-800 border border-slate-700 pl-14 p-5 rounded-2xl text-4xl font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Origem do Faturamento</label>
            <div className="grid grid-cols-2 gap-2">
              {(modalType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                <label key={cat} className="relative cursor-pointer group">
                  <input 
                    type="radio" 
                    name="category" 
                    value={cat} 
                    required 
                    className="peer sr-only" 
                  />
                  <div className={`
                    p-4 text-center rounded-xl border transition-all text-sm font-black uppercase tracking-wider
                    bg-slate-800/50 border-slate-700 text-slate-400
                    hover:border-slate-500 hover:text-slate-300
                    ${modalType === 'income' 
                      ? 'peer-checked:bg-emerald-500 peer-checked:border-emerald-500 peer-checked:text-white' 
                      : 'peer-checked:bg-rose-500 peer-checked:border-rose-500 peer-checked:text-white'
                    }
                  `}>
                    {cat}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
              modalType === 'income' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
            }`}
          >
            {loading ? "Processando..." : "Confirmar Agora"}
          </button>
        </form>
      </Modal>
    </>
  );
}

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "./Modal";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, getDocs, orderBy, limit } from "firebase/firestore";
import { Pencil, History } from "lucide-react";
import { EditTransactionModal, Transaction } from "./EditTransactionModal";
import { formatCurrency } from "../lib/utils";

const EXPENSE_CATEGORIES = ["Alimentação", "Combustível", "Manutenção", "Outros"];
const INCOME_CATEGORIES = ["99", "Uber", "Muvi", "Zopp", "Indriver", "Particular", "Outros"];

export function EntryActions() {
  const { user, profile, recalculateTotals } = useAuth();
  const [modalType, setModalType] = useState<'income' | 'expense' | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const loadRecent = async () => {
    if (!user) return;
    try {
      const transRef = collection(db, 'users', user.uid, 'transactions');
      const q = query(transRef, orderBy('date', 'desc'), limit(5));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Transaction[];
      setRecentTransactions(items);
    } catch (e) {
      console.error("Erro ao carregar recentes:", e);
    }
  };

  useEffect(() => {
    loadRecent();
  }, [user]);

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
      await loadRecent();

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
      <div className="flex gap-3 px-6 mb-4">
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

      {recentTransactions.length > 0 && (
        <div className="px-6 mb-6">
          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History size={16} className="text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">
                  Últimos Lançamentos
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Clique no lápis para editar data/valor
              </span>
            </div>
            <div className="space-y-2">
              {recentTransactions.map((t) => {
                const cleanDate = t.date ? t.date.split('T')[0] : "";
                const isIncome = t.type === 'income';
                return (
                  <div
                    key={t.id}
                    onClick={() => setEditingTransaction(t)}
                    className="flex items-center justify-between p-3 bg-slate-800/60 hover:bg-slate-800 rounded-2xl border border-slate-700/60 cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-8 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                          {t.category || "Outros"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          {cleanDate.split('-').reverse().join('/')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`text-sm font-black ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTransaction(t);
                        }}
                        className="p-2 bg-slate-700/60 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-xl transition-all"
                        title="Editar lançamento (Data, Valor ou Categoria)"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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

      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        onSuccess={loadRecent}
      />
    </>
  );
}

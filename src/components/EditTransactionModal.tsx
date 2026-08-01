import React, { useState, useEffect } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "./Modal";
import { Trash2, Save, Calendar, Tag, DollarSign } from "lucide-react";

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES = ["Alimentação", "Combustível", "Manutenção", "Outros"];
const INCOME_CATEGORIES = ["99", "Uber", "Muvi", "Zopp", "Indriver", "Particular", "Outros"];

export function EditTransactionModal({ isOpen, onClose, transaction, onSuccess }: EditTransactionModalProps) {
  const { user, recalculateTotals } = useAuth();
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (transaction) {
      const cleanDate = transaction.date ? transaction.date.split('T')[0] : "";
      setDate(cleanDate);
      setAmount(transaction.amount ? transaction.amount.toString() : "");
      setCategory(transaction.category || "");
    }
  }, [transaction]);

  if (!transaction) return null;

  const categories = transaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const displayCategories = categories.includes(category)
    ? categories
    : category
      ? [category, ...categories]
      : categories;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transaction) return;

    if (!date) {
      alert("Por favor, selecione a data.");
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Por favor, informe um valor válido.");
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, 'users', user.uid, 'transactions', transaction.id);
      await updateDoc(docRef, {
        date: date,
        amount: numAmount,
        category: category || "Outros",
      });

      await recalculateTotals();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Erro ao atualizar lançamento:", error);
      alert("Erro ao atualizar o lançamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !transaction) return;
    const confirmed = window.confirm(
      `Deseja realmente apagar este ${
        transaction.type === 'income' ? 'lucro' : 'gasto'
      } de R$ ${transaction.amount.toFixed(2)} do dia ${date}?`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const docRef = doc(db, 'users', user.uid, 'transactions', transaction.id);
      await deleteDoc(docRef);

      await recalculateTotals();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Erro ao excluir lançamento:", error);
      alert("Erro ao excluir o lançamento. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction.type === 'income' ? "Editar Lucro" : "Editar Gasto"}
      variant={transaction.type === 'income' ? 'income' : 'expense'}
    >
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest flex items-center gap-1.5">
            <Calendar size={14} className="text-emerald-400" />
            Data do Lançamento
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            💡 Você pode corrigir a data caso tenha digitado um dia errado.
          </p>
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest flex items-center gap-1.5">
            <DollarSign size={14} className="text-emerald-400" />
            Valor (R$)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 pl-14 p-5 rounded-2xl text-3xl font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="0,00"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest flex items-center gap-1.5">
            <Tag size={14} className="text-emerald-400" />
            Categoria
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {displayCategories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`p-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                  category === cat
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <button
            type="submit"
            disabled={loading || deleting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-wider"
          >
            <Save size={18} />
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || deleting}
            className="w-full bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 text-rose-400 border border-rose-500/20 font-black py-3 rounded-xl flex items-center justify-center gap-2 uppercase text-xs tracking-wider transition-colors"
          >
            <Trash2 size={16} />
            {deleting ? "Excluindo..." : "Excluir Lançamento"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

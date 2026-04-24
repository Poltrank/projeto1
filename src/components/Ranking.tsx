import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { RankingEntry } from "../types";
import { formatCurrency } from "../lib/utils";
import { Trophy, Car, Zap, Flame, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";

export function Ranking() {
  const { user, isAdmin, deleteUser } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "ranking"),
      orderBy("weeklyTotal", "desc"),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as RankingEntry);
      setEntries(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-mono italic animate-pulse">Carregando Ranking...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="text-emerald-500" size={24} />
          Ranking Local
        </h3>
        <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Semana Ativa</span>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center justify-between p-4 bg-slate-50 rounded-2xl border ${
              entry.userId === user?.uid ? 'ring-2 ring-emerald-200 border-emerald-200' : 'border-slate-100'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className={`font-black text-lg ${
                index === 0 ? 'text-emerald-500' : 
                index === 1 ? 'text-slate-400' :
                index === 2 ? 'text-amber-700' :
                'text-slate-300'
              }`}>
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <div>
                <p className="font-bold text-slate-800 leading-tight flex items-center gap-1">
                  {entry.nickname}
                  {entry.carType === 'Elétrico' && <Zap size={12} className="text-emerald-500 fill-emerald-500" />}
                </p>
                <p className="text-xs text-slate-500 font-medium italic">
                  {entry.car} • {entry.carType}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-emerald-600 text-lg">
                {formatCurrency(entry.weeklyTotal)}
              </span>
              {isAdmin && (
                <button
                  onClick={async () => {
                    if (confirm(`Excluir ${entry.nickname}?`)) {
                      try {
                        await deleteUser(entry.userId);
                      } catch (e: any) {
                        alert(e.message);
                      }
                    }
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {entries.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 font-medium italic">
            Aguardando primeiros dados...
          </div>
        )}
      </div>
    </div>
  );
}

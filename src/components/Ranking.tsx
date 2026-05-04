import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { RankingEntry } from "../types";
import { formatCurrency } from "../lib/utils";
import { Trophy, Zap, Trash2, Calendar, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { format, startOfWeek, endOfWeek, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Ranking() {
  const { user, isAdmin, deleteUser, clearUserHistory } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    setLoading(true);
    const orderField = view === 'weekly' ? 'weeklyGross' : 'monthlyGross';
    const q = query(
      collection(db, "ranking"),
      orderBy(orderField, "desc"),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as RankingEntry);
      setEntries(data);
      setLoading(false);
    });
  }, [view]);

  const getWeekRange = () => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    
    return `${format(start, "dd")} a ${format(end, "dd")} de ${format(now, "MMMM", { locale: ptBR })}`;
  };

  const getMonthName = () => {
    return format(new Date(), "MMMM", { locale: ptBR });
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <Trophy className="text-emerald-500" size={24} />
            Ranking Local
          </h3>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setView('weekly')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'weekly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'
              }`}
            >
              Semanal
            </button>
            <button 
              onClick={() => setView('monthly')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'monthly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'
              }`}
            >
              Mensal
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <Calendar size={14} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
            {view === 'weekly' ? `Semana (Faturamento Bruto): ${getWeekRange()}` : `Mês (Faturamento Bruto): ${getMonthName()}`}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-mono italic animate-pulse">Carregando Ranking...</div>
        ) : entries.map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center justify-between p-4 bg-slate-50 rounded-2xl border ${
              entry.userId === user?.uid ? 'ring-2 ring-emerald-200 border-emerald-200 bg-white' : 'border-slate-100'
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
                <p className="font-bold text-slate-800 leading-tight flex items-center gap-2">
                  {entry.nickname}
                  {entry.topCategory && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border shadow-sm ${
                      entry.topCategory === 'Particular' 
                        ? 'bg-blue-500 text-white border-blue-400' 
                        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      {entry.topCategory}
                    </span>
                  )}
                  {entry.carType === 'Elétrico' && <Zap size={12} className="text-emerald-500 fill-emerald-500" />}
                </p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  {entry.car} • {entry.carType}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-emerald-600 text-lg tabular-nums">
                {formatCurrency(view === 'weekly' ? (entry.weeklyGross || 0) : (entry.monthlyGross || 0))}
              </span>
              {isAdmin && (
                <div className="flex items-center gap-1 border-l border-slate-200 ml-2 pl-2">
                  <button
                    onClick={async () => {
                      if (confirm(`ZERAR histórico de ${entry.nickname}? (Transações e totais serão apagados, o perfil permanece)`)) {
                        try {
                          await clearUserHistory(entry.userId);
                        } catch (e: any) {
                          alert(e.message);
                        }
                      }
                    }}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Zerar Histórico"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`EXCLUIR PERFIL de ${entry.nickname}? (Tudo será apagado e o usuário precisará se cadastrar de novo)`)) {
                        try {
                          await deleteUser(entry.userId);
                        } catch (e: any) {
                          alert(e.message);
                        }
                      }
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Excluir Perfil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {!loading && entries.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[10px]">
            Aguardando primeiros dados...
          </div>
        )}
      </div>
    </div>
  );
}

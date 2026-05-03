import React, { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../lib/utils";
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachMonthOfInterval, 
  startOfYear, 
  isSameMonth,
  differenceInDays,
  isBefore,
  isAfter,
  startOfDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp, Calendar, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

interface MonthSummary {
  month: Date;
  label: string;
  income: number;
  expense: number;
  fixedCost: number;
  net: number;
  transactions: Transaction[];
}

export function MonthlyHistory() {
  const { user, profile } = useAuth();
  const [summaries, setSummaries] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user || !profile) return;
      
      try {
        const transRef = collection(db, 'users', user.uid, 'transactions');
        const q = query(transRef, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const allTransactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];

        const now = new Date();
        const start = startOfYear(now);
        const months = eachMonthOfInterval({ start, end: now });
        
        const registrationDate = profile.createdAt ? startOfDay(new Date(profile.createdAt)) : startOfDay(now);
        const insuranceDaily = (profile.monthlyInsurance || 0) / 30;
        const vehicleDaily = (profile.monthlyVehicleCost || 0) / 30;
        const internetDaily = (profile.monthlyInternet || 0) / 30;
        const tiresDaily = (profile.monthlyTires || 0) / 30;
        const maintenanceDaily = (profile.monthlyMaintenance || 0) / 30;
        const electricityDaily = profile.carType === 'Elétrico' ? (profile.lastElectricityBill || 0) / 30 : 0;
        const dailyFixedCost = insuranceDaily + vehicleDaily + internetDaily + tiresDaily + maintenanceDaily + electricityDaily;

        const monthSummaries: MonthSummary[] = months.reverse().map(monthDate => {
          const mTransactions = allTransactions.filter(t => isSameMonth(parseISO(t.date), monthDate));
          
          const income = mTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
          const expense = mTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
          
          // Calculate Fixed Cost for this month
          // Only count from the later of (start of month) or (registration date)
          const mStart = startOfMonth(monthDate);
          const mEnd = endOfMonth(monthDate);
          const effectiveStart = registrationDate > mStart && registrationDate <= mEnd ? registrationDate : mStart;
          
          let daysCounted = 0;
          if (!isBefore(now, mStart)) { // Month is in past or present
            const endCounting = isBefore(now, mEnd) ? now : mEnd;
            if (!isAfter(effectiveStart, endCounting)) {
              daysCounted = differenceInDays(endCounting, effectiveStart) + 1;
            }
          }

          // Fixed cost only applies if there was ANY activity in that month (income or expense)
          const hasMonthActivity = mTransactions.length > 0;
          const fixedCost = hasMonthActivity ? daysCounted * dailyFixedCost : 0;
          
          const net = (income - expense) - fixedCost;

          return {
            month: monthDate,
            label: format(monthDate, "MMMM yyyy", { locale: ptBR }),
            income,
            expense,
            fixedCost,
            net,
            transactions: mTransactions
          };
        });

        setSummaries(monthSummaries);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Histórico Mensal</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Seu desempenho mês a mês</p>
      </header>

      {summaries.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum lançamento encontrado</p>
        </div>
      )}

      <div className="space-y-4">
        {summaries.map((summary) => {
          const monthKey = summary.label;
          const isExpanded = expandedMonth === monthKey;
          const hasNet = summary.income > 0 || summary.expense > 0;

          if (!hasNet && summary.month.getMonth() !== new Date().getMonth()) {
            return null; // Don't show empty future/past months
          }

          return (
            <motion.div 
              key={monthKey}
              layout
              className={`overflow-hidden border rounded-3xl transition-all ${
                isExpanded ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <button 
                onClick={() => setExpandedMonth(isExpanded ? null : monthKey)}
                className="w-full p-5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl transition-colors ${
                    isExpanded ? 'bg-emerald-500 text-slate-950' : 'bg-slate-50 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                  }`}>
                    <Calendar size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-black uppercase tracking-tight transition-colors ${
                      isExpanded ? 'text-white' : 'text-slate-800'
                    }`}>
                      {summary.label}
                    </h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      isExpanded ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      {summary.transactions.length} LANÇAMENTOS
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className={`text-xl font-black tabular-nums transition-colors ${
                      isExpanded ? 'text-emerald-400' : 'text-slate-900'
                    }`}>
                      {formatCurrency(summary.net)}
                    </p>
                  </div>
                  <div className={isExpanded ? 'text-white' : 'text-slate-300'}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-6 border-t border-white/5"
                  >
                    <div className="grid grid-cols-3 gap-2 mt-6 mb-8">
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-1.5 mb-1 text-emerald-400">
                          <TrendingUp size={12} />
                          <p className="text-[9px] font-black uppercase tracking-widest">Bruto</p>
                        </div>
                        <p className="text-sm font-black text-white">{formatCurrency(summary.income)}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-1.5 mb-1 text-rose-400">
                          <TrendingDown size={12} />
                          <p className="text-[9px] font-black uppercase tracking-widest">Gasto</p>
                        </div>
                        <p className="text-sm font-black text-white">{formatCurrency(summary.expense)}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-1.5 mb-1 text-blue-400">
                          <PiggyBank size={12} />
                          <p className="text-[9px] font-black uppercase tracking-widest">Fixos</p>
                        </div>
                        <p className="text-sm font-black text-white">{formatCurrency(summary.fixedCost)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Detalhes do Mês</p>
                       {summary.transactions.map((t) => (
                         <div key={t.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div>
                               <p className="text-xs font-bold text-white uppercase tracking-tight">{t.category}</p>
                               <p className="text-[9px] text-slate-500 font-bold uppercase">{format(parseISO(t.date), "dd/MM 'às' HH:mm", { locale: ptBR })}</p>
                            </div>
                            <p className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                               {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                            </p>
                         </div>
                       ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      
      <div className="pt-8 pb-12 opacity-30 text-center">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fim dos Lançamentos</p>
      </div>
    </div>
  );
}

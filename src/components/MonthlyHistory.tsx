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
  startOfDay,
  getDaysInMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  max,
  min
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp, Calendar, TrendingUp, TrendingDown, PiggyBank, PieChart as PieChartIcon, List as ListIcon, Activity, CalendarDays, Pencil } from "lucide-react";
import { EditTransactionModal } from "./EditTransactionModal";

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
  dailyFixedCost: number;
  net: number;
  transactions: Transaction[];
}

export function MonthlyHistory() {
  const { user, profile } = useAuth();
  const [summaries, setSummaries] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'summary' | 'daily' | 'weekly'>('list');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const loadData = async () => {
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

        const monthSummaries: MonthSummary[] = months.reverse().map(monthDate => {
          const mTransactions = allTransactions.filter(t => isSameMonth(parseISO(t.date), monthDate));
          
          const income = mTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
          const expense = mTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
          
          const daysInThisMonth = getDaysInMonth(monthDate);
          const insuranceDaily = (profile.monthlyInsurance || 0) / daysInThisMonth;
          const vehicleDaily = (profile.monthlyVehicleCost || 0) / daysInThisMonth;
          const internetDaily = (profile.monthlyInternet || 0) / daysInThisMonth;
          const tiresDaily = (profile.monthlyTires || 0) / daysInThisMonth;
          const maintenanceDaily = (profile.monthlyMaintenance || 0) / daysInThisMonth;
          const electricityDaily = profile.carType === 'Elétrico' ? (profile.lastElectricityBill || 0) / daysInThisMonth : 0;
          const dailyFixedCost = insuranceDaily + vehicleDaily + internetDaily + tiresDaily + maintenanceDaily + electricityDaily;

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
            dailyFixedCost,
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
  };

  useEffect(() => {
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
      <header className="mb-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Histórico Mensal</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Seu desempenho mês a mês</p>
      </header>

      {/* Annual Summary Card */}
      <div className="bg-slate-900 rounded-[32px] p-6 border border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon size={16} className="text-emerald-500" />
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">RESUMO DO ANO {new Date().getFullYear()}</p>
          </div>

          {(() => {
            const allExpenses = summaries.flatMap(s => s.transactions.filter(t => t.type === 'expense'));
            const totalYearExpenses = allExpenses.reduce((acc, t) => acc + t.amount, 0) || 1;
            const categoryMap: Record<string, number> = allExpenses.reduce((acc, t) => {
              acc[t.category] = (acc[t.category] || 0) + t.amount;
              return acc;
            }, {} as Record<string, number>);
            
            const categories = (Object.entries(categoryMap) as [string, number][])
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5); // Top 5

            if (categories.length === 0) {
              return <p className="text-slate-500 text-xs font-bold uppercase italic">Sem gastos registrados no ano</p>;
            }

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Total acumulado</p>
                    <p className="text-2xl font-black text-white tabular-nums">
                      {formatCurrency(allExpenses.reduce((acc, t) => acc + t.amount, 0))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Média Mensal</p>
                    <p className="text-xl font-black text-emerald-400 tabular-nums">
                      {formatCurrency(allExpenses.reduce((acc, t) => acc + t.amount, 0) / (summaries.filter(s => s.income > 0 || s.expense > 0).length || 1))}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Maiores Gastos do Ano</p>
                  {categories.map(([cat, amt]) => {
                    const percent = (amt / totalYearExpenses) * 100;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                          <span className="text-slate-300">{cat}</span>
                          <span className="text-white">{formatCurrency(amt)}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

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

                    <div className="space-y-4">
                       <div className="flex items-center justify-between mb-2 px-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            {viewMode === 'list' ? 'Detalhes do Mês' : 
                             viewMode === 'summary' ? 'Resumo de Gastos' : 
                             viewMode === 'daily' ? 'Melhores Dias' : 
                             'Resumo Semanal'}
                          </p>
                          <div className="flex bg-white/5 rounded-lg p-1 border border-white/5 gap-1">
                            <button 
                              onClick={() => setViewMode('list')}
                              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'}`}
                              title="Lista de Transações"
                            >
                              <ListIcon size={14} />
                            </button>
                            <button 
                              onClick={() => setViewMode('weekly')}
                              className={`p-1.5 rounded-md transition-all ${viewMode === 'weekly' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'}`}
                              title="Resumo Semanal"
                            >
                              <CalendarDays size={14} />
                            </button>
                            <button 
                              onClick={() => setViewMode('daily')}
                              className={`p-1.5 rounded-md transition-all ${viewMode === 'daily' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'}`}
                              title="Desempenho Diário"
                            >
                              <Activity size={14} />
                            </button>
                            <button 
                              onClick={() => setViewMode('summary')}
                              className={`p-1.5 rounded-md transition-all ${viewMode === 'summary' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'}`}
                              title="Gastos por Categoria"
                            >
                              <PieChartIcon size={14} />
                            </button>
                          </div>
                       </div>

                       {viewMode === 'list' ? (
                         <div className="space-y-2">
                            {summary.transactions.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => setEditingTransaction(t)}
                                className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 cursor-pointer group transition-all"
                              >
                                 <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{t.category}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase">{format(parseISO(t.date), "dd/MM 'às' HH:mm", { locale: ptBR })}</p>
                                 </div>
                                 <div className="flex items-center gap-3">
                                   <p className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                   </p>
                                   <button
                                     type="button"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setEditingTransaction(t);
                                     }}
                                     className="p-1.5 bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all"
                                     title="Editar lançamento"
                                   >
                                     <Pencil size={14} />
                                   </button>
                                 </div>
                              </div>
                            ))}
                         </div>
                       ) : viewMode === 'daily' ? (
                         <div className="space-y-2">
                           {(() => {
                             const daysWithActivity = new Map<string, { income: number; expense: number; date: Date }>();
                             
                             summary.transactions.forEach(t => {
                               const dateKey = format(parseISO(t.date), 'yyyy-MM-dd');
                               const existing = daysWithActivity.get(dateKey) || { income: 0, expense: 0, date: parseISO(t.date) };
                               if (t.type === 'income') existing.income += t.amount;
                               else existing.expense += t.amount;
                               daysWithActivity.set(dateKey, existing);
                             });

                             const dailyStats = Array.from(daysWithActivity.values())
                               .map(day => ({
                                 ...day,
                                 net: day.income - day.expense - summary.dailyFixedCost
                               }))
                               .sort((a, b) => b.net - a.net);

                             if (dailyStats.length === 0) {
                               return (
                                 <div className="py-8 text-center bg-white/5 rounded-2xl border border-white/5">
                                   <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Sem lançamentos diários</p>
                                 </div>
                               );
                             }

                             return dailyStats.map((day, idx) => (
                               <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden group">
                                  {idx === 0 && day.net > 0 && (
                                    <div className="absolute top-0 right-0 bg-emerald-500/10 px-2 py-1 rounded-bl-lg">
                                       <p className="text-[7px] font-black text-emerald-400 uppercase tracking-tighter">Melhor Dia 🎯</p>
                                    </div>
                                  )}
                                  <div>
                                     <p className="text-xs font-bold text-white uppercase tracking-tight">
                                       {format(day.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                     </p>
                                     <div className="flex items-center gap-2 mt-0.5">
                                       <span className="text-[9px] text-emerald-400/70 font-bold">+{formatCurrency(day.income)}</span>
                                       <span className="text-[9px] text-rose-400/70 font-bold">-{formatCurrency(day.expense)}</span>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-sm font-black ${day.net > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                       {formatCurrency(day.net)}
                                    </p>
                                  </div>
                               </div>
                             ));
                           })()}
                         </div>
                       ) : viewMode === 'weekly' ? (
                         <div className="space-y-2">
                           {(() => {
                             const mStart = startOfMonth(summary.month);
                             const mEnd = endOfMonth(summary.month);
                             
                             const weeks = eachWeekOfInterval({ start: mStart, end: mEnd }, { weekStartsOn: 1 });
                             
                             const weeklyStats = weeks.map(weekStart => {
                               const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                               const effectiveStart = max([weekStart, mStart]);
                               const effectiveEnd = min([wEnd, mEnd]);
                               
                               const weekIncome = summary.transactions
                                 .filter(t => {
                                   const tDate = parseISO(t.date);
                                   return t.type === 'income' && (tDate >= effectiveStart && tDate <= effectiveEnd);
                                 })
                                 .reduce((acc, t) => acc + t.amount, 0);
                                 
                               return {
                                 start: effectiveStart,
                                 end: effectiveEnd,
                                 income: weekIncome
                               };
                             }).filter(w => w.income > 0 || isSameMonth(w.start, summary.month));

                             return weeklyStats.map((week, idx) => (
                               <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                                  <div>
                                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Semana {idx + 1}</p>
                                     <p className="text-xs font-bold text-white uppercase tracking-tight">
                                       {format(week.start, "dd", { locale: ptBR })} a {format(week.end, "dd 'de' MMMM", { locale: ptBR })}
                                     </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">Bruto Total</p>
                                    <p className="text-sm font-black text-emerald-400">
                                       {formatCurrency(week.income)}
                                    </p>
                                  </div>
                               </div>
                             ));
                           })()}
                         </div>
                       ) : (
                         <div className="space-y-4">
                           {(() => {
                             const expenses = summary.transactions.filter(t => t.type === 'expense');
                             const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0) || 1;
                             const categoryMap: Record<string, number> = expenses.reduce((acc, t) => {
                               acc[t.category] = (acc[t.category] || 0) + t.amount;
                               return acc;
                             }, {} as Record<string, number>);

                             const categories = (Object.entries(categoryMap) as [string, number][])
                               .sort((a, b) => b[1] - a[1]);

                             if (categories.length === 0) {
                               return (
                                 <div className="py-8 text-center bg-white/5 rounded-2xl border border-white/5">
                                   <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Sem gastos registrados</p>
                                 </div>
                               );
                             }

                             return categories.map(([cat, amt]) => {
                               const percent = (amt / totalExpenses) * 100;
                               return (
                                 <div key={cat} className="space-y-1.5">
                                   <div className="flex justify-between items-end px-1">
                                     <p className="text-xs font-bold text-white uppercase tracking-tight">{cat}</p>
                                     <div className="text-right">
                                       <p className="text-xs font-black text-white">{formatCurrency(amt)}</p>
                                       <p className="text-[9px] font-bold text-slate-500">{percent.toFixed(0)}%</p>
                                     </div>
                                   </div>
                                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: `${percent}%` }}
                                       className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                     />
                                   </div>
                                 </div>
                               );
                             });
                           })()}
                         </div>
                       )}
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

      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        onSuccess={loadData}
      />
    </div>
  );
}

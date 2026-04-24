import { formatCurrency } from "../lib/utils";
import { UserProfile } from "../types";
import { motion } from "motion/react";
import { Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Dashboard({ profile }: { profile: UserProfile }) {
  const dailyFixedCost = (profile.monthlyInsurance || 0) / 30;

  const now = new Date();
  const startOfW = startOfWeek(now, { weekStartsOn: 1 });
  
  // Calculate accrued fixed costs
  const daysInWeek = differenceInDays(now, startOfW) + 1;
  const weeklyInsuranceAccrued = daysInWeek * dailyFixedCost;
  
  const daysInMonth = now.getDate();
  const monthlyInsuranceAccrued = daysInMonth * dailyFixedCost;

  // Accrued insurance since registration or just for display logic
  const netWeekly = (profile.weeklyTotal || 0) - weeklyInsuranceAccrued;
  const netMonthly = (profile.monthlyTotal || 0) - monthlyInsuranceAccrued;

  const getWeekRange = () => {
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return `${format(startOfW, "dd")} a ${format(end, "dd")} de ${format(now, "MMMM", { locale: ptBR })}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 gap-3">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 border border-slate-200 p-6 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Lucro Líquido Semanal</p>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              {getWeekRange()}
            </span>
          </div>
          <h2 className="text-4xl font-black text-emerald-600 leading-none">
            {formatCurrency(netWeekly)}
          </h2>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tight">
            {profile.weeklyGross === 0 ? "Pronto para iniciar?" : `Desconto de ${formatCurrency(weeklyInsuranceAccrued)} em custos fixos`}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Mensal (Líquido)</p>
            <p className="text-xl font-black text-slate-800 tabular-nums">{formatCurrency(netMonthly)}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Anual Total</p>
            <p className="text-xl font-black text-slate-800 tabular-nums">{formatCurrency(profile.annualTotal || 0)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
        <div className="bg-emerald-500 p-2 rounded-xl text-white">
          <Calendar size={18} />
        </div>
        <div>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Custo Fixo Diário</p>
          <p className="text-sm font-bold text-slate-800">
            {formatCurrency(dailyFixedCost)} <span className="text-slate-400 font-normal ml-1">em seguro</span>
          </p>
        </div>
      </div>
    </div>
  );
}

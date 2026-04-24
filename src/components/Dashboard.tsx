import { formatCurrency } from "../lib/utils";
import { UserProfile } from "../types";
import { motion } from "motion/react";
import { Calendar } from "lucide-react";

export function Dashboard({ profile }: { profile: UserProfile }) {
  const dailyFixedCost = (profile.monthlyInsurance || 0) / 30;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 gap-3">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 border border-slate-200 p-6 rounded-3xl"
        >
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Faturamento Semanal</p>
          <h2 className="text-4xl font-black text-emerald-600 leading-none mt-2">
            {formatCurrency(profile.weeklyTotal || 0)}
          </h2>
        </motion.div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <p className="text-slate-500 text-[10px] font-bold uppercase">Mensal</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(profile.monthlyTotal || 0)}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <p className="text-slate-500 text-[10px] font-bold uppercase">Anual</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(profile.annualTotal || 0)}</p>
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

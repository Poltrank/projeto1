import { formatCurrency } from "../lib/utils";
import { UserProfile } from "../types";
import { motion } from "motion/react";
import { Calendar, Target } from "lucide-react";
import { format, startOfWeek, endOfWeek, differenceInDays, getDaysInMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Dashboard({ profile }: { profile: UserProfile }) {
  const now = new Date();
  const daysInCurrentMonth = getDaysInMonth(now);

  const insuranceDaily = (profile.monthlyInsurance || 0) / daysInCurrentMonth;
  const vehicleDaily = (profile.monthlyVehicleCost || 0) / daysInCurrentMonth;
  const internetDaily = (profile.monthlyInternet || 0) / daysInCurrentMonth;
  const tiresDaily = (profile.monthlyTires || 0) / daysInCurrentMonth;
  const maintenanceDaily = (profile.monthlyMaintenance || 0) / daysInCurrentMonth;
  const electricityDaily = profile.carType === 'Elétrico' ? (profile.lastElectricityBill || 0) / daysInCurrentMonth : 0;
  const dailyFixedCost = insuranceDaily + vehicleDaily + internetDaily + tiresDaily + maintenanceDaily + electricityDaily;

  const targetDailyNet = profile.targetMonthlyNet && profile.targetDaysPerMonth ? (profile.targetMonthlyNet / profile.targetDaysPerMonth) : 0;
  const targetDailyGross = targetDailyNet > 0 ? targetDailyNet + dailyFixedCost : 0;

  const registrationDate = profile.createdAt ? new Date(profile.createdAt) : now;
  const daysActive = Math.max(1, differenceInDays(now, registrationDate) + 1);
  const startOfW = startOfWeek(now, { weekStartsOn: 1 });
  
  // Only count insurance from the LATER of (start of week) or (registration date)
  const effectivelyStartedCountingCostsAt = registrationDate > startOfW ? registrationDate : startOfW;
  
  // Calculate accrued fixed costs
  const daysInWeekCounted = differenceInDays(now, effectivelyStartedCountingCostsAt) + 1;
  const hasActivity = (profile.weeklyTotal || 0) !== 0 || (profile.weeklyGross || 0) > 0;
  const weeklyInsuranceAccrued = hasActivity ? (daysInWeekCounted * dailyFixedCost) : 0;
  
  const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const effectivelyStartedMonthAt = registrationDate > startOfMonthDate ? registrationDate : startOfMonthDate;
  const daysInMonthCounted = differenceInDays(now, effectivelyStartedMonthAt) + 1;
  const hasMonthlyActivity = (profile.monthlyTotal || 0) !== 0 || (profile.monthlyGross || 0) > 0;
  const monthlyInsuranceAccrued = hasMonthlyActivity ? (daysInMonthCounted * dailyFixedCost) : 0;

  // Accrued insurance since registration or just for display logic
  const netWeekly = hasActivity ? (profile.weeklyTotal || 0) - weeklyInsuranceAccrued : 0;
  const netMonthly = hasMonthlyActivity ? (profile.monthlyTotal || 0) - monthlyInsuranceAccrued : 0;

  // Average Daily calculations within the current month
  const averageDailyNet = hasMonthlyActivity ? netMonthly / daysInMonthCounted : 0;
  const missingDailyNet = Math.max(0, targetDailyNet - averageDailyNet);

  const monthlyGoal = profile.targetMonthlyNet || 0;
  const progressPercentage = monthlyGoal > 0 ? Math.min(100, (netMonthly / monthlyGoal) * 100) : 0;

  const getWeekRange = () => {
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return `${format(startOfW, "dd")} a ${format(end, "dd")} de ${format(now, "MMMM", { locale: ptBR })}`;
  };

  return (
    <div className="p-6 space-y-6">
      {targetDailyGross > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500 border border-emerald-400 p-6 rounded-[32px] shadow-xl shadow-emerald-500/20 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl text-white">
                <Target size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none mb-1">Meta Líquida Diária</p>
                <p className="text-3xl font-black tracking-tighter italic font-mono leading-none">{formatCurrency(targetDailyNet)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Necessário Bruto</p>
              <p className="text-sm font-black italic font-mono opacity-90">{formatCurrency(targetDailyGross)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div>
              <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Média Líquida</p>
              <p className="text-sm font-black italic font-mono">
                {formatCurrency(averageDailyNet)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Falta (Líquido)</p>
              <p className="text-sm font-black italic font-mono">
                {formatCurrency(missingDailyNet)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
      <div className="grid grid-cols-1 gap-3">
        {profile.targetMonthlyNet && profile.targetMonthlyNet > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 border border-slate-200 p-6 rounded-[32px] overflow-hidden relative"
          >
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Status Meta Mensal</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-black text-slate-900 tabular-nums leading-none">
                    {formatCurrency(netMonthly)}
                  </h2>
                  <span className="text-sm font-bold text-slate-300">/ {formatCurrency(profile.targetMonthlyNet)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-black italic font-mono leading-none ${progressPercentage >= 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {Math.round(progressPercentage)}%
                </p>
              </div>
            </div>

            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`h-full rounded-full shadow-lg ${
                  progressPercentage >= 100 ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-blue-600 shadow-blue-500/20'
                }`}
              />
            </div>

            <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-tight flex items-center justify-between">
              <span>{progressPercentage >= 100 ? "Objetivo Alcançado! 🎯" : "Rumo ao seu salário desejado"}</span>
              {progressPercentage < 100 && (
                <span className="text-slate-500">Falta {formatCurrency(profile.targetMonthlyNet - netMonthly)}</span>
              )}
            </p>
          </motion.div>
        )}

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
            {!hasActivity ? "Pronto para iniciar?" : `Desconto de ${formatCurrency(weeklyInsuranceAccrued)} em custos fixos`}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Mensal Bruto</p>
            <p className="text-xl font-black text-slate-800 tabular-nums">{formatCurrency(profile.monthlyGross || 0)}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Anual Total</p>
            <p className="text-xl font-black text-slate-800 tabular-nums">{formatCurrency(profile.annualTotal || 0)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
        <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg shadow-emerald-500/20">
          <Calendar size={18} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Custo Fixo Diário Estimado</p>
          <div className="flex items-end gap-2">
            <p className="text-sm font-black text-slate-900 leading-none">
              {formatCurrency(dailyFixedCost)} 
            </p>
            <p className="text-[9px] text-slate-400 font-bold uppercase">
              ({[
                profile.monthlyInsurance ? 'Seguro' : null,
                profile.monthlyVehicleCost ? 'Veículo' : null,
                profile.monthlyInternet ? 'Internet' : null,
                profile.monthlyTires ? 'Pneus' : null,
                profile.monthlyMaintenance ? 'Revisão' : null,
                profile.carType === 'Elétrico' && profile.lastElectricityBill ? 'Luz' : null
              ].filter(Boolean).join(' + ') || 'Nenhum'})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

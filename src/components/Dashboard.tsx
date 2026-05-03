import { formatCurrency } from "../lib/utils";
import { UserProfile } from "../types";
import { motion } from "motion/react";
import { Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Dashboard({ profile }: { profile: UserProfile }) {
  const insuranceDaily = (profile.monthlyInsurance || 0) / 30;
  const vehicleDaily = (profile.monthlyVehicleCost || 0) / 30;
  const internetDaily = (profile.monthlyInternet || 0) / 30;
  const tiresDaily = (profile.monthlyTires || 0) / 30;
  const maintenanceDaily = (profile.monthlyMaintenance || 0) / 30;
  const electricityDaily = profile.carType === 'Elétrico' ? (profile.lastElectricityBill || 0) / 30 : 0;
  const dailyFixedCost = insuranceDaily + vehicleDaily + internetDaily + tiresDaily + maintenanceDaily + electricityDaily;

  const now = new Date();
  const registrationDate = profile.createdAt ? new Date(profile.createdAt) : now;
  const startOfW = startOfWeek(now, { weekStartsOn: 1 });
  
  // Only count insurance from the LATER of (start of week) or (registration date)
  const effectivelyStartedCountingCostsAt = registrationDate > startOfW ? registrationDate : startOfW;
  
  // Calculate accrued fixed costs
  const daysInWeekCounted = differenceInDays(now, effectivelyStartedCountingCostsAt) + 1;
  const hasActivity = (profile.weeklyTotal || 0) !== 0 || (profile.weeklyGross || 0) > 0;
  const weeklyInsuranceAccrued = hasActivity ? (daysInWeekCounted * dailyFixedCost) : 0;
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const effectivelyStartedMonthAt = registrationDate > startOfMonth ? registrationDate : startOfMonth;
  const daysInMonthCounted = differenceInDays(now, effectivelyStartedMonthAt) + 1;
  const hasMonthlyActivity = (profile.monthlyTotal || 0) !== 0 || (profile.monthlyGross || 0) > 0;
  const monthlyInsuranceAccrued = hasMonthlyActivity ? (daysInMonthCounted * dailyFixedCost) : 0;

  // Accrued insurance since registration or just for display logic
  const netWeekly = hasActivity ? (profile.weeklyTotal || 0) - weeklyInsuranceAccrued : 0;
  const netMonthly = hasMonthlyActivity ? (profile.monthlyTotal || 0) - monthlyInsuranceAccrued : 0;

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
            {!hasActivity ? "Pronto para iniciar?" : `Desconto de ${formatCurrency(weeklyInsuranceAccrued)} em custos fixos`}
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

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "./Modal";
import { Target, Save, Calculator } from "lucide-react";
import { motion } from "motion/react";
import { formatCurrency } from "../lib/utils";
import { getDaysInMonth } from "date-fns";

const goalSchema = z.object({
  targetMonthlyNet: z.number().min(0, "O valor deve ser positivo"),
  targetDaysPerMonth: z.number().min(1, "Mínimo 1 dia").max(31, "Máximo 31 dias"),
});

type GoalForm = z.infer<typeof goalSchema>;

export function GoalModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile, updateProfile } = useAuth();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      targetMonthlyNet: profile?.targetMonthlyNet || 0,
      targetDaysPerMonth: profile?.targetDaysPerMonth || 25,
    },
  });

  const onSubmit = async (data: GoalForm) => {
    try {
      await updateProfile(data);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar meta");
    }
  };

  const targetNet = watch("targetMonthlyNet") || 0;
  const targetDays = watch("targetDaysPerMonth") || 25;

  const now = new Date();
  const daysInCurrentMonth = getDaysInMonth(now);

  // Calculate required
  const insuranceDaily = (profile?.monthlyInsurance || 0) / daysInCurrentMonth;
  const vehicleDaily = (profile?.monthlyVehicleCost || 0) / daysInCurrentMonth;
  const internetDaily = (profile?.monthlyInternet || 0) / daysInCurrentMonth;
  const tiresDaily = (profile?.monthlyTires || 0) / daysInCurrentMonth;
  const maintenanceDaily = (profile?.monthlyMaintenance || 0) / daysInCurrentMonth;
  const electricityDaily = profile?.carType === 'Elétrico' ? (profile?.lastElectricityBill || 0) / daysInCurrentMonth : 0;
  const dailyFixedCost = insuranceDaily + vehicleDaily + internetDaily + tiresDaily + maintenanceDaily + electricityDaily;

  const dailyNetNeeded = targetNet / targetDays;
  const dailyGrossNeeded = dailyNetNeeded + dailyFixedCost;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Minha Meta de Salário">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 flex items-start gap-3">
          <Target className="text-emerald-500 mt-1" size={20} />
          <div>
            <h4 className="text-emerald-400 font-bold text-sm">Planejamento Diário</h4>
            <p className="text-slate-400 text-xs">
              Defina quanto você quer ganhar livre no final do mês. O sistema calculará o bruto necessário considerando seus custos fixos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">Salário Líquido Desejado</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs uppercase">R$</span>
              <input
                type="number"
                step="0.01"
                {...register("targetMonthlyNet", { valueAsNumber: true })}
                className="w-full bg-slate-800 border border-slate-700 pl-12 p-3.5 rounded-xl text-lg font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                placeholder="5000.00"
              />
            </div>
            {errors.targetMonthlyNet && <p className="text-rose-500 text-[10px] mt-1 font-bold pl-1">{errors.targetMonthlyNet.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">Dias de Trabalho/Mês</label>
            <input
              type="number"
              {...register("targetDaysPerMonth", { valueAsNumber: true })}
              className="w-full bg-slate-800 border border-slate-700 p-3.5 rounded-xl text-lg font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-center"
              placeholder="25"
            />
            {errors.targetDaysPerMonth && <p className="text-rose-500 text-[10px] mt-1 font-bold pl-1">{errors.targetDaysPerMonth.message}</p>}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Calculator size={14} />
              Cálculo de Meta
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Custo Fixo Diário</p>
              <p className="text-xl font-black text-slate-300 font-mono italic">{formatCurrency(dailyFixedCost)}</p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-500/70 uppercase font-black tracking-widest mb-1">Líquido Diário</p>
              <p className="text-xl font-black text-emerald-400 font-mono italic">{formatCurrency(dailyNetNeeded)}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <p className="text-[10px] text-rose-400 uppercase font-black tracking-widest mb-1">Meta Diária (Bruto)</p>
            <p className="text-4xl font-black text-white font-mono italic tracking-tighter">
              {formatCurrency(dailyGrossNeeded)}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">
              * Para sobrar {formatCurrency(targetNet)} limpo no mês em {targetDays} dias.
            </p>
          </div>
        </motion.div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
        >
          <Save size={16} />
          {isSubmitting ? "Salvando..." : "Salvar Meta"}
        </button>
      </form>
    </Modal>
  );
}


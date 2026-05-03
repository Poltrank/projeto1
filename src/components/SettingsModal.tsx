import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "./Modal";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { motion } from "motion/react";

const profileSchema = z.object({
  nickname: z.string().min(3, "Mínimo 3 caracteres").max(20, "Máximo 20 caracteres"),
  car: z.string().min(2, "Informe seu carro"),
  carType: z.enum(["Combustão", "Elétrico"]),
  monthlyInsurance: z.number().min(0, "O valor deve ser positivo"),
  monthlyVehicleCost: z.number().min(0).optional(),
  monthlyInternet: z.number().min(0).optional(),
  monthlyTires: z.number().min(0).optional(),
  monthlyMaintenance: z.number().min(0).optional(),
  lastElectricityBill: z.number().min(0).optional(),
  rankingOptIn: z.boolean(),
});

type ProfileValues = z.infer<typeof profileSchema>;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { profile, updateProfile } = useAuth();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: profile?.nickname || "",
      car: profile?.car || "",
      carType: profile?.carType || "Combustão",
      monthlyInsurance: profile?.monthlyInsurance || 0,
      monthlyVehicleCost: profile?.monthlyVehicleCost || 0,
      monthlyInternet: profile?.monthlyInternet || 0,
      monthlyTires: profile?.monthlyTires || 0,
      monthlyMaintenance: profile?.monthlyMaintenance || 0,
      lastElectricityBill: profile?.lastElectricityBill || 0,
      rankingOptIn: profile?.rankingOptIn ?? true,
    },
  });

  const carType = watch("carType");

  const onSubmit = async (data: ProfileValues) => {
    try {
      await updateProfile({
        ...profile,
        ...data,
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      alert("Erro ao atualizar perfil: " + (error.message || "Tente novamente"));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil">
      <div className="p-1">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">Seu Nickname Público</label>
            <input
              {...register("nickname")}
              className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-lg font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
              placeholder="Ex: PedroUber"
            />
            {errors.nickname && <p className="text-rose-500 text-[10px] mt-1 font-bold pl-1">{errors.nickname.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">Veículo</label>
              <input
                {...register("car")}
                className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-lg font-bold text-white outline-none"
                placeholder="Modelo"
              />
              {errors.car && <p className="text-rose-500 text-[10px] mt-1 font-bold pl-1">{errors.car.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">Motorização</label>
              <select
                {...register("carType")}
                className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-lg font-bold text-white outline-none appearance-none cursor-pointer"
              >
                <option value="Combustão">Combustão</option>
                <option value="Elétrico">Elétrico</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">Seguro Mensal (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs uppercase">R$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register("monthlyInsurance", { valueAsNumber: true })}
                  className="w-full bg-slate-800 border border-slate-700 pl-12 p-3.5 rounded-xl text-lg font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              {errors.monthlyInsurance && <p className="text-rose-500 text-[10px] mt-1 font-bold pl-1">{errors.monthlyInsurance.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">Aluguel/Financ. (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs uppercase">R$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register("monthlyVehicleCost", { valueAsNumber: true })}
                  className="w-full bg-slate-800 border border-slate-700 pl-12 p-3.5 rounded-xl text-lg font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">Internet (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs uppercase">R$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register("monthlyInternet", { valueAsNumber: true })}
                  className="w-full bg-slate-800 border border-slate-700 pl-12 p-3.5 rounded-xl text-lg font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-blue-400 mb-2 tracking-widest pl-1">Troca de Pneu (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-xs uppercase">R$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register("monthlyTires", { valueAsNumber: true })}
                  className="w-full bg-slate-800 border-blue-900/30 border pl-12 p-3.5 rounded-xl text-lg font-bold text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Custos mensais"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-amber-500 mb-2 tracking-widest pl-1">Revisão (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600 font-bold text-xs uppercase">R$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register("monthlyMaintenance", { valueAsNumber: true })}
                  className="w-full bg-slate-800 border-amber-900/30 border pl-12 p-3.5 rounded-xl text-lg font-bold text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  placeholder="Custos mensais"
                />
              </div>
            </div>

            {carType === "Elétrico" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">Luz Mês Anterior (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs uppercase">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    {...register("lastElectricityBill", { valueAsNumber: true })}
                    className="w-full bg-slate-800 border border-slate-700 pl-12 p-3.5 rounded-xl text-lg font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Ex: 150,00"
                  />
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <input
              type="checkbox"
              {...register("rankingOptIn")}
              className="w-5 h-5 mt-0.5 accent-emerald-500 rounded-md cursor-pointer"
            />
            <div>
              <label className="text-sm font-black text-emerald-400 uppercase tracking-tighter block">Participar do Ranking</label>
              <p className="text-[10px] text-slate-500 font-bold leading-tight mt-0.5">Suas conquistas aparecerão para os colegas de Jaraguá.</p>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-800 text-slate-400 hover:text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
            >
              <Save size={16} />
              {isSubmitting ? "Gravando..." : "Salvar Mudanças"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

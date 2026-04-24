import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../contexts/AuthContext";
import { CarType } from "../types";
import { motion } from "motion/react";

const profileSchema = z.object({
  nickname: z.string().min(3, "Mínimo 3 caracteres").max(20, "Máximo 20 caracteres"),
  name: z.string().min(3, "Nome muito curto"),
  car: z.string().min(2, "Informe seu carro"),
  carType: z.enum(["Combustão", "Elétrico"]),
  monthlyInsurance: z.number().min(0),
  rankingOptIn: z.boolean(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function RegistrationForm() {
  const { updateProfile, user } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      carType: "Combustão",
      monthlyInsurance: 0,
      rankingOptIn: true,
      nickname: "", // Ensure explicit defaults
      name: "",
      car: "",
    },
  });

  const onSubmit = async (data: ProfileValues) => {
    console.log("Iniciando salvamento de perfil:", data);
    try {
      await updateProfile({
        ...data,
        weeklyTotal: 0,
        monthlyTotal: 0,
        annualTotal: 0,
        createdAt: new Date().toISOString(),
      });
      console.log("Perfil salvo com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      alert("Erro ao salvar perfil: " + (error.message || "Verifique sua conexão"));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-md mx-auto bg-white rounded-[32px] shadow-2xl border border-slate-100"
    >
      <h2 className="text-3xl font-bold mb-2 text-slate-900 tracking-tight">Finalizar Cadastro</h2>
      <p className="text-slate-500 mb-8 text-lg font-medium leading-tight">Olá, {user?.displayName}! Personalize suas informações de motorista.</p>
      
      <form onSubmit={handleSubmit(onSubmit, (err) => console.log("Erros de validação:", err))} className="space-y-6">
        {Object.keys(errors).length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-bold">
            Existem campos obrigatórios não preenchidos corretamente acima.
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Nickname Público</label>
          <input
            {...register("nickname")}
            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="Ex: PedroUber"
          />
          {errors.nickname && <p className="text-rose-500 text-sm mt-1 font-bold">{errors.nickname.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Nome Completo</label>
          <input
            {...register("name")}
            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
          {errors.name && <p className="text-rose-500 text-sm mt-1 font-bold">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Seu Veículo</label>
            <input
              {...register("car")}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Ex: Corolla 2023"
            />
            {errors.car && <p className="text-rose-500 text-sm mt-1 font-bold">{errors.car.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Tipo de Motor</label>
            <select
              {...register("carType")}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
            >
              <option value="Combustão">Combustão</option>
              <option value="Elétrico">Elétrico</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Seguro Mensal (R$)</label>
          <input
            type="number"
            {...register("monthlyInsurance", { valueAsNumber: true })}
            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-start gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
          <input
            type="checkbox"
            {...register("rankingOptIn")}
            className="w-6 h-6 mt-1 accent-emerald-500 rounded-lg"
          />
          <div>
            <label className="font-bold text-slate-800 text-lg">Participar do Ranking</label>
            <p className="text-sm text-slate-500 leading-tight">Compartilhe seu progresso e inspire outros colegas de Jaraguá.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-black text-xl rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
        >
          {isSubmitting ? "Cadastrando..." : "Confirmar Perfil"}
        </button>
      </form>
    </motion.div>
  );
}

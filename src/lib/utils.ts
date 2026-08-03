import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function get30DayDailyCost(amount?: number, dateStr?: string, updatedAt?: any, installments: number = 1): number {
  if (!amount || amount <= 0) return 0;
  const numInstallments = Math.max(1, Math.min(12, installments || 1));
  const totalDays = numInstallments * 30;
  const now = new Date();
  const baseDate = dateStr ? new Date(dateStr) : (updatedAt ? new Date(updatedAt) : now);
  if (isNaN(baseDate.getTime())) return amount / totalDays;
  const daysDiff = differenceInDays(now, baseDate);
  if (daysDiff > totalDays) return 0;
  return amount / totalDays;
}

export function is30DayCostActive(amount?: number, dateStr?: string, updatedAt?: any, installments: number = 1): boolean {
  if (!amount || amount <= 0) return false;
  const numInstallments = Math.max(1, Math.min(12, installments || 1));
  const totalDays = numInstallments * 30;
  const now = new Date();
  const baseDate = dateStr ? new Date(dateStr) : (updatedAt ? new Date(updatedAt) : now);
  if (isNaN(baseDate.getTime())) return true;
  const daysDiff = differenceInDays(now, baseDate);
  return daysDiff <= totalDays;
}


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

export function get30DayDailyCost(amount?: number, dateStr?: string, updatedAt?: any): number {
  if (!amount || amount <= 0) return 0;
  const now = new Date();
  const baseDate = dateStr ? new Date(dateStr) : (updatedAt ? new Date(updatedAt) : now);
  if (isNaN(baseDate.getTime())) return amount / 30;
  const daysDiff = differenceInDays(now, baseDate);
  if (daysDiff > 30) return 0;
  return amount / 30;
}

export function is30DayCostActive(amount?: number, dateStr?: string, updatedAt?: any): boolean {
  if (!amount || amount <= 0) return false;
  const now = new Date();
  const baseDate = dateStr ? new Date(dateStr) : (updatedAt ? new Date(updatedAt) : now);
  if (isNaN(baseDate.getTime())) return true;
  const daysDiff = differenceInDays(now, baseDate);
  return daysDiff <= 30;
}


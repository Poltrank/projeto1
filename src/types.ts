export type CarType = 'Combustão' | 'Elétrico';

export interface UserProfile {
  uid: string;
  nickname: string;
  name?: string;
  car: string;
  carType: CarType;
  monthlyInsurance: number;
  lastElectricityBill?: number;
  monthlyVehicleCost?: number;
  monthlyInternet?: number;
  monthlyTires?: number;
  monthlyMaintenance?: number;
  targetMonthlyNet?: number;
  targetDaysPerMonth?: number;
  topCategory?: string;
  rankingOptIn: boolean;
  weeklyTotal: number;
  monthlyTotal: number;
  annualTotal: number;
  weeklyGross: number;
  monthlyGross: number;
  createdAt: any;
  updatedAt: any;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id?: string;
  userId: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  createdAt: any;
}

export interface RankingEntry {
  userId: string;
  nickname: string;
  car: string;
  carType: CarType;
  weeklyTotal: number;
  monthlyTotal: number;
  weeklyGross: number;
  monthlyGross: number;
  topCategory?: string;
  monthlyInsurance: number;
  updatedAt: any;
}

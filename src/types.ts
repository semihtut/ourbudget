// Core domain types. Money is always integer cents; dates are 'YYYY-MM-DD'.

export type Payer = 'me' | 'partner' | 'joint';
export type MonthKey = string; // 'YYYY-MM'
export type CategoryKind = 'fixed' | 'variable';

export interface Expense {
  id?: number;
  month: MonthKey; // denormalized from `date` for fast indexed queries
  date: string; // 'YYYY-MM-DD'
  categoryId: string;
  amountCents: number; // store money as integer cents — never floats
  payer: Payer;
  note?: string;
  recurring: boolean; // true => offered when copying fixed bills to a new month
}

export interface Category {
  id: string;
  label: string; // English
  emoji: string;
  color: string; // hex from the categorical palette
  kind: CategoryKind;
}

// Settings is a single row keyed by a fixed string in Dexie (store: 'key').
export interface Settings {
  key: string; // always 'app'
  meName: string;
  partnerName: string;
  splitRatio: number; // share borne by `me` for joint costs, default 0.5
}

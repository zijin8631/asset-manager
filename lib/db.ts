import Dexie, { Table } from 'dexie';

export interface Account {
  id?: number;
  name: string;
  type: 'cash' | 'bank' | 'security';
  balance: number;
  currency?: string;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id?: number;
  accountId: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category?: string;
  date: Date;
  note?: string;
  createdAt: Date;
}

export interface Investment {
  id?: number;
  symbol: string;
  name: string;
  quantity: number;
  costPrice: number;
  currentPrice: number;
  currency?: string;
  lastUpdated: Date;
  createdAt: Date;
}

export class AssetDatabase extends Dexie {
  accounts!: Table<Account>;
  transactions!: Table<Transaction>;
  investments!: Table<Investment>;

  constructor() {
    super('AssetManagerDB');
    this.version(1).stores({
      accounts: '++id, name, type, createdAt',
      transactions: '++id, accountId, type, date, createdAt',
      investments: '++id, symbol, lastUpdated, createdAt',
    });
  }
}

export const db = new AssetDatabase();

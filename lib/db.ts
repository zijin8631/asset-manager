import Dexie, { Table } from 'dexie';

// 账户类型 - 现金类账户
export type AccountType =
  | 'cash'      // 现金
  | 'bank'      // 银行卡
  | 'alipay'    // 支付宝
  | 'wechat'    // 微信支付
  | 'security'; // 证券账户（仅作为通道，实际资产在 investments）

// 投资类型
export type InvestmentType =
  | 'stock'            // 股票（A股）
  | 'fund'             // 基金
  | 'bond'             // 债券
  | 'gold'             // 黄金
  | 'wealth'           // 理财
  | 'fixed_income'     // 固收
  | 'us_stock'         // 美股
  | 'cd'               // 同业存单
  | 'reits'            // REITs
  | 'crypto';          // 加密货币

// 债券子分类
export type BondSubType = 'long' | 'short' | 'corporate' | 'government' | 'convertible';

// 基金子分类
export type FundSubType = 'stock' | 'bond' | 'mixed' | 'money_market' | 'index' | 'etf';

export interface Account {
  id?: number;
  name: string;
  type: AccountType;
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
  type: InvestmentType;
  symbol: string;
  name: string;
  currency?: string;
  // 子分类（用于债券、基金等）
  subType?: string;
  // 对于股票/基金/债券：数量和单价
  quantity?: number;
  avgCostPrice?: number;     // 平均持仓成本价
  currentPrice?: number;      // 当前单价
  // 对于理财/固收等：金额
  totalCost?: number;         // 总投入金额
  currentValue?: number;     // 当前价值
  // 购买时间
  purchaseDate?: Date;        // 首次购买时间
  // 累计数据
  totalBuyAmount?: number;    // 累计买入金额
  totalSellAmount?: number;   // 累计卖出金额
  totalProfit?: number;       // 累计收益金额
  yieldRate?: number;         // 收益率（%），系统计算
  lastUpdated: Date;
  createdAt: Date;
}

// 收益记录
export interface YieldRecord {
  id?: number;
  investmentId: number;
  yieldRate: number;        // 收益率（%）
  yieldAmount: number;      // 收益金额
  recordDate: Date;         // 记录日期
  note?: string;
  createdAt: Date;
}

// 投资交易记录（买入/卖出）
export interface InvestmentTransaction {
  id?: number;
  investmentId: number;
  type: 'buy' | 'sell';     // 买入/卖出
  amount: number;           // 金额
  quantity?: number;         // 数量（股票/基金/债券）
  price?: number;           // 单价（股票/基金/债券）
  date: Date;               // 交易日期
  note?: string;
  createdAt: Date;
}

export class AssetDatabase extends Dexie {
  accounts!: Table<Account>;
  transactions!: Table<Transaction>;
  investments!: Table<Investment>;
  yieldRecords!: Table<YieldRecord>;
  investmentTransactions!: Table<InvestmentTransaction>;

  constructor() {
    super('AssetManagerDB');
    this.version(3).stores({
      accounts: '++id, name, type, createdAt',
      transactions: '++id, accountId, type, date, createdAt',
      investments: '++id, type, symbol, purchaseDate, lastUpdated, createdAt',
      yieldRecords: '++id, investmentId, recordDate, createdAt',
      investmentTransactions: '++id, investmentId, type, date, createdAt',
    });
  }
}

export const db = new AssetDatabase();

'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  Calculator,
} from 'lucide-react';

// 模拟股票价格数据（实际应从 API 获取）
const mockStockPrices: Record<string, { price: number; name: string; currency: string }> = {
  '600519': { price: 1720, name: '贵州茅台', currency: 'CNY' },
  '000858': { price: 125, name: '五粮液', currency: 'CNY' },
  'AAPL': { price: 198, name: 'Apple Inc.', currency: 'USD' },
  'TSLA': { price: 245, name: 'Tesla Inc.', currency: 'USD' },
  'NVDA': { price: 875, name: 'NVIDIA Corp.', currency: 'USD' },
  'MSFT': { price: 415, name: 'Microsoft Corp.', currency: 'USD' },
};

// 持仓类型
interface Investment {
  id: number;
  symbol: string;
  name: string;
  quantity: number;
  costPrice: number;
  currentPrice: number;
  currency?: string;
  purchaseDate: Date; // 用于 XIRR 计算
}

// 现金流类型（用于 XIRR）
interface CashFlow {
  date: Date;
  amount: number; // 正数为流入，负数为流出
}

// XIRR 计算函数（牛顿迭代法）
function calculateXIRR(cashFlows: CashFlow[]): number {
  if (cashFlows.length < 2) return 0;

  // 按日期排序
  const sortedFlows = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const startDate = sortedFlows[0].date;

  // 初始猜测值 0.1 (10%)
  let rate = 0.1;

  // 牛顿迭代法求解 XIRR
  const maxIterations = 100;
  const tolerance = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (const flow of sortedFlows) {
      const days = (flow.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const discount = Math.pow(1 + rate, days / 365);
      npv += flow.amount / discount;
      dnpv -= (flow.amount * days) / (365 * discount * (1 + rate));
    }

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate * 100; // 转换为百分比
    }

    rate = newRate;
  }

  return rate * 100;
}

// 模拟获取股票价格
async function fetchStockPrice(symbol: string): Promise<{ price: number; name: string; currency: string } | null> {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  const stock = mockStockPrices[symbol.toUpperCase()];
  if (stock) {
    // 返回随机波动的价格（模拟实时性）
    const randomFluctuation = (Math.random() - 0.5) * 0.02; // ±1% 波动
    return {
      price: Number((stock.price * (1 + randomFluctuation)).toFixed(2)),
      name: stock.name,
      currency: stock.currency,
    };
  }

  // 实际项目中可以使用真实的 API，例如：
  // const response = await fetch(`https://api.example.com/stock/${symbol}`);
  // return await response.json();

  return null;
}

export default function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([
    {
      id: 1,
      symbol: '600519',
      name: '贵州茅台',
      quantity: 100,
      costPrice: 1650,
      currentPrice: 1720,
      currency: 'CNY',
      purchaseDate: new Date('2023-01-15'),
    },
    {
      id: 2,
      symbol: '000858',
      name: '五粮液',
      quantity: 200,
      costPrice: 138,
      currentPrice: 125,
      currency: 'CNY',
      purchaseDate: new Date('2023-03-20'),
    },
    {
      id: 3,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      quantity: 50,
      costPrice: 185,
      currentPrice: 198,
      currency: 'USD',
      purchaseDate: new Date('2022-06-10'),
    },
  ]);

  const [searchSymbol, setSearchSymbol] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ price: number; name: string; currency: string } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showXIRRDialog, setShowXIRRDialog] = useState(false);

  // 计算总成本、总市值
  const totalCost = investments.reduce((sum, inv) => sum + inv.quantity * inv.costPrice, 0);
  const totalValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);
  const totalProfit = totalValue - totalCost;
  const profitPercent = totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(2) : '0.00';

  // 计算年化收益率 (XIRR)
  const calculatePortfolioXIRR = (): number => {
    const cashFlows: CashFlow[] = [];

    // 添加购买现金流（负数）
    for (const inv of investments) {
      cashFlows.push({
        date: inv.purchaseDate,
        amount: -(inv.quantity * inv.costPrice),
      });
    }

    // 添加当前市值现金流（正数，假设今天卖出）
    cashFlows.push({
      date: new Date(),
      amount: totalValue,
    });

    return calculateXIRR(cashFlows);
  };

  const xirr = calculatePortfolioXIRR();

  // 搜索股票价格
  const handleSearch = async () => {
    if (!searchSymbol.trim()) return;

    setIsSearching(true);
    const result = await fetchStockPrice(searchSymbol);
    setSearchResult(result);
    setIsSearching(false);
  };

  // 更新股票价格
  const handleUpdatePrice = async (id: number, symbol: string) => {
    const result = await fetchStockPrice(symbol);
    if (result) {
      setInvestments(prev =>
        prev.map(inv =>
          inv.id === id
            ? { ...inv, currentPrice: result.price, name: result.name }
            : inv
        )
      );
    }
  };

  // 更新所有股票价格
  const handleRefreshAll = async () => {
    const updates = investments.map(async (inv) => {
      const result = await fetchStockPrice(inv.symbol);
      return result ? { id: inv.id, price: result.price, name: result.name } : null;
    });

    const results = await Promise.all(updates);

    setInvestments(prev =>
      prev.map(inv => {
        const update = results.find(r => r?.id === inv.id);
        return update ? { ...inv, currentPrice: update.price, name: update.name } : inv;
      })
    );
  };

  // 添加新持仓
  const handleAddInvestment = () => {
    if (!searchResult || !searchSymbol.trim()) return;

    const newInvestment: Investment = {
      id: Date.now(),
      symbol: searchSymbol.toUpperCase(),
      name: searchResult.name,
      quantity: 0, // 需要用户输入
      costPrice: searchResult.price,
      currentPrice: searchResult.price,
      currency: searchResult.currency,
      purchaseDate: new Date(),
    };

    setInvestments(prev => [...prev, newInvestment]);
    setShowAddDialog(false);
    setSearchSymbol('');
    setSearchResult(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">投资</h1>
          <p className="text-sm text-gray-500 mt-1">共 {investments.length} 个持仓</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowXIRRDialog(true)}
            className="p-2 rounded-full hover:bg-gray-100"
            title="计算年化收益率"
          >
            <Calculator className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleRefreshAll}
            className="p-2 rounded-full hover:bg-gray-100"
            title="刷新所有价格"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* 持仓市值卡片 */}
      <div
        className={`rounded-2xl p-6 mb-6 text-white ${
          totalProfit >= 0
            ? 'bg-gradient-to-br from-emerald-600 to-emerald-700'
            : 'bg-gradient-to-br from-rose-600 to-rose-700'
        }`}
      >
        <p className="text-sm opacity-80 mb-1">持仓市值</p>
        <p className="text-4xl font-semibold mb-2">¥ {totalValue.toLocaleString()}</p>
        <div className="flex items-center gap-2">
          {totalProfit >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {totalProfit >= 0 ? '+' : ''}
            {totalProfit.toLocaleString()} ({profitPercent}%)
          </span>
          <span className="text-xs opacity-60">总收益</span>
        </div>
      </div>

      {/* 持仓列表 */}
      <div className="space-y-3">
        {investments.map((inv) => {
          const value = inv.quantity * inv.currentPrice;
          const cost = inv.quantity * inv.costPrice;
          const profit = value - cost;
          const profitPercent = cost > 0 ? ((profit / cost) * 100).toFixed(2) : '0.00';

          return (
            <div
              key={inv.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{inv.name}</p>
                  <p className="text-xs text-gray-500">{inv.symbol}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdatePrice(inv.id, inv.symbol)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="更新价格"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  </button>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                      profit >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {profit >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-sm font-medium">
                      {profit >= 0 ? '+' : ''}
                      {profitPercent}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">持仓</p>
                  <p className="font-medium">{inv.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">成本价</p>
                  <p className="font-medium">¥ {inv.costPrice}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">现价</p>
                  <p className="font-medium">¥ {inv.currentPrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">市值</p>
                  <p className="font-medium">¥ {value.toLocaleString()}</p>
                </div>
              </div>
              {/* 盈亏金额 */}
              <div className={`flex items-center justify-between pt-3 border-t border-gray-100 ${
                profit >= 0 ? 'text-green-600' : 'text-red-500'
              }`}>
                <span className="text-xs">盈亏金额</span>
                <span className="font-medium">
                  {profit >= 0 ? '+' : ''}¥ {profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 股票搜索对话框 */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">添加持仓</h2>
              <button
                onClick={() => setShowAddDialog(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="输入股票代码 (如: AAPL, 600519)"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isSearching ? '查询中...' : '查询价格'}
              </button>
              {searchResult && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{searchResult.name}</p>
                      <p className="text-sm text-gray-500">{searchSymbol.toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">¥ {searchResult.price}</p>
                      <p className="text-xs text-gray-500">{searchResult.currency}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleAddInvestment}
                    className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
                  >
                    添加到持仓
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* XIRR 计算结果对话框 */}
      {showXIRRDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">年化收益率</h2>
              <button
                onClick={() => setShowXIRRDialog(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-2">投资组合年化收益率 (XIRR)</p>
              <p className={`text-4xl font-bold ${xirr >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {xirr >= 0 ? '+' : ''}{xirr.toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <p className="mb-2">基于以下计算：</p>
              <ul className="space-y-1 text-xs">
                <li>• 每笔投资买入日期</li>
                <li>• 各笔投资成本</li>
                <li>• 当前组合市值</li>
                <li>• 使用牛顿迭代法计算内部收益率</li>
              </ul>
            </div>
            <button
              onClick={() => setShowXIRRDialog(false)}
              className="w-full mt-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 添加持仓浮动按钮 */}
      <button
        onClick={() => setShowAddDialog(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

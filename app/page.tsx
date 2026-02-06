'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Plus, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { db, Account, Investment } from '@/lib/db';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  // 数据状态
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载数据
  useEffect(() => {
    loadData();

    // 监听数据库变化，自动重新加载数据
    let unsubscribe: any;
    try {
      unsubscribe = (db as any).on('changes', (changes: any[]) => {
        // 检查是否有 accounts 或 investments 表的变化
        const hasRelevantChanges = changes.some(change =>
          change.table === 'accounts' || change.table === 'investments'
        );
        if (hasRelevantChanges) {
          console.log('检测到数据库变化，重新加载数据');
          loadData();
        }
      });
      console.log('数据库变化监听器已注册', unsubscribe);
    } catch (error) {
      console.error('注册数据库变化监听器失败:', error);
    }

    // 清理监听器
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      } else if (unsubscribe && typeof unsubscribe.unsubscribe === 'function') {
        unsubscribe.unsubscribe();
      } else {
        console.warn('无法清理数据库变化监听器，未找到取消订阅方法');
      }
    };
  }, []);

  const loadData = async () => {
    try {
      const [accountData, investmentData] = await Promise.all([
        db.accounts.toArray(),
        db.investments.toArray(),
      ]);
      setAccounts(accountData);
      setInvestments(investmentData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算资产数据
  // 流动资产：现金、支付宝、微信、银行卡
  const liquidAssets = accounts
    .filter(a => a.type === 'cash' || a.type === 'alipay' || a.type === 'wechat' || a.type === 'bank')
    .reduce((sum, a) => sum + a.balance, 0);

  // 投资分类市值计算
  const calculateInvestmentValue = (investment: Investment) => {
    const quantity = investment.quantity || 0;
    const currentPrice = investment.currentPrice || 0;
    return quantity * currentPrice;
  };

  const calculateInvestmentValue2 = (investment: Investment) => {
    if (investment.quantity && investment.currentPrice) {
      return investment.quantity * investment.currentPrice;
    }
    return investment.currentValue || 0;
  };

  // 按分类计算投资市值
  const stockValue = investments
    .filter(i => i.type === 'stock')
    .reduce((sum, i) => sum + calculateInvestmentValue2(i), 0);

  const fundValue = investments
    .filter(i => i.type === 'fund')
    .reduce((sum, i) => sum + calculateInvestmentValue2(i), 0);

  const bondValue = investments
    .filter(i => i.type === 'bond')
    .reduce((sum, i) => sum + calculateInvestmentValue2(i), 0);

  const usStockValue = investments
    .filter(i => i.type === 'us_stock')
    .reduce((sum, i) => sum + calculateInvestmentValue2(i), 0);

  // 固收类：理财、固收+、同业存单
  const fixedIncomeValue = investments
    .filter(i => i.type === 'wealth' || i.type === 'fixed_income' || i.type === 'cd')
    .reduce((sum, i) => sum + calculateInvestmentValue2(i), 0);

  // 另类投资：黄金、REITs、加密货币
  const alternativeValue = investments
    .filter(i => i.type === 'gold' || i.type === 'reits' || i.type === 'crypto')
    .reduce((sum, i) => sum + calculateInvestmentValue2(i), 0);

  const totalAssets = liquidAssets + stockValue + fundValue + bondValue + usStockValue + fixedIncomeValue + alternativeValue;

  // 资产配置数据（只显示有值的分类）
  const assetData = [
    { name: '流动资产', value: liquidAssets, color: '#3b82f6' },
    { name: '股票', value: stockValue, color: '#8b5cf6' },
    { name: '基金', value: fundValue, color: '#10b981' },
    { name: '债券', value: bondValue, color: '#f59e0b' },
    { name: '美股', value: usStockValue, color: '#ef4444' },
    { name: '固收', value: fixedIncomeValue, color: '#ec4899' },
    { name: '另类投资', value: alternativeValue, color: '#14b8a6' },
  ].filter(d => d.value > 0);

  const handleSubmit = () => {
    console.log('记账:', { accountId: selectedAccount, amount, type });
    setIsOpen(false);
    setSelectedAccount(null);
    setAmount('');
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="text-center py-20 text-black">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-black">概览</h1>
        <p className="text-sm text-black mt-1">资产总览</p>
      </header>

      {/* 总净值卡片 */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 mb-6">
        <p className="text-sm text-white/90 mb-2">总净值</p>
        <p className="text-5xl font-semibold mb-4 tracking-tight text-white">
          ¥ {totalAssets.toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-300" />
          <span className="text-green-300">
            {totalAssets > 0 ? '资产已更新' : '暂无资产'}
          </span>
          <span className="text-xs text-black">实时计算</span>
        </div>
      </div>

      {/* 资产配置饼图 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-base font-semibold text-black mb-4">资产配置</h2>
        {assetData.length > 0 ? (
          <>
            <div className="flex items-center justify-center">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetData}
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      cornerRadius={8}
                    >
                      {assetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => `¥ ${value ? value.toLocaleString() : '0'}`}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {assetData.map((item) => {
                const percent = totalAssets > 0 ? ((item.value / totalAssets) * 100).toFixed(0) : '0';
                return (
                  <div key={item.name} className="text-center">
                    <div
                      className="w-3 h-3 rounded-full mx-auto mb-1"
                      style={{ backgroundColor: item.color }}
                    />
                    <p className="text-xs text-black">{item.name}</p>
                    <p className="text-sm font-medium text-black">{percent}%</p>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-black">
            <p className="text-sm text-black">暂无资产数据</p>
          </div>
        )}
      </section>

      {/* 账户快速概览 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-base font-semibold text-black mb-4">账户概览</h2>
        {accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.slice(0, 4).map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">{account.name}</p>
                    <p className="text-xs text-black">{account.currency || 'CNY'}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-black">
                  ¥ {account.balance.toLocaleString()}
                </p>
              </div>
            ))}
            {accounts.length > 4 && (
              <p className="text-xs text-center text-black pt-2">
                还有 {accounts.length - 4} 个账户...
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-black">
            <p className="text-sm">暂无账户，点击右下角添加</p>
          </div>
        )}
      </section>

      {/* 快速记账按钮 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="fixed bottom-24 right-4 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
            <Plus className="w-6 h-6" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>快速记账</DialogTitle>
            <DialogDescription>选择账户并输入金额</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 收支类型选择 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'expense'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <ArrowUpRight
                  className={`w-6 h-6 mx-auto mb-2 ${
                    type === 'expense' ? 'text-red-500' : 'text-black'
                  }`}
                />
                <p className="font-medium">支出</p>
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'income'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <ArrowDownRight
                  className={`w-6 h-6 mx-auto mb-2 ${
                    type === 'income' ? 'text-green-500' : 'text-black'
                  }`}
                />
                <p className="font-medium">收入</p>
              </button>
            </div>

            {/* 账户选择 */}
            {accounts.length > 0 && (
              <div>
                <label className="text-sm font-medium text-black mb-2 block">
                  选择账户
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setSelectedAccount(account.id!)}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        selectedAccount === account.id
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-black">{account.name}</p>
                        <p className="text-xs text-black">
                          ¥ {account.balance.toLocaleString()}
                        </p>
                      </div>
                      {selectedAccount === account.id && (
                        <Check className="w-4 h-4 text-black" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 金额输入 */}
            <div>
              <label className="text-sm font-medium text-black mb-2 block">
                金额
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                  ¥
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* 提交按钮 */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedAccount || !amount}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                !selectedAccount || !amount
                  ? 'bg-gray-200 text-black cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              确认记账
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

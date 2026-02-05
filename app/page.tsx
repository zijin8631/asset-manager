'use client';

import { useState } from 'react';
import { Wallet2, TrendingUp, ArrowUpRight, ArrowDownRight, Plus, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const assetData = [
  { name: '现金', value: 45200, color: '#3b82f6' },
  { name: '银行卡', value: 25400, color: '#8b5cf6' },
  { name: '投资', value: 57856, color: '#10b981' },
];

const totalAssets = assetData.reduce((sum, item) => sum + item.value, 0);
const monthlyProfit = 2340;
const monthlyProfitPercent = 1.86;

const accounts = [
  { id: 1, name: '招商银行', balance: 25400 },
  { id: 2, name: '建设银行', balance: 12000 },
  { id: 3, name: '现金钱包', balance: 5800 },
  { id: 4, name: '投资账户', balance: 57856 },
];

const recentTransactions = [
  { id: 1, name: '工资收入', amount: 15000, date: '今天 10:30', type: 'income' },
  { id: 2, name: '超市购物', amount: 328.5, date: '昨天 18:20', type: 'expense' },
  { id: 3, name: '股票买入', amount: 5000, date: '昨天 14:00', type: 'expense' },
];

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const handleSubmit = () => {
    console.log('记账:', { accountId: selectedAccount, amount, type });
    setIsOpen(false);
    setSelectedAccount(null);
    setAmount('');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">概览</h1>
        <p className="text-sm text-gray-500 mt-1">资产总览</p>
      </header>

      {/* 总净值卡片 */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 mb-6 text-white">
        <p className="text-sm text-gray-400 mb-2">总净值</p>
        <p className="text-5xl font-semibold mb-4 tracking-tight">
          ¥ {totalAssets.toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          {monthlyProfit >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <ArrowUpRight className="w-4 h-4 text-red-400" />
          )}
          <span className={monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
            {monthlyProfit >= 0 ? '+' : ''}
            {monthlyProfit.toLocaleString()} ({monthlyProfitPercent}%)
          </span>
          <span className="text-xs text-gray-500">本月盈亏</span>
        </div>
      </div>

      {/* 资产配置饼图 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">资产配置</h2>
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
                  formatter={(value: number) => `¥ ${value.toLocaleString()}`}
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
            const percent = ((item.value / totalAssets) * 100).toFixed(0);
            return (
              <div key={item.name} className="text-center">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-xs text-gray-500">{item.name}</p>
                <p className="text-sm font-medium">{percent}%</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 最近交易 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近交易</h2>
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.name}</p>
                    <p className="text-xs text-gray-500">{tx.date}</p>
                  </div>
                </div>
                <p
                  className={`font-semibold ${
                    tx.type === 'income' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}¥ {tx.amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
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
                    type === 'expense' ? 'text-red-500' : 'text-gray-400'
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
                    type === 'income' ? 'text-green-500' : 'text-gray-400'
                  }`}
                />
                <p className="font-medium">收入</p>
              </button>
            </div>

            {/* 账户选择 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                选择账户
              </label>
              <div className="grid grid-cols-2 gap-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedAccount(account.id)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      selectedAccount === account.id
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Wallet2 className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-gray-500">
                        ¥ {account.balance.toLocaleString()}
                      </p>
                    </div>
                    {selectedAccount === account.id && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 金额输入 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                金额
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
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
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
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

'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Wallet, Landmark, Plus, Edit2, Trash2, Smartphone, WalletCards, TrendingUp, Coins, BadgeDollarSign, PiggyBank, DollarSign } from 'lucide-react';
import { db, Account, AccountType, Investment, InvestmentType } from '@/lib/db';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// 账户类型配置
const ACCOUNT_TYPES: { value: AccountType; label: string; icon: any; category: string }[] = [
  { value: 'cash', label: '现金', icon: Wallet, category: '现金' },
  { value: 'alipay', label: '支付宝', icon: Smartphone, category: '现金' },
  { value: 'wechat', label: '微信支付', icon: WalletCards, category: '现金' },
  { value: 'bank', label: '银行卡', icon: CreditCard, category: '银行' },
  { value: 'security', label: '证券账户', icon: Landmark, category: '证券' },
];

// 按分类分组账户类型
const ACCOUNT_CATEGORIES = [
  { name: '现金', types: ['cash', 'alipay', 'wechat'] as AccountType[] },
  { name: '银行', types: ['bank'] as AccountType[] },
  { name: '证券', types: ['security'] as AccountType[] },
];

// 投资类型配置（从投资页面复制）
const INVESTMENT_TYPES: { value: InvestmentType; label: string; icon: any; category: string; hasQuantity: boolean }[] = [
  { value: 'stock', label: '股票', icon: TrendingUp, category: '股票', hasQuantity: true },
  { value: 'fund', label: '基金', icon: BadgeDollarSign, category: '基金', hasQuantity: true },
  { value: 'us_stock', label: '美股', icon: TrendingUp, category: '美股', hasQuantity: true },
  { value: 'bond', label: '债券', icon: Landmark, category: '债券', hasQuantity: true },
  { value: 'cd', label: '同业存单', icon: Landmark, category: '固收', hasQuantity: false },
  { value: 'gold', label: '黄金', icon: Coins, category: '另类投资', hasQuantity: false },
  { value: 'wealth', label: '理财', icon: Wallet, category: '固收', hasQuantity: false },
  { value: 'fixed_income', label: '固收+', icon: PiggyBank, category: '固收', hasQuantity: false },
  { value: 'reits', label: 'REITs', icon: DollarSign, category: '另类投资', hasQuantity: true },
  { value: 'crypto', label: '加密货币', icon: Coins, category: '另类投资', hasQuantity: true },
];

// 按分类分组投资类型
const INVESTMENT_CATEGORIES = [
  { name: '股票', types: ['stock'] as InvestmentType[] },
  { name: '基金', types: ['fund'] as InvestmentType[] },
  { name: '债券', types: ['bond'] as InvestmentType[] },
  { name: '美股', types: ['us_stock'] as InvestmentType[] },
  { name: '固收', types: ['cd', 'wealth', 'fixed_income'] as InvestmentType[] },
  { name: '另类投资', types: ['gold', 'reits', 'crypto'] as InvestmentType[] },
];

// 投资分类图标映射
const INVESTMENT_CATEGORY_ICONS: Record<string, any> = {
  '股票': TrendingUp,
  '基金': BadgeDollarSign,
  '债券': Landmark,
  '美股': TrendingUp,
  '固收': PiggyBank,
  '另类投资': Coins,
};

// 分类图标映射
const CATEGORY_ICONS: Record<string, any> = {
  '现金': Wallet,
  '银行': CreditCard,
  '证券': Landmark,
  '投资': TrendingUp,
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash' as AccountType,
    balance: 0,
    currency: 'CNY',
  });

  // 加载账户数据
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const [accountData, investmentData] = await Promise.all([
        db.accounts.orderBy('createdAt').reverse().toArray(),
        db.investments.orderBy('createdAt').reverse().toArray(),
      ]);
      setAccounts(accountData);
      setInvestments(investmentData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalInvestmentValue = investments.reduce((sum, inv) => {
    if (inv.quantity && inv.currentPrice) {
      return sum + inv.quantity * inv.currentPrice;
    }
    return sum + (inv.currentValue || 0);
  }, 0);
  const totalAssets = totalBalance + totalInvestmentValue;

  // 按分类计算余额
  const getCategoryBalance = (categoryName: string) => {
    const category = ACCOUNT_CATEGORIES.find(c => c.name === categoryName);
    if (!category) return 0;
    return accounts
      .filter(acc => category.types.includes(acc.type))
      .reduce((sum, acc) => sum + acc.balance, 0);
  };

  // 获取分类下的账户
  const getCategoryAccounts = (categoryName: string) => {
    const category = ACCOUNT_CATEGORIES.find(c => c.name === categoryName);
    if (!category) return [];
    return accounts.filter(acc => category.types.includes(acc.type));
  };

  // 计算投资总成本和总收益
  const getInvestmentStats = () => {
    let totalCost = 0;
    let totalValue = 0;
    let totalProfit = 0;

    investments.forEach(inv => {
      // 计算当前价值
      let currentValue = 0;
      if (inv.quantity && inv.currentPrice) {
        currentValue = inv.quantity * inv.currentPrice;
      } else {
        currentValue = inv.currentValue || 0;
      }

      const cost = inv.totalBuyAmount || 0;

      totalCost += cost;
      totalValue += currentValue;
      totalProfit += (currentValue - cost);
    });

    return { totalCost, totalValue, totalProfit };
  };

  // 获取投资类型配置
  const getInvestmentType = (type: InvestmentType) => {
    return INVESTMENT_TYPES.find(t => t.value === type) || INVESTMENT_TYPES[0];
  };

  // 按分类获取持仓
  const getCategoryInvestments = (categoryName: string) => {
    const category = INVESTMENT_CATEGORIES.find(c => c.name === categoryName);
    if (!category) return [];
    return investments.filter(inv => category.types.includes(inv.type));
  };

  // 计算分类收益
  const getCategoryInvestmentStats = (categoryName: string) => {
    const categoryInvestments = getCategoryInvestments(categoryName);
    const value = categoryInvestments.reduce((sum, inv) => {
      if (inv.quantity && inv.currentPrice) {
        return sum + inv.quantity * inv.currentPrice;
      }
      return sum + (inv.currentValue || 0);
    }, 0);
    const cost = categoryInvestments.reduce((sum, inv) => sum + (inv.totalBuyAmount || 0), 0);
    return { value, cost, profit: value - cost };
  };

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency || 'CNY',
      });
    } else {
      setEditingAccount(null);
      setFormData({ name: '', type: 'cash', balance: 0, currency: 'CNY' });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingAccount(null);
    setFormData({ name: '', type: 'cash', balance: 0, currency: 'CNY' });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingAccount) {
        await db.accounts.update(editingAccount.id!, {
          name: formData.name,
          type: formData.type,
          balance: formData.balance,
          currency: formData.currency,
          updatedAt: new Date(),
        });
      } else {
        await db.accounts.add({
          name: formData.name,
          type: formData.type,
          balance: formData.balance,
          currency: formData.currency,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      loadAccounts();
      handleCloseDialog();
    } catch (error) {
      console.error('保存账户失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个账户吗？')) return;

    try {
      await db.accounts.delete(id);
      loadAccounts();
    } catch (error) {
      console.error('删除账户失败:', error);
    }
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
        <h1 className="text-2xl font-semibold text-black">资产</h1>
        <p className="text-sm text-black mt-1">共 {accounts.length + investments.length} 个资产</p>
      </header>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
        <p className="text-sm text-blue-100 mb-1">总资产</p>
        <p className="text-4xl font-semibold">¥ {totalAssets.toLocaleString()}</p>
      </div>

      {/* 按分类展示账户 */}
      <div className="space-y-6">
        {ACCOUNT_CATEGORIES.map((category) => {
          const categoryAccounts = getCategoryAccounts(category.name);
          const categoryBalance = getCategoryBalance(category.name);
          const CategoryIcon = CATEGORY_ICONS[category.name];

          if (categoryAccounts.length === 0) return null;

          return (
            <div key={category.name} className="space-y-3">
              {/* 分类标题 */}
              <div className="flex items-center gap-2 px-1">
                <CategoryIcon className="w-4 h-4 text-black" />
                <span className="text-sm font-medium text-black">{category.name}</span>
                <span className="text-sm text-black ml-auto">¥ {categoryBalance.toLocaleString()}</span>
              </div>

              {/* 该分类下的账户 */}
              {categoryAccounts.map((account) => {
                const typeConfig = ACCOUNT_TYPES.find(t => t.value === account.type) || ACCOUNT_TYPES[0];
                const Icon = typeConfig.icon;

                return (
                  <div
                    key={account.id}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <p className="font-semibold text-black">{account.name}</p>
                          <p className="text-xs text-black">{typeConfig.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-semibold text-black">
                          ¥ {account.balance.toLocaleString()}
                        </p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenDialog(account)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4 text-black" />
                          </button>
                          <button
                            onClick={() => handleDelete(account.id!)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4 text-black hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* 投资部分 - 按分类显示 */}
        {INVESTMENT_CATEGORIES.map((category) => {
          const categoryInvestments = getCategoryInvestments(category.name);
          const stats = getCategoryInvestmentStats(category.name);
          const CategoryIcon = INVESTMENT_CATEGORY_ICONS[category.name];

          if (categoryInvestments.length === 0) return null;

          return (
            <div key={category.name} className="space-y-3">
              {/* 分类标题 */}
              <div className="flex items-center gap-2 px-1">
                <CategoryIcon className="w-4 h-4 text-black" />
                <span className="text-sm font-medium text-black">{category.name}</span>
                <span className="text-sm text-black ml-auto">¥ {stats.value.toLocaleString()}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  stats.profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stats.profit >= 0 ? '+' : ''}{stats.profit.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </div>

              {/* 该分类下的投资汇总卡片 */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                      <CategoryIcon className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <p className="font-semibold text-black">{category.name}</p>
                      <p className="text-xs text-black">共 {categoryInvestments.length} 个持仓</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-black">¥ {stats.value.toLocaleString()}</p>
                    <p className={`text-xs ${stats.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {stats.profit >= 0 ? '+' : ''}¥ {stats.profit.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-black mb-1">总投入</p>
                    <p className="font-medium text-black">¥ {stats.cost.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-black mb-1">收益率</p>
                    <p className={`font-medium ${stats.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {stats.cost > 0 ? ((stats.profit / stats.cost) * 100).toFixed(2) : '0.00'}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && investments.length === 0 && (
        <div className="text-center py-20 text-black">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-black" />
          <p className="text-black">暂无资产，点击右下角添加账户</p>
        </div>
      )}

      {/* 添加/编辑账户按钮 */}
      <button
        onClick={() => handleOpenDialog()}
        className="fixed bottom-24 right-4 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 添加/编辑账户对话框 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAccount ? '编辑账户' : '添加账户'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">账户名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如: 招商银行"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">账户类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              >
                {ACCOUNT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">余额</label>
              <input
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                placeholder="0.00"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">币种</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              >
                <option value="CNY">CNY - 人民币</option>
                <option value="USD">USD - 美元</option>
                <option value="EUR">EUR - 欧元</option>
                <option value="HKD">HKD - 港币</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={handleCloseDialog}
              className="px-4 py-2 text-black hover:bg-gray-100 rounded-xl"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800"
            >
              {editingAccount ? '保存' : '添加'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

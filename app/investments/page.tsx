'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Calculator,
  Edit2,
  Trash2,
  DollarSign,
  Landmark,
  PiggyBank,
  Wallet,
  Coins,
  BadgeDollarSign,
  Minus,
  Calendar,
} from 'lucide-react';
import { db, Investment, InvestmentType, InvestmentTransaction } from '@/lib/db';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// 投资类型配置
const INVESTMENT_TYPES: { value: InvestmentType; label: string; icon: any; category: string; hasQuantity: boolean }[] = [
  { value: 'stock', label: '股票', icon: TrendingUp, category: '权益类', hasQuantity: true },
  { value: 'fund', label: '基金', icon: BadgeDollarSign, category: '权益类', hasQuantity: true },
  { value: 'us_stock', label: '美股', icon: TrendingUp, category: '权益类', hasQuantity: true },
  { value: 'bond', label: '债券', icon: Landmark, category: '固收类', hasQuantity: true },
  { value: 'cd', label: '同业存单', icon: Landmark, category: '固收类', hasQuantity: false },
  { value: 'gold', label: '黄金', icon: Coins, category: '另类投资', hasQuantity: false },
  { value: 'wealth', label: '理财', icon: Wallet, category: '固收类', hasQuantity: false },
  { value: 'fixed_income', label: '固收+', icon: PiggyBank, category: '固收类', hasQuantity: false },
  { value: 'reits', label: 'REITs', icon: DollarSign, category: '另类投资', hasQuantity: true },
  { value: 'crypto', label: '加密货币', icon: Coins, category: '另类投资', hasQuantity: true },
];

// 按分类分组
const INVESTMENT_CATEGORIES = [
  { name: '权益类', types: ['stock', 'fund', 'us_stock'] as InvestmentType[] },
  { name: '固收类', types: ['bond', 'cd', 'wealth', 'fixed_income'] as InvestmentType[] },
  { name: '另类投资', types: ['gold', 'reits', 'crypto'] as InvestmentType[] },
];

// 债券子分类
const BOND_SUBTYPES = [
  { value: 'long', label: '长债' },
  { value: 'short', label: '短债' },
  { value: 'corporate', label: '企业债' },
  { value: 'government', label: '国债' },
  { value: 'convertible', label: '可转债' },
];

// 基金字分类
const FUND_SUBTYPES = [
  { value: 'stock', label: '股票基金' },
  { value: 'bond', label: '债券基金' },
  { value: 'mixed', label: '混合基金' },
  { value: 'money_market', label: '货币基金' },
  { value: 'index', label: '指数基金' },
  { value: 'etf', label: 'ETF' },
];

// 分类图标映射
const CATEGORY_ICONS: Record<string, any> = {
  '权益类': TrendingUp,
  '固收类': Landmark,
  '另类投资': Coins,
};

// 持仓类型（带 ID 用于编辑）
interface InvestmentWithId extends Investment {
  id: number;
}

// 表单数据类型
interface FormData {
  type: InvestmentType;
  symbol: string;
  name: string;
  subType: string;
  buyAmount: number;
  currentValue: number;
  purchaseDate: string;
  // 数量相关（股票/基金/债券）
  quantity: number;
  price: number;
}

export default function Investments() {
  const [investments, setInvestments] = useState<InvestmentWithId[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [showXIRRDialog, setShowXIRRDialog] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<InvestmentWithId | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');

  // 添加表单数据
  const [addFormData, setAddFormData] = useState<FormData>({
    type: 'stock',
    symbol: '',
    name: '',
    subType: '',
    buyAmount: 0,
    currentValue: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    quantity: 0,
    price: 0,
  });

  // 编辑表单数据
  const [editFormData, setEditFormData] = useState<FormData>({
    type: 'stock',
    symbol: '',
    name: '',
    subType: '',
    buyAmount: 0,
    currentValue: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    quantity: 0,
    price: 0,
  });

  // 交易表单数据
  const [tradeFormData, setTradeFormData] = useState({
    amount: 0,
    quantity: 0,
    price: 0,
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  // 加载持仓数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const invData = await db.investments.orderBy('createdAt').reverse().toArray();
      const transData = await db.investmentTransactions.orderBy('date').reverse().toArray();
      setInvestments(invData.map(inv => ({ ...inv, id: inv.id! })));
      setTransactions(transData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算总成本、总市值
  const totalCost = investments.reduce((sum, inv) => sum + (inv.totalBuyAmount || 0), 0);
  const totalValue = investments.reduce((sum, inv) => {
    if (inv.quantity && inv.currentPrice) {
      return sum + inv.quantity * inv.currentPrice;
    }
    return sum + (inv.currentValue || 0);
  }, 0);
  const totalProfit = investments.reduce((sum, inv) => sum + (inv.totalProfit || 0), 0);
  const profitPercent = totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(2) : '0.00';

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
  const getCategoryStats = (categoryName: string) => {
    const categoryInvestments = getCategoryInvestments(categoryName);
    const value = categoryInvestments.reduce((sum, inv) => {
      if (inv.quantity && inv.currentPrice) {
        return sum + inv.quantity * inv.currentPrice;
      }
      return sum + (inv.currentValue || 0);
    }, 0);
    const cost = categoryInvestments.reduce((sum, inv) => sum + (inv.totalBuyAmount || 0), 0);
    return { value, profit: value - cost };
  };

  // 检查是否有数量类型
  const hasQuantityType = (type: InvestmentType) => {
    return getInvestmentType(type).hasQuantity;
  };

  // 打开添加对话框
  const handleOpenAddDialog = () => {
    setAddFormData({
      type: 'stock',
      symbol: '',
      name: '',
      subType: '',
      buyAmount: 0,
      currentValue: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      quantity: 0,
      price: 0,
    });
    setShowAddDialog(true);
  };

  // 打开编辑对话框
  const handleOpenEditDialog = (investment: InvestmentWithId) => {
    setSelectedInvestment(investment);

    // 计算正确的价格字段：优先使用平均成本价，其次使用当前价格
    const price = investment.avgCostPrice || investment.currentPrice || 0;

    // 计算当前价值：如果有数量和当前价格则计算，否则使用存储的当前价值
    let currentValue = investment.currentValue || 0;
    if (investment.quantity && investment.currentPrice) {
      currentValue = investment.quantity * investment.currentPrice;
    }

    // 计算买入金额：如果有总买入金额则使用，否则根据数量和价格计算
    let buyAmount = investment.totalBuyAmount || 0;
    if (investment.quantity && price > 0 && buyAmount === 0) {
      buyAmount = investment.quantity * price;
    }

    setEditFormData({
      type: investment.type,
      symbol: investment.symbol,
      name: investment.name,
      subType: investment.subType || '',
      buyAmount,
      currentValue,
      purchaseDate: investment.purchaseDate
        ? investment.purchaseDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      quantity: investment.quantity || 0,
      price,
    });
    setShowEditDialog(true);
  };

  // 打开交易对话框
  const handleOpenTradeDialog = (investment: InvestmentWithId, type: 'buy' | 'sell') => {
    setSelectedInvestment(investment);
    setTradeType(type);
    setTradeFormData({
      amount: 0,
      quantity: 0,
      price: 0,
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setShowTradeDialog(true);
  };

  // 保存添加
  const handleSaveAdd = async () => {
    if (!addFormData.name.trim()) return;

    const typeConfig = getInvestmentType(addFormData.type);
    const purchaseDate = new Date(addFormData.purchaseDate);

    // 计算买入金额、当前价值、收益等
    let buyAmount = addFormData.buyAmount;
    let currentValue = addFormData.currentValue;
    let profit = currentValue - buyAmount;
    let yieldRate = buyAmount > 0 ? (profit / buyAmount) * 100 : 0;

    // 对于有数量的类型，根据份额和单价计算
    if (typeConfig.hasQuantity) {
      if (addFormData.quantity > 0 && addFormData.price > 0) {
        // 使用输入的价格作为平均成本价
        buyAmount = addFormData.quantity * addFormData.price;
        // 如果当前价值未输入，默认为买入金额（无收益）
        if (currentValue === 0) {
          currentValue = buyAmount;
        }
        profit = currentValue - buyAmount;
        yieldRate = buyAmount > 0 ? (profit / buyAmount) * 100 : 0;
      }
    }

    try {
      // 创建持仓
      const invId = await db.investments.add({
        type: addFormData.type,
        symbol: addFormData.symbol,
        name: addFormData.name,
        subType: addFormData.subType,
        currency: 'CNY',
        purchaseDate,
        lastUpdated: new Date(),
        createdAt: new Date(),
      });

      // 记录初始买入交易
      await db.investmentTransactions.add({
        investmentId: invId,
        type: 'buy',
        amount: buyAmount,
        quantity: typeConfig.hasQuantity ? addFormData.quantity : undefined,
        price: typeConfig.hasQuantity ? addFormData.price : undefined,
        date: purchaseDate,
        createdAt: new Date(),
      });

      // 更新持仓数据
      const updateData: any = {
        totalBuyAmount: buyAmount,
        totalProfit: profit,
        yieldRate,
      };

      if (typeConfig.hasQuantity) {
        // 计算当前单价：当前价值 / 持有份额
        const currentPrice = addFormData.quantity > 0 ? currentValue / addFormData.quantity : 0;
        updateData.quantity = addFormData.quantity;
        updateData.avgCostPrice = addFormData.price;
        updateData.currentPrice = currentPrice;
        updateData.currentValue = currentValue;
      } else {
        // 无数量类型
        updateData.totalCost = buyAmount;
        updateData.currentValue = currentValue;
      }

      await db.investments.update(invId, updateData);

      loadData();
      setShowAddDialog(false);
    } catch (error) {
      console.error('添加持仓失败:', error);
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!selectedInvestment || !editFormData.name.trim()) return;

    const typeConfig = getInvestmentType(editFormData.type);

    // 计算买入金额、当前价值、收益等
    let buyAmount = editFormData.buyAmount;
    let currentValue = editFormData.currentValue;
    let profit = currentValue - buyAmount;
    let yieldRate = buyAmount > 0 ? (profit / buyAmount) * 100 : 0;

    // 对于有数量的类型，根据份额和单价计算
    if (typeConfig.hasQuantity) {
      if (editFormData.quantity > 0 && editFormData.price > 0) {
        // 使用输入的价格作为平均成本价
        buyAmount = editFormData.quantity * editFormData.price;
        // 如果当前价值未输入，默认为买入金额（无收益）
        if (currentValue === 0) {
          currentValue = buyAmount;
        }
        profit = currentValue - buyAmount;
        yieldRate = buyAmount > 0 ? (profit / buyAmount) * 100 : 0;
      }
    }

    try {
      const updateData: any = {
        type: editFormData.type,
        symbol: editFormData.symbol,
        name: editFormData.name,
        subType: editFormData.subType,
        purchaseDate: new Date(editFormData.purchaseDate),
        totalBuyAmount: buyAmount,
        totalProfit: profit,
        yieldRate,
        lastUpdated: new Date(),
      };

      if (typeConfig.hasQuantity) {
        // 计算当前单价：当前价值 / 持有份额
        const currentPrice = editFormData.quantity > 0 ? currentValue / editFormData.quantity : 0;
        updateData.quantity = editFormData.quantity;
        updateData.avgCostPrice = editFormData.price;
        updateData.currentPrice = currentPrice;
        updateData.currentValue = currentValue;
      } else {
        // 无数量类型
        updateData.totalCost = buyAmount;
        updateData.currentValue = currentValue;
      }

      await db.investments.update(selectedInvestment.id, updateData);

      loadData();
      setShowEditDialog(false);
    } catch (error) {
      console.error('编辑持仓失败:', error);
    }
  };

  // 保存交易
  const handleSaveTrade = async () => {
    if (!selectedInvestment || tradeFormData.amount <= 0) return;

    const typeConfig = getInvestmentType(selectedInvestment.type);
    const tradeDate = new Date(tradeFormData.date);

    try {
      // 记录交易
      await db.investmentTransactions.add({
        investmentId: selectedInvestment.id,
        type: tradeType,
        amount: tradeFormData.amount,
        quantity: typeConfig.hasQuantity ? tradeFormData.quantity : undefined,
        price: typeConfig.hasQuantity ? tradeFormData.price : undefined,
        date: tradeDate,
        note: tradeFormData.note,
        createdAt: new Date(),
      });

      // 更新持仓数据
      const currentInv = investments.find(i => i.id === selectedInvestment.id);
      if (currentInv) {
        const totalBuyAmount = (currentInv.totalBuyAmount || 0) + (tradeType === 'buy' ? tradeFormData.amount : 0);
        const totalSellAmount = (currentInv.totalSellAmount || 0) + (tradeType === 'sell' ? tradeFormData.amount : 0);

        if (typeConfig.hasQuantity) {
          // 有数量的类型（股票/基金/债券）
          const currentQuantity = currentInv.quantity || 0;
          const newQuantity = tradeType === 'buy'
            ? currentQuantity + (tradeFormData.quantity || 0)
            : currentQuantity - (tradeFormData.quantity || 0);

          // 重新计算平均成本价
          const avgCostPrice = tradeType === 'buy'
            ? ((currentQuantity * (currentInv.avgCostPrice || 0)) + (tradeFormData.quantity || 0) * (tradeFormData.price || 0)) / newQuantity
            : currentInv.avgCostPrice;

          const currentPrice = tradeFormData.price || currentInv.currentPrice || 0;
          const currentValue = newQuantity * currentPrice;
          const totalCost = totalBuyAmount - totalSellAmount;
          const totalProfit = currentValue - totalCost;
          const yieldRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

          await db.investments.update(selectedInvestment.id, {
            quantity: newQuantity,
            avgCostPrice,
            currentPrice,
            currentValue,
            totalBuyAmount,
            totalSellAmount,
            totalProfit,
            yieldRate,
            lastUpdated: new Date(),
          });
        } else {
          // 纯金额类型（理财/固收等）
          const currentCost = currentInv.totalCost || 0;
          const currentValue = tradeType === 'buy'
            ? currentCost + tradeFormData.amount
            : currentCost - tradeFormData.amount;

          const totalCost = totalBuyAmount - totalSellAmount;
          const totalProfit = currentValue - totalCost;
          const yieldRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

          await db.investments.update(selectedInvestment.id, {
            totalCost: currentValue,
            currentValue,
            totalBuyAmount,
            totalSellAmount,
            totalProfit,
            yieldRate,
            lastUpdated: new Date(),
          });
        }
      }

      loadData();
      setShowTradeDialog(false);
    } catch (error) {
      console.error('交易失败:', error);
    }
  };

  // 删除持仓
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个持仓吗？')) return;

    try {
      await db.investments.delete(id);
      // 同时删除相关交易记录
      await db.investmentTransactions.where('investmentId').equals(id).delete();
      loadData();
    } catch (error) {
      console.error('删除持仓失败:', error);
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
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">投资</h1>
          <div className="text-sm text-black mt-1">共 {investments.length} 个持仓</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowXIRRDialog(true)}
            className="p-2 rounded-full hover:bg-gray-100"
            title="查看收益率"
          >
            <Calculator className="w-5 h-5 text-black" />
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

      {/* 按分类展示持仓 */}
      <div className="space-y-6">
        {INVESTMENT_CATEGORIES.map((category) => {
          const categoryInvestments = getCategoryInvestments(category.name);
          const stats = getCategoryStats(category.name);
          const CategoryIcon = CATEGORY_ICONS[category.name];

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

              {/* 该分类下的持仓 */}
              {categoryInvestments.map((inv) => {
                const typeConfig = getInvestmentType(inv.type);
                const Icon = typeConfig.icon;
                const hasQuantity = typeConfig.hasQuantity;

                let value: number;
                if (hasQuantity && inv.quantity && inv.currentPrice) {
                  value = inv.quantity * inv.currentPrice;
                } else {
                  value = inv.currentValue || 0;
                }

                const cost = inv.totalBuyAmount || 0;
                const profit = inv.totalProfit || 0;
                const yieldRate = inv.yieldRate || 0;

                return (
                  <div
                    key={inv.id}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-black" />
                        </div>
                        <div>
                          <p className="font-semibold text-black">{inv.name}</p>
                          <p className="text-xs text-black">
                            {inv.symbol} {inv.subType && `· ${inv.subType}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditDialog(inv)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4 text-black hover:text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleOpenTradeDialog(inv, 'buy')}
                          className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                          title="加仓"
                        >
                          <Plus className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => handleOpenTradeDialog(inv, 'sell')}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="减仓"
                        >
                          <Minus className="w-4 h-4 text-red-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-black hover:text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* 持仓信息 */}
                    {hasQuantity && inv.quantity ? (
                      <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-xs text-black mb-1">持仓</p>
                          <p className="font-medium text-black">{inv.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-black mb-1">均价</p>
                          <p className="font-medium text-black">¥ {inv.avgCostPrice?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-black mb-1">现价</p>
                          <p className="font-medium text-black">¥ {inv.currentPrice?.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-black mb-1">市值</p>
                          <p className="font-medium text-black">¥ {value.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-xs text-black mb-1">投入</p>
                          <p className="font-medium text-black">¥ {inv.totalCost?.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-black mb-1">当前价值</p>
                          <p className="font-medium text-black">¥ {inv.currentValue?.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
                        </div>
                      </div>
                    )}

                    {/* 收益信息 */}
                    <div className={`flex items-center justify-between pt-3 border-t border-gray-100 ${
                      profit >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      <span className="text-xs">收益率</span>
                      <span className="font-medium">
                        {yieldRate >= 0 ? '+' : ''}{yieldRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {investments.length === 0 && (
        <div className="text-center py-20 text-black">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-black" />
          <p>暂无持仓，点击右下角添加</p>
        </div>
      )}

      {/* 添加持仓浮动按钮 */}
      <button
        onClick={handleOpenAddDialog}
        className="fixed bottom-24 right-4 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 添加持仓对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加持仓</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">投资类型</label>
              <select
                value={addFormData.type}
                onChange={(e) => setAddFormData({ ...addFormData, type: e.target.value as InvestmentType })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              >
                {INVESTMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">名称</label>
              <input
                type="text"
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                placeholder="例如: 易方达蓝筹精选"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">代码/标识</label>
              <input
                type="text"
                value={addFormData.symbol}
                onChange={(e) => setAddFormData({ ...addFormData, symbol: e.target.value })}
                placeholder="例如: 005827"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              />
            </div>

            {/* 债券子分类 */}
            {addFormData.type === 'bond' && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">债券类型</label>
                <select
                  value={addFormData.subType}
                  onChange={(e) => setAddFormData({ ...addFormData, subType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                >
                  <option value="">请选择</option>
                  {BOND_SUBTYPES.map(sub => (
                    <option key={sub.value} value={sub.value}>{sub.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 基金字分类 */}
            {addFormData.type === 'fund' && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">基金类型</label>
                <select
                  value={addFormData.subType}
                  onChange={(e) => setAddFormData({ ...addFormData, subType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                >
                  <option value="">请选择</option>
                  {FUND_SUBTYPES.map(sub => (
                    <option key={sub.value} value={sub.value}>{sub.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 数量和单价（股票/基金/债券/美股/REITs/加密货币） */}
            {hasQuantityType(addFormData.type) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">持有份额</label>
                  <input
                    type="number"
                    value={addFormData.quantity}
                    onChange={(e) => {
                      const quantity = Number(e.target.value);
                      // 如果买入金额已设置，重新计算单价；否则重新计算买入金额
                      let price = addFormData.price;
                      let buyAmount = addFormData.buyAmount;
                      if (addFormData.buyAmount > 0 && quantity > 0) {
                        // 优先保持买入金额不变，重新计算单价
                        price = addFormData.buyAmount / quantity;
                      } else if (addFormData.price > 0) {
                        // 保持单价不变，重新计算买入金额
                        buyAmount = quantity * addFormData.price;
                      }
                      setAddFormData({
                        ...addFormData,
                        quantity,
                        price,
                        buyAmount,
                      });
                    }}
                    placeholder="例如: 1000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">成本单价</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addFormData.price}
                    onChange={(e) => {
                      const price = Number(e.target.value);
                      const buyAmount = addFormData.quantity * price;
                      setAddFormData({
                        ...addFormData,
                        price,
                        buyAmount,
                      });
                    }}
                    placeholder="例如: 1.23"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                  />
                  <p className="text-xs text-black mt-1">
                    自动计算买入金额：持有份额 × 成本单价 = {addFormData.quantity * addFormData.price}
                  </p>
                </div>
              </>
            )}

            {/* 当前价值（自动显示） */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">当前价值</label>
              <input
                type="number"
                step="0.01"
                value={addFormData.currentValue}
                onChange={(e) => setAddFormData({ ...addFormData, currentValue: Number(e.target.value) })}
                placeholder={hasQuantityType(addFormData.type) ? "例如: 10500（持有收益+买入金额）" : "例如: 10500"}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              />
              <p className="text-xs text-black mt-1">
                {hasQuantityType(addFormData.type)
                  ? `系统自动计算：当前单价 = 当前价值 ÷ 持有份额 = ${addFormData.quantity > 0 ? (addFormData.currentValue / addFormData.quantity).toFixed(2) : '0.00'}，收益 = 当前价值 - 买入金额`
                  : '当前价值 = 买入金额 + 持有收益'
                }
              </p>
            </div>

            {/* 买入金额（可编辑，与单价联动） */}
            {hasQuantityType(addFormData.type) && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">买入金额</label>
                <input
                  type="number"
                  step="0.01"
                  value={addFormData.buyAmount}
                  onChange={(e) => {
                    const buyAmount = Number(e.target.value);
                    const price = addFormData.quantity > 0 ? buyAmount / addFormData.quantity : 0;
                    setAddFormData({
                      ...addFormData,
                      buyAmount,
                      price,
                    });
                  }}
                  placeholder="例如: 10000"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                />
                <p className="text-xs text-black mt-1">
                  自动计算单价：买入金额 ÷ 持有份额 = {addFormData.quantity > 0 ? (addFormData.buyAmount / addFormData.quantity).toFixed(2) : '0.00'}
                </p>
              </div>
            )}

            {/* 购买时间 */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">购买时间</label>
              <div className="relative">
                <input
                  type="date"
                  value={addFormData.purchaseDate}
                  onChange={(e) => setAddFormData({ ...addFormData, purchaseDate: e.target.value })}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowAddDialog(false)}
              className="px-4 py-2 text-black hover:bg-gray-100 rounded-xl"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveAdd}
              className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800"
            >
              添加
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑持仓对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑持仓</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">投资类型</label>
              <select
                value={editFormData.type}
                onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as InvestmentType })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              >
                {INVESTMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">名称</label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">代码/标识</label>
              <input
                type="text"
                value={editFormData.symbol}
                onChange={(e) => setEditFormData({ ...editFormData, symbol: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              />
            </div>

            {/* 债券子分类 */}
            {editFormData.type === 'bond' && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">债券类型</label>
                <select
                  value={editFormData.subType}
                  onChange={(e) => setEditFormData({ ...editFormData, subType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                >
                  <option value="">请选择</option>
                  {BOND_SUBTYPES.map(sub => (
                    <option key={sub.value} value={sub.value}>{sub.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 基金字分类 */}
            {editFormData.type === 'fund' && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">基金类型</label>
                <select
                  value={editFormData.subType}
                  onChange={(e) => setEditFormData({ ...editFormData, subType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                >
                  <option value="">请选择</option>
                  {FUND_SUBTYPES.map(sub => (
                    <option key={sub.value} value={sub.value}>{sub.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 数量和单价（股票/基金/债券/美股/REITs/加密货币） */}
            {hasQuantityType(editFormData.type) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">持有份额</label>
                  <input
                    type="number"
                    value={editFormData.quantity}
                    onChange={(e) => {
                      const quantity = Number(e.target.value);
                      // 如果买入金额已设置，重新计算单价；否则重新计算买入金额
                      let price = editFormData.price;
                      let buyAmount = editFormData.buyAmount;
                      if (editFormData.buyAmount > 0 && quantity > 0) {
                        // 优先保持买入金额不变，重新计算单价
                        price = editFormData.buyAmount / quantity;
                      } else if (editFormData.price > 0) {
                        // 保持单价不变，重新计算买入金额
                        buyAmount = quantity * editFormData.price;
                      }
                      setEditFormData({
                        ...editFormData,
                        quantity,
                        price,
                        buyAmount,
                      });
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">成本单价</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.price}
                    onChange={(e) => {
                      const price = Number(e.target.value);
                      const buyAmount = editFormData.quantity * price;
                      setEditFormData({
                        ...editFormData,
                        price,
                        buyAmount,
                      });
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                  />
                  <p className="text-xs text-black mt-1">
                    自动计算买入金额：持有份额 × 成本单价 = {editFormData.quantity * editFormData.price}
                  </p>
                </div>
              </>
            )}

            {/* 当前价值 */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">当前价值</label>
              <input
                type="number"
                step="0.01"
                value={editFormData.currentValue}
                onChange={(e) => setEditFormData({ ...editFormData, currentValue: Number(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              />
              <p className="text-xs text-black mt-1">
                {hasQuantityType(editFormData.type)
                  ? `系统自动计算：当前单价 = 当前价值 ÷ 持有份额 = ${editFormData.quantity > 0 ? (editFormData.currentValue / editFormData.quantity).toFixed(2) : '0.00'}`
                  : '当前价值 = 买入金额 + 持有收益'
                }
              </p>
            </div>

            {/* 买入金额（可编辑，与单价联动） */}
            {hasQuantityType(editFormData.type) && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">买入金额</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.buyAmount}
                  onChange={(e) => {
                    const buyAmount = Number(e.target.value);
                    const price = editFormData.quantity > 0 ? buyAmount / editFormData.quantity : 0;
                    setEditFormData({
                      ...editFormData,
                      buyAmount,
                      price,
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                />
                <p className="text-xs text-black mt-1">
                  自动计算单价：买入金额 ÷ 持有份额 = {editFormData.quantity > 0 ? (editFormData.buyAmount / editFormData.quantity).toFixed(2) : '0.00'}
                </p>
              </div>
            )}

            {/* 购买时间 */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">购买时间</label>
              <div className="relative">
                <input
                  type="date"
                  value={editFormData.purchaseDate}
                  onChange={(e) => setEditFormData({ ...editFormData, purchaseDate: e.target.value })}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowEditDialog(false)}
              className="px-4 py-2 text-black hover:bg-gray-100 rounded-xl"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800"
            >
              保存
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 交易对话框（加仓/减仓） */}
      <Dialog open={showTradeDialog} onOpenChange={setShowTradeDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tradeType === 'buy' ? '加仓' : '减仓'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedInvestment && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-black">{selectedInvestment.name}</p>
                <p className="text-xs text-black">{selectedInvestment.symbol}</p>
              </div>
            )}

            {/* 数量和单价（股票/基金/债券等） */}
            {selectedInvestment && hasQuantityType(selectedInvestment.type) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    {tradeType === 'buy' ? '买入份额' : '卖出份额'}
                  </label>
                  <input
                    type="number"
                    value={tradeFormData.quantity}
                    onChange={(e) => {
                      const quantity = Number(e.target.value);
                      setTradeFormData({ ...tradeFormData, quantity });
                    }}
                    placeholder="例如: 100"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">单价</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tradeFormData.price}
                    onChange={(e) => {
                      const price = Number(e.target.value);
                      setTradeFormData({
                        ...tradeFormData,
                        price,
                        amount: tradeFormData.quantity * price,
                      });
                    }}
                    placeholder="例如: 1.23"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                  />
                </div>
              </>
            )}

            {/* 金额 */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                {tradeType === 'buy' ? '买入金额' : '卖出金额'}
              </label>
              <input
                type="number"
                step="0.01"
                value={tradeFormData.amount}
                onChange={(e) => setTradeFormData({ ...tradeFormData, amount: Number(e.target.value) })}
                placeholder="例如: 5000"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              />
            </div>

            {/* 交易日期 */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">交易日期</label>
              <div className="relative">
                <input
                  type="date"
                  value={tradeFormData.date}
                  onChange={(e) => setTradeFormData({ ...tradeFormData, date: e.target.value })}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
              </div>
            </div>

            {/* 备注 */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">备注（可选）</label>
              <input
                type="text"
                value={tradeFormData.note}
                onChange={(e) => setTradeFormData({ ...tradeFormData, note: e.target.value })}
                placeholder="例如: 分红再投资"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-black"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowTradeDialog(false)}
              className="px-4 py-2 text-black hover:bg-gray-100 rounded-xl"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveTrade}
              className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800"
            >
              确定
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 收益率对话框 */}
      {showXIRRDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-black">收益率详情</h2>
              <button
                onClick={() => setShowXIRRDialog(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Plus className="w-5 h-5 rotate-45 text-black" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-black">总投入</p>
                <p className="text-2xl font-semibold text-black">¥ {totalCost.toLocaleString()}</p>
              </div>
              <div className={`rounded-xl p-4 ${totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm text-black">总收益</p>
                <p className={`text-2xl font-semibold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {totalProfit >= 0 ? '+' : ''}¥ {totalProfit.toLocaleString()}
                </p>
              </div>
              <div className={`rounded-xl p-4 ${profitPercent >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm text-black">收益率</p>
                <p className={`text-2xl font-semibold ${profitPercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {profitPercent >= 0 ? '+' : ''}{profitPercent}%
                </p>
              </div>
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
    </div>
  );
}

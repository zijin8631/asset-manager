import { CreditCard, Wallet, Landmark, Plus } from 'lucide-react';

const accounts = [
  { id: 1, name: '招商银行', type: 'bank', balance: 25400, currency: 'CNY' },
  { id: 2, name: '建设银行', type: 'bank', balance: 12000, currency: 'CNY' },
  { id: 3, name: '现金钱包', type: 'cash', balance: 5800, currency: 'CNY' },
  { id: 4, name: '支付宝', type: 'cash', balance: 2000, currency: 'CNY' },
];

export default function Accounts() {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">资产</h1>
        <p className="text-sm text-gray-500 mt-1">共 {accounts.length} 个账户</p>
      </header>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
        <p className="text-sm text-blue-100 mb-1">账户总额</p>
        <p className="text-4xl font-semibold">¥ {totalBalance.toLocaleString()}</p>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => {
          const Icon = account.type === 'bank' ? Landmark : Wallet;

          return (
            <div
              key={account.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  {account.type === 'bank' ? (
                    <CreditCard className="w-6 h-6 text-gray-600" />
                  ) : (
                    <Wallet className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{account.name}</p>
                  <p className="text-xs text-gray-500">
                    {account.type === 'bank' ? '银行卡' : '电子钱包'}
                  </p>
                </div>
              </div>
              <p className="text-xl font-semibold text-gray-900">
                ¥ {account.balance.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <button className="fixed bottom-24 right-4 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

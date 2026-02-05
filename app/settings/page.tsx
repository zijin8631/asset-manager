'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Upload, Trash2, Moon, Sun, Info, Smartphone, Share2, AlertCircle } from 'lucide-react';
import { db, Account, Transaction, Investment } from '@/lib/db';

interface BackupData {
  accounts: Account[];
  transactions: Transaction[];
  investments: Investment[];
  exportDate: string;
  version: string;
}

const settings = [
  {
    section: '数据管理',
    items: [
      { icon: Download, label: '备份数据', description: '将数据导出为 JSON 文件', action: 'backup' },
      { icon: Upload, label: '恢复数据', description: '从 JSON 文件恢复数据', action: 'restore' },
      { icon: Trash2, label: '清除数据', description: '删除所有本地数据', action: 'clear' },
    ],
  },
  {
    section: '外观',
    items: [
      { icon: Moon, label: '深色模式', description: '切换深色主题', action: 'darkMode' },
      { icon: Sun, label: '浅色模式', description: '切换浅色主题', action: 'lightMode' },
    ],
  },
  {
    section: 'PWA 安装',
    items: [
      { icon: Smartphone, label: '安装应用', description: '添加到主屏幕', action: 'install' },
    ],
  },
  {
    section: '关于',
    items: [
      { icon: Info, label: '版本信息', description: 'v1.0.0', action: 'about' },
    ],
  },
];

export default function Settings() {
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // 在 useEffect 中检测 iOS 设备，避免 SSR 期间的渲染问题
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent;
      const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
      setIsIOS(isIOSDevice);

      // 监听 PWA 安装提示事件
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        console.log('PWA install prompt received', e);
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // 检查是否已安装
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) {
        console.log('App is already installed in standalone mode');
      }

      // 清理函数
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  // 备份数据
  const handleBackup = async () => {
    try {
      const accounts = await db.accounts.toArray();
      const transactions = await db.transactions.toArray();
      const investments = await db.investments.toArray();

      const backupData: BackupData = {
        accounts,
        transactions,
        investments,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asset-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupMessage({ type: 'success', text: '数据备份成功！' });
      setTimeout(() => setBackupMessage(null), 3000);
    } catch (error) {
      console.error('备份失败:', error);
      setBackupMessage({ type: 'error', text: '备份失败，请重试' });
      setTimeout(() => setBackupMessage(null), 3000);
    }
  };

  // 恢复数据
  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data: BackupData = JSON.parse(text);

        // 验证数据格式
        if (!data.accounts || !data.transactions || !data.investments) {
          throw new Error('数据格式不正确');
        }

        // 清空现有数据
        await db.accounts.clear();
        await db.transactions.clear();
        await db.investments.clear();

        // 恢复数据
        await db.accounts.bulkAdd(data.accounts);
        await db.transactions.bulkAdd(data.transactions);
        await db.investments.bulkAdd(data.investments);

        setBackupMessage({ type: 'success', text: `成功恢复 ${data.accounts.length} 个账户、${data.transactions.length} 条交易、${data.investments.length} 个投资` });
        setTimeout(() => setBackupMessage(null), 3000);
      } catch (error) {
        console.error('恢复失败:', error);
        setBackupMessage({ type: 'error', text: '恢复失败：' + (error as Error).message });
        setTimeout(() => setBackupMessage(null), 3000);
      }
    };

    input.click();
  };

  // 清除数据
  const handleClear = () => {
    if (confirm('确定要删除所有数据吗？此操作不可恢复！')) {
      db.accounts.clear();
      db.transactions.clear();
      db.investments.clear();
      setBackupMessage({ type: 'success', text: '数据已清除' });
      setTimeout(() => setBackupMessage(null), 3000);
    }
  };

  // PWA 安装处理
  const handleInstall = () => {
    if (isIOS) {
      setShowIOSInstallGuide(true);
    } else {
      // Android/Desktop 的 PWA 安装逻辑
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('PWA 安装成功');
          }
          setDeferredPrompt(null);
        });
      } else {
        // 浏览器已安装 PWA
        alert('应用已安装到设备上');
      }
    }
  };

  // 显示消息
  const showMessage = () => {
    if (!backupMessage) return null;

    return (
      <div className={`fixed top-4 left-4 right-4 max-w-md mx-auto p-4 rounded-xl ${
        backupMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      } flex items-center gap-3`}>
        {backupMessage.type === 'success' ? (
          <Download className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
        <span>{backupMessage.text}</span>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">设置</h1>
        <p className="text-sm text-gray-500 mt-1">应用设置</p>
      </header>

      {showMessage()}

      <div className="space-y-6">
        {settings.map((section) => (
          <div key={section.section}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {section.section}
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      switch (item.action) {
                        case 'backup':
                          handleBackup();
                          break;
                        case 'restore':
                          handleRestore();
                          break;
                        case 'clear':
                          handleClear();
                          break;
                        case 'install':
                          handleInstall();
                          break;
                        default:
                          break;
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* iOS PWA 安装引导 */}
      {showIOSInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">安装到主屏幕</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-4 h-4 text-blue-600" />
                </div>
                <p>点击浏览器底部的<span className="font-semibold">「分享」</span>按钮</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                </div>
                <p>向下滚动，找到<span className="font-semibold">「添加到主屏幕」</span>选项</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-green-600" />
                </div>
                <p>点击<span className="font-semibold">「添加」</span>完成安装</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSInstallGuide(false)}
              className="w-full mt-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">所有数据均存储在本地浏览器</p>
      </div>
    </div>
  );
}

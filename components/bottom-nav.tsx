'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, TrendingUp, Settings } from 'lucide-react';
import { useEffect } from 'react';

const navItems = [
  { href: '/', label: '概览', icon: LayoutDashboard },
  { href: '/accounts', label: '资产', icon: Wallet },
  { href: '/investments', label: '投资', icon: TrendingUp },
  { href: '/settings', label: '设置', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  useEffect(() => {
    // Service Worker 调试信息
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          console.log('Service Worker 注册状态:');
          if (registrations.length === 0) {
            console.log('⚠️ 未找到已注册的 Service Worker');
          } else {
            registrations.forEach((registration, index) => {
              console.log(`✅ Service Worker #${index + 1}:`, {
                scope: registration.scope,
                active: registration.active ? '已激活' : '未激活',
                waiting: registration.waiting ? '等待中' : '无等待',
                installing: registration.installing ? '安装中' : '未安装',
              });
            });
          }
        })
        .catch((error) => {
          console.error('获取 Service Worker 注册信息失败:', error);
        });

      // 监听 Service Worker 状态变化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker 控制器变更，页面现在由 Service Worker 控制');
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('收到 Service Worker 消息:', event.data);
      });
    } else {
      console.warn('⚠️ 当前浏览器不支持 Service Worker');
    }
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                transition-all duration-200
                ${isActive ? 'text-black' : 'text-black'}
              `}
            >
              <Icon
                className={`
                  mb-0.5 transition-all duration-200
                  ${isActive ? 'w-6 h-6' : 'w-5 h-5'}
                `}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

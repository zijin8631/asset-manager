'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, TrendingUp, Settings } from 'lucide-react';

const navItems = [
  { href: '/', label: '概览', icon: LayoutDashboard },
  { href: '/accounts', label: '资产', icon: Wallet },
  { href: '/investments', label: '投资', icon: TrendingUp },
  { href: '/settings', label: '设置', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

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

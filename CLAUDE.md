# Claude Context - 资产管理 App 开发记录

## 项目目标

定义一个单机版、响应式、具备投资跟踪能力的 PWA 资产管理 App。

### 核心架构
- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS + Shadcn UI
- **数据存储**: Dexie.js (IndexedDB 封装)，全本地存储，零服务器依赖

### 核心模块
1. **Dashboard**: 净值概览、资产分布图、最近交易
2. **账户管理**: 现金、银行卡、证券账户（支持多币种）
3. **投资管理**: 股票/基金代码、持仓成本、手动或 API 更新现价
4. **PWA 特性**: 添加到主屏幕、离线访问、JSON 数据导入/导出

### 设计风格
极简风格，参考 Apple Wallet 质感（毛玻璃效果、柔和阴影、系统字体）

---

## 已完成的工作

### 1. 项目初始化 ✓
```bash
npx create-next-app@14 asset-manager --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

### 2. 依赖安装 ✓
- `class-variance-authority` - 类名变体工具
- `clsx` - 条件类名
- `tailwind-merge` - Tailwind 类名合并
- `lucide-react` - 图标库
- `dexie` - IndexedDB 封装库
- `recharts` - 图表库（饼图）
- `@radix-ui/react-dialog` - 对话框组件
- `@radix-ui/react-slot` - Slot 组件

### 3. 数据库 Schema 定义 ✓
文件: `lib/db.ts`

```typescript
// accounts (id, name, type, balance, currency, icon, color, createdAt, updatedAt)
// transactions (id, accountId, type, amount, category, date, note, createdAt)
// investments (id, symbol, name, quantity, costPrice, currentPrice, currency, lastUpdated, createdAt)
```

### 4. 页面结构 ✓
| 页面 | 文件 | 状态 |
|------|------|------|
| Dashboard 概览 | `app/page.tsx` | ✓ (总净值、饼图、快速记账) |
| 资产账户 | `app/accounts/page.tsx` | ✓ (静态数据) |
| 投资管理 | `app/investments/page.tsx` | ✓ (静态数据) |
| 设置 | `app/settings/page.tsx` | ✓ (静态UI) |

### 5. 组件 ✓
- `components/bottom-nav.tsx` - 底部导航栏（概览、资产、投资、设置）
- `components/ui/dialog.tsx` - Shadcn UI Dialog 组件（快速记账弹窗）

### 7. Dashboard 功能 ✓
- 大字体显示"总净值"
- 显示"本月盈亏"（带涨跌颜色和图标）
- Recharts 环形饼图展示资产配置（现金、银行卡、投资）
- 快速记账浮动按钮 + Dialog 弹窗（收支类型选择、账户选择、金额输入）

### 8. 投资管理功能 ✓
- 持仓列表显示每个标的的盈亏百分比和金额
- 模拟股票价格查询（支持代码输入）
- XIRR 年化收益率计算（牛顿迭代法）
- 价格刷新功能（单个和全部）
- 添加新持仓功能

### 9. PWA 配置 ✓
- 安装并配置 next-pwa
- 生成 manifest.json 和 Service Worker
- 数据备份功能（导出为 JSON 文件）
- 数据恢复功能（从 JSON 文件恢复）
- iOS PWA 安装引导对话框
- Android/Desktop PWA 安装提示

### 6. 样式配置 ✓
- `app/globals.css` - Apple Wallet 风格样式
- `public/manifest.json` - PWA 清单文件

---

## 待完成的工作

### 第一阶段 - 数据层
- [ ] 创建 Dexie 数据库操作 hooks (useAccounts, useTransactions, useInvestments)
- [ ] 将投资管理页面的静态数据替换为真实数据库查询
- [ ] 将 Dashboard 的静态数据替换为真实数据库查询
- [ ] 将账户页面的静态数据替换为真实数据库查询

### 第二阶段 - 功能实现
- [ ] 账户管理：添加/编辑/删除账户
- [ ] 交易记录：添加/编辑/删除交易
- [ ] 投资管理：添加/编辑/删除持仓，更新现价
- [ ] 数据导入/导出功能

### 第三阶段 - PWA 完善
- [ ] 注册 Service Worker
- [ ] 添加 PWA 图标 (icon-192.png, icon-512.png)
- [ ] 离线访问支持
- [ ] 添加到主屏幕引导

### 第四阶段 - 增强功能
- [ ] 资产分布图表
- [ ] 投资收益统计
- [ ] API 集成（实时行情）
- [ ] 深色模式切换

---

## 项目结构

```
asset-manager/
├── app/
│   ├── accounts/
│   │   └── page.tsx       # 资产账户页面
│   ├── investments/
│   │   └── page.tsx       # 投资管理页面（XIRR 计算、价格更新）
│   ├── settings/
│   │   └── page.tsx       # 设置页面（备份/恢复/PWA 安装）
│   ├── globals.css        # Apple Wallet 风格样式 + 动画
│   ├── layout.tsx         # 根布局 + 底部导航栏
│   └── page.tsx           # Dashboard 概览页面
├── components/
│   ├── bottom-nav.tsx     # 底部导航栏组件
│   └── ui/
│       └── dialog.tsx     # Shadcn UI Dialog 组件
├── lib/
│   ├── db.ts              # Dexie.js 数据库 Schema
│   └── utils.ts           # cn 工具函数
├── public/
│   ├── manifest.json      # PWA 清单文件
│   ├── sw.js             # Service Worker
│   └── icon.svg          # 应用图标（SVG）
├── next.config.mjs        # Next.js + PWA 配置
└── package.json
```

---

## 常用命令

```bash
# 启动开发服务器
cd asset-manager && npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

---

## PWA 开发指南

### 测试 PWA 功能
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### PWA 特性验证
1. **安装到主屏幕**
   - Chrome: 地址栏旁的安装按钮
   - iOS: 分享菜单 → 添加到主屏幕
   - Safari: 分享菜单 → 添加到主屏幕

2. **离线访问**
   - 打开开发者工具 → 网络标签 → 选择离线
   - 尝试刷新页面，应该能访问缓存内容

3. **数据备份/恢复**
   - 设置页面 → 数据管理 → 备份数据/恢复数据
   - 导出 JSON 文件并验证数据完整性

### 需要添加的 PWA 图标
```bash
# 需要在 public/ 目录下创建以下文件：
- icon-192.png (192x192 像素)
- icon-512.png (512x512 像素)
```

---

## 备注

- 所有数据存储在本地浏览器 IndexedDB 中
- 投资管理页面使用模拟数据演示功能
- XIRR 计算使用牛顿迭代法，确保隐私（客户端计算）
- 股票价格查询使用模拟数据，可替换为真实 API（如 Alpha Vantage, Finnhub）
- PWA 需要手动添加 PNG 图标文件（icon-192.png, icon-512.png）
- Service Worker 默认配置，离线访问需要进一步优化

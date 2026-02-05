# Claude Context - 资产管理 App 开发记录

## 项目目标

定义一个单机版、响应式、具备投资跟踪能力的 PWA 资产管理 App。

### 核心架构
- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS + Shadcn UI
- **数据存储**: Dexie.js (IndexedDB 封装)，全本地存储，零服务器依赖

### 核心模块
1. **Dashboard**: 净值概览、资产分布图、最近交易
2. **账户管理**: 现金、银行卡、支付宝、微信支付、证券账户（支持多币种）
3. **投资管理**: 多类型投资（股票、基金、债券、黄金、理财、固收、美股、REITs、加密货币），支持手动更新收益
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

### 3. 数据库 Schema 定义 ✓ (v2)
文件: `lib/db.ts`

```typescript
// 账户类型: cash | bank | alipay | wechat | security
// 投资类型: stock | fund | bond | gold | wealth | fixed_income | us_stock | cd | reits | crypto
// accounts (id, name, type, balance, currency, icon, color, createdAt, updatedAt)
// transactions (id, accountId, type, amount, category, date, note, createdAt)
// investments (id, type, symbol, name, quantity, costPrice, currentPrice, currency,
//              subType, manualYield, manualYieldDate, totalProfit, lastUpdated, createdAt)
// yieldRecords (id, investmentId, yieldRate, yieldAmount, recordDate, note, createdAt)
```

**更新内容**:
- 数据库升级到 version 2
- 新增 `Investment` 类型扩展：支持 10 种投资类型
- 新增子分类支持（债券：长债/短债/企业债/国债/可转债；基金：股票基金/债券基金/混合基金/货币基金/指数基金/ETF）
- 新增手动收益字段：`manualYield`、`manualYieldDate`、`totalProfit`
- 新增 `YieldRecord` 表：记录收益历史

### 4. 页面结构 ✓
| 页面 | 文件 | 状态 |
|------|------|------|
| Dashboard 概览 | `app/page.tsx` | ✓ (总净值、饼图、快速记账) |
| 资产账户 | `app/accounts/page.tsx` | ✓ (DB连接、CRUD、分类展示) |
| 投资管理 | `app/investments/page.tsx` | ✓ (DB连接、多类型、手动收益) |
| 设置 | `app/settings/page.tsx` | ✓ (静态UI) |

### 5. 组件 ✓
- `components/bottom-nav.tsx` - 底部导航栏（概览、资产、投资、设置）
- `components/ui/dialog.tsx` - Shadcn UI Dialog 组件（快速记账弹窗）

### 6. Dashboard 功能 ✓
- 大字体显示"总净值"
- 显示"本月盈亏"（带涨跌颜色和图标）
- Recharts 环形饼图展示资产配置（现金、银行卡、投资）
- 快速记账浮动按钮 + Dialog 弹窗（收支类型选择、账户选择、金额输入）

### 7. 账户管理功能 ✓
- **支持的账户类型**: 现金、银行卡、支付宝、微信支付、证券账户
- **分类展示**: 按现金、银行、证券三大分类分组展示
- **完整 CRUD**: 添加/编辑/删除账户
- **数据库连接**: 所有操作同步到 IndexedDB
- 空状态提示

### 8. 投资管理功能 ✓
- **支持的投资类型** (10 种):
  - 权益类: 股票、基金、美股
  - 固收类: 债券、同业存单、理财、固收+
  - 另类投资: 黄金、REITs、加密货币
- **子分类支持**:
  - 债券: 长债、短债、企业债、国债、可转债
  - 基金: 股票基金、债券基金、混合基金、货币基金、指数基金、ETF
- **分类展示**: 按权益类、固收类、另类投资分组展示，显示各分类市值和收益
- **手动更新收益**: 支持手动输入收益率和收益金额，记录到 `yieldRecords` 表
- **完整 CRUD**: 添加/编辑/删除持仓
- **数据库连接**: 所有操作同步到 IndexedDB
- XIRR 年化收益率计算（牛顿迭代法）
- 价格刷新功能（单个和全部）

### 9. PWA 配置 ✓
- 安装并配置 next-pwa
- 生成 manifest.json 和 Service Worker
- 数据备份功能（导出为 JSON 文件）
- 数据恢复功能（从 JSON 文件恢复）
- iOS PWA 安装引导对话框
- Android/Desktop PWA 安装提示

### 10. 样式配置 ✓
- `app/globals.css` - Apple Wallet 风格样式
- `public/manifest.json` - PWA 清单文件

### 11. 用户反馈优化 ✓ (2026-02-05)
- **Dashboard页面修复**:
  - 修复投资市值计算NaN问题（处理undefined值）
  - 修复百分比计算NaN问题（处理totalAssets为0的情况）
  - 将所有灰色文本改为黑色（`text-gray-*` → `text-black`）
  - 百分比数字添加`text-black`类

- **资产页面集成投资数据**:
  - 同时加载账户和投资数据
  - 显示总资产（账户余额 + 投资市值）
  - 添加投资分类，显示投资总额和收益
  - 修改空状态消息为"暂无资产"
  - 统计显示"共 X 个资产"（账户+持仓）

- **投资页面优化**:
  - 修复编辑对话框数据映射（正确使用`avgCostPrice`和`currentPrice`）
  - 优化新建/编辑表单自动计算逻辑
  - 修复持仓卡片中数字的灰色文本问题（添加`text-black`类到所有数字显示）
  - 表单联动计算：持有份额、成本单价、买入金额、当前价值相互关联
  - 实时显示计算提示

- **全局样式优化**:
  - 所有页面灰色文字改为黑色（Dashboard、资产、投资、设置页面）
  - 底部导航非活动状态文字改为黑色

---

## 数据库版本升级说明

### v1 → v2 变更
- 新增 `investments` 表字段:
  - `type`: InvestmentType - 投资类型
  - `subType`: string - 子分类
  - `manualYield`: number - 手动收益率
  - `manualYieldDate`: Date - 手动收益更新日期
  - `totalProfit`: number - 累计收益金额
  - `totalProfitPercent`: number - 累计收益率
- 新增 `yieldRecords` 表: 收益记录历史
- `accounts` 表类型扩展: 新增 `alipay`、`wechat` 类型

---

## 待完成的工作

### 第一阶段 - 数据层
- [ ] 创建 Dexie 数据库操作 hooks (useAccounts, useTransactions, useInvestments)
- [ ] 将 Dashboard 的静态数据替换为真实数据库查询

### 第二阶段 - 功能实现
- [ ] 交易记录：添加/编辑/删除交易
- [ ] 收益记录历史页面（查看 yieldRecords）
- [ ] 数据导入/导出功能

### 第三阶段 - PWA 完善
- [ ] 注册 Service Worker
- [ ] 添加 PWA 图标 (icon-192.png, icon-512.png)
- [ ] 离线访问支持
- [ ] 添加到主屏幕引导

### 第四阶段 - 增强功能
- [ ] Dashboard 资产分布图表（连接真实数据）
- [ ] API 集成（实时行情：可替换模拟价格查询）
- [ ] 深色模式切换

---

## 项目结构

```
asset-manager/
├── app/
│   ├── accounts/
│   │   └── page.tsx       # 资产账户页面（分类展示、CRUD）
│   ├── investments/
│   │   └── page.tsx       # 投资管理页面（多类型、手动收益、XIRR）
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
│   ├── db.ts              # Dexie.js 数据库 Schema (v2)
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
- 账户页面已连接数据库，支持 5 种账户类型
- 投资页面已连接数据库，支持 10 种投资类型和子分类
- 支持手动更新收益功能，收益记录存储在 `yieldRecords` 表
- XIRR 计算使用牛顿迭代法，确保隐私（客户端计算）
- 价格查询使用模拟数据，可替换为真实 API（如 Alpha Vantage, Finnhub）
- PWA 需要手动添加 PNG 图标文件（icon-192.png, icon-512.png）
- Service Worker 默认配置，离线访问需要进一步优化

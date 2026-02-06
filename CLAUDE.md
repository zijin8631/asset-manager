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

### 3. 数据库 Schema 定义 ✓ (v4)
文件: `lib/db.ts`

```typescript
// 核心数据库表 (v4)
// accounts: 现金、银行卡、支付宝、微信支付、证券账户
// transactions: 收支交易记录
// investments: 10种投资类型，包含收益计算字段
// yieldRecords: 收益历史记录
// investmentTransactions: 投资交易记录（买入/卖出）
```

**当前版本 (v4)**:
- 数据库包含 5 个表：`accounts`、`transactions`、`investments`、`yieldRecords`、`investmentTransactions`
- 支持 5 种账户类型：现金、银行卡、支付宝、微信支付、证券账户
- 支持 10 种投资类型：股票、基金、债券、黄金、理财、固收+、美股、同业存单、REITs、加密货币
- 完整的收益管理：收益记录、投资交易记录、预期收益率跟踪
- 详细的数据库版本升级历史见下文

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

### 12. 投资功能优化 ✓ (2026-02-05)
- **资产页面改进**:
  - 修复投资市值计算问题（正确处理数量类型和金额类型投资）
  - 在资产页面按权益类、固收类、另类投资分类显示投资数据
  - 每个投资分类显示市值、投入成本、收益和收益率

- **数据库升级到v4**:
  - 新增预期收益率字段：`expectedYieldRate`（预期年化收益率）
  - 新增收益更新频率字段：`yieldUpdateFrequency`（daily/monthly/quarterly/yearly）
  - 新增上次/下次收益更新日期字段：`lastYieldUpdate`、`nextYieldUpdate`

- **收益管理功能增强**:
  - 添加收益补登功能，可记录历史收益
  - 投资编辑/添加表单支持设置预期收益率和更新频率
  - 收益补登自动更新持仓总收益和收益率计算

- **市值更新简化**:
  - 编辑/添加表单添加"当前单价（计算值）"只读显示
  - 系统根据当前价值和持有份额自动计算当前单价
  - 当前价值更新后自动重新计算单价

- **加减仓流程优化**:
  - 交易对话框增加提示：加减仓前请先更新当日收益
  - 支持直接输入金额，系统根据当前单价自动计算份额
  - 保留手动输入单价和份额的选项
  - 显示当前单价和计算提示

### 13. 资产分类与收益功能优化 ✓ (2026-02-05)

- **资产分类重构**:
  - Dashboard页面资产配置扩展为7类：流动资产（现金/银行卡/支付宝/微信）、股票、基金、债券、美股、固收（理财/固收+/同业存单）、另类投资（黄金/REITs/加密货币）
  - 资产页面同步更新投资分类配置，按股票、基金、债券、美股、固收、另类投资分组展示
  - 投资页面保持分类一致性，确保三个页面的资产分类统一

- **编辑与更新收益功能分离**:
  - 投资页面新增独立"更新收益"按钮和对话框，分离编辑和更新收益功能
  - 编辑功能简化：仅处理投资基本信息（类型、代码、名称、子分类、预期收益率等），移除收益相关字段
  - 更新收益功能增强：支持更新当前价格（数量类型）或当前价值（金额类型），自动重新计算收益和收益率
  - 界面优化：调整按钮顺序和样式，添加"更新收益"紫色按钮（RefreshCw图标）

- **TypeScript错误修复**:
  - 修复添加表单中可选字段的非空断言问题（`buyAmount!`、`currentValue!`等）
  - 修复收益率百分比类型错误（字符串转为数字）
  - 修复多个可选字段的类型安全处理

### 14. 更新收益功能优化 ✓ (2026-02-05)

- **简化用户输入**:
  - 将"更新收益"功能简化为统一输入"当天价值"
  - 移除当前价格和当前价值的区分，用户只需输入当天总价值
  - 系统自动计算：对于有数量类型，自动计算当前单价 = 当天价值 ÷ 数量

- **增强信息展示**:
  - 在更新收益对话框中显示持仓详细信息：持有数量、总买入金额、当前单价
  - 实时显示计算提示：计算单价、当天收益、当天收益率
  - 明确最初的价值和份额不变，只需输入当天价值

- **统一计算逻辑**:
  - 统一收益计算：总收益 = 当天价值 - 总买入金额
  - 统一收益率计算：收益率 = (总收益 ÷ 总买入金额) × 100%
  - 自动更新当前价格字段（有数量类型）和当前价值字段

- **用户体验优化**:
  - 简化对话框布局，减少用户决策点
  - 提供实时计算反馈，增强操作信心
  - 保持操作流程直观：输入当天价值 → 查看计算结果 → 确认更新

### 15. 数据备份恢复功能完善 ✓ (2026-02-05)

- **完整数据备份**:
  - 备份所有5个数据库表：accounts、transactions、investments、yieldRecords、investmentTransactions
  - 包含数据库schema版本信息（v4）用于兼容性检查
  - 自动生成包含日期的备份文件名：`asset-backup-YYYY-MM-DD.json`

- **增强数据恢复**:
  - 完整验证备份数据格式，确保包含必要表数据
  - 数据库版本兼容性检查：拒绝高于当前版本的备份数据
  - 详细的确认对话框，显示备份数据统计信息
  - 支持旧版本备份文件（处理缺失的可选表）

- **用户交互优化**:
  - 备份成功消息显示数据统计（账户数、交易数、投资数）
  - 恢复前显示详细确认对话框，列出所有表的数据量
  - 错误处理包含具体错误信息，便于问题排查
  - 清除数据操作添加额外警告，防止误操作

- **技术实现细节**:
  - 使用IndexedDB的`bulkAdd()`方法提升恢复性能
  - 处理可选表字段：yieldRecords和investmentTransactions
  - 包含schemaVersion字段用于未来数据迁移
  - 统一的错误处理和用户反馈机制

- **PWA集成**:
  - 保持PWA安装引导功能（iOS/Android/Desktop）
  - 支持检测已安装的PWA应用
  - 完整的安装引导界面

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

### v2 → v3 变更
- 新增 `investmentTransactions` 表: 投资交易记录（买入/卖出）
- `investments` 表结构调整:
  - 重命名字段：`totalCost` → `totalBuyAmount`
  - 新增字段：`totalSellAmount`（累计卖出金额）
  - 新增字段：`yieldRate`（收益率，系统计算）
  - 移除字段：`manualYield`、`manualYieldDate`、`totalProfitPercent`

### v3 → v4 变更
- 新增预期收益相关字段:
  - `expectedYieldRate`: number - 预期年化收益率（%）
  - `yieldUpdateFrequency`: string - 收益更新频率：daily, monthly, quarterly, yearly
  - `lastYieldUpdate`: Date - 上次收益更新日期
  - `nextYieldUpdate`: Date - 下次收益更新日期

---

## 待完成的工作

### 第一阶段 - 数据层
- [ ] 创建 Dexie 数据库操作 hooks (useAccounts, useTransactions, useInvestments)
- [ ] 将 Dashboard 的静态数据替换为真实数据库查询

### 第二阶段 - 功能实现
- [ ] 交易记录：添加/编辑/删除交易
- [ ] 收益记录历史页面（查看 yieldRecords）
- [x] 数据导入/导出功能 ✓

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
│   ├── db.ts              # Dexie.js 数据库 Schema (v4)
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

## PWA 离线功能修复 (2026-02-06)

### 修复内容
1. **PWA配置优化** ([next.config.mjs](next.config.mjs))
   - 确保 `disable: false` - PWA 在生产构建中启用
   - 扩展 `runtimeCaching` 策略：图片、JS/CSS、字体、页面路由、API请求、数据文件
   - 页面路由使用 NetworkFirst 策略，3秒超时回退缓存

2. **Service Worker 调试代码** ([components/bottom-nav.tsx](components/bottom-nav.tsx))
   - 添加调试输出显示 Service Worker 注册状态
   - 监听控制器变更和消息事件
   - 控制台显示详细注册信息便于问题排查

3. **HTTPS 测试指导**
   - Microsoft Dev Tunnels: `devtunnels host -p 3000 --protocol https`
   - ngrok: `ngrok http 3000`
   - 本地自签名证书: 使用 mkcert

### 测试步骤
1. 构建生产版本：`npm run build && npm start`
2. 通过 HTTPS 访问应用
3. DevTools Network 面板勾选 "Offline" 测试
4. 检查 Application → Cache Storage 验证缓存

---

## 离线数据同步修复 (2026-02-06)

### 问题描述
用户报告在离线状态下，投资页面更新数据后，概览页面需要刷新才能显示最新数据。各页面间数据不同步。

### 解决方案
使用 Dexie.js 的 `on('changes')` 事件监听数据库变化，实现跨页面实时数据同步。

### 修改内容

1. **Dashboard页面** ([app/page.tsx](app/page.tsx))
   - 添加 `db.on('changes')` 事件监听器
   - 监听 `accounts` 和 `investments` 表变化
   - 检测到相关变化时自动调用 `loadData()`

2. **资产页面** ([app/accounts/page.tsx](app/accounts/page.tsx))
   - 添加数据库变化监听器
   - 监听 `accounts` 和 `investments` 表变化
   - 自动重新加载资产数据

3. **投资页面** ([app/investments/page.tsx](app/investments/page.tsx))
   - 添加数据库变化监听器
   - 监听 `investments`、`investmentTransactions` 和 `yieldRecords` 表变化
   - 自动重新加载投资数据

### 技术实现
- 每个页面在 `useEffect` 中注册数据库变化监听器
- 监听器检查相关表的变化，避免不必要的数据重新加载
- 组件卸载时自动清理监听器（`return () => unsubscribe()`）
- 控制台输出调试信息便于验证

### TypeScript 错误修复
- Dexie.js 类型定义中 `db.on('changes')` 方法类型不匹配
- 使用类型断言 `(db as any).on('changes', (changes: any[]) => { ... })` 解决编译错误
- 保持功能完整性的同时绕过类型检查

### 效果
- 在任一页面更新数据后，其他页面自动同步最新数据
- 无需手动刷新页面
- 离线状态下完全功能可用
- 保持PWA的离线访问能力

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

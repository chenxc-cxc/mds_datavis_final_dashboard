# 电商数据可视化看板

一个基于 **FastAPI + React (Vite)** 的前后端分离交互式数据可视化看板，用于分析电商网站的用户行为和销售数据。

## 架构概览

- **后端**：FastAPI + DuckDB+ Redis 缓存  
  - 负责数据加载、用户分群、聚合计算及 Drill-down 接口  
  - 所有 API 暴露在 `/api/*`，默认端口 `8000`
- **前端**：React + TypeScript + TailwindCSS + Ant Design + ECharts + Framer Motion  
  - 支持 Top N 指标切换、Drill-down 抽屉、响应式布局与现代化主题  
  - 通过 `.env` (`VITE_API_BASE_URL`) 指向后端 API
- **部署模式**：前后端分离；目前仅配置了本地
  - 预计未来: Nginx/CDN 托管静态资源，FastAPI 作为独立服务；DuckDB 文件和 Redis 提供查询加速


## 功能特性

### 核心交互功能

- **用户群体选择**：可选择不同的消费类型用户群体（Hesitant犹豫型、Impulsive冲动型、Collector收藏型）或全部用户
- **Top N 控制**：支持实时切换排名指标（浏览/加购/购买）与 Top N 数量（3-30）
- **日期范围筛选**：支持选择日期范围进行数据筛选
- **Drill-down 抽屉**：点击图表元素可在侧边面板中查看详细分析
- **实时刷新**：所有图表根据选择的用户群体、指标和日期范围自动刷新
- **响应式设计**：所有图表支持窗口大小自适应调整
- **现代 UI**：基于 Urbanist 字体与渐变色系的现代化卡片式布局，支持暗色主题，使用 Framer Motion 动画效果
- **可拖拽布局**：图表卡片支持拖拽重新排列位置

### 主看板图表

1. **数据概览指标卡片** - 显示浏览、加购、购买三种事件类型的总数统计

2. **Top N 商品榜** - 水平柱状图显示销量/浏览/加购 Top N 商品
   - 支持点击商品查看详细 Drill-down 分析

3. **Top N 品类榜** - 水平柱状图显示销量/浏览/加购 Top N 类别
   - 支持点击类别查看详细 Drill-down 分析

4. **转换率漏斗** - 自定义 SVG 漏斗图展示浏览→加购→购买的转化流程
   - 显示各阶段数量和转化率
   - 支持点击阶段查看详细分析

5. **用户活跃时间段** - 折线图展示 24 小时内用户活跃度分布
   - 支持点击时间段查看该时段的详细分析

6. **用户留存率（月度）** - 折线图展示不同月份用户的月度留存率曲线
   - 支持点击折线数据点查看该 Cohort 的详细行为分析

7. **周一到周日用户数** - 柱状图展示一周中各天的用户数分布
   - 显示工作日平均和周末平均参考线
   - 支持点击柱状图查看该天的详细分析

### Drill-down 详情抽屉

#### 1. 商品/类别详情（DrilldownDrawer）
点击 Top N 商品或类别后展示：
- 数据概览统计
- 事件类型分布（浏览、加购、购买）
- 时间趋势图（周度活动量）
- 24 小时活跃分布
- 用户群体分布

#### 2. 漏斗阶段详情（FunnelStageDrawer）
点击漏斗图的某个阶段后展示：
- 阶段数据统计
- 时间趋势图
- 24 小时活跃分布
- Top 商品和类别

#### 3. 活跃时间段详情（ActiveHourDrawer）
点击活跃时间段图表后展示：
- 时间段数据概览
- 事件类型分布
- 转化率分析
- 对比分析（与每日平均对比）
- 时间趋势图（周度）
- 转化漏斗
- Top 商品和类别
- 用户群体分布

#### 4. 用户留存 Cohort 详情（CohortDetailDrawer）
点击留存率图表的某个 Cohort 后展示：
- Cohort 数据概览
- 事件统计（浏览、加购、购买）
- 用户群体分布
- 转化率分析
- 时间趋势图
- Top 商品和类别

#### 5. 星期几详情（WeekdayDetailDrawer）
点击周一到周日用户数图表的某一天后展示：
- 事件概览统计
- 用户群体分布
- 事件类型分布
- 转化率分析
- 对比分析（与工作日平均、周末平均、一周平均对比）
- 24 小时活跃分布
- 时间趋势图（周度）
- 转化漏斗
- Top 商品和类别

## 用户分类说明

系统根据用户行为特征自动将用户分为三类：

- **Hesitant（犹豫型）**：浏览多但购买少，购买率低于 5%
- **Impulsive（冲动型）**：浏览后快速购买，购买率高于 30%，24 小时内完成购买
- **Collector（收藏型）**：加购多但购买转化慢，加购次数 ≥ 5 次，购买率 ≥ 10%

## 安装和运行

### 0. 运行 Redis (这一步可以先选择不做)

```bash
# macOS
brew services start redis
# 或使用 docker
docker run -p 6379:6379 redis:7
```

### 1. 准备数据

确保数据文件位于 `backend/archive/events_with_category.csv`，数据格式如下：

```text
timestamp,visitorid,event,itemid,categoryid
2015-06-02 05:02:12,257597,view,355908,1173
2015-06-02 05:50:14,992329,view,248676,1231
2015-06-02 04:57:58,158090,addtocart,10572,1037
2015-06-01 21:18:20,121688,transaction,15335,1098
```

首次运行后端时会自动将 CSV 转换为 DuckDB 格式（存储在 `backend/cache/events.duckdb`）(较耗时,请耐心等待)。

### 2. 启动后端（FastAPI）

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

接口文档：`http://127.0.0.1:8000/api/docs`

### 3. 启动前端（React + Vite）

```bash
cd frontend
npm install   # 首次运行
npm run dev
```

默认会连接 `http://localhost:8000/api`，可在 `frontend/.env` 中调整 `VITE_API_BASE_URL`。

访问地址：`http://localhost:5173`（Vite 默认端口）

### 4. 生产环境部署(未部署)

#### 后端部署

使用 Gunicorn 部署：

```bash
gunicorn app.main:app --workers 4 --bind 0.0.0.0:8000
```

#### 前端部署

构建静态文件：

```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist` 目录，可使用 Nginx 或其他静态文件服务器托管。

## 项目结构

```text
project/
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       └── metrics.py      # API 路由定义
│   │   ├── core/
│   │   │   └── config.py           # 配置管理
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic 数据模型
│   │   ├── services/
│   │   │   ├── cache.py            # Redis 缓存服务
│   │   │   └── data_service.py     # DuckDB 数据查询服务
│   │   └── main.py                 # FastAPI 应用入口
│   ├── archive/                    # 数据文件目录
│   │   └── events_with_category.csv
│   ├── cache/                      # 自动生成的缓存文件
│   │   └── events.duckdb           # DuckDB 数据库文件
│   └── requirements.txt
├── frontend/                   # React + Vite 前端
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts           # API 客户端配置
│   │   │   ├── endpoints.ts        # API 端点函数
│   │   │   └── types.ts            # TypeScript 类型定义
│   │   ├── components/
│   │   │   ├── charts/             # 图表组件
│   │   │   │   ├── BarChart.tsx
│   │   │   │   ├── FunnelChart.tsx
│   │   │   │   ├── LineChart.tsx
│   │   │   │   ├── RetentionChart.tsx
│   │   │   │   └── WeekdayUserChart.tsx
│   │   │   ├── ActiveHourDrawer.tsx        # 活跃时间段详情抽屉
│   │   │   ├── ChartCard.tsx               # 图表卡片容器
│   │   │   ├── CohortDetailDrawer.tsx      # Cohort 详情抽屉
│   │   │   ├── DateRangePicker.tsx         # 日期范围选择器
│   │   │   ├── DrilldownDrawer.tsx         # 商品/类别详情抽屉
│   │   │   ├── DraggableGrid.tsx           # 可拖拽图表网格
│   │   │   ├── FilterBar.tsx               # 筛选栏（用户群体、指标、TopN）
│   │   │   ├── FunnelStageDrawer.tsx       # 漏斗阶段详情抽屉
│   │   │   ├── MetricsGrid.tsx             # 指标卡片网格
│   │   │   ├── ParticlesBackground.tsx     # 粒子背景动画
│   │   │   ├── RefreshIndicator.tsx        # 刷新指示器
│   │   │   └── WeekdayDetailDrawer.tsx     # 星期几详情抽屉
│   │   ├── App.tsx                 # 主应用组件
│   │   ├── App.css                 # 应用样式
│   │   └── main.tsx                # 应用入口
│   ├── package.json
│   └── vite.config.ts
└── README.md                     # 项目说明文档
```

## 后端 API 端点

所有 API 端点均位于 `/api/` 路径下：

### 基础查询

- `GET /api/segments` - 获取用户群体统计摘要
- `GET /api/top-items` - 获取 Top N 商品
- `GET /api/top-categories` - 获取 Top N 类别
- `GET /api/funnel` - 获取转化漏斗数据
- `GET /api/event-counts` - 获取事件统计（浏览、加购、购买总数）
- `GET /api/active-hours` - 获取 24 小时活跃时间段分布
- `GET /api/monthly-retention` - 获取月度用户留存率
- `GET /api/weekday-users` - 获取周一到周日用户数分布

### Drill-down 详情

- `GET /api/drilldown/{entity_type}/{entity_id}` - 获取商品/类别详情
  - `entity_type`: `item` 或 `category`
  - `entity_id`: 商品或类别 ID
- `GET /api/funnel-stage/{stage}` - 获取漏斗阶段详情
  - `stage`: `view`, `addtocart`, 或 `transaction`
- `GET /api/active-hour/{hour}` - 获取活跃时间段详情
  - `hour`: 0-23 的小时数
- `GET /api/cohort-detail/{cohort_month}` - 获取 Cohort 详情
  - `cohort_month`: 格式为 `YYYY-MM`（如 `2015-06`）
- `GET /api/weekday-detail/{weekday}` - 获取星期几详情
  - `weekday`: 1-7（1=周一，7=周日）

### 通用查询参数

所有端点支持以下可选参数：
- `segment`: 用户群体（`All`, `Hesitant`, `Impulsive`, `Collector`），默认为 `All`
- `date_from`: 开始日期（格式：`YYYY-MM-DD`）
- `date_to`: 结束日期（格式：`YYYY-MM-DD`）
- `metric`: 指标类型（`view`, `addtocart`, `transaction`），仅用于 Top N 查询，默认为 `transaction`
- `limit` / `top_n`: Top N 数量，范围 3-30，默认为 10

## 技术栈

### 后端

- **FastAPI**: 现代、快速的 Web 框架
- **DuckDB**: 高性能列式数据库，用于数据分析查询
- **Redis**: 内存缓存，加速热点查询
- **Pydantic**: 数据验证和序列化
- **Python 3.10+**

### 前端

- **React 18**: UI 框架
- **TypeScript**: 类型安全
- **Vite**: 构建工具和开发服务器
- **ECharts**: 数据可视化图表库
- **Ant Design**: UI 组件库
- **TailwindCSS**: 实用优先的 CSS 框架
- **Framer Motion**: 动画库
- **React Query (TanStack Query)**: 数据获取和状态管理
- **Day.js**: 日期处理库

## 性能优化

1. **DuckDB 列式存储**
   首次启动会自动将 CSV 转换为 DuckDB 格式，查询速度提升显著。

2. **用户分群结果缓存**
   用户分类结果会序列化为 `cache/user_segments.pkl`（带数据文件 mtime 与阈值哈希），后续启动直接复用，避免重复聚合大量用户。

3. **Redis 二级缓存**
   FastAPI 层对热点接口（TopN、Funnel、Drill-down）增加 Redis TTL 缓存，进一步减轻 DuckDB 查询压力。

4. **响应式图表**
   所有图表使用 `ResizeObserver` 自动适配容器大小变化，无需手动刷新。

5. **按需加载**
   Drill-down 详情仅在用户点击时加载，减少初始渲染压力。

6. **React Query 缓存**
   前端使用 React Query 进行请求去重和缓存，避免重复请求。

## 缓存级别说明
```
1. 浏览器内存 (React Query) ← 最快，仅前端
   ↓ (未命中)
2. Redis 内存缓存 ← 快速，跨请求共享
   ↓ (未命中)
3. DuckDB 数据库文件 ← 数据持久化存储
   ↓ (初始化时)
4. Parquet/CSV 源文件 ← 原始数据源
```

## 注意事项

1. 首次运行会生成 DuckDB 数据库文件和用户分群表，耗时取决于硬件（通常 1~2 分钟）；完成后再次启动约 5~8 秒
2. 建议使用至少 4GB 内存的服务器运行
3. 数据文件路径、缓存目录可在 `backend/app/core/config.py` 中配置
4. Drill-down 功能需要后端 API；请确保 FastAPI 已启动
5. Redis 缓存为可选，但强烈推荐使用以提升性能
6. 前端开发服务器默认端口为 5173，后端 API 默认端口为 8000

## 许可证

MIT License

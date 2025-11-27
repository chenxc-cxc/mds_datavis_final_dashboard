# 电商数据可视化看板

一个基于 **FastAPI + React (Vite)** 的前后端分离交互式数据可视化看板，用于分析电商网站的用户行为和销售数据。

## 架构概览

- **后端**：FastAPI + DuckDB（列式存储）+ Redis 缓存  
  - 负责数据加载、用户分群、聚合计算及 Drill-down 接口  
  - 所有 API 暴露在 `/api/*`，默认端口 `8000`
- **前端**：React + TypeScript + TailwindCSS + Ant Design + ECharts  
  - 支持 Top N 指标切换、Drill-down 抽屉、响应式布局与现代化主题  
  - 通过 `.env` (`VITE_API_BASE_URL`) 指向后端 API
- **部署模式**：前后端分离；Nginx/CDN 托管静态资源，FastAPI 作为独立服务；DuckDB 文件和 Redis 提供查询加速

## 功能特性

### 交互功能

- ✅ 用户群体选择：可选择不同的消费类型用户群体（Hesitant犹豫型、Impulsive冲动型、Collector收藏型）或全部用户
- ✅ Top N 控制：支持实时切换排名指标（浏览/加购/购买）与 Top N 数量
- ✅ Drill-down Offcanvas：点击排行榜即可在侧边面板中查看商品 / 类别的周度行为详情
- ✅ 实时过滤：所有图表根据选择的用户群体和排行榜条件自动刷新
- ✅ 现代 UI：基于 Urbanist 字体与渐变色系的现代化卡片式布局，支持暗浅分层

### 用户子表图表

1. **按月份销售额** - 显示选定用户群体的月度销售趋势
2. **Top N 商品销量** - 按ItemId统计的销量Top N商品
3. **Top N 类别销量** - 按CategoryId统计的销量Top N类别
4. **转换率漏斗** - 浏览→加购→购买的转化漏斗
5. **活跃时间段分布** - 用户活跃时间段分布图

### 总表图表

1. **浏览量、加购量、购买量** - 三种事件类型的数量对比
2. **用户活跃时间段分布** - 用户活跃时间段分布
3. **Top N 商品/类别销量** - 销量Top N的商品和类别
4. **不同类型用户月度趋势** - 不同用户群体在不同月份的交易趋势对比
5. **用户活跃度趋势** - 每日活跃用户数（DAU）趋势
6. **用户留存率** - 用户留存率曲线（0-30天）
7. **黑马商品** - 销量涨幅Top N的商品购买趋势
8. **行为时间热力图** - 用户行为的时间分布热力图

## 用户分类说明

系统根据用户行为特征自动将用户分为三类：

- **Hesitant（犹豫型）**：浏览多但购买少，购买率低于5%
- **Impulsive（冲动型）**：浏览后快速购买，购买率高于30%，24小时内完成购买
- **Collector（收藏型）**：加购多但购买转化慢，加购次数≥5次，购买率≥10%

## 安装和运行

### 0. 运行 Redis（可选但推荐）

```bash
# macOS
brew services start redis
# 或使用 docker
docker run -p 6379:6379 redis:7
```

### 1. 准备数据

确保数据文件位于 `archive/events_with_category.csv`（若已存在 `cache/events_with_category.parquet`，会优先加载），数据格式如下：

```text
timestamp,visitorid,event,itemid,categoryid
2015-06-02 05:02:12,257597,view,355908,1173
2015-06-02 05:50:14,992329,view,248676,1231
2015-06-02 04:57:58,158090,addtocart,10572,1037
2015-06-01 21:18:20,121688,transaction,15335,1098
```

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
npm install   # 首次
npm run dev
```

默认会连接 `http://localhost:8000/api`，可在 `frontend/.env` 中调整。

### 4. 旧 Dash 看板（如需）

```bash
python app.py
```

应用将在 `http://127.0.0.1:8050` 启动。

### 4. 生产环境部署

使用Gunicorn部署：

```bash
gunicorn app:server --bind 0.0.0.0:8050 --workers 4
```

## 项目结构

```text
project/
├── app.py                  # 主应用文件（Dash）
├── data_processor.py       # 数据处理 & 缓存逻辑
├── chart_components.py     # 图表生成函数
├── config.py               # 配置项（主题 / 缓存 / 分类阈值）
├── requirements.txt        # 依赖包列表
├── run.sh                  # 一键启动脚本
├── README.md               # 项目说明文档
├── backend/                # FastAPI 后端
│   ├── app/
│   │   ├── api/routes/metrics.py
│   │   ├── core/config.py
│   │   ├── services/{cache,data_service}.py
│   │   └── main.py
│   └── requirements.txt
├── frontend/               # React + Vite 前端
│   ├── src/
│   │   ├── api/{client,endpoints,types}.ts
│   │   ├── components/
│   │   └── App.tsx
│   └── package.json
├── assets/                 # 自定义样式（Urbanist 主题）
│   └── style.css
├── cache/                  # 自动生成的缓存文件（首次运行后出现）
│   ├── events_with_category.parquet
│   └── user_segments.pkl
└── archive/                # 数据文件目录
    └── events_with_category.csv
```

## 配置说明

可以在 `config.py` 中修改以下配置：

- `TOP_N`: Top N 商品/类别的默认数量
- `USER_CLASSIFICATION`: 用户分类阈值参数
- `APP_THEME / COLORS / COLOR_PALETTES`: 看板主题与配色方案
- `DATA_CACHE_FILE / USER_SEGMENTS_CACHE`: 数据与分群缓存文件路径

## 技术栈

- **Dash**: Web应用框架
- **Plotly + plotly.io 模板**: 交互式图表与自定义 Urbanist 主题
- **Pandas**: 数据处理
- **NumPy**: 数值计算
- **Dash Bootstrap Components**: UI组件库

## 性能优化

1. **Parquet 数据缓存**  
   首次启动会自动将 `archive/events_with_category.csv` 转换为 `cache/events_with_category.parquet`，之后均从 Parquet 读取，速度提升 3-5 倍。

2. **分群结果缓存**  
   用户分类结果会序列化为 `cache/user_segments.pkl`（带数据文件 mtime 与阈值哈希），后续启动直接复用，避免重复聚合 120 万用户。

3. **按需重算**  
   - 当原始 CSV 更新时间晚于缓存文件时自动失效重建；
   - Top N 图表与 Drill-down 均只在用户操作时计算，减少初始渲染压力。

4. **Redis 二级缓存**  
   FastAPI 层对热点接口（TopN、Funnel、Drill-down）增加 Redis TTL 缓存，进一步减轻 DuckDB 查询压力。

## 注意事项

1. 首次运行会生成 Parquet / DuckDB / 用户分群表，耗时取决于硬件（通常 1~2 分钟）；完成后再次启动约 5~8 秒
2. 建议使用至少 4GB 内存的服务器运行
3. 数据文件路径、缓存目录可在 `config.py`（Dash 版）或 `backend/app/core/config.py` 中配置
4. Drill-down 功能需要后端 API；请确保 FastAPI 与 Redis 均已启动

## 许可证

MIT License

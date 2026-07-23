# 顺时生活 — 部署说明

## 项目概览

- **技术栈**: Vite + React + TypeScript + Express
- **部署目标**: Vercel（Serverless）
- **架构**: 单域名，静态前端 + Serverless API

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 QWEATHER_KEY

# 启动（前端 dev server + Express API server）
npm run dev

# 访问
# 前端: http://localhost:5173/
# API:  http://localhost:3001/api/health
```

## 构建（本地验证）

```bash
npm run build
```

构建产物：
- `dist/` — 前端静态资源（JS/CSS/HTML）
- `api/` — Serverless API 入口（TypeScript 源码）

## 部署到 Vercel

### 前置准备

1. 注册 [Vercel](https://vercel.com) 账号
2. 安装 Vercel CLI（可选）：
   ```bash
   npm i -g vercel
   ```

### 方式一：Vercel Dashboard（推荐）

1. 进入 [vercel.com/new](https://vercel.com/new)
2. 连接 Git 仓库（GitHub/GitLab）
3. 选择 `web-app` 目录
4. 配置项目：
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. 添加环境变量：
   - 点击 **Environment Variables**
   - 添加 `QWEATHER_KEY` = 你的和风天气 API Key
6. 点击 **Deploy**

### 方式二：Vercel CLI

```bash
cd web-app

# 首次部署
vercel
# 登录 → 选择项目 → 添加 QWEATHER_KEY 环境变量

# 生产环境部署
vercel --prod
```

### 方式三：Git Push 自动部署

将代码推送到 GitHub，Vercel 会自动检测 `vercel.json` 并部署：

```bash
git add .
git commit -m "feat: deploy to vercel"
git push origin main
```

## 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `QWEATHER_KEY` | 是 | 和风天气 API Key（免费额度 5万次/月） |

在 Vercel Dashboard → Settings → Environment Variables 中添加。

## 架构说明

```
web-app/
├── dist/              # 前端静态资源（Vercel 托管）
├── api/
│   ├── index.ts       # Vercel Serverless 入口
│   ├── app.ts         # Express 应用定义
│   ├── server.ts      # 本地开发入口
│   ├── engines/       # 算法引擎（纯逻辑）
│   ├── services/      # 服务层（API 调用、数据处理）
│   └── routes/        # 路由定义
├── data/              # 静态 JSON 数据（随代码包部署）
│   ├── solar_terms.json
│   ├── cities.json
│   ├── constitutions-v2.json
│   ├── constitution_questionnaire.json
│   ├── recipe_pool_v2.json
│   └── herbal_tea_pool_v2.json
├── vercel.json        # Vercel 部署配置
└── .env.local         # 本地环境变量（不提交）
```

### API 路由

| 路由 | 说明 |
|------|------|
| `GET /api/health` | 健康检查 |
| `GET /api/solar-term/current` | 当前节气 |
| `GET /api/solar-term` | 24 节气列表 |
| `GET /api/wellness-plan?term=&city=&constitution=&weather=` | 养生方案 |
| `GET /api/recipe/daily?term=&constitution=&weather=` | 食谱推荐 |
| `GET /api/tea/daily?term=&constitution=&weather=` | 花草茶推荐 |
| `GET /api/constitution/types` | 体质类型列表 |
| `GET /api/constitution/questionnaire` | 体质测评问卷 |
| `POST /api/constitution/assess` | 提交测评答案 |
| `GET /api/weather/:city` | 城市天气 |
| `GET /api/weather/cities` | 城市列表 |

### 缓存策略

- **天气**: 前端浏览器 `localStorage` 缓存，每天首次直连 API
- **节气/体质/食谱/花草茶**: 纯算法，无缓存需求
- **静态数据**: 随代码包部署，`readFileSync` 读取

### Serverless 注意事项

- Vercel Serverless 文件系统是**临时的、只读的**
- 所有数据存储在 `data/` 目录（静态文件）或浏览器 `localStorage`
- 不支持服务端文件写入（`writeFileSync` 会报错）
- 全局变量在每次请求后重置（LRU/缓存 Map 不影响结果）

## 部署检查清单

- [ ] `QWEATHER_KEY` 已在 Vercel 添加
- [ ] `npm run build` 本地构建成功
- [ ] `dist/` 目录包含完整静态资源
- [ ] `api/index.ts` 可正常启动
- [ ] `vercel.json` 已正确配置
- [ ] `.env.local` 在 `.gitignore` 中（不会被提交）

## 部署后验证

1. 访问部署域名，确认前端页面正常
2. 检查网络请求，确认 API 返回 200
3. 测试天气功能（首次加载可能较慢，后续秒级响应）
4. 检查浏览器 Console 无错误

## 常见问题

### API 返回 404

检查 `vercel.json` 的 rewrite 配置是否正确。

### 天气 API 失败

检查 `QWEATHER_KEY` 是否在 Vercel Environment Variables 中正确配置。

### 构建失败

运行 `npm run build` 本地验证，查看报错信息。

# 顺时生活 技术架构方案 v2.0

> **版本**：v2.0
> **日期**：2026-07-21
> **状态**：与 PRD v2.0 对齐
> **范围**：微信小程序 + 网站 PWA
> **前置**：v1.0 技术验证版已完成

---

## 1. 架构概览

### 1.1 整体架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                     表现层（Presentation）                         │
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────┐           │
│  │   微信小程序（Taro）    │    │    网站 PWA（Taro H5）  │           │
│  │  React + Vant Weapp   │    │  React + PWA 配置    │           │
│  └──────────┬───────────┘    └──────────┬───────────┘           │
│             │                            │                        │
├─────────────┼────────────────────────────┼───────────────────────┤
│             │         API Gateway         │                        │
│             │      Express.js 3000       │                        │
│             └────────────────┬───────────┘                        │
│                              │                                    │
│                  ┌───────────┴───────────┐                        │
│                  │   应用层（Application） │                        │
│                  │                        │                        │
│   ┌──────────────┴──────────────┐        │                        │
│   │      服务层（Services）      │        │                        │
│   │  WellnessPlan / Recipe      │        │                        │
│   │  HerbalTea / Constitution   │        │                        │
│   │  Weather / SolarTerm        │        │                        │
│   └──────────────┬──────────────┘        │                        │
│                  │                        │                        │
│   ┌──────────────┴──────────────┐        │                        │
│   │      规则引擎层（Engines）   │        │                        │
│   │  CM1 节气不变层             │        │                        │
│   │  CM2 地域适配               │        │                        │
│   │  CM3 体质适配               │        │                        │
│   │  CM4 三维合成               │        │                        │
│   │  天气修正                   │        │                        │
│   └──────────────┬──────────────┘        │                        │
│                  │                        │                        │
│   ┌──────────────┴──────────────┐        │                        │
│   │       数据层（Data）        │        │                        │
│   │   JSON 配置驱动（无数据库）   │        │                        │
│   │   24 节气 / 300+ 城市 /     │        │                        │
│   │   9×24 体质适配 / 食材池    │        │                        │
│   └────────────────────────────┘        │                        │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 架构决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 数据库 | **JSON 文件 + 本地存储**（v2.0 无 MySQL） | MVP 阶段无需关系型数据库；用户数据仅存微信本地 Storage |
| 规则引擎 | **纯 Node.js 实现** | 无需 LLM，成本低，结果稳定可解释 |
| 前端框架 | **Taro** | 一套代码同时输出小程序和 H5（PWA） |
| 天气 API | **和风天气免费版** | 国内优化好，MVP 阶段免费够用 |
| 部署 | **服务器直部署** | 单人开发，轻量部署即可 |

---

## 2. 技术栈选型

### 2.1 前端

| 组件 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 跨端框架 | Taro | v3.x | React 语法，同时输出小程序 + H5 |
| UI 组件 | Vant Weapp | 最新版 | 小程序端 UI 库 |
| 自建组件 | React + SCSS | — | 节气卡片、方案卡片、花草茶卡片 |
| 状态管理 | React Hook | — | 页面级状态 |
| PWA | Service Worker + Manifest | — | 网站端 PWA 支持 |

### 2.2 后端

| 组件 | 技术 | 版本 | 说明 |
|------|------|------|------|
| Web 框架 | Express.js | 4.x | 轻量 API 服务 |
| 规则引擎 | Node.js | 20.x | 四层参数化推理 |
| 天气 API | 和风天气 | 免费版 | 每日天气数据 |
| 存储 | JSON 文件 | — | 知识数据（节气/体质/食材池） |

### 2.3 基础设施

| 组件 | 选择 | 说明 |
|------|------|------|
| 服务器 | 腾讯云轻量服务器 2C2G | 成本可控 |
| 域名 | — | ¥50/年 |
| 微信认证 | ¥300/年 | 小程序发布必需 |

---

## 3. 后端架构

### 3.1 目录结构

```
backend/
├── src/
│   ├── routes/              # API 路由层
│   │   ├── solarTerm.js     # 节气 API
│   │   ├── wellness.js      # 方案生成 API
│   │   ├── recipe.js        # 食谱 API
│   │   ├── herbalTea.js     # 花草茶 API（新增）
│   │   ├── constitution.js  # 体质相关 API
│   │   └── weather.js       # 天气 API
│   ├── services/            # 业务逻辑层
│   │   ├── WellnessPlanService.js   # 方案生成服务（核心）
│   │   ├── RecipeService.js         # 食谱服务
│   │   ├── HerbalTeaService.js      # 花草茶服务（新增）
│   │   ├── ConstitutionService.js   # 体质测评服务
│   │   └── WeatherService.js        # 天气服务
│   ├── engines/             # 规则引擎层
│   │   ├── InvarianceLayer.js       # CM1：节气不变层
│   │   ├── RegionalAdaptation.js    # CM2：地域气候适配
│   │   ├── ConstitutionAdaptation.js # CM3：体质适配
│   │   ├── PlanSynthesis.js         # CM4：三维方案合成
│   │   ├── WeatherCorrection.js     # 天气修正
│   │   └── ConstitutionLoader.js    # 体质数据加载
│   ├── data/                # 知识数据（JSON）
│   │   ├── solar_terms.json
│   │   ├── cities.json
│   │   ├── constitutions-final.json
│   │   ├── recipe_pool_*.json
│   │   ├── herbal_tea_pool_*.json
│   │   └── constitution_questionnaire.json
│   └── app.js               # 入口
├── package.json
└── test-engine.js           # 引擎测试脚本
```

### 3.2 服务层职责

| 服务 | 职责 | 依赖 |
|------|------|------|
| WellnessPlanService | 接收节气/城市/体质，调用四层引擎，返回三维方案 | CM1~CM4 + 候递进 |
| RecipeService | 接收节气/城市/体质/天气，返回一日三餐食谱 | CM1~CM3 + 天气修正 |
| HerbalTeaService | 接收节气/城市/体质/天气，返回花草茶配方 | CM1~CM3 + 天气修正 |
| ConstitutionService | 体质测评问卷获取、提交、结果判定、历史查询 | 问卷 JSON + 评分算法 |
| WeatherService | 封装和风天气 API 调用，返回当日天气 | 和风天气 API |

### 3.3 引擎层协作流程

```
用户请求
  │
  ▼
Service 层（参数校验、业务编排）
  │
  ├── CM1 InvarianceLayer
  │   └── 返回节气不变层（方向锚定）
  │
  ├── CM2 RegionalAdaptation
  │   └── 返回地域修正（程度修正）
  │
  ├── CM3 ConstitutionAdaptation
  │   └── 返回体质适配（侧重点偏移）
  │
  ├── CM4 PlanSynthesis
  │   └── 三维方案合成（健康 + 起居 + 饮食）
  │
  └── WeatherCorrection
      └── 天气权重修正（食谱/花草茶）
```

---

## 4. 前端架构

### 4.1 目录结构

```
frontend/
├── src/
│   ├── pages/
│   │   ├── index/           # 首页
│   │   │   ├── index.jsx
│   │   │   └── index.scss
│   │   ├── plan/            # 方案详情页
│   │   │   ├── plan.jsx
│   │   │   └── plan.scss
│   │   ├── assess/          # 体质测评
│   │   │   ├── assess.jsx
│   │   │   └── assess.scss
│   │   └── tea/             # 花草茶详情页（新增）
│   │       ├── tea.jsx
│   │       └── tea.scss
│   ├── components/          # 公共组件
│   ├── services/
│   │   ├── api.js           # API 调用封装
│   │   └── cache.js         # 本地缓存
│   └── utils/
│       ├── date.js          # 日期工具（节气计算等）
│       └── weather.js       # 天气解析
├── config/
│   ├── index.js             # 基础配置
│   ├── dev.js               # 开发环境
│   └── prod.js              # 生产环境
└── package.json
```

### 4.2 页面与组件映射

| 页面 | 核心组件 | 说明 |
|------|---------|------|
| 首页 index | 节气卡片、方案卡片、花草茶卡片、体质卡片、倒计时卡片 | 信息聚合页 |
| 方案详情 plan | 健康卡片、起居卡片、饮食卡片、食材推荐 | 方案展开页 |
| 体质测评 assess | 问卷题卡、进度条、结果卡片 | 引导测评 + 结果展示 |
| 花草茶详情 tea | 配方卡片、备选卡片 | 花草茶专属详情页（新增） |
| 我的 | 体质设置、城市设置、历史记录 | 设置 + 个人信息 |

### 4.3 前端数据流

```
用户操作
  │
  ▼
页面组件（React Class Component）
  │
  ▼
API 调用层（Taro.request 封装）
  │
  ▼
后端 API（Express.js）
  │
  ▼
返回 JSON → 页面 setState → 渲染
```

**前端缓存策略：**

- 用户体质：`Taro.getStorageSync('constitution')`
- 用户城市：`Taro.getStorageSync('city')`
- 用户 ID：`Taro.getStorageSync('userId')`
- 方案数据：下拉刷新时重新获取，无主动缓存

---

## 5. 规则引擎设计（核心）

### 5.1 四层参数化推理引擎

引擎是产品的核心差异化能力，通过四层逐步收敛个性化方案。

```
CM1 节气不变层（方向锚定）
  → 确定节气养生大方向（清热/温补/养心等）
  → 确定体质脆弱点（节气对人体的固有影响）

CM2 地域气候适配（程度修正）
  → 根据城市气候类型，调整养生方向的程度
  → 寒冷地区：加强温补；湿热地区：加强清热

CM3 体质适配（侧重点偏移）
  → 根据用户体质，偏调整体方向的侧重点
  → 阳虚体质：侧重健脾温阳；阴虚体质：侧重滋阴润燥

CM4 三维方案合成（输出）
  → 将上述三层信息合成为健康 + 起居 + 饮食三维方案
```

### 5.2 CM1：节气不变层

**职责**：加载节气固定的养生方向、脆弱点、阴阳属性、中医当令等不变量。

**输入**：节气名称（如"小暑"）
**输出**：不变层数据对象

```javascript
// InvarianceLayer.js

class InvarianceLayer {
  static getInvariance(term) {
    // 从 solar_terms.json 加载节气数据
    const data = solarTermsData.solar_terms.find(t => t.term_name === term);
    return {
      term: data.term_name,
      solar_longitude: data.solar_longitude,
      climate_pattern: data.climate_trend,
      yinyang: data.yinyang_attribute,
      tcm_organ: data.tcm_organ_command,
      wellness_direction: data.wellness_direction,
      vulnerability_points: data.vulnerability_points,
      season: data.season,
    };
  }

  static getCurrentHou(term, day) {
    // 返回当前候（初候/中候/末候）
    const houIndex = Math.min(Math.floor((day - 1) / 5), 2);
    const houNames = ['初候', '中候', '末候'];
    return {
      name: houNames[houIndex],
      intensity: houIndex === 0 ? 0.8 : houIndex === 1 ? 1.0 : 1.2,
    };
  }

  static getTermByDate(date) {
    // 根据日期计算当前节气
    // 使用 24 节气公历近似日期
    // 返回节气名称
  }
}
```

### 5.3 CM2：地域气候适配

**职责**：根据城市气候数据，对养生方向做程度修正。

**输入**：城市名、节气名
**输出**：地域修正参数

```javascript
// RegionalAdaptation.js

class RegionalAdaptation {
  static getAdaptation(city, term) {
    // 从 cities.json 加载城市气候数据
    const cityData = citiesData.cities.find(c => c.city === city);
    if (!cityData) {
      return { climate_type: '通用', deviation: 0 };
    }
    return {
      climate_type: cityData.climate_type,
      avg_temp: cityData.avg_temp,
      humidity: cityData.humidity_range,
      deviation_direction: cityData.deviation_direction,
    };
  }
}
```

### 5.4 CM3：体质适配

**职责**：根据用户体质和节气，返回体质适配参数（脆弱点、方向修正、程度修正、侧重点偏移）。

**输入**：体质类型、节气名、城市名
**输出**：体质适配数据

```javascript
// ConstitutionAdaptation.js

class ConstitutionAdaptation {
  static getAdaptation(constitution, term, city) {
    // 从 constitutions-final.json 加载体质适配数据
    // 优先匹配（体质 + 节气 + 城市），回退到（体质 + 节气 + 通用）
    return constitutionData;
  }
}
```

### 5.5 CM4：三维方案合成

**职责**：将 CM1~CM3 的输出合成为健康、起居、饮食三维方案。

**输入**：CM1 不变层 + CM2 地域适配 + CM3 体质适配 + 当前候
**输出**：三维方案对象

```javascript
// PlanSynthesis.js

class PlanSynthesis {
  static synthesize({ invariance, regional, constitutionData, hou }) {
    // 根据节气方向 + 地域修正 + 体质适配，生成三维方案文本
    return {
      health: {
        high_risk: [...],
        prevention: [...],
        vulnerability: "..."
      },
      daily_routine: {
        sleep: "...",
        exercise: "...",
        emotion: "..."
      },
      diet: {
        direction: "...",
        recipes: {...}
      }
    };
  }
}
```

### 5.6 天气修正

**职责**：根据当日天气类型，调整食谱/花草茶食材池的权重。

| 天气类型 | 清热食材 | 祛湿食材 | 温性食材 |
|---------|---------|---------|---------|
| 晴天 | 1.0 | 0.8 | 0.9 |
| 雨天 | 0.8 | 1.2 | 1.1 |
| 雪天 | 0.6 | 0.8 | 1.3 |
| 大风 | 1.0 | 1.0 | 1.0 |
| 雾霾 | 0.9 | 1.1 | 0.9 |

### 5.7 食材池轮转算法

**目的**：同一节气 15 天内食谱每日不重复，且与天气关联。

```
每日食谱 = 节气食材池 × 体质筛选 × 天气权重修正 × 日期种子随机选择

其中：
  - 日期种子 = YYYYMMDD（保证同一日期不同用户结果一致，不同日期结果不同）
  - 三餐使用 seed / seed+1 / seed+2 分别选取
```

### 5.8 候递进规则

| 候 | 天数 | 强度系数 | 策略 |
|----|------|---------|------|
| 初候 | 第 1-5 天 | 0.8 | 以当前节气食材为主，温和调整 |
| 中候 | 第 6-10 天 | 1.0 | 标准强度，适度加强 |
| 末候 | 第 11-15 天 | 1.2 | 加强 + 混入下一节气过渡食材 |

---

## 6. 数据模型

### 6.1 核心数据文件清单

| 文件 | 条目数 | 职责 |
|------|--------|------|
| `solar_terms.json` | 24 条 | 节气不变层（气候/阴阳/脏腑/方向/脆弱点/三候） |
| `cities.json` | 300+ 条 | 城市气候数据（气候类型/温度/湿度/偏差） |
| `constitutions-final.json` | 9×24 条 | 九种体质 × 24 节气适配数据 |
| `recipe_pool_*.json` | 节气×体质 | 节气体质食材池（按节气分文件） |
| `herbal_tea_pool_*.json` | 节气×体质 | 花草茶配方池（按节气分文件） |
| `constitution_questionnaire.json` | 8 题 | 体质测评问卷 + 九种体质信息 |
| `weather_correction.json` | ~10 条 | 天气类型 × 食材权重修正系数 |

### 6.2 节气不变层数据结构

```json
{
  "term_name": "小暑",
  "solar_longitude": "105°",
  "season": "夏季",
  "climate_trend": "炎热多雨，湿热交蒸",
  "yinyang_attribute": "阳极阴生",
  "tcm_organ_command": "心",
  "wellness_direction": "清热祛湿，养心安神",
  "vulnerability_points": ["中暑", "暑湿", "心火旺盛"],
  "hou": {
    "初候": { "description": "温风至", "intensity": 0.8 },
    "中候": { "description": "蟋蟀居壁", "intensity": 1.0 },
    "末候": { "description": "鹰始鸷", "intensity": 1.2 }
  }
}
```

### 6.3 体质适配数据结构

```json
{
  "constitution_type": "阳虚质",
  "solar_term": "小暑",
  "city": "通用",
  "vulnerability_points": ["暑湿困脾，阳气更虚", "汗多伤阳"],
  "direction_override": "温性清热，忌寒凉过度",
  "intensity_modifier": "适度",
  "focus_shift": "侧重健脾温阳，兼顾清热"
}
```

### 6.4 食材池数据结构

```json
{
  "solar_term": "小暑",
  "constitution_type": "阳虚质",
  "food_pool": [
    {
      "name": "绿豆薏米粥（加姜丝）",
      "type": "breakfast",
      "ingredients": ["绿豆", "薏米", "姜丝"],
      "tags": ["清热", "温性辅助"]
    },
    {
      "name": "冬瓜老鸭汤",
      "type": "dinner",
      "ingredients": ["冬瓜", "老鸭", "薏米", "陈皮"],
      "tags": ["祛湿", "滋阴"]
    }
  ]
}
```

### 6.5 花草茶配方池数据结构

```json
{
  "solar_term": "小暑",
  "constitution_type": "阳虚质",
  "city": "通用",
  "tea_direction": "温性清热",
  "tea_pool": [
    {
      "name": "玫瑰陈皮茶",
      "ingredients": ["玫瑰花 3g", "陈皮 3g", "生姜 2片"],
      "preparation": "沸水冲泡 10 分钟，温热饮用",
      "note": "适合阳虚体质夏季饮用，不宜过量"
    },
    {
      "name": "菊花薄荷茶",
      "ingredients": ["菊花 5g", "薄荷 3g"],
      "preparation": "沸水冲泡 5 分钟，温热饮用",
      "note": "如感烦热明显，可临时替换"
    }
  ],
  "weather_weights": {
    "rainy": { "warm_tea_bonus": 1.2 },
    "sunny": { "cool_tea_bonus": 1.1 }
  }
}
```

---

## 7. API 设计

### 7.1 API 总览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/solar-term/current?date=YYYY-MM-DD` | 获取指定日期的节气信息 |
| GET | `/api/solar-term/countdown` | 获取下一个节气倒计时 |
| GET | `/api/wellness-plan?term=&city=&constitution=&date=` | 获取养生方案（支持未来日期） |
| GET | `/api/recipe/daily?term=&city=&constitution=&date=` | 获取指定日期食谱 |
| GET | `/api/tea/daily?term=&city=&constitution=&date=` | 获取指定日期花草茶 |
| POST | `/api/constitution/assess` | 提交体质测评 |
| GET | `/api/constitution/user/:userId` | 获取用户体质信息 |
| GET | `/api/constitution/questionnaire` | 获取测评问卷 |
| GET | `/api/constitution/types` | 获取所有体质类型列表 |
| GET | `/api/constitution/type/:type` | 获取体质详细信息 |
| GET | `/api/constitution/history/:userId` | 获取体质测评历史 |
| GET | `/api/weather/:city` | 获取当日天气 |
| GET | `/api/ingredients/:term` | 获取节气食材推荐 |
| GET | `/health` | 健康检查 |

### 7.2 方案生成 API 响应示例

```json
{
  "solar_term": "小暑",
  "date": "2026-07-20",
  "hou": "中候",
  "city": "天津",
  "constitution": "阳虚体质",
  "plan": {
    "health": {
      "high_risk": ["中暑", "感冒（空调病）", "失眠"],
      "prevention": ["避免正午外出", "空调不低于 26°C"],
      "vulnerability": "天津闷热易引动心火→烦躁失眠"
    },
    "daily_routine": {
      "sleep": "夜卧早起（22:00 前入睡），午间小憩 20-30 分钟",
      "exercise": "清晨或傍晚，推荐游泳/太极/八段锦",
      "emotion": "静心养性，避免急躁"
    },
    "diet": {
      "direction": "清热祛湿，养心安神",
      "breakfast": {
        "name": "绿豆薏米粥（加姜丝）",
        "ingredients": ["绿豆", "薏米", "姜丝"]
      },
      "lunch": {
        "name": "凉拌苦瓜 + 炒丝瓜",
        "ingredients": ["苦瓜", "丝瓜", "蒜末"]
      },
      "dinner": {
        "name": "冬瓜老鸭汤",
        "ingredients": ["冬瓜", "老鸭", "薏米", "陈皮"]
      },
      "soup": {
        "name": "绿豆汤（少量）",
        "note": "阳虚体质不宜过量"
      }
    },
    "herbal_tea": {
      "primary": {
        "name": "玫瑰陈皮茶",
        "ingredients": ["玫瑰花 3g", "陈皮 3g", "生姜 2片"],
        "direction": "温性清热，适合阳虚体质夏季饮用",
        "preparation": "沸水冲泡 10 分钟，温热饮用"
      },
      "alternative": {
        "name": "菊花薄荷茶",
        "ingredients": ["菊花 5g", "薄荷 3g"],
        "note": "如感烦热明显，可临时替换为菊花薄荷茶"
      }
    }
  },
  "disclaimer": "本方案仅供参考，不构成医疗建议。特殊人群请遵医嘱。"
}
```

### 7.3 花草茶 API 响应示例

```json
{
  "solar_term": "小暑",
  "date": "2026-07-20",
  "city": "天津",
  "constitution": "阳虚体质",
  "weather": "晴",
  "tea": {
    "primary": {
      "name": "玫瑰陈皮茶",
      "ingredients": ["玫瑰花 3g", "陈皮 3g", "生姜 2片"],
      "direction": "温性清热，适合阳虚体质夏季饮用",
      "preparation": "沸水冲泡 10 分钟，温热饮用",
      "constitution_adaptation": "阳虚体质夏季宜温性清热，玫瑰陈皮茶温和不伤阳"
    },
    "alternative": {
      "name": "菊花薄荷茶",
      "ingredients": ["菊花 5g", "薄荷 3g"],
      "preparation": "沸水冲泡 5 分钟，温热饮用",
      "note": "如感烦热明显，可临时替换为菊花薄荷茶"
    }
  },
  "disclaimer": "本配方仅供参考，不构成医疗建议。特殊人群请遵医嘱。"
}
```

---

## 8. 部署架构

### 8.1 部署拓扑

```
┌─────────────────────────────────────────┐
│       腾讯云轻量服务器（2C2G）             │
│                                         │
│  Nginx（反向代理）                        │
│  ├── 前端静态资源（Taro 构建产物）          │
│  ├── 网站 PWA 静态资源                    │
│  └── 后端 API（Express.js，3000 端口）      │
│                                         │
│  Node.js（规则引擎运行时）                  │
│                                         │
│  JSON 数据文件（本地存储）                  │
└─────────────────────────────────────────┘
```

### 8.2 部署流程

```
1. 前端构建：taro build --type weapp（小程序）
2. 前端构建：taro build --type h5（网站 PWA）
3. 后端部署：npm install → pm2 start app.js
4. Nginx 配置：反向代理 + 静态资源托管
5. 域名绑定 + HTTPS（Let's Encrypt）
```

### 8.3 环境配置

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `PORT` | 后端服务端口 | `3000` |
| `WEATHER_API_KEY` | 和风天气 API Key | — |
| `WEATHER_API_BASE` | 和风天气 API 地址 | `https://devapi.qweather.com/v7/weather/now` |
| `NODE_ENV` | 运行环境 | `production` |

---

## 9. 性能要求

| 指标 | 要求 |
|------|------|
| 小程序首屏加载 | ≤ 2 秒 |
| 方案生成响应 | ≤ 1 秒 |
| 网页首屏加载（PWA） | ≤ 3 秒 |
| API 响应时间 | ≤ 500ms |
| JSON 数据加载 | 应用启动时预加载，后续请求 ≤ 10ms |
| 离线可访问 | 已访问的方案/花草茶可通过 PWA 离线查看 |

---

## 10. 安全与降级

### 10.1 安全策略

| 项目 | 策略 |
|------|------|
| 用户数据 | 仅存储微信本地 Storage，不上传服务器 |
| 体质数据 | 不收集真实姓名、身份证等敏感信息 |
| API 安全 | 无用户认证（MVP 阶段），后续可加 IP 限流 |
| 免责声明 | 每次方案展示均附带免责声明 |

### 10.2 降级策略

| 场景 | 降级方案 |
|------|---------|
| 天气 API 不可用 | 默认"晴天"参数生成食谱 |
| 用户未测评 | 默认"平和质"生成方案 |
| 未知城市 | 回退到最近城市或默认城市（北京） |
| 未知体质 | 回退到"平和质" |
| 缺失节气数据 | 返回错误提示，引导用户稍后再试 |
| 缺失食材池 | 返回基础方案（不含个性化食谱） |

---

## 11. v2.0 与 v1.0 架构差异

| 维度 | v1.0（技术验证版） | v2.0（正式 MVP） |
|------|------------------|-----------------|
| 数据库 | 无（纯 JSON） | 无（纯 JSON，不引入 MySQL） |
| 花草茶 | 规划中，无代码 | HerbalTeaService + herbalTea.js + tea 页面 |
| 时间切换 | 仅支持今日 | 支持今日/明天/后天（传入 date 参数） |
| 网站 | 无 | Taro H5 + PWA 配置 |
| 错误处理 | 基础 | 完善降级策略 + 异常捕获 |
| API 覆盖 | 部分 | 14 个 API 端点全覆盖 |
| 体质覆盖 | 部分 | 九种体质全覆盖 |

---

## 12. 附录

### 12.1 关键文件索引

| 文件 | 路径 |
|------|------|
| 后端入口 | `backend/src/app.js` |
| 节气不变层引擎 | `backend/src/engines/InvarianceLayer.js` |
| 体质适配引擎 | `backend/src/engines/ConstitutionAdaptation.js` |
| 方案合成引擎 | `backend/src/engines/PlanSynthesis.js` |
| 体质测评问卷 | `backend/src/data/constitution_questionnaire.json` |
| 节气数据 | `backend/src/data/solar_terms.json` |
| 城市数据 | `backend/src/data/cities.json` |
| 前端首页 | `frontend/src/pages/index/index.jsx` |
| 前端测评页 | `frontend/src/pages/assess/assess.jsx` |
| Taro 配置 | `frontend/config/index.js` |

### 12.2 开发调试

```bash
# 启动后端
cd backend && npm install && npm start

# 启动小程序（微信开发者工具）
cd frontend && npm install && taro build --type weapp --watch

# 启动网站（H5）
cd frontend && npm install && taro build --type h5 --watch
```

---

> **版本**：v2.0
> **日期**：2026-07-21
> **对齐文档**：PRD v2.0

# 顺时养生技术架构方案 v1.0

> 日期：2026-07-20
> 状态：v1.0
> 依据：product-engineering-chain Step 2-3

---

## 1. 架构概览

```
┌─────────────────────────────────────────────────────┐
│                  表现层（Presentation）               │
│  微信小程序（Taro React） + 网站（Taro H5）            │
│  组件：Vant Weapp + 自有组件                           │
├─────────────────────────────────────────────────────┤
│                  应用层（Application）                │
│  规则引擎（三层参数化推理） + API服务（Express.js）      │
│  模块：节气服务 / 体质服务 / 食谱服务 / 花草茶服务 / 天气服务         │
├─────────────────────────────────────────────────────┤
│                  数据层（Data）                       │
│  MySQL + 知识数据（JSON/YAML配置）                     │
│  表：节气不变层 / 地域气候 / 体质适配 / 天气修正 / 食谱池 │
└─────────────────────────────────────────────────────┘
```

---

## 2. 技术栈选型

| 层 | 技术 | 版本 | 选择理由 |
|----|------|------|---------|
| **前端框架** | Taro | v3.x | 一套代码同时输出小程序和H5 |
| **前端UI** | Vant Weapp | 最新版 | 微信生态UI组件库，成熟稳定 |
| **后端框架** | Express.js | 4.x | 生态成熟，单人开发学习成本低 |
| **数据库** | MySQL | 8.0 | 关系型查询效率高，支持JSON字段 |
| **天气API** | 和风天气 | 免费版 | 国内优化好，数据质量高 |
| **推送** | 微信模板消息 | — | 用户主动交互后触发 |
| **部署** | 腾讯云轻量服务器 | 2C2G | 成本可控，SSH管理简单 |
| **CI/CD** | GitHub Actions | — | 自动化构建+部署 |

---

## 3. 系统架构

### 3.1 后端模块划分

```
backend/
├── src/
│   ├── routes/              # API路由层
│   │   ├── solarTerm.js     # 节气相关API
│   │   ├── wellness.js      # 方案生成API
│   │   ├── recipe.js        # 食谱API
│   │   ├── constitution.js  # 体质相关API
│   │   └── weather.js       # 天气API
│   ├── services/            # 业务逻辑层
│   │   ├── SolarTermService.js    # 节气服务
│   │   ├── WellnessPlanService.js # 方案生成服务（核心规则引擎）
│   │   ├── RecipeService.js       # 食谱服务
│   │   ├── ConstitutionService.js # 体质服务
│   │   └── WeatherService.js      # 天气服务
│   ├── engines/             # 规则引擎层
│   │   ├── InvarianceLayer.js     # CM1：节气不变层
│   │   ├── RegionalAdaptation.js  # CM2：地域气候适配
│   │   ├── ConstitutionAdaptation.js # CM3：体质适配
│   │   ├── PlanSynthesis.js       # CM4：三维方案合成
│   │   └── WeatherCorrection.js   # 天气修正
│   ├── models/              # 数据模型层
│   │   ├── SolarTerm.js
│   │   ├── CityClimate.js
│   │   ├── Constitution.js
│   │   ├── RecipePool.js
│   │   ├── HerbalTeaPool.js
│   │   └── UserProfile.js
│   ├── config/              # 配置层
│   │   ├── db.js            # 数据库配置
│   │   ├── weather.js       # 天气API配置
│   │   └── knowledge.json   # 知识数据（JSON）
│   └── app.js               # 入口
└── package.json
```

### 3.2 前端页面结构

```
frontend/
├── src/
│   ├── pages/
│   │   ├── index/            # 首页
│   │   ├── plan/             # 方案详情页
│   │   ├── assess/           # 体质测评
│   │   ├── ingredients/      # 节气食材推荐
│   │   └── profile/          # 我的
│   ├── components/
│   │   ├── SolarTermCard.js  # 节气卡片
│   │   ├── WellnessCard.js   # 方案卡片
│   │   ├── RecipeCard.js     # 食谱卡片
│   │   ├── HerbalTeaCard.js  # 花草茶卡片
│   │   └── CountdownCard.js  # 倒计时卡片
│   ├── services/
│   │   ├── api.js            # API调用封装
│   │   └── cache.js          # 本地缓存
│   └── utils/
│       ├── date.js           # 日期工具
│       └── weather.js        # 天气解析
└── config/
    └── index.js              # Taro配置
```

---

## 4. 规则引擎架构（核心）

### 4.1 三层参数化推理引擎

```javascript
// WellnessPlanService.js（伪代码）

class WellnessPlanService {
  async generatePlan({ term, city, constitution }) {
    // CM1：节气不变层（方向锚定）
    const invariance = await this.cm1_getInvariance(term);

    // CM2：地域气候适配（程度修正）
    const regional = await this.cm2_getRegional(city, term);

    // CM3：体质适配（侧重点偏移）
    const constitution = await this.cm3_getConstitution(constitution_type, term, city);

    // CM4：三维方案合成
    const plan = this.cm4_synthesize({ invariance, regional, constitution });

    return plan;
  }
}
```

### 4.2 食材池轮转算法

```javascript
// RecipeService.js（伪代码）

class RecipeService {
  async getDailyRecipe({ term, city, constitution, weather, date }) {
    const foodPool = await this.getFoodPool(term, city, constitution);
    const weatherWeights = await this.getWeatherWeights(weather);
    const seed = this.generateSeed(date);

    const breakfast = this.weightedRandomSelect(foodPool, weatherWeights, seed);
    const lunch = this.weightedRandomSelect(foodPool, weatherWeights, seed + 1);
    const dinner = this.weightedRandomSelect(foodPool, weatherWeights, seed + 2);

    return { breakfast, lunch, dinner };
  }
}
```

### 4.3 候递进规则

| 候 | 天数 | 强度修正 | 食材池优先级 |
|----|------|---------|-------------|
| 初候 | 第1-5天 | 0.8（温和） | 清热为主 |
| 中候 | 第6-10天 | 1.0（标准） | 清热+祛湿并重 |
| 末候 | 第11-15天 | 1.2（加强）+ 下一节气食材 | 过渡至下一节气 |

---

## 5. 数据库设计

### 5.1 核心表

| 表名 | 说明 | 条目数 |
|------|------|--------|
| `solar_term_registry` | 节气不变层 | 24 |
| `city_climate` | 城市气候数据 | 300+ |
| `constitution_adaptation` | 体质适配 | 9×24 |
| `weather_correction` | 天气修正 | 10 |
| `recipe_pool` | 食材池 | 24×9 |
| `user_profile` | 用户档案 | 动态 |
| `recipe_history` | 历史食谱 | 动态 |

### 5.2 关键表结构

```sql
-- 节气不变层
CREATE TABLE solar_term_registry (
  id INT PRIMARY KEY AUTO_INCREMENT,
  term_name VARCHAR(10) NOT NULL,
  date_range VARCHAR(50) NOT NULL,
  solar_longitude VARCHAR(20) NOT NULL,
  climate_pattern VARCHAR(200) NOT NULL,
  yinyang_attribute VARCHAR(50) NOT NULL,
  tcm_organ VARCHAR(50) NOT NULL,
  wellness_direction VARCHAR(100) NOT NULL,
  vulnerability_points TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 城市气候
CREATE TABLE city_climate (
  id INT PRIMARY KEY AUTO_INCREMENT,
  city VARCHAR(20) NOT NULL,
  climate_type VARCHAR(20) NOT NULL,
  avg_temp_jan DECIMAL(5,1),
  avg_temp_jul DECIMAL(5,1),
  humidity_range VARCHAR(50),
  deviation_direction VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 体质适配
CREATE TABLE constitution_adaptation (
  id INT PRIMARY KEY AUTO_INCREMENT,
  constitution_type VARCHAR(20) NOT NULL,
  solar_term VARCHAR(10) NOT NULL,
  city VARCHAR(20) DEFAULT '通用',
  vulnerability_points TEXT NOT NULL,
  direction_override VARCHAR(100),
  intensity_modifier VARCHAR(100),
  focus_shift VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 天气修正
CREATE TABLE weather_correction (
  id INT PRIMARY KEY AUTO_INCREMENT,
  weather_type VARCHAR(20) NOT NULL,
  cool_food_weight DECIMAL(3,2) DEFAULT 1.0,
  moist_food_weight DECIMAL(3,2) DEFAULT 1.0,
  warm_food_weight DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 食材池（JSON字段存储）
CREATE TABLE recipe_pool (
  id INT PRIMARY KEY AUTO_INCREMENT,
  solar_term VARCHAR(10) NOT NULL,
  constitution_type VARCHAR(20) NOT NULL,
  food_pool JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 花草茶配方池（JSON字段存储）
CREATE TABLE herbal_tea_pool (
  id INT PRIMARY KEY AUTO_INCREMENT,
  solar_term VARCHAR(10) NOT NULL,
  constitution_type VARCHAR(20) NOT NULL,
  city VARCHAR(20) DEFAULT '通用',
  tea_direction VARCHAR(50) NOT NULL,
  tea_pool JSON NOT NULL,
  weather_weights JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. API设计

### 6.1 核心API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/solar-term/current` | 当前节气信息 |
| GET | `/api/wellness-plan` | 节气养生方案（节气+地域+体质） |
| GET | `/api/recipe/daily` | 当日食谱（节气+地域+体质+天气） |
| POST | `/api/constitution/assess` | 体质测评提交 |
| GET | `/api/constitution/{userId}` | 用户体质信息 |
| GET | `/api/weather/{city}` | 当日天气 |
| GET | `/api/solar-term/countdown` | 节气倒计时 |
| GET | `/api/ingredients/{term}` | 节气食材推荐 |

### 6.2 方案生成API响应

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
      "prevention": ["避免正午外出", "空调不低于26°C"],
      "vulnerability": "天津闷热易引动心火→烦躁失眠"
    },
    "daily_routine": {
      "sleep": "夜卧早起（22:00前入睡），午间小憩20-30分钟",
      "exercise": "清晨或傍晚，推荐游泳/太极/八段锦",
      "emotion": "静心养性，避免急躁"
    },
    "diet": {
      "breakfast": { "name": "绿豆薏米粥（加姜丝）", "ingredients": ["绿豆", "薏米", "姜丝"] },
      "lunch": { "name": "凉拌苦瓜 + 炒丝瓜", "ingredients": ["苦瓜", "丝瓜", "蒜末"] },
      "dinner": { "name": "冬瓜老鸭汤", "ingredients": ["冬瓜", "老鸭", "薏米", "陈皮"] },
      "soup": { "name": "绿豆汤（少量）", "note": "阳虚体质不宜过量" }
    },
    "herbal_tea": {
      "name": "玫瑰陈皮茶",
      "ingredients": ["玫瑰花 3g", "陈皮 3g", "生姜 2片"],
      "direction": "温性清热，适合阳虚体质夏季饮用",
      "preparation": "沸水冲泡10分钟，温热饮用",
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

---

## 7. 部署架构

```
┌─────────────────────────────────────────┐
│         腾讯云轻量服务器（2C2G）             │
│                                         │
│  Nginx（反向代理）                        │
│  ├── 前端静态资源（Taro构建产物）            │
│  └── 后端API（Express.js，3000端口）        │
│                                         │
│  MySQL 8.0（数据库）                       │
│                                         │
│  Node.js（规则引擎运行时）                   │
└─────────────────────────────────────────┘
```

---

## 8. 成本估算

| 项目 | 成本 |
|------|------|
| 服务器（2C2G，腾讯云轻量） | ¥200/月 |
| 域名 | ¥50/年 |
| 微信认证 | ¥300/年 |
| 天气API | ¥0（免费版） |
| **总计** | 约¥600-1800/3个月 |

---

## 9. 性能要求

| 指标 | 要求 |
|------|------|
| 首屏加载 | ≤2秒 |
| 方案生成 | ≤1秒 |
| 数据库查询 | ≤100ms |
| 并发用户 | 100（MVP期） |

---

> 版本：v1.0
> 日期：2026-07-20

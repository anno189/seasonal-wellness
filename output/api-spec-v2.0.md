# 顺时生活 API 接口文档 v2.0

> **版本**：v2.0
> **日期**：2026-07-21
> **依据**：PRD v2.0 + Architecture v2.0
> **基础 URL**：`http://localhost:3000/api`（开发环境）
> **内容类型**：application/json

---

## 1. 接口总览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/solar-term/current` | 获取当前节气信息 |
| GET | `/solar-term/countdown` | 获取下一个节气倒计时 |
| GET | `/wellness-plan` | 获取养生方案 |
| GET | `/recipe/daily` | 获取当日食谱 |
| GET | `/tea/daily` | 获取当日花草茶 |
| POST | `/constitution/assess` | 提交体质测评 |
| GET | `/constitution/questionnaire` | 获取测评问卷 |
| GET | `/constitution/user/:userId` | 获取用户体质信息 |
| GET | `/constitution/history/:userId` | 获取体质测评历史 |
| GET | `/constitution/types` | 获取所有体质类型 |
| GET | `/constitution/type/:type` | 获取体质详细信息 |
| POST | `/constitution/reset/:userId` | 重置体质测评历史 |
| GET | `/weather/:city` | 获取当日天气 |
| GET | `/ingredients/:term` | 获取节气食材推荐 |

---

## 2. 公共响应格式

### 2.1 成功响应

```json
{
  "data": { /* 响应数据 */ }
}
```

### 2.2 错误响应

```json
{
  "error": "错误描述",
  "message": "详细错误信息"
}
```

### 2.3 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 3. 节气相关接口

### 3.1 获取当前节气

```
GET /api/solar-term/current?date=YYYY-MM-DD
```

**请求参数：**

| 参数 | 必填 | 类型 | 说明 | 默认值 |
|------|------|------|------|--------|
| date | 否 | string | 目标日期（YYYY-MM-DD），不传则返回当前日期 | 当日日期 |

**响应示例：**

```json
{
  "data": {
    "term": "小暑",
    "date": "2026-07-20",
    "solar_longitude": "105°",
    "season": "夏季",
    "climate_pattern": "炎热多雨，湿热交蒸",
    "yinyang_attribute": "阳极阴生",
    "tcm_organ": "心",
    "wellness_direction": "清热祛湿，养心安神",
    "vulnerability_points": ["中暑", "暑湿", "心火旺盛"],
    "hou": {
      "name": "中候",
      "description": "蟋蟀居壁",
      "intensity": 1.0,
      "day": 6,
      "end_day": 10
    }
  }
}
```

### 3.2 获取节气倒计时

```
GET /api/solar-term/countdown
```

**请求参数：** 无

**响应示例：**

```json
{
  "data": {
    "next_term": "大暑",
    "days_left": 2,
    "date": "2026-07-22",
    "term_info": {
      "season": "夏季",
      "wellness_direction": "清热解暑，益气养阴",
      "key_advice": "注意防暑降温，适当补充盐分和水分"
    }
  }
}
```

---

## 4. 方案生成接口

### 4.1 获取养生方案

```
GET /api/wellness-plan?term=&city=&constitution=&date=
```

**请求参数：**

| 参数 | 必填 | 类型 | 说明 | 默认值 |
|------|------|------|------|--------|
| term | 是 | string | 节气名称（如"小暑"） | — |
| city | 是 | string | 城市名（如"北京"） | — |
| constitution | 否 | string | 体质类型（如"阳虚质"） | 平和质 |
| date | 否 | string | 目标日期（YYYY-MM-DD） | 当日日期 |

**响应示例：**

```json
{
  "data": {
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
}
```

---

## 5. 食谱接口

### 5.1 获取当日食谱

```
GET /api/recipe/daily?term=&city=&constitution=&date=
```

**请求参数：**

| 参数 | 必填 | 类型 | 说明 | 默认值 |
|------|------|------|------|--------|
| term | 是 | string | 节气名称 | — |
| city | 是 | string | 城市名 | — |
| constitution | 否 | string | 体质类型 | 平和质 |
| date | 否 | string | 目标日期（YYYY-MM-DD） | 当日日期 |

**响应示例：**

```json
{
  "data": {
    "solar_term": "小暑",
    "date": "2026-07-20",
    "city": "天津",
    "constitution": "阳虚体质",
    "weather": "晴",
    "diet": {
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
    "disclaimer": "本食谱仅供参考，不构成医疗建议。特殊人群请遵医嘱。"
  }
}
```

---

## 6. 花草茶接口

### 6.1 获取当日花草茶

```
GET /api/tea/daily?term=&city=&constitution=&date=
```

**请求参数：**

| 参数 | 必填 | 类型 | 说明 | 默认值 |
|------|------|------|------|--------|
| term | 是 | string | 节气名称 | — |
| city | 是 | string | 城市名 | — |
| constitution | 否 | string | 体质类型 | 平和质 |
| date | 否 | string | 目标日期（YYYY-MM-DD） | 当日日期 |

**响应示例：**

```json
{
  "data": {
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
}
```

---

## 7. 体质相关接口

### 7.1 获取测评问卷

```
GET /api/constitution/questionnaire
```

**请求参数：** 无

**响应示例：**

```json
{
  "data": {
    "version": "v2.0",
    "description": "体质测评问卷 — 8 题调研式问答，基于中华中医药学会《中医体质分类与评定》标准",
    "instructions": "请根据自己的真实感受选择【是】或【否】，不要反复思考",
    "threshold": {
      "mixed_score_min": 0.5,
      "primary_score_max": 0.85,
      "note": "当一种体质得分 > 85% 判定为单一体质；当最高分体质得分 50%-85% 且有 2 种以上 > 50% 时判定为混合体质；否则判定为平和质"
    },
    "questions": [
      {
        "id": 1,
        "question": "您容易疲乏、气短、懒言、动则出汗吗？",
        "target_constitutions": {
          "气虚质": 3,
          "阳虚质": 1
        }
      }
    ]
  }
}
```

### 7.2 提交体质测评

```
POST /api/constitution/assess
```

**请求体：**

```json
{
  "userId": "user_123",
  "answers": [
    { "questionId": 1, "value": 1 },
    { "questionId": 2, "value": 0 },
    { "questionId": 3, "value": 1 },
    { "questionId": 4, "value": 0 },
    { "questionId": 5, "value": 0 },
    { "questionId": 6, "value": 0 },
    { "questionId": 7, "value": 1 },
    { "questionId": 8, "value": 0 }
  ]
}
```

**请求参数：**

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| userId | 是 | string | 用户唯一标识 |
| answers | 是 | array | 8 题答案，每题包含 questionId（1-8）和 value（1=是，0=否） |

**响应示例：**

```json
{
  "data": {
    "constitution": "阴虚质",
    "is_mixed": false,
    "constitution_types": ["阴虚质"],
    "scores": {
      "阴虚质": 0.75,
      "气虚质": 0.40,
      "阳虚质": 0.25
    },
    "constitution_info": {
      "name": "阴虚质",
      "description": "阴液亏少，口燥咽干，手足心热，易失眠",
      "features": ["口燥咽干", "手足心热", "易失眠", "大便干结"],
      "wellness_principle": "滋阴润燥，忌辛辣，避免熬夜",
      "key_advice": "多食银耳、百合、梨；避免熬夜和辛辣食物"
    },
    "note": "您的体质以阴虚质为主，建议滋阴润燥，避免熬夜和辛辣食物。"
  }
}
```

### 7.3 获取用户体质信息

```
GET /api/constitution/user/:userId
```

**路径参数：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| userId | 是 | string | 用户唯一标识 |

**响应示例：**

```json
{
  "data": {
    "constitution": "阴虚质",
    "is_mixed": false,
    "assessment_date": "2026-07-20",
    "constitution_info": {
      "name": "阴虚质",
      "description": "阴液亏少，口燥咽干，手足心热，易失眠",
      "features": ["口燥咽干", "手足心热", "易失眠", "大便干结"],
      "wellness_principle": "滋阴润燥，忌辛辣，避免熬夜",
      "key_advice": "多食银耳、百合、梨；避免熬夜和辛辣食物"
    }
  }
}
```

**错误响应（未测评）：**

```json
{
  "error": "尚未完成体质测评"
}
```

### 7.4 获取体质测评历史

```
GET /api/constitution/history/:userId
```

**路径参数：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| userId | 是 | string | 用户唯一标识 |

**响应示例：**

```json
{
  "data": [
    {
      "assessment_date": "2026-07-20",
      "constitution": "阴虚质",
      "is_mixed": false
    },
    {
      "assessment_date": "2026-07-15",
      "constitution": "阴虚质",
      "is_mixed": false
    }
  ]
}
```

### 7.5 重置体质测评历史

```
POST /api/constitution/reset/:userId
```

**路径参数：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| userId | 是 | string | 用户唯一标识 |

**响应示例：**

```json
{
  "data": {
    "message": "测评历史已清除"
  }
}
```

### 7.6 获取所有体质类型

```
GET /api/constitution/types
```

**请求参数：** 无

**响应示例：**

```json
{
  "data": {
    "types": [
      "平和质",
      "气虚质",
      "阳虚质",
      "阴虚质",
      "痰湿质",
      "湿热质",
      "血瘀质",
      "气郁质",
      "特禀质"
    ]
  }
}
```

### 7.7 获取体质详细信息

```
GET /api/constitution/type/:type
```

**路径参数：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| type | 是 | string | 体质类型名称 |

**响应示例：**

```json
{
  "data": {
    "name": "阳虚质",
    "description": "阳气不足，怕冷，手足不温，喜热饮食",
    "features": ["怕冷", "手足不温", "喜热饮", "大便稀溏"],
    "wellness_principle": "温补阳气，忌食生冷，注意保暖",
    "key_advice": "多食羊肉、生姜、桂圆；冬季尤其注意保暖"
  }
}
```

---

## 8. 天气接口

### 8.1 获取当日天气

```
GET /api/weather/:city
```

**路径参数：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| city | 是 | string | 城市名（如"北京"） |

**响应示例：**

```json
{
  "data": {
    "city": "天津",
    "date": "2026-07-20",
    "weather_type": "晴",
    "temperature": {
      "current": 32,
      "high": 35,
      "low": 26
    },
    "humidity": 65,
    "wind": {
      "direction": "东南风",
      "speed": "3-4级"
    }
  }
}
```

**错误响应（API 不可用）：**

```json
{
  "error": "天气数据获取失败",
  "message": "使用默认参数（晴天）生成方案"
}
```

---

## 9. 食材推荐接口

### 9.1 获取节气食材推荐

```
GET /api/ingredients/:term
```

**路径参数：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| term | 是 | string | 节气名称 |

**响应示例：**

```json
{
  "data": {
    "solar_term": "小暑",
    "date_range": "2026-07-06 至 2026-07-21",
    "ingredients": {
      "宜食": {
        "清热类": ["绿豆", "苦瓜", "冬瓜", "丝瓜"],
        "祛湿类": ["薏米", "赤小豆", "陈皮"],
        "养心类": ["百合", "莲子", "桂圆"]
      },
      "忌食": ["羊肉", "辣椒", "荔枝", "龙眼"]
    }
  }
}
```

---

## 10. 健康检查

### 10.1 服务健康检查

```
GET /health
```

**请求参数：** 无

**响应示例：**

```json
{
  "status": "ok",
  "message": "顺时生活后端运行正常"
}
```

---

## 11. 错误处理规范

### 11.1 常见错误码

| HTTP 状态码 | 错误描述 | 说明 |
|-------------|---------|------|
| 400 | 缺少参数 | 必填参数未提供 |
| 400 | 参数格式错误 | 参数值不符合格式要求 |
| 404 | 资源不存在 | 指定的节气/体质/城市不存在 |
| 404 | 尚未完成体质测评 | 用户未进行体质测评 |
| 500 | 服务器内部错误 | 引擎或数据加载异常 |

### 11.2 错误响应示例

**参数缺失：**

```json
{
  "error": "缺少城市参数 (city)"
}
```

**未知节气：**

```json
{
  "error": "未知节气: XXX"
}
```

**数据加载异常：**

```json
{
  "error": "服务器内部错误",
  "message": "节气数据加载失败"
}
```

---

> **版本**：v2.0
> **日期**：2026-07-21
> **对齐文档**：PRD v2.0 + Architecture v2.0

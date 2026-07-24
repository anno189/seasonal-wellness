/**
 * HerbalTeaService v2.0 — 花草茶服务
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import RegionalAdaptation from '../engines/RegionalAdaptation.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = resolve(__dirname, '../../../data')

const WEATHER_WEIGHT_MAP: Record<string, { cool: number; warm: number; moist: number }> = {
  '晴天':   { cool: 1.2, warm: 1.0, moist: 0.8 },
  '多云':   { cool: 1.0, warm: 1.0, moist: 1.0 },
  '阴天':   { cool: 1.0, warm: 1.1, moist: 1.2 },
  '小雨':   { cool: 0.8, warm: 1.2, moist: 1.5 },
  '中雨':   { cool: 0.7, warm: 1.2, moist: 1.6 },
  '大雨':   { cool: 0.6, warm: 1.1, moist: 1.8 },
  '雷阵雨': { cool: 0.8, warm: 1.1, moist: 1.5 },
  '高温':   { cool: 1.5, warm: 0.6, moist: 1.0 },
  '低温':   { cool: 0.5, warm: 1.6, moist: 1.0 },
  '雾霾':   { cool: 1.2, warm: 1.0, moist: 1.2 },
}

const COOL_INGREDIENTS = ['菊花', '金银花', '薄荷', '蒲公英', '栀子', '绿豆', '荷叶', '莲子心']
const WARM_INGREDIENTS = ['生姜', '桂圆', '红枣', '大枣', '红糖', '枸杞', '荔枝']
const MOIST_INGREDIENTS = ['薏米', '赤小豆', '茯苓', '白扁豆', '陈皮', '山药', '白术', '荷叶']

function classifyTea(ingredients: string[]) {
  let coolScore = 0, warmScore = 0, moistScore = 0
  for (const ing of ingredients) {
    const name = ing.replace(/[\d\.]+g?$/g, '').trim()
    if (COOL_INGREDIENTS.some(k => name.includes(k))) coolScore += 2
    if (WARM_INGREDIENTS.some(k => name.includes(k))) warmScore += 2
    if (MOIST_INGREDIENTS.some(k => name.includes(k))) moistScore += 2
  }
  return { coolScore, warmScore, moistScore }
}

function loadTeaPools() {
  const poolFile = resolve(DATA_DIR, 'herbal_tea_pool_v2.json')
  try {
    const data = JSON.parse(readFileSync(poolFile, 'utf-8'))
    return data.entries || []
  } catch (err) {
    console.error(`Error loading herbal_tea_pool_v2.json: ${err.message}`)
    return []
  }
}

let teaCache: any[] = []

export class HerbalTeaService {
  static getTeaRecommendation(term: string, constitution: string, weather: string | null = null, date: string | null = null, city: string | null = null, opts?: { intensityFactor?: number }) {
    const pools = teaCache.length ? teaCache : loadTeaPools()
    teaCache = pools

    const pool = pools.find(p => p.solar_term === term && p.constitution_type === constitution)
    if (!pool) {
      const fallbackPool = pools.find(p => p.solar_term === term)
      if (fallbackPool) return this.getFromPool(fallbackPool, weather, date, city, opts?.intensityFactor)
      return this.getDefaultTea(term)
    }
    return this.getFromPool(pool, weather, date, city, opts?.intensityFactor)
  }

  static getFromPool(pool: any, weather: string | null, date: string | null, city: string | null, intensityFactor: number = 1.0) {
    const teaPool = pool.tea_pool || []
    const teaDirection = pool.tea_direction || ''
    const baseWeights = pool.weather_weights || { cool_tea_weight: 1.0, warm_tea_weight: 1.0, moist_tea_weight: 1.0 }

    if (teaPool.length === 0) return this.getDefaultTea(pool.solar_term)

    // 天气权重
    const weatherMap = weather ? (WEATHER_WEIGHT_MAP[weather] || WEATHER_WEIGHT_MAP['多云']) : null
    const finalWeights = weatherMap
      ? {
          cool: baseWeights.cool_tea_weight * weatherMap.cool,
          warm: baseWeights.warm_tea_weight * weatherMap.warm,
          moist: baseWeights.moist_tea_weight * weatherMap.moist,
        }
      : {
          cool: baseWeights.cool_tea_weight,
          warm: baseWeights.warm_tea_weight,
          moist: baseWeights.moist_tea_weight,
        }

    // 地域权重叠加
    let regionWeights = { cool: 1.0, warm: 1.0, moist: 1.0 }
    if (city) {
      const cityAdaptation = RegionalAdaptation.getAdaptation(city, pool.solar_term)
      const rw = cityAdaptation?.regional_weight
      if (rw) {
        regionWeights = {
          cool: rw.cool_weight || 1.0,
          warm: rw.warm_weight || 1.0,
          moist: rw.damp_weight || 1.0,
        }
      }
    }

    // 评分：天气权重 × 地域权重 × 过渡期强度衰减
    const scoredTeas = teaPool.map((tea: any) => {
      const { coolScore, warmScore, moistScore } = classifyTea(tea.ingredients)
      const weightedScore =
        coolScore * finalWeights.cool * regionWeights.cool +
        warmScore * finalWeights.warm * regionWeights.warm +
        moistScore * finalWeights.moist * regionWeights.moist
      // 过渡期强度衰减：极端花草茶（大寒大热）降分
      let teaFactor = 1.0
      if (intensityFactor < 1.0) {
        const extremeCoolTea = ['苦瓜', '金银花', '栀子', '莲子心', '蒲公英']
        const extremeWarmTea = ['生姜', '桂圆', '当归']
        const allIngredients = tea.ingredients.join('')
        if (extremeCoolTea.some(k => allIngredients.includes(k)) || extremeWarmTea.some(k => allIngredients.includes(k))) {
          teaFactor = intensityFactor
        }
      }
      return { tea, weightedScore: weightedScore * teaFactor }
    })

    scoredTeas.sort((a, b) => b.weightedScore - a.weightedScore)

    const seed = date ? this.generateSeed(date) : 0
    // 取前 30% 高分候选中的一项，确保天气/地域权重真正影响结果
    const topCount = Math.max(1, Math.ceil(scoredTeas.length * 0.3))
    const topPool = scoredTeas.slice(0, topCount)
    const selectIdx = seed % topPool.length
    const primaryTea = topPool[selectIdx].tea
    // 备选取剩余候选中的最高分
    const remaining = scoredTeas.slice(topCount)
    const altTea = remaining.length > 0 ? remaining[0].tea : (topPool.length > 1 ? topPool[(selectIdx + 1) % topPool.length].tea : null)
    const weatherNote = weather ? this.generateWeatherNote(weather, teaDirection, finalWeights) : ''

    return {
      primary: {
        name: primaryTea.name,
        ingredients: primaryTea.ingredients,
        preparation: primaryTea.preparation,
        note: primaryTea.note,
      },
      alternative: altTea ? {
        name: altTea.name,
        ingredients: altTea.ingredients,
        preparation: altTea.preparation,
        note: altTea.note,
      } : null,
      direction: teaDirection,
      weather_note: weatherNote,
      weather_weights: weatherMap ? finalWeights : null,
      meta: {
        solar_term: pool.solar_term,
        constitution_type: pool.constitution_type,
        city: city || '未知',
        weather_adjusted: !!weather,
        region_adjusted: !!city,
      },
    }
  }

  static generateWeatherNote(weather: string, direction: string, weights: any) {
    const notes: Record<string, string> = {
      '晴天': '天气晴好，建议增加清热类花草茶',
      '多云': '天气温和，按标准配方饮用',
      '阴天': '天气阴沉，建议增加温补类花草茶',
      '小雨': '天气潮湿，建议增加祛湿类花草茶',
      '中雨': '雨水较多，加强祛湿茶饮',
      '大雨': '大雨连绵，注重健脾祛湿茶饮',
      '高温': '高温天气，增加清热解暑茶饮',
      '低温': '低温天气，增加温补茶饮',
      '雾霾': '空气质量差，建议饮用润肺清肺茶饮',
    }
    return notes[weather] || ''
  }

  static generateSeed(date: string) {
    const d = new Date(date)
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  }

  static getDefaultTea(term: string) {
    return {
      primary: {
        name: '根据节气推荐花草茶',
        ingredients: ['根据节气和体质推荐'],
        preparation: '沸水冲泡10-15分钟',
        note: '未找到对应的花草茶池数据',
      },
      alternative: null,
      direction: '根据节气调理',
      weather_note: '',
      weather_weights: null,
      meta: { solar_term: term, note: '未找到对应的花草茶池数据' },
    }
  }

  static getTeaByTerm(term: string) {
    const pools = teaCache.length ? teaCache : loadTeaPools()
    teaCache = pools
    const poolsForTerm = pools.filter(p => p.solar_term === term)
    const recommendations: Record<string, any> = {}
    for (const pool of poolsForTerm) {
      recommendations[pool.constitution_type] = {
        direction: pool.tea_direction,
        teas: pool.tea_pool,
      }
    }
    return recommendations
  }
}

export default HerbalTeaService

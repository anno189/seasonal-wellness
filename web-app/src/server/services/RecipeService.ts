/**
 * RecipeService — 节气级食谱服务
 * v2.1 变更：
 *   - 用 extractIngredients 替换 getWords/isUsed 的前/后缀正则，改为食材字典交集去重
 *   - 增加 pickFrom 权重排序（天气×地域）
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import RegionalAdaptation from '../engines/RegionalAdaptation.js'
import InvarianceLayer from '../engines/InvarianceLayer.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = resolve(__dirname, '../../../data')

/** 24 节气顺序 */
const TERM_ORDER = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒',
]

/** 节气→公历日期（精确覆盖 24 节气） */
const TERM_DATES: Record<string, [number, number]> = {
  '立春': [2, 4], '雨水': [2, 19], '惊蛰': [3, 6], '春分': [3, 21], '清明': [4, 5], '谷雨': [4, 20],
  '立夏': [5, 6], '小满': [5, 21], '芒种': [6, 6], '夏至': [6, 21], '小暑': [7, 7], '大暑': [7, 22],
  '立秋': [8, 8], '处暑': [8, 23], '白露': [9, 8], '秋分': [9, 23], '寒露': [10, 8], '霜降': [10, 23],
  '立冬': [11, 7], '小雪': [11, 22], '大雪': [12, 7], '冬至': [12, 22], '小寒': [1, 6], '大寒': [1, 20],
}

/** 各节气通用的应季兜底食谱（当个人体质池全部被去重后使用） */
const GENERIC_RECIPES: Record<string, { breakfast: string[]; lunch: string[]; dinner: string[]; soup: string[] }> = {
  '立春': { breakfast: ['韭菜炒蛋', '春卷'], lunch: ['韭菜鸡蛋饼', '炒时蔬'], dinner: ['韭菜鸡蛋汤', '炒时蔬'], soup: ['韭菜鸡蛋汤', '炒时蔬'] },
  '雨水': { breakfast: ['菠菜粥', '炒时蔬'], lunch: ['菠菜炒蛋', '炒时蔬'], dinner: ['菠菜猪肝汤', '炒时蔬'], soup: ['菠菜猪肝汤', '炒时蔬'] },
  '惊蛰': { breakfast: ['核桃粥', '炒时蔬'], lunch: ['核桃蒸蛋', '炒时蔬'], dinner: ['核桃炖鸡', '炒时蔬'], soup: ['核桃炖鸡', '炒时蔬'] },
  '春分': { breakfast: ['菠菜猪肝汤', '韭菜炒蛋'], lunch: ['清蒸鲈鱼', '韭菜炒蛋'], dinner: ['韭菜炒蛋', '炒时蔬'], soup: ['菠菜猪肝汤', '炒时蔬'] },
  '清明': { breakfast: ['青团', '糯米粥'], lunch: ['韭菜炒蛋', '炒时蔬'], dinner: ['青团汤', '炒时蔬'], soup: ['青团汤', '炒时蔬'] },
  '谷雨': { breakfast: ['菠菜粥', '炒时蔬'], lunch: ['蒸鲈鱼', '炒时蔬'], dinner: ['菠菜炒蛋', '炒时蔬'], soup: ['菠菜猪肝汤', '炒时蔬'] },
  '立夏': { breakfast: ['南瓜粥', '蒸蛋羹'], lunch: ['清蒸鲈鱼', '炒时蔬'], dinner: ['蒸蛋羹', '炒时蔬'], soup: ['酸梅汤', '冬瓜汤'] },
  '小满': { breakfast: ['绿豆粥', '炒时蔬'], lunch: ['番茄炒蛋', '炒时蔬'], dinner: ['蒜蓉西兰花', '炒时蔬'], soup: ['酸梅汤', '冬瓜汤'] },
  '芒种': { breakfast: ['绿豆粥', '炒时蔬'], lunch: ['凉拌西红柿', '炒时蔬'], dinner: ['蒜蓉西兰花', '炒时蔬'], soup: ['酸梅汤', '冬瓜汤'] },
  '夏至': { breakfast: ['绿豆粥', '炒时蔬'], lunch: ['番茄炒蛋', '炒时蔬'], dinner: ['蒜蓉西兰花', '炒时蔬'], soup: ['酸梅汤', '冬瓜汤'] },
  '小暑': { breakfast: ['绿豆粥', '炒时蔬'], lunch: ['番茄炒蛋', '炒时蔬'], dinner: ['蒜蓉西兰花', '炒时蔬'], soup: ['酸梅汤', '冬瓜汤'] },
  '大暑': { breakfast: ['番茄鸡蛋面', '南瓜粥'], lunch: ['番茄炒蛋', '清蒸鲈鱼'], dinner: ['蒜蓉西兰花', '清蒸鲈鱼'], soup: ['酸梅汤', '番茄蛋花汤'] },
  '立秋': { breakfast: ['银耳羹', '南瓜粥'], lunch: ['银耳清蒸鱼', '炒时蔬'], dinner: ['银耳莲子汤', '炒时蔬'], soup: ['银耳羹', '银耳莲子汤'] },
  '处暑': { breakfast: ['银耳羹', '南瓜粥'], lunch: ['银耳清蒸鱼', '炒时蔬'], dinner: ['银耳莲子汤', '炒时蔬'], soup: ['银耳羹', '银耳莲子汤'] },
  '白露': { breakfast: ['银耳羹', '南瓜粥'], lunch: ['银耳清蒸鱼', '炒时蔬'], dinner: ['银耳莲子汤', '炒时蔬'], soup: ['银耳羹', '银耳莲子汤'] },
  '秋分': { breakfast: ['银耳羹', '山药粥'], lunch: ['蒸鲈鱼', '炒时蔬'], dinner: ['银耳莲子汤', '炒时蔬'], soup: ['银耳羹', '银耳莲子汤'] },
  '寒露': { breakfast: ['银耳羹', '南瓜粥'], lunch: ['蒸鲈鱼', '炒时蔬'], dinner: ['银耳莲子汤', '炒时蔬'], soup: ['银耳羹', '银耳莲子汤'] },
  '霜降': { breakfast: ['银耳羹', '南瓜粥'], lunch: ['蒸鲈鱼', '炒时蔬'], dinner: ['银耳莲子汤', '炒时蔬'], soup: ['银耳羹', '银耳莲子汤'] },
  '立冬': { breakfast: ['羊肉汤面', '炒时蔬'], lunch: ['羊肉生姜粥', '炒时蔬'], dinner: ['羊肉萝卜汤', '炒时蔬'], soup: ['羊肉萝卜汤', '炒时蔬'] },
  '小雪': { breakfast: ['羊肉汤面', '炒时蔬'], lunch: ['当归生姜羊肉', '炒时蔬'], dinner: ['羊肉萝卜汤', '炒时蔬'], soup: ['当归生姜羊肉', '炒时蔬'] },
  '大雪': { breakfast: ['羊肉汤面', '炒时蔬'], lunch: ['当归生姜羊肉', '炒时蔬'], dinner: ['羊肉萝卜汤', '炒时蔬'], soup: ['羊肉萝卜汤', '炒时蔬'] },
  '冬至': { breakfast: ['糯米粥', '炒时蔬'], lunch: ['羊肉生姜粥', '炒时蔬'], dinner: ['羊肉萝卜汤', '炒时蔬'], soup: ['羊肉萝卜汤', '炒时蔬'] },
  '小寒': { breakfast: ['羊肉汤面', '炒时蔬'], lunch: ['当归生姜羊肉', '炒时蔬'], dinner: ['羊肉萝卜汤', '炒时蔬'], soup: ['当归生姜羊肉', '炒时蔬'] },
  '大寒': { breakfast: ['羊肉汤面', '炒时蔬'], lunch: ['当归生姜羊肉', '炒时蔬'], dinner: ['羊肉萝卜汤', '炒时蔬'], soup: ['当归生姜羊肉', '炒时蔬'] },
}

/** 兜底食谱的"极端"关键词——过渡期降分 */
const EXTREME_PATTERNS = ['羊肉', '当归', '酸梅', '酸梅汤', '银耳', '银耳羹']

/** 天气权重修正表 */
const WEATHER_WEIGHTS: Record<string, { cool: number; warm: number; moist: number }> = {
  '晴天': { cool: 1.0, warm: 1.1, moist: 0.9 },
  '多云': { cool: 1.0, warm: 1.0, moist: 1.0 },
  '阴天': { cool: 1.1, warm: 1.0, moist: 1.0 },
  '小雨': { cool: 0.9, warm: 0.9, moist: 1.2 },
  '中雨': { cool: 0.9, warm: 0.8, moist: 1.3 },
  '大雨': { cool: 0.8, warm: 0.7, moist: 1.4 },
  '雷阵雨': { cool: 0.9, warm: 0.9, moist: 1.2 },
  '高温': { cool: 1.3, warm: 0.7, moist: 1.0 },
  '低温': { cool: 0.7, warm: 1.3, moist: 1.0 },
  '雾霾': { cool: 1.0, warm: 1.0, moist: 1.0 },
}

/** 体质→基础权重倾向 */
const BODY_TENDENCY = {
  湿热质: { tendency: { cool: 1.3, warm: 0.7, moist: 1.2 } },
  痰湿质: { tendency: { cool: 1.1, warm: 0.8, moist: 1.3 } },
  气虚质: { tendency: { cool: 0.8, warm: 1.2, moist: 0.9 } },
  阳虚质: { tendency: { cool: 0.6, warm: 1.3, moist: 0.8 } },
  阴虚质: { tendency: { cool: 1.2, warm: 0.7, moist: 1.1 } },
  血瘀质: { tendency: { cool: 0.9, warm: 1.1, moist: 0.9 } },
  特禀质: { tendency: { cool: 1.0, warm: 1.0, moist: 1.0 } },
  平和质: { tendency: { cool: 1.0, warm: 1.0, moist: 1.0 } },
}

/**
 * 核心食材关键词字典 — 覆盖所有菜谱中出现的关键食材
 * 按食材类别分组，优先匹配长词（避免"绿豆"匹配到"绿豆芽"）
 */
const INGREDIENT_KEYWORDS = [
  // 主菜蛋白
  '排骨', '老鸭', '鲈鱼', '豆腐', '虾仁', '猪肝', '鸡蛋', '羊肉', '时蔬', '黑木耳', '木耳',
  // 豆类（注意：绿豆芽在绿豆之前，因为更长）
  '绿豆芽', '绿豆', '赤小豆', '白扁豆',
  // 薯芋类
  '山药', '莲藕', '冬瓜', '南瓜', '白萝卜',
  // 瓜果蔬菜
  '西瓜皮', '西瓜', '丝瓜', '苦瓜', '菠菜', '茄子', '豆角', '番茄', '黄瓜', '西兰花', '菜心', '青菜', '韭菜', '豆芽',
  // 菌菇/药食同源
  '银耳', '石斛', '佛手', '党参', '太子参', '黄芪', '当归', '枸杞', '茯苓', '麦冬', '玉竹', '陈皮', '百合', '生姜',
  '红糖', '红枣', '大枣', '桂圆', '莲子', '核桃', '山楂', '荷叶', '荷花', '薄荷', '玫瑰', '玫瑰花', '菊花', '海带',
  '酸梅', '藕粉', '柠檬', '蜂蜜', '桂花', '栗子',
  // 主食
  '小米', '糯米', '大米', '玉米', '春卷', '春饼', '青团', '粽子', '年糕',
]

/**
 * 从菜谱名中提取食材关键词集合
 * 按长度降序匹配，避免短词误匹配长词
 */
function extractIngredients(recipe: string | undefined): Set<string> {
  if (!recipe) return new Set()
  const name = recipe.replace(/[（(][^）)]*[）)]/g, '')
  const found = new Set<string>()
  const sorted = [...INGREDIENT_KEYWORDS].sort((a, b) => b.length - a.length)
  for (const kw of sorted) {
    if (name.includes(kw)) found.add(kw)
  }
  return found
}

/** 两个食材集合是否有交集 */
function hasIngredientOverlap(a: Set<string>, b: Set<string>): boolean {
  for (const item of a) {
    if (b.has(item)) return true
  }
  return false
}

/**
 * 从候选列表中选择一个不重复的食谱
 * 按"天气权重 × 地域权重"打分排序，取前 30% 高分
 */
function pickFrom(
  list: string[],
  usedIngredients: Set<string>,
  weatherWeights: { cool: number; warm: number; moist: number },
  rw: { cool: number; warm: number; moist: number },
  transitionFactor: number,
  seed: number
): { recipe: string | null; meta?: any } | null {
  const coolFoods = ['绿豆', '冬瓜', '荷叶', '苦瓜', '丝瓜', '黄瓜', '西红柿', '西瓜皮', '西瓜', '番茄', '酸梅', '薄荷']
  const moistFoods = ['赤小豆', '薏米', '茯苓', '冬瓜', '荷叶', '丝瓜', '百合', '银耳']
  const warmFoods = ['红枣', '桂圆', '核桃', '生姜', '党参', '黄芪', '当归', '羊肉', '糯米']

  // 1) 筛选：剔除与已选食材有交集的
  const candidates: string[] = []
  for (const r of list) {
    const ing = extractIngredients(r)
    if (!hasIngredientOverlap(ing, usedIngredients)) {
      candidates.push(r)
    }
  }

  if (candidates.length === 0) return null

  // 2) 打分：天气权重 × 地域权重
  const scored = candidates.map(r => {
    const ing = extractIngredients(r)
    let coolScore = ing.size > 0 && [...ing].some(x => coolFoods.includes(x)) ? weatherWeights.cool : 1.0
    let warmScore = ing.size > 0 && [...ing].some(x => warmFoods.includes(x)) ? weatherWeights.warm : 1.0
    let moistScore = ing.size > 0 && [...ing].some(x => moistFoods.includes(x)) ? weatherWeights.moist : 1.0

    // 地域权重叠加
    const wCool = coolFoods.some(c => r.includes(c)) ? rw.cool : 1.0
    const wWarm = warmFoods.some(c => r.includes(c)) ? rw.warm : 1.0
    const wMoist = moistFoods.some(c => r.includes(c)) ? rw.moist : 1.0

    coolScore *= wCool
    warmScore *= wWarm
    moistScore *= wMoist

    let final = coolScore + warmScore + moistScore

    // 过渡期：极端食材降分
    if (transitionFactor < 1) {
      for (const p of EXTREME_PATTERNS) {
        if (r.includes(p)) { final *= transitionFactor; break }
      }
    }

    return { score: final, recipe: r }
  })

  // 3) 排序取前 30%
  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, Math.max(1, Math.ceil(scored.length * 0.3)))
  const pick = top[Math.abs(seed) % top.length]
  return { recipe: pick.recipe, meta: { score: pick.score, candidates: candidates.length } }
}

/**
 * 兜底选菜（当个人体质池全部被去重后使用）
 * 同时检查食材交集和风格重复
 */
export class RecipeService {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static readonly CACHE_TTL = 5 * 60 * 1000

  /** 获取节气食谱推荐 */
  static getDailyRecipe(
    term: string,
    constitution: string | null,
    city?: string | null,
    date?: string | null,
    options?: { intensityFactor?: number; bypassLRU?: boolean; seed?: number }
  ): any {
    const today = new Date()
    const dateStr = date || today.toISOString().split('T')[0]
    const cacheKey = `${term}_${constitution || 'default'}_${city || 'default'}_${dateStr}`

    // LRU 缓存
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL && !options?.bypassLRU) {
      return cached.data
    }

    // 获取城市气候和地域修正
    const cityInfo = city ? RegionalAdaptation.getAdaptation(city, term) : null

    // 1) 体质倾向
    const bodyTendency = BODY_TENDENCY[constitution || '平和质']

    // 2) 基础权重（用节气推断默认气候）
    const baseWeatherWeights = WEATHER_WEIGHTS['高温']

    // 3) 过渡期强度因子
    const transition = InvarianceLayer.isTransitionPeriod(dateStr)
    const transitionFactor = transition.isTransition ? 0.7 : 1.0

    // 4) 地域权重（从 RegionalAdaptation 的 {cool,warm,damp,dry} 映射到 {cool,warm,moist}）
    const rawWeight = cityInfo?.regional_weight || { cool: 1.0, warm: 1.0, damp: 1.0, dry: 1.0 }
    const rw: { cool: number; warm: number; moist: number } = {
      cool: rawWeight.cool || 1.0,
      warm: rawWeight.warm || 1.0,
      moist: rawWeight.damp || 1.0,
    }

    // 5) 最终权重 = 体质倾向 × 天气权重
    const weatherWeights = {
      cool: bodyTendency.tendency.cool * baseWeatherWeights.cool,
      warm: bodyTendency.tendency.warm * baseWeatherWeights.warm,
      moist: bodyTendency.tendency.moist * baseWeatherWeights.moist,
    }

    // 6) 加载食谱池
    const pool = this.loadFromPool(term, constitution || '平和质')
    // refresh 时传入真正的随机 seed，否则基于日期生成固定 seed
    const seed = options?.seed ?? this.generateSeed(dateStr)
    const usedIngredients = new Set<string>()

    const breakfast = pickFrom(pool.breakfast, usedIngredients, weatherWeights, rw, transitionFactor, seed)
    if (breakfast) extractIngredients(breakfast.recipe).forEach(ing => usedIngredients.add(ing))

    const lunch = pickFrom(pool.lunch, usedIngredients, weatherWeights, rw, transitionFactor, seed + 1)
    if (lunch) extractIngredients(lunch.recipe).forEach(ing => usedIngredients.add(ing))

    const dinner = pickFrom(pool.dinner, usedIngredients, weatherWeights, rw, transitionFactor, seed + 2)
    if (dinner) extractIngredients(dinner.recipe).forEach(ing => usedIngredients.add(ing))

    const soup = pickFrom(pool.soup, usedIngredients, weatherWeights, rw, transitionFactor, seed + 3)

    // 兜底：如果某餐段没选出，使用 GENERIC_RECIPES
    const generic = GENERIC_RECIPES[term] || GENERIC_RECIPES['大暑']
    const breakfastFallback = breakfast?.recipe || generic.breakfast[0]
    const lunchFallback = lunch?.recipe || generic.lunch[0]
    const dinnerFallback = dinner?.recipe || generic.dinner[0]
    const soupFallback = soup?.recipe || generic.soup[0]

    const result = {
      term,
      constitution: constitution || '平和质',
      date: dateStr,
      city: city || '默认',
      breakfast: breakfastFallback,
      lunch: lunchFallback,
      dinner: dinnerFallback,
      soup: soupFallback,
      weights: weatherWeights,
      weatherWeights: baseWeatherWeights,
      transition: transition.isTransition ? {
        factor: transitionFactor,
        nextTerm: transition.nextTerm,
        daysUntil: transition.daysUntil,
      } : null,
      region_adjusted: !!city,
      usedIngredients: [...usedIngredients],
    }

    this.cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  }

  static clearCache() {
    this.cache.clear()
  }

  static getIngredients(term: string, constitution: string | null): string[] {
    const pool = this.loadFromPool(term, constitution || '平和质')
    const allRecipes = [...pool.breakfast, ...pool.lunch, ...pool.dinner, ...pool.soup]
    const ingredients = new Set<string>()
    for (const r of allRecipes) {
      for (const ing of extractIngredients(r)) {
        ingredients.add(ing)
      }
    }
    return [...ingredients].sort()
  }

  static getTerm(term: string) {
    const idx = TERM_ORDER.indexOf(term)
    if (idx === -1) return null
    return {
      name: term,
      index: idx,
      next: TERM_ORDER[(idx + 1) % TERM_ORDER.length],
      prev: TERM_ORDER[(idx - 1 + TERM_ORDER.length) % TERM_ORDER.length],
    }
  }

  static getTermByDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    let result = '大寒'
    let maxDate = new Date(y - 1, 1, 20)
    for (const [term, [tm, td]] of Object.entries(TERM_DATES)) {
      const candidate = new Date(y, tm - 1, td)
      if (candidate <= date && candidate > maxDate) {
        maxDate = candidate
        result = term
      }
    }
    return result
  }

  static loadFromPool(term: string, constitution: string): Record<string, string[]> {
    const poolFile = resolve(DATA_DIR, 'recipe_pool_v2.json')
    const poolData = JSON.parse(readFileSync(poolFile, 'utf8'))
    const entries = poolData.entries || []

    const result: Record<string, string[]> = { breakfast: [], lunch: [], dinner: [], soup: [] }
    for (const entry of entries) {
      // JSON 中使用 solar_term(字符串)和 constitution_type(字符串)
      const entryTerm = entry.solar_term || ''
      const entryConstitution = entry.constitution_type || ''
      // 匹配当前节气 + 四季通用条目
      if ((entryTerm === term || entryTerm === '四季通用') && entryConstitution === constitution) {
        const fp = entry.food_pool || {}
        for (const key of ['breakfast', 'lunch', 'dinner', 'soup']) {
          if (fp[key]) {
            result[key] = result[key].concat(fp[key])
          }
        }
      }
    }

    for (const key of ['breakfast', 'lunch', 'dinner', 'soup']) {
      result[key] = [...new Set(result[key])]
    }
    return result
  }

  static generateSeed(date: string) {
    const d = new Date(date)
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  }

  static getMainIngredient(recipe: string | undefined): Set<string> {
    return extractIngredients(recipe)
  }
}

export default RecipeService

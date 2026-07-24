/**
 * CM1: 节气不变层 (Solar Term Invariance)
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = resolve(__dirname, '../../../data')

interface SolarTermEntry {
  term_name: string
  solar_longitude: string
  climate_trend: string
  yinyang_attribute: string
  tcm_organ_command: string
  wellness_direction: string
  vulnerability_points: string[]
  season: string
}

function loadSolarTermsData() {
  const poolFile = resolve(DATA_DIR, 'solar_terms.json')
  try {
    const data = JSON.parse(readFileSync(poolFile, 'utf-8'))
    return data.solar_terms || []
  } catch (err) {
    console.error(`Error loading solar_terms.json: ${err.message}`)
    return []
  }
}

let solarTermsCache: SolarTermEntry[] = []

/** 全部 24 节气查表（与 InvarianceLayer 和 RecipeService 保持完全一致） */
const TERM_DATES: [string, number, number][] = [
  ['立春', 2, 4], ['雨水', 2, 19], ['惊蛰', 3, 6], ['春分', 3, 21],
  ['清明', 4, 5], ['谷雨', 4, 20], ['立夏', 5, 6], ['小满', 5, 21],
  ['芒种', 6, 6], ['夏至', 6, 21], ['小暑', 7, 7], ['大暑', 7, 22],
  ['立秋', 8, 8], ['处暑', 8, 23], ['白露', 9, 8], ['秋分', 9, 23],
  ['寒露', 10, 8], ['霜降', 10, 23], ['立冬', 11, 7], ['小雪', 11, 22],
  ['大雪', 12, 7], ['冬至', 12, 22], ['小寒', 1, 6], ['大寒', 1, 20],
]

export class InvarianceLayer {
  static getInvariance(term: string) {
    const data = solarTermsCache.length ? solarTermsCache : loadSolarTermsData()
    solarTermsCache = data
    const entry = data.find(t => t.term_name === term)
    if (!entry) {
      throw new Error(`未知节气: ${term}`)
    }
    return {
      term: entry.term_name,
      solar_longitude: entry.solar_longitude,
      climate_pattern: entry.climate_trend,
      yinyang: entry.yinyang_attribute,
      tcm_organ: entry.tcm_organ_command,
      wellness_direction: entry.wellness_direction,
      vulnerability_points: entry.vulnerability_points,
      season: entry.season,
    }
  }

  static getCurrentHou(term: string, day: number) {
    const houIndex = Math.min(Math.floor((day - 1) / 5), 2)
    const houNames = ['初候', '中候', '末候']
    return {
      name: houNames[houIndex],
      day: houIndex * 5 + 1,
      end_day: (houIndex + 1) * 5,
      intensity: houIndex === 0 ? 0.8 : houIndex === 1 ? 1.0 : 1.2,
    }
  }

  static getHouIntensity(day: number) {
    if (day <= 5) return 0.8
    if (day <= 10) return 1.0
    return 1.2
  }

  static getTermByDate(date: Date | string) {
    const d = new Date(date)
    const targetMs = d.getTime()
    const year = d.getFullYear()

    let bestTerm = ''
    let bestDiff = Infinity

    for (const [term, tm, td] of TERM_DATES) {
      // 检查当前年和上一年，处理跨年边界
      for (const y of [year - 1, year]) {
        const termMs = new Date(y, tm - 1, td).getTime()
        if (termMs <= targetMs) {
          const diff = targetMs - termMs
          if (diff < bestDiff) {
            bestDiff = diff
            bestTerm = term
          }
        }
      }
    }

    return bestTerm || '大寒'
  }

  /**
   * 检测指定日期是否处于节气过渡期（前后 3 天）
   * PM1: 过渡期检测 — 避免在节令转换时给出极端方案
   * 双向检测：即将到来的节气 + 刚过去的节气
   */
  static isTransitionPeriod(date: Date | string): { isTransition: boolean; nextTerm: string | null; daysUntil: number | null; prevTerm: string | null; daysSince: number | null } {
    const d = new Date(date)
    const targetMs = d.getTime()

    // 找到下一个即将到来的节气
    for (const [term, tm, td] of TERM_DATES) {
      const termMs = new Date(d.getFullYear(), tm - 1, td).getTime()
      const daysUntil = Math.ceil((termMs - targetMs) / 86400000)
      if (daysUntil >= 0 && daysUntil <= 3) {
        // 找刚过去的节气
        let prevTerm: string | null = null
        let daysSince: number | null = null
        let found = false
        for (let i = 0; i < TERM_DATES.length; i++) {
          const [pTerm, pTm, pTd] = TERM_DATES[i]
          if (pTerm === term) {
            // 上一个节气
            const prevIdx = i > 0 ? i - 1 : TERM_DATES.length - 1
            const [prevName, prevM, prevD] = TERM_DATES[prevIdx]
            prevTerm = prevName
            daysSince = Math.floor((targetMs - new Date(d.getFullYear(), prevM - 1, prevD).getTime()) / 86400000)
            found = true
            break
          }
        }
        return { isTransition: true, nextTerm: term, daysUntil, prevTerm, daysSince }
      }
    }

    // 检查是否刚过了一个节气（距离刚过去的节气 ≤ 3 天）
    for (let i = 0; i < TERM_DATES.length; i++) {
      const [term, tm, td] = TERM_DATES[i]
      const termMs = new Date(d.getFullYear(), tm - 1, td).getTime()
      const daysSince = Math.floor((targetMs - termMs) / 86400000)
      if (daysSince >= 0 && daysSince <= 3) {
        // 找下一个节气
        const nextIdx = i < TERM_DATES.length - 1 ? i + 1 : 0
        const [nextTerm, nextM, nextD] = TERM_DATES[nextIdx]
        const daysUntil = Math.ceil((new Date(d.getFullYear(), nextM - 1, nextD).getTime() - targetMs) / 86400000)
        return { isTransition: true, nextTerm, daysUntil, prevTerm: term, daysSince }
      }
    }

    return { isTransition: false, nextTerm: null, daysUntil: null, prevTerm: null, daysSince: null }
  }
}

export default InvarianceLayer

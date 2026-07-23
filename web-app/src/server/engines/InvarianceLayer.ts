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
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const day = d.getDate()

    const termDates = [
      ['小寒', 1, 5], ['大寒', 1, 20], ['立春', 2, 3], ['雨水', 2, 18],
      ['惊蛰', 3, 6], ['春分', 3, 20], ['清明', 4, 4], ['谷雨', 4, 19],
      ['立夏', 5, 5], ['小满', 5, 21], ['芒种', 6, 5], ['夏至', 6, 21],
      ['小暑', 7, 6], ['大暑', 7, 23], ['立秋', 8, 7], ['处暑', 8, 22],
      ['白露', 9, 7], ['秋分', 9, 22], ['寒露', 10, 8], ['霜降', 10, 23],
      ['立冬', 11, 7], ['小雪', 11, 22], ['大雪', 12, 6], ['冬至', 12, 21],
    ]

    const targetMs = new Date(y, m - 1, day).getTime()
    let result = '大寒'

    for (const [term, tm, td] of termDates as [string, number, number][]) {
      const termMs = new Date(y, tm - 1, td).getTime()
      if (termMs <= targetMs) {
        result = term
      } else {
        break
      }
    }

    return result
  }
}

export default InvarianceLayer

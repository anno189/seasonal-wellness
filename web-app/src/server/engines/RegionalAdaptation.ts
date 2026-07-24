/**
 * CM2: 地域气候适配层 (Geographic Adaptation)
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = resolve(__dirname, '../../../data')

interface CityEntry {
  city: string
  climate_type: string
  avg_temp_jul_min: number
  avg_temp_jul_max: number
  humidity_range: string
}

function loadCitiesData() {
  const poolFile = resolve(DATA_DIR, 'cities.json')
  try {
    const data = JSON.parse(readFileSync(poolFile, 'utf-8'))
    return data.cities || []
  } catch (err) {
    console.error(`Error loading cities.json: ${err.message}`)
    return []
  }
}

let citiesCache: CityEntry[] = []

interface SeasonalBias {
  temp_adjustment: number
  humidity_adjustment: number
  diet_adjustment: string
  note: string
}

interface RegionalWeight {
  cool: number   // 寒凉类食材修正
  warm: number   // 温热类食材修正
  damp: number   // 湿润类食材修正
  dry: number    // 干燥类食材修正
}

export class RegionalAdaptation {
  static getAdaptation(city: string, term: string) {
    const data = citiesCache.length ? citiesCache : loadCitiesData()
    citiesCache = data
    const cityData = data.find(c => c.city === city)
    if (!cityData) {
      return this.getGenericAdaptation(term)
    }
    const seasonalBias = this.calculateSeasonalBias(term, cityData)
    const regionalWeight = this.calculateRegionalWeight(term, cityData, seasonalBias)
    return {
      city: cityData.city,
      climate_type: cityData.climate_type,
      avg_temp: `${cityData.avg_temp_jul_min}-${cityData.avg_temp_jul_max}°C (7月)`,
      humidity: cityData.humidity_range,
      seasonal_bias: seasonalBias,
      regional_weight: regionalWeight,
      temperature_adjustment: seasonalBias.temp_adjustment,
      humidity_adjustment: seasonalBias.humidity_adjustment,
      diet_adjustment: seasonalBias.diet_adjustment,
    }
  }

  /** 根据气候类型和节气计算地域权重 */
  static calculateRegionalWeight(term: string, cityData: CityEntry, bias: SeasonalBias): RegionalWeight {
    const { climate_type } = cityData
    const hotTerms = ['小暑', '大暑', '夏至', '芒种', '小满', '立夏']
    const coldTerms = ['小寒', '大寒', '冬至', '大雪', '小雪', '立冬']

    const result: RegionalWeight = { cool: 1.0, warm: 1.0, damp: 1.0, dry: 1.0 }

    if (hotTerms.includes(term)) {
      if (climate_type.includes('温带大陆性') || climate_type.includes('温带季风')) {
        result.cool = 1.2
        result.dry = 1.2
      } else if (climate_type.includes('亚热带')) {
        result.cool = 1.1
        result.damp = 1.2
      } else if (climate_type.includes('南亚热带') || climate_type.includes('热带')) {
        result.cool = 1.3
        result.damp = 1.1
      }
    } else if (coldTerms.includes(term)) {
      if (climate_type.includes('温带大陆性') || climate_type.includes('温带季风')) {
        result.warm = 1.3
        result.dry = 1.1
      } else if (climate_type.includes('亚热带')) {
        result.warm = 1.1
        result.damp = 1.1
      } else if (climate_type.includes('南亚热带') || climate_type.includes('热带')) {
        result.warm = 0.9
      }
    }

    return result
  }

  static calculateSeasonalBias(term: string, cityData: CityEntry) {
    const { climate_type } = cityData
    const hotTerms = ['小暑', '大暑', '夏至', '芒种', '小满', '立夏']
    const coldTerms = ['小寒', '大寒', '冬至', '大雪', '小雪', '立冬']

    let bias: SeasonalBias = {
      temp_adjustment: 1.0,
      humidity_adjustment: 1.0,
      diet_adjustment: '',
      note: '',
    }

    if (hotTerms.includes(term)) {
      if (climate_type.includes('温带大陆性') || climate_type.includes('温带季风')) {
        bias.temp_adjustment = 1.1
        bias.diet_adjustment = '注重滋阴润燥'
        bias.note = '北方夏季偏干热，清热同时需防燥'
      } else if (climate_type.includes('亚热带')) {
        bias.humidity_adjustment = 1.2
        bias.diet_adjustment = '注重清热祛湿'
        bias.note = '江南夏季湿热并重，需清热祛湿并举'
      } else if (climate_type.includes('南亚热带') || climate_type.includes('热带')) {
        bias.temp_adjustment = 1.3
        bias.diet_adjustment = '注重清热解暑'
        bias.note = '岭南夏季酷热，清热解暑为首要'
      }
    } else if (coldTerms.includes(term)) {
      if (climate_type.includes('温带大陆性') || climate_type.includes('温带季风')) {
        bias.temp_adjustment = 1.2
        bias.diet_adjustment = '注重温补驱寒'
        bias.note = '北方冬季严寒，温补驱寒为首要'
      } else if (climate_type.includes('亚热带')) {
        bias.humidity_adjustment = 1.1
        bias.diet_adjustment = '注重温补兼祛湿'
        bias.note = '江南冬季湿冷，温补需兼顾祛湿'
      } else if (climate_type.includes('南亚热带') || climate_type.includes('热带')) {
        bias.temp_adjustment = 0.9
        bias.diet_adjustment = '适度温补'
        bias.note = '岭南冬季温和，温补不宜过猛'
      }
    } else {
      bias.note = '过渡节气，温和调养'
    }

    return bias
  }

  static getGenericAdaptation(term: string) {
    return {
      city: '未知',
      climate_type: '通用',
      avg_temp: 'N/A',
      humidity: 'N/A',
      seasonal_bias: {
        temp_adjustment: 1.0,
        humidity_adjustment: 1.0,
        diet_adjustment: '通用养生',
        note: '未知地域，使用通用节气养生方案',
      },
      regional_weight: { cool: 1.0, warm: 1.0, damp: 1.0, dry: 1.0 },
      temperature_adjustment: 1.0,
      humidity_adjustment: 1.0,
      diet_adjustment: '通用养生',
    }
  }
}

export default RegionalAdaptation

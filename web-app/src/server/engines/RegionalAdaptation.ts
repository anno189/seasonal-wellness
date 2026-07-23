/**
 * CM2: 地域气候适配层 (Geographic Adaptation)
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const DATA_DIR = resolve(import.meta.dirname, '../../../data')

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

export class RegionalAdaptation {
  static getAdaptation(city: string, term: string) {
    const data = citiesCache.length ? citiesCache : loadCitiesData()
    citiesCache = data
    const cityData = data.find(c => c.city === city)
    if (!cityData) {
      return this.getGenericAdaptation(term)
    }
    const seasonalBias = this.calculateSeasonalBias(term, cityData)
    return {
      city: cityData.city,
      climate_type: cityData.climate_type,
      avg_temp: `${cityData.avg_temp_jul_min}-${cityData.avg_temp_jul_max}°C (7月)`,
      humidity: cityData.humidity_range,
      seasonal_bias: seasonalBias,
      temperature_adjustment: seasonalBias.temp_adjustment,
      humidity_adjustment: seasonalBias.humidity_adjustment,
      diet_adjustment: seasonalBias.diet_adjustment,
    }
  }

  static calculateSeasonalBias(term: string, cityData: CityEntry) {
    const { climate_type } = cityData
    const hotTerms = ['小暑', '大暑', '夏至', '芒种', '小满', '立夏']
    const coldTerms = ['小寒', '大寒', '冬至', '大雪', '小雪', '立冬']

    let bias = {
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
    }
  }
}

export default RegionalAdaptation

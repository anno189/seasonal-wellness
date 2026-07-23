/**
 * CM3: 体质适配层 (Constitution Adaptation)
 */

import ConstitutionLoader from './ConstitutionLoader'

export class ConstitutionAdaptation {
  static getAdaptation(constitution: string, term: string) {
    const data = ConstitutionLoader.getByConstitutionAndTerm(constitution, term)
    if (!data) {
      return this.getDefaultAdaptation(constitution)
    }
    return {
      constitution_type: data.constitution_type,
      solar_term: data.solar_term,
      vulnerability_points: data.vulnerability_points,
      direction_override: data.direction_override || null,
      intensity_modifier: data.intensity_modifier || '标准强度',
      focus_shift: data.focus_shift || '无',
      diet_additions: data.diet_additions || [],
      diet_restrictions: data.diet_restrictions || [],
    }
  }

  static getDefaultAdaptation(constitution: string) {
    return {
      constitution_type: constitution || '平和质',
      solar_term: '',
      vulnerability_points: ['体质信息不足，使用通用养生建议'],
      direction_override: null,
      intensity_modifier: '标准强度',
      focus_shift: '无',
      diet_additions: [],
      diet_restrictions: [],
    }
  }

  static getIntensityFactor(modifier: string) {
    if (!modifier || modifier === '标准强度') return 1.0
    const match = modifier.match(/强度×(\d+\.?\d*)/)
    if (match) return parseFloat(match[1])
    return 1.0
  }
}

export default ConstitutionAdaptation

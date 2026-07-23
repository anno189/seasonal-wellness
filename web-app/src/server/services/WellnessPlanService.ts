/**
 * WellnessPlanService: 方案生成服务（核心规则引擎入口）
 */

import { InvarianceLayer } from '../engines/InvarianceLayer'
import RegionalAdaptation from '../engines/RegionalAdaptation'
import ConstitutionAdaptation from '../engines/ConstitutionAdaptation'
import PlanSynthesis from '../engines/PlanSynthesis'
import RecipeService from './RecipeService'
import HerbalTeaService from './HerbalTeaService'
import WeatherCorrection from '../engines/WeatherCorrection'

export class WellnessPlanService {
  static async generatePlan(params: {
    term: string
    city?: string
    constitution?: string
    weather?: string
    date?: Date | string
    day?: number
  }) {
    const { term, city, constitution, weather, date, day = 1 } = params

    const cm1 = InvarianceLayer.getInvariance(term)
    const cm2 = RegionalAdaptation.getAdaptation(city || '未知', term)
    const cm3 = ConstitutionAdaptation.getAdaptation(constitution || '平和质', term)
    const plan = PlanSynthesis.synthesize(cm1, cm2, cm3)

    const hou = InvarianceLayer.getCurrentHou(term, day)
    const weatherCorrection = weather ? WeatherCorrection.getCorrection(weather) : null

    const recipes = RecipeService.getDailyRecipe(term, constitution || '平和质', weather || null, typeof date === 'string' ? date : date.toISOString().split('T')[0])
    const herbalTea = HerbalTeaService.getTeaRecommendation(term, constitution || '平和质', weather || null, typeof date === 'string' ? date : date.toISOString().split('T')[0])

    return {
      solar_term: term,
      date: date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hou: hou.name,
      city: city || '未知',
      constitution: constitution || '平和质',
      plan: {
        health: plan.health,
        daily_routine: plan.daily_routine,
        diet: {
          ...plan.diet,
          recipes,
        },
        herbal_tea: {
          ...plan.herbal_tea,
          ...herbalTea,
        },
      },
      weather: weatherCorrection ? {
        ...weatherCorrection,
        adjusted: true,
      } : null,
      meta: plan.meta,
      disclaimer: '本方案仅供参考，不构成医疗建议。特殊人群请遵医嘱。',
    }
  }

  static getTermInfo(term: string) {
    return InvarianceLayer.getInvariance(term)
  }

  static getCurrentTerm(date?: Date | string) {
    return InvarianceLayer.getTermByDate(date || new Date())
  }
}

export default WellnessPlanService

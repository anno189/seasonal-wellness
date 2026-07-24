/**
 * WellnessPlanService: 方案生成服务（核心规则引擎入口）
 */

import { InvarianceLayer } from '../engines/InvarianceLayer.js'
import RegionalAdaptation from '../engines/RegionalAdaptation.js'
import ConstitutionAdaptation from '../engines/ConstitutionAdaptation.js'
import PlanSynthesis from '../engines/PlanSynthesis.js'
import RecipeService from './RecipeService.js'
import HerbalTeaService from './HerbalTeaService.js'
import WeatherCorrection from '../engines/WeatherCorrection.js'

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

    const dateObj = typeof date === 'string' ? new Date(date) : date
    const dateStr = dateObj.toISOString().split('T')[0]

    // PM1: 节气过渡期检测
    const transition = InvarianceLayer.isTransitionPeriod(dateObj)

    const cm1 = InvarianceLayer.getInvariance(term)
    const cm2 = RegionalAdaptation.getAdaptation(city || '未知', term)
    const cm3 = ConstitutionAdaptation.getAdaptation(constitution || '平和质', term)

    // 过渡期强度因子：方案强度适度降低
    const intensityFactor = transition.isTransition ? 0.85 : 1.0

    const plan = PlanSynthesis.synthesize(cm1, cm2, cm3, { intensityOverride: intensityFactor })

    const hou = InvarianceLayer.getCurrentHou(term, day)
    const weatherCorrection = weather ? WeatherCorrection.getCorrection(weather) : null

    const recipes = RecipeService.getDailyRecipe(term, constitution || '平和质', weather || null, dateStr, city || null, { intensityFactor })
    const herbalTea = HerbalTeaService.getTeaRecommendation(term, constitution || '平和质', weather || null, dateStr, city || null, { intensityFactor })

    // 过渡期方案说明
    const transitionNote = transition.isTransition
      ? `当前处于「${transition.prevTerm ? transition.prevTerm + '→' + transition.nextTerm : transition.nextTerm}」节气过渡期（距${transition.nextTerm}${transition.daysUntil}天，${transition.prevTerm ? '距' + transition.prevTerm + '已过' + transition.daysSince + '天' : ''}），方案偏向温和，请注意观察身体反应。`
      : null

    // PM5: 完整的诚实边界声明
    const disclaimer = [
      '本方案仅供参考，不构成医疗建议。特殊人群（孕妇、婴幼儿、慢性病患者）请遵医嘱。',
      `方案基于「${term}」节气、${city || '默认'}地域气候、${constitution || '平和质'}体质生成。`,
      '方案来源：节气养生知识库 + 体质辨识算法，适用人群为18-65岁健康成年人。',
      '地域和体质辨识存在不确定性，建议结合实际情况调整。',
      transitionNote ? transitionNote : '',
    ].filter(Boolean).join('\n')

    return {
      solar_term: term,
      date: dateStr,
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
      transition: transition.isTransition ? {
        isTransition: true,
        nextTerm: transition.nextTerm,
        daysUntil: transition.daysUntil,
        prevTerm: transition.prevTerm,
        daysSince: transition.daysSince,
        note: transitionNote,
      } : null,
      meta: plan.meta,
      disclaimer,
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

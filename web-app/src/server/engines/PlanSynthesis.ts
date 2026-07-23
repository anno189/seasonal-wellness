/**
 * CM4: 三维方案合成层 (3D Prescription Synthesis)
 */

export class PlanSynthesis {
  static synthesize(cm1: any, cm2: any, cm3: any) {
    const {
      term,
      wellness_direction,
      vulnerability_points: baseVulnerabilities,
    } = cm1

    const { seasonal_bias, diet_adjustment: regionalDietNote } = cm2

    const {
      vulnerability_points: constitutionVulnerabilities,
      direction_override,
      intensity_modifier,
      focus_shift,
      diet_additions,
      diet_restrictions,
    } = cm3

    const intensityFactor = this.calculateIntensity(intensity_modifier, seasonal_bias)

    const health = this.buildHealthPlan({
      term,
      wellness_direction,
      direction_override,
      baseVulnerabilities,
      constitutionVulnerabilities,
      intensityFactor,
      seasonal_bias,
    })

    const dailyRoutine = this.buildDailyRoutine({
      term,
      wellness_direction,
      intensityFactor,
      seasonal_bias,
    })

    const diet = this.buildDietPlan({
      term,
      wellness_direction,
      diet_additions,
      diet_restrictions,
      regionalDietNote,
      intensityFactor,
    })

    const herbalTea = this.buildHerbalTeaPlan({
      term,
      direction_override,
      intensityFactor,
    })

    return {
      health,
      daily_routine: dailyRoutine,
      diet,
      herbal_tea: herbalTea,
      meta: {
        solar_term: term,
        intensity: intensity_modifier,
        focus_shift,
        regional_note: seasonal_bias.note,
      },
    }
  }

  static calculateIntensity(intensity_modifier: string, seasonal_bias: any) {
    let factor = 1.0
    if (intensity_modifier) {
      const match = intensity_modifier.match(/强度×(\d+\.?\d*)/)
      if (match) factor = parseFloat(match[1])
    }
    if (seasonal_bias && seasonal_bias.temp_adjustment) {
      factor *= seasonal_bias.temp_adjustment
    }
    if (seasonal_bias && seasonal_bias.humidity_adjustment) {
      factor *= seasonal_bias.humidity_adjustment
    }
    return Math.max(0.8, Math.min(2.0, factor))
  }

  static buildHealthPlan({
    term,
    wellness_direction,
    direction_override,
    baseVulnerabilities,
    constitutionVulnerabilities,
    intensityFactor,
    seasonal_bias,
  }: any) {
    const allVulnerabilities = [...new Set([
      ...(baseVulnerabilities || []),
      ...(constitutionVulnerabilities || []),
    ])]

    const highRisk = this.generateHighRisk({ term, vulnerabilities: allVulnerabilities, intensity: intensityFactor })
    const prevention = this.generatePrevention({ term, direction: wellness_direction, intensity: intensityFactor, seasonal_bias })
    const vulnerability = this.generateVulnerabilityDescription({ term, vulnerabilities: allVulnerabilities, intensity: intensityFactor })

    return {
      high_risk: highRisk,
      prevention,
      vulnerability,
      direction: direction_override || wellness_direction,
    }
  }

  static generateHighRisk({ term, vulnerabilities, intensity }: any) {
    const riskMap: Record<string, string[]> = {
      '暑热': ['中暑', '脱水', '热射病'],
      '湿热': ['湿疹', '腹泻', '暑湿感冒'],
      '秋燥': ['皮肤干燥', '咳嗽', '便秘'],
      '寒邪': ['感冒', '关节痛', '心血管事件'],
      '熬夜': ['失眠', '免疫力下降', '肝火旺'],
      '心火': ['心悸', '失眠', '口腔溃疡'],
    }
    const risks: string[] = []
    const vulnText = vulnerabilities.join('')
    for (const [keyword, riskList] of Object.entries(riskMap)) {
      if (vulnText.includes(keyword) || term.includes(keyword.slice(0, 1))) {
        if (intensity >= 1.2) {
          risks.push(...riskList)
        } else {
          risks.push(riskList[0])
        }
      }
    }
    if (risks.length === 0) {
      risks.push('适应力下降')
    }
    return [...new Set(risks)]
  }

  static generatePrevention({ term, direction, intensity, seasonal_bias }: any) {
    const suggestions: string[] = []
    if (intensity >= 1.2) suggestions.push('注意防暑降温')
    if (seasonal_bias && seasonal_bias.temp_adjustment > 1.1) suggestions.push('避免正午外出')
    if (direction && direction.includes('温阳')) suggestions.push('注意保暖')
    if (direction && direction.includes('清热')) suggestions.push('保持充足水分')
    return suggestions
  }

  static generateVulnerabilityDescription({ term, vulnerabilities, intensity }: any) {
    if (vulnerabilities.length === 0) {
      return '当前节气相对平稳，保持日常养生即可'
    }
    return `${term}期间，体质脆弱点：${vulnerabilities.join('；')}。建议重点关注。`
  }

  static buildDailyRoutine({ term, wellness_direction, intensityFactor, seasonal_bias }: any) {
    const sleep = this.generateSleepAdvice({ term, intensity: intensityFactor })
    const exercise = this.generateExerciseAdvice({ term, intensity: intensityFactor, seasonal_bias })
    const emotion = this.generateEmotionAdvice({ term, direction: wellness_direction })
    return { sleep, exercise, emotion }
  }

  static generateSleepAdvice({ term, intensity }: any) {
    const adviceMap: Record<string, string> = {
      '小暑': '夜卧早起（22:00前入睡），午间小憩20-30分钟',
      '大暑': '夜卧早起（21:30入睡），午间小憩30分钟',
      '夏至': '夜卧早起（22:00前入睡），保证充足睡眠',
      '冬至': '早卧晚起（22:00睡，7:00起），避寒就温',
      '秋分': '早睡早起，顺应秋收阳气',
      '春分': '早睡早起，顺应春生阳气',
    }
    return adviceMap[term] || '顺应节气，保证充足睡眠'
  }

  static generateExerciseAdvice({ term, intensity, seasonal_bias }: any) {
    if (intensity >= 1.2) return '避免剧烈运动，推荐散步、太极、八段锦'
    if (term.includes('暑')) return '清晨或傍晚运动，推荐游泳、太极'
    if (term.includes('寒')) return '室内运动为主，推荐八段锦、太极拳'
    return '适度运动，推荐散步、太极、八段锦'
  }

  static generateEmotionAdvice({ term, direction }: any) {
    if (direction && direction.includes('疏肝')) return '保持心情舒畅，适当宣泄情绪'
    if (direction && direction.includes('养心')) return '静心养性，避免急躁'
    if (direction && direction.includes('温阳')) return '保持乐观心态，多晒太阳'
    return '保持平和心态，顺应节气规律'
  }

  static buildDietPlan({
    term,
    wellness_direction,
    diet_additions,
    diet_restrictions,
    regionalDietNote,
    intensityFactor,
  }: any) {
    return {
      additions: diet_additions,
      restrictions: diet_restrictions,
      direction: wellness_direction,
      regional_note: regionalDietNote,
      intensity: intensityFactor,
    }
  }

  static buildHerbalTeaPlan({ term, direction_override, intensityFactor }: any) {
    return {
      direction: direction_override || '根据节气调理',
      intensity: intensityFactor,
    }
  }
}

export default PlanSynthesis

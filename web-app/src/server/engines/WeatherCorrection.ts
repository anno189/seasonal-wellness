/**
 * WeatherCorrection: 天气修正层
 */

const WEATHER_RULES: Record<string, {
  cool_food_weight: number
  moist_food_weight: number
  warm_food_weight: number
  note: string
}> = {
  '晴天': { cool_food_weight: 1.0, moist_food_weight: 0.9, warm_food_weight: 1.1, note: '天气晴好，可适当增加温热食物' },
  '多云': { cool_food_weight: 1.0, moist_food_weight: 1.0, warm_food_weight: 1.0, note: '天气温和，按标准方案执行' },
  '阴天': { cool_food_weight: 1.1, moist_food_weight: 1.0, warm_food_weight: 1.0, note: '天气阴沉，可适当增加清热食物' },
  '小雨': { cool_food_weight: 0.9, moist_food_weight: 1.2, warm_food_weight: 0.9, note: '天气潮湿，增加祛湿食物' },
  '中雨': { cool_food_weight: 0.9, moist_food_weight: 1.3, warm_food_weight: 0.8, note: '雨水较多，加强祛湿' },
  '大雨': { cool_food_weight: 0.8, moist_food_weight: 1.4, warm_food_weight: 0.7, note: '大雨连绵，注重健脾祛湿' },
  '雷阵雨': { cool_food_weight: 0.9, moist_food_weight: 1.2, warm_food_weight: 0.9, note: '天气多变，注意祛湿防暑' },
  '高温': { cool_food_weight: 1.3, moist_food_weight: 1.0, warm_food_weight: 0.7, note: '高温天气，增加清热解暑食物' },
  '低温': { cool_food_weight: 0.7, moist_food_weight: 1.0, warm_food_weight: 1.3, note: '低温天气，增加温补食物' },
  '雾霾': { cool_food_weight: 1.0, moist_food_weight: 1.0, warm_food_weight: 1.0, note: '空气质量差，减少外出，注意润肺' },
}

export class WeatherCorrection {
  static getCorrection(weather: string | null) {
    const normalizedWeather = this.normalizeWeather(weather)
    const rule = WEATHER_RULES[normalizedWeather] || WEATHER_RULES['多云']
    return {
      weather: normalizedWeather,
      cool_food_weight: rule.cool_food_weight,
      moist_food_weight: rule.moist_food_weight,
      warm_food_weight: rule.warm_food_weight,
      note: rule.note,
    }
  }

  static normalizeWeather(weather: string | null) {
    if (!weather) return '多云'
    const weatherStr = weather.toLowerCase()
    if (weatherStr.includes('晴') || weatherStr.includes('sun')) return '晴天'
    if (weatherStr.includes('阴') || weatherStr.includes('overcast')) return '阴天'
    if (weatherStr.includes('雨') || weatherStr.includes('rain')) {
      if (weatherStr.includes('雷')) return '雷阵雨'
      if (weatherStr.includes('大')) return '大雨'
      if (weatherStr.includes('中')) return '中雨'
      return '小雨'
    }
    if (weatherStr.includes('高温') || weatherStr.includes('heat')) return '高温'
    if (weatherStr.includes('低温') || weatherStr.includes('cold')) return '低温'
    if (weatherStr.includes('雾') || weatherStr.includes('霾') || weatherStr.includes('haze')) return '雾霾'
    return '多云'
  }

  static adjustRecipeWeights(recipes: any[], correction: any) {
    return recipes.map(recipe => {
      let weight = 1.0
      if (recipe.category === '清热') weight *= correction.cool_food_weight
      else if (recipe.category === '祛湿') weight *= correction.moist_food_weight
      else if (recipe.category === '温补') weight *= correction.warm_food_weight
      return { ...recipe, weather_weight: weight }
    })
  }

  static adjustTeaWeights(teas: any[], correction: any) {
    return teas.map(tea => {
      let weight = 1.0
      if (tea.direction.includes('清热') || tea.direction.includes('解暑')) weight *= correction.cool_food_weight
      else if (tea.direction.includes('祛湿')) weight *= correction.moist_food_weight
      else if (tea.direction.includes('温补') || tea.direction.includes('温阳')) weight *= correction.warm_food_weight
      return { ...tea, weather_weight: weight }
    })
  }
}

export default WeatherCorrection

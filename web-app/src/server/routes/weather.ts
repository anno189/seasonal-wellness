/**
 * 天气相关 API
 * IMPORTANT: /cities MUST be defined before /:city
 */

import { Router, Request, Response } from 'express'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import WeatherService from '../services/WeatherService'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const CITIES_FILE = resolve(__dirname, '../../../data/cities.json')

const router = Router()

router.get('/cities', (req: Request, res: Response) => {
  try {
    const raw = readFileSync(CITIES_FILE, 'utf-8')
    const data = JSON.parse(raw)
    const cities = data.cities || []
    res.json({
      cities: cities.map((c: any) => ({
        name: c.name,
        province: c.province,
        region: c.region,
      })),
      total: cities.length,
    })
  } catch (err: any) {
    console.error('读取城市数据失败:', err)
    res.status(500).json({ error: '读取城市数据失败', message: err.message })
  }
})

router.get('/:city', async (req: Request, res: Response) => {
  const city = req.params.city
  try {
    const weather = await WeatherService.getWeather(city)
    res.json({
      city: weather.city || city,
      weather: weather.weather,
      temperature: weather.temperature,
      humidity: weather.humidity,
      wind: weather.wind,
      feelsLike: weather.feelsLike,
    })
  } catch (err: any) {
    console.error('获取天气失败:', err)
    res.status(500).json({ error: '获取天气失败', message: err.message })
  }
})

export default router

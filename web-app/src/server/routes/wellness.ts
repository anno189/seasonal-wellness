/**
 * 养生方案 API
 */

import { Router, Request, Response } from 'express'
import WellnessPlanService from '../services/WellnessPlanService'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const { term, city, constitution, weather, date, day } = req.query

    if (!term) {
      return res.status(400).json({ error: '缺少节气参数 (term)' })
    }

    const params = {
      term: term as string,
      city: (city as string) || '未知',
      constitution: (constitution as string) || '平和质',
      weather: (weather as string) || null,
      date: typeof date === 'string' ? date : new Date(),
      day: parseInt(day as string, 10) || 1,
    }

    const plan = await WellnessPlanService.generatePlan(params)
    res.json(plan)
  } catch (err: any) {
    console.error('生成方案失败:', err)
    res.status(500).json({ error: '生成方案失败', message: err.message })
  }
})

router.get('/preview', async (req: Request, res: Response) => {
  try {
    const { term, constitution } = req.query

    if (!term) {
      return res.status(400).json({ error: '缺少节气参数 (term)' })
    }

    const params = {
      term: term as string,
      city: '未知',
      constitution: (constitution as string) || '平和质',
      weather: null,
      date: new Date(),
      day: 1,
    }

    const plan = await WellnessPlanService.generatePlan(params)

    res.json({
      solar_term: plan.solar_term,
      health: plan.plan.health,
      daily_routine: plan.plan.daily_routine,
    })
  } catch (err: any) {
    console.error('预览方案失败:', err)
    res.status(500).json({ error: '预览方案失败', message: err.message })
  }
})

export default router

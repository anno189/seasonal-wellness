/**
 * 食谱相关 API
 */

import { Router, Request, Response } from 'express'
import RecipeService from '../services/RecipeService.js'

const router = Router()

router.get('/daily', (req: Request, res: Response) => {
  try {
    const { term, constitution, date, city, refresh } = req.query

    if (!term) {
      return res.status(400).json({ error: '缺少节气参数 (term)' })
    }

    const dateParam = Array.isArray(date) ? (date[0] as string) : (typeof date === 'string' ? date : undefined)
    const seedDate = refresh
      ? new Date(Date.now() + Math.floor(Math.random() * 86400000 * 30))
      : (dateParam ? new Date(dateParam) : new Date())

    const cityParam = (city as string) || null
    const dateStr = dateParam ? dateParam : new Date().toISOString().split('T')[0]

    // refresh 时传入真正的随机 seed，避免基于日期的固定 seed
    const options: { bypassLRU?: boolean; seed?: number } = { bypassLRU: !!refresh }
    if (refresh) {
      options.seed = Math.floor(Math.random() * 1000000)
    }

    const recipes = RecipeService.getDailyRecipe(
      term as string,
      (constitution as string) || '平和质',
      cityParam,
      dateStr,
      options
    )

    res.json(recipes)
  } catch (err: any) {
    console.error('获取当日食谱失败:', err)
    res.status(500).json({ error: '获取当日食谱失败', message: err.message })
  }
})

router.get('/ingredients/:term', (req: Request, res: Response) => {
  try {
    const term = req.params.term
    const constitution = req.query.constitution as string || null
    const city = req.query.city as string || null
    const ingredients = RecipeService.getIngredients(term, constitution)
    res.json(ingredients)
  } catch (err: any) {
    console.error('获取食材推荐失败:', err)
    res.status(500).json({ error: '获取食材推荐失败', message: err.message })
  }
})

export default router

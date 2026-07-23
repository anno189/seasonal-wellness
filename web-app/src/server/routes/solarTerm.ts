/**
 * 节气相关 API
 */

import { Router, Request, Response } from 'express'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { InvarianceLayer } from '../engines/InvarianceLayer.js'

const DATA_DIR = resolve(process.cwd(), 'data')

const router = Router()

router.get('/current', (req: Request, res: Response) => {
  try {
    const currentDate = req.query.date ? new Date(req.query.date as string) : new Date()
    const currentTerm = InvarianceLayer.getTermByDate(currentDate)
    const info = InvarianceLayer.getInvariance(currentTerm)
    res.json({ term: currentTerm, date: currentDate.toISOString().split('T')[0], ...info })
  } catch (err: any) { console.error('获取当前节气失败:', err); res.status(500).json({ error: '获取当前节气失败', message: err.message }) }
})

router.get('/countdown', (req: Request, res: Response) => {
  try {
    const currentDate = req.query.date ? new Date(req.query.date as string) : new Date()
    const currentTerm = InvarianceLayer.getTermByDate(currentDate)
    const info = InvarianceLayer.getInvariance(currentTerm)
    const dayOfMonth = currentDate.getDate()
    const dayInTerm = Math.min(dayOfMonth, 15)
    const hou = InvarianceLayer.getCurrentHou(currentTerm, dayInTerm)
    res.json({ term: currentTerm, current_day: dayInTerm, total_days: 15, remaining_days: 15 - dayInTerm, hou: hou.name, hou_info: hou, info })
  } catch (err: any) { console.error('获取节气倒计时失败:', err); res.status(500).json({ error: '获取节气倒计时失败', message: err.message }) }
})

router.get('/:term', (req: Request, res: Response) => {
  try { const info = InvarianceLayer.getInvariance(req.params.term); res.json(info) }
  catch (err: any) { res.status(404).json({ error: '未知节气', message: err.message }) }
})

router.get('/', (req: Request, res: Response) => {
  try {
    const poolFile = resolve(DATA_DIR, 'solar_terms.json')
    const data = JSON.parse(readFileSync(poolFile, 'utf-8'))
    res.json(data.solar_terms)
  } catch (err: any) { res.status(500).json({ error: '获取节气列表失败', message: err.message }) }
})

export default router

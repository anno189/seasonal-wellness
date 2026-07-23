/**
 * 体质服务 API
 */

import { Router, Request, Response } from 'express'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ConstitutionService from '../services/ConstitutionService.js'
import ConstitutionLoader from '../engines/ConstitutionLoader.js'

const DATA_DIR = resolve(process.cwd(), 'data')

const router = Router()

router.get('/questionnaire', (req: Request, res: Response) => {
  try { res.json(ConstitutionService.getQuestionnaire()) }
  catch (err: any) { res.status(500).json({ error: '获取问卷失败', message: err.message }) }
})

router.post('/assess', (req: Request, res: Response) => {
  try {
    const { userId, answers } = req.body
    if (!userId) return res.status(400).json({ error: '缺少用户ID (userId)' })
    if (!answers || !Array.isArray(answers) || answers.length < 8) return res.status(400).json({ error: '答案不完整，需要8题答案' })
    const result = ConstitutionService.assess(userId, answers)
    res.json(result)
  } catch (err: any) { res.status(400).json({ error: err.message }) }
})

router.get('/user/:userId', (req: Request, res: Response) => {
  try {
    const data = ConstitutionService.getUserConstitution(req.params.userId)
    if (!data) return res.status(404).json({ error: '尚未完成体质测评' })
    res.json(data)
  } catch (err: any) { res.status(500).json({ error: '获取体质信息失败', message: err.message }) }
})

router.get('/history/:userId', (req: Request, res: Response) => {
  try {
    const history = ConstitutionService.getAssessmentHistory(req.params.userId)
    if (history.length === 0) return res.status(404).json({ error: '暂无测评记录' })
    res.json(history)
  } catch (err: any) { res.status(500).json({ error: '获取历史记录失败', message: err.message }) }
})

router.post('/reset/:userId', (req: Request, res: Response) => {
  try {
    ConstitutionService.clearHistory(req.params.userId)
    res.json({ message: '测评历史已清除' })
  } catch (err: any) { res.status(500).json({ error: '重置失败', message: err.message }) }
})

router.get('/types', (req: Request, res: Response) => {
  try { res.json({ types: ConstitutionLoader.getConstitutionTypes() }) }
  catch (err: any) { res.status(500).json({ error: '获取体质类型失败', message: err.message }) }
})

router.get('/type/:type', (req: Request, res: Response) => {
  try {
    const poolFile = resolve(DATA_DIR, 'constitution_questionnaire.json')
    const questionnaireData = JSON.parse(readFileSync(poolFile, 'utf-8'))
    const info = questionnaireData.constitution_info?.[req.params.type]
    if (!info) return res.status(404).json({ error: `未知体质类型: ${req.params.type}` })
    res.json({ name: info.name, description: info.description, features: info.features, wellness_principle: info.wellness_principle, key_advice: info.key_advice })
  } catch (err: any) { res.status(500).json({ error: '获取体质信息失败', message: err.message }) }
})

export default router

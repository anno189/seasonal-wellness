/**
 * 花草茶相关 API
 */
import { Router } from 'express';
import HerbalTeaService from '../services/HerbalTeaService.js';
const router = Router();
router.get('/daily', (req, res) => {
    try {
        const { term, constitution, weather, date, refresh } = req.query;
        if (!term) {
            return res.status(400).json({ error: '缺少节气参数 (term)' });
        }
        const dateParam = Array.isArray(date) ? date[0] : (typeof date === 'string' ? date : undefined);
        const seedDate = refresh
            ? new Date(Date.now() + Math.floor(Math.random() * 86400000 * 30))
            : (dateParam ? new Date(dateParam) : new Date());
        const tea = HerbalTeaService.getTeaRecommendation(term, constitution || '平和质', weather || null, seedDate.toISOString().split('T')[0]);
        res.json(tea);
    }
    catch (err) {
        console.error('获取当日花草茶失败:', err);
        res.status(500).json({ error: '获取当日花草茶失败', message: err.message });
    }
});
router.get('/by-term/:term', (req, res) => {
    try {
        const term = req.params.term;
        const recommendations = HerbalTeaService.getTeaByTerm(term);
        res.json(recommendations);
    }
    catch (err) {
        console.error('获取节气花草茶失败:', err);
        res.status(500).json({ error: '获取节气花草茶失败', message: err.message });
    }
});
export default router;

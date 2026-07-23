/**
 * 食谱相关 API
 */
import { Router } from 'express';
import RecipeService from '../services/RecipeService.js';
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
        const recipes = RecipeService.getDailyRecipe(term, constitution || '平和质', weather || null, seedDate.toISOString().split('T')[0], refresh ? { bypassLRU: true } : {});
        res.json(recipes);
    }
    catch (err) {
        console.error('获取当日食谱失败:', err);
        res.status(500).json({ error: '获取当日食谱失败', message: err.message });
    }
});
router.get('/ingredients/:term', (req, res) => {
    try {
        const term = req.params.term;
        const constitution = req.query.constitution || null;
        const ingredients = RecipeService.getIngredients(term, constitution);
        res.json(ingredients);
    }
    catch (err) {
        console.error('获取食材推荐失败:', err);
        res.status(500).json({ error: '获取食材推荐失败', message: err.message });
    }
});
export default router;

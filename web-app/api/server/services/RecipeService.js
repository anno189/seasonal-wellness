/**
 * RecipeService v2.0 — 节气级食谱服务
 */
import { recipePools } from '../data/index.js';
const TERM_ORDER = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'];
const termLRU = new Map();
const MAX_LRU_SIZE = 200;
let recipeCache = [];
export class RecipeService {
    static getDailyRecipe(term, constitution, weather = null, date = null, opts = {}) {
        const pools = recipeCache.length ? recipeCache : recipePools;
        recipeCache = pools;
        const pool = pools.find(p => p.solar_term === term && p.constitution_type === constitution);
        if (!pool)
            return this.getDefaultRecipe(term);
        let usedMain = opts?.bypassLRU ? new Set() : (() => {
            const lruKey = `${term}#${constitution}`;
            let lruEntry = termLRU.get(lruKey);
            if (!lruEntry || lruEntry.lastTerm !== term) {
                lruEntry = { used: new Set(), lastTerm: term };
                termLRU.set(lruKey, lruEntry);
            }
            if (!lruEntry?.used) {
                lruEntry = { used: new Set(), lastTerm: term };
                termLRU.set(lruKey, lruEntry);
            }
            return lruEntry.used;
        })();
        const seed = date ? this.generateSeed(date) : 0;
        const todayUsed = new Set();
        const todayStyles = new Set();
        const STYLE_KEYWORDS = ['凉拌', '白灼', '清炒', '红烧', '蒜蓉', '蜂蜜', '蒸蛋', '蒸肉', '蒸鱼', '蒸蛋羹', '肉丸汤', '排骨汤', '绿豆汤'];
        const getStyle = (name) => { for (const kw of STYLE_KEYWORDS) {
            if (name.includes(kw))
                return kw;
        } return null; };
        const getWords = (name) => { const words = []; for (let i = 0; i < name.length - 1; i++) {
            const w = name.slice(i, i + 2);
            if (/[\u4e00-\u9fff]/.test(w[0]) && /[\u4e00-\u9fff]/.test(w[1])) {
                words.push(w);
            }
        } return words; };
        const usedWords = new Set();
        for (const item of usedMain)
            for (const w of getWords(item))
                usedWords.add(w);
        const isUsed = (main) => {
            if (!main)
                return false;
            if (usedMain.has(main) || todayUsed.has(main))
                return true;
            for (const ex of [...usedMain, ...todayUsed]) {
                if (main.includes(ex) && ex.length >= 2)
                    return true;
                if (ex.includes(main) && main.length >= 2)
                    return true;
            }
            const newWords = getWords(main);
            for (const w of newWords) {
                if (usedWords.has(w))
                    return true;
            }
            return false;
        };
        const pickFrom = (list, slotOffset) => {
            if (!list || list.length === 0)
                return null;
            const candidates = list.filter(r => { const main = this.getMainIngredient(r); if (isUsed(main))
                return false; const style = getStyle(r); if (style && todayStyles.has(style))
                return false; return true; });
            const pool2 = candidates.length > 0 ? candidates : list;
            return pool2[(seed + slotOffset) % pool2.length];
        };
        const breakfast = pickFrom(pool.food_pool.breakfast, 0);
        if (breakfast) {
            const bi = this.getMainIngredient(breakfast);
            usedMain.add(bi);
            todayUsed.add(bi);
            for (const w of getWords(bi))
                usedWords.add(w);
            const s = getStyle(breakfast);
            if (s)
                todayStyles.add(s);
        }
        const lunch = pickFrom(pool.food_pool.lunch, 1);
        if (lunch) {
            const li = this.getMainIngredient(lunch);
            usedMain.add(li);
            todayUsed.add(li);
            for (const w of getWords(li))
                usedWords.add(w);
            const s = getStyle(lunch);
            if (s)
                todayStyles.add(s);
        }
        const dinner = pickFrom(pool.food_pool.dinner, 2);
        if (dinner) {
            const di = this.getMainIngredient(dinner);
            usedMain.add(di);
            todayUsed.add(di);
            for (const w of getWords(di))
                usedWords.add(w);
            const s = getStyle(dinner);
            if (s)
                todayStyles.add(s);
        }
        const soup = pickFrom(pool.food_pool.soup, 3);
        if (soup) {
            const si = this.getMainIngredient(soup);
            usedMain.add(si);
            todayUsed.add(si);
            for (const w of getWords(si))
                usedWords.add(w);
            const s = getStyle(soup);
            if (s)
                todayStyles.add(s);
        }
        if (!opts?.bypassLRU) {
            const lruKey = `${term}#${constitution}`;
            const lruEntry = termLRU.get(lruKey);
            if (lruEntry && lruEntry.used) {
                lruEntry.used = usedMain;
                termLRU.set(lruKey, lruEntry);
            }
        }
        if (termLRU.size > MAX_LRU_SIZE) {
            const firstKey = termLRU.keys().next().value;
            termLRU.delete(firstKey);
        }
        const weatherWeights = weather ? this.applyWeatherCorrection(pool.weather_weights || {}, weather) : (pool.weather_weights || {});
        return { breakfast, lunch, dinner, soup, meta: { solar_term: term, constitution_type: constitution, weather_adjusted: !!weather, weather_weights: weatherWeights } };
    }
    static getMainIngredient(recipe) {
        if (!recipe)
            return '';
        return recipe.replace(/[（(][^）)]*[）)]/g, '').replace(/(粥|汤|羹|茶|面|饭|饼|卷|盒|羹)$/g, '').replace(/^(清炒|红烧|凉拌|白灼|炒|煎|蒸|炖|煮|焖|烧|蒜蓉|蜂蜜)/g, '').trim();
    }
    static applyWeatherCorrection(baseWeights, weather) {
        const weatherMap = {
            '晴天': { cool: 1.0, warm: 1.1, moist: 0.9 }, '多云': { cool: 1.0, warm: 1.0, moist: 1.0 },
            '阴天': { cool: 1.1, warm: 1.0, moist: 1.0 }, '小雨': { cool: 0.9, warm: 0.9, moist: 1.2 },
            '中雨': { cool: 0.9, warm: 0.8, moist: 1.3 }, '大雨': { cool: 0.8, warm: 0.7, moist: 1.4 },
            '雷阵雨': { cool: 0.9, warm: 0.9, moist: 1.2 }, '高温': { cool: 1.3, warm: 0.7, moist: 1.0 },
            '低温': { cool: 0.7, warm: 1.3, moist: 1.0 }, '雾霾': { cool: 1.0, warm: 1.0, moist: 1.0 },
        };
        const w = weatherMap[weather] || weatherMap['多云'];
        return { cool_food_weight: (baseWeights.cool_food_weight || 1.0) * w.cool, warm_food_weight: (baseWeights.warm_food_weight || 1.0) * w.warm, moist_food_weight: (baseWeights.moist_food_weight || 1.0) * w.moist };
    }
    static generateSeed(date) { const d = new Date(date); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
    static getDefaultRecipe(term) {
        return { breakfast: '根据节气推荐：清淡为主', lunch: '根据节气推荐：适量蔬菜', dinner: '根据节气推荐：易消化', soup: '根据节气推荐：清汤', meta: { solar_term: term, note: '未找到对应的食材池数据' } };
    }
    static getIngredients(term, constitution = null) {
        const pools = recipeCache.length ? recipeCache : recipePools;
        recipeCache = pools;
        const poolsForTerm = constitution ? pools.filter(p => p.solar_term === term && p.constitution_type === constitution) : pools.filter(p => p.solar_term === term);
        const additions = new Set();
        for (const pool of poolsForTerm) {
            const fp = (pool.food_pool || {});
            [fp.breakfast, fp.lunch, fp.dinner, fp.soup].flat().forEach((f) => additions.add(f));
        }
        return { additions: [...additions], total_options: additions.size };
    }
    static clearLRU() { termLRU.clear(); }
}
export default RecipeService;

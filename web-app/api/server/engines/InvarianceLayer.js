/**
 * CM1: 节气不变层 (Solar Term Invariance)
 */
import { solarTerms } from '../data/index.js';
let solarTermsCache = [];
export class InvarianceLayer {
    static getInvariance(term) {
        const data = solarTermsCache.length ? solarTermsCache : solarTerms;
        solarTermsCache = data;
        const entry = data.find(t => t.term_name === term);
        if (!entry) {
            throw new Error(`未知节气: ${term}`);
        }
        return {
            term: entry.term_name,
            solar_longitude: entry.solar_longitude,
            climate_pattern: entry.climate_trend,
            yinyang: entry.yinyang_attribute,
            tcm_organ: entry.yinyang_attribute,
            wellness_direction: entry.wellness_direction,
            vulnerability_points: entry.vulnerability_points,
            season: entry.season,
        };
    }
    static getCurrentHou(term, day) {
        const houIndex = Math.min(Math.floor((day - 1) / 5), 2);
        const houNames = ['初候', '中候', '末候'];
        return { name: houNames[houIndex], day: houIndex * 5 + 1, end_day: (houIndex + 1) * 5, intensity: houIndex === 0 ? 0.8 : houIndex === 1 ? 1.0 : 1.2 };
    }
    static getHouIntensity(day) {
        if (day <= 5)
            return 0.8;
        if (day <= 10)
            return 1.0;
        return 1.2;
    }
    static getTermByDate(date) {
        const d = new Date(date);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const termDates = [
            ['小寒', 1, 5], ['大寒', 1, 20], ['立春', 2, 3], ['雨水', 2, 18],
            ['惊蛰', 3, 6], ['春分', 3, 20], ['清明', 4, 4], ['谷雨', 4, 19],
            ['立夏', 5, 5], ['小满', 5, 21], ['芒种', 6, 5], ['夏至', 6, 21],
            ['小暑', 7, 6], ['大暑', 7, 23], ['立秋', 8, 7], ['处暑', 8, 22],
            ['白露', 9, 7], ['秋分', 9, 22], ['寒露', 10, 8], ['霜降', 10, 23],
            ['立冬', 11, 7], ['小雪', 11, 22], ['大雪', 12, 6], ['冬至', 12, 21],
        ];
        const targetMs = new Date(y, m - 1, day).getTime();
        let result = '大寒';
        for (const [term, tm, td] of termDates) {
            const termMs = new Date(y, tm - 1, td).getTime();
            if (termMs <= targetMs) {
                result = term;
            }
            else {
                break;
            }
        }
        return result;
    }
}
export default InvarianceLayer;

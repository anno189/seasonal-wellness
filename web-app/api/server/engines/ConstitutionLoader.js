/**
 * ConstitutionLoader: 加载合并版体质数据
 */
import { constitutions } from '../data/index.js';
class ConstitutionLoader {
    constructor() {
        this.cache = [];
    }
    load() {
        if (this.cache.length)
            return this.cache;
        this.cache = constitutions;
        return this.cache;
    }
    getByConstitutionAndTerm(constitution, term) {
        const entries = this.load();
        return entries.find(e => e.constitution_type === constitution && e.solar_term === term) || null;
    }
    getConstitutionTypes() {
        const entries = this.load();
        const types = [...new Set(entries.map(e => e.constitution_type))];
        return types.sort();
    }
    clear() {
        this.cache = [];
    }
}
const instance = new ConstitutionLoader();
export default instance;

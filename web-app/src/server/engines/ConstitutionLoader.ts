/**
 * ConstitutionLoader: 加载合并版体质数据
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const DATA_DIR = resolve(import.meta.dirname, '../../../data')

class ConstitutionLoader {
  private cache: any[] = []

  load() {
    if (this.cache.length) return this.cache
    const poolFile = resolve(DATA_DIR, 'constitutions-v2.json')
    try {
      const data = JSON.parse(readFileSync(poolFile, 'utf-8'))
      this.cache = data.entries || []
      return this.cache
    } catch (err) {
      console.error(`Error loading constitutions-v2.json: ${err.message}`)
      return []
    }
  }

  getByConstitutionAndTerm(constitution: string, term: string) {
    const entries = this.load()
    return entries.find(e => e.constitution_type === constitution && e.solar_term === term) || null
  }

  getConstitutionTypes() {
    const entries = this.load()
    const types = [...new Set(entries.map(e => e.constitution_type))]
    return types.sort()
  }

  clear() {
    this.cache = []
  }
}

const instance = new ConstitutionLoader()
export default instance

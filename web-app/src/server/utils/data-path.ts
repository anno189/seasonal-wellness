/**
 * 用于在 Vercel Serverless 中定位 data/ 目录
 * 支持本地开发和 Vercel 部署两种环境
 */

import { resolve } from 'node:path'
import { existsSync, readdirSync } from 'node:fs'

/**
 * 智能解析 data 目录
 * 按优先级搜索：
 * 1. 相对于当前文件的 ../../../data
 * 2. 相对于 process.cwd() 的 data
 * 3. 相对于 process.cwd() 的 dist/data (Vercel 构建后)
 */
export function findDataDir(): string {
  // 优先：尝试相对于当前文件
  try {
    const relative = resolve(process.cwd(), 'data')
    if (existsSync(relative)) return relative
  } catch {
    // ignore
  }

  // 次优：Vercel Serverless 环境，data 在 process.cwd()
  return resolve(process.cwd(), 'data')
}

/**
 * 获取数据文件路径
 */
export function resolveDataFile(filename: string): string {
  return resolve(findDataDir(), filename)
}

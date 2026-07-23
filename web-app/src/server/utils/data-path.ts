/**
 * 智能数据目录定位
 * 在本地开发和 Vercel Serverless 中都有效
 */
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

export function findDataDir(): string {
  // 优先：项目根目录的 data/
  const cwd = resolve(process.cwd(), 'data')
  if (existsSync(cwd)) return cwd

  // 降级：dist/data/ (Vercel 构建后)
  const distData = resolve(process.cwd(), 'dist', 'data')
  if (existsSync(distData)) return distData

  return cwd // 返回首个路径，即使不存在也让错误消息清晰
}

export function resolveDataFile(filename: string): string {
  return resolve(findDataDir(), filename)
}

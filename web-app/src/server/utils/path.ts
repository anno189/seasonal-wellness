/**
 * Portable path resolution for server-side data files
 * Works in both local dev and Vercel Serverless environments
 */
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

export function resolveDataDir(relativeTo: string = 'engines'): string {
  const candidate = resolve(dirname(fileURLToPath(import.meta.url)), '../../../data')
  // Verify the data directory exists
  if (existsSync(candidate)) return candidate

  // Fallback: try relative to cwd
  const cwdFallback = resolve(process.cwd(), 'data')
  if (existsSync(cwdFallback)) return cwdFallback

  // Last resort
  return candidate
}

export function resolveDataFile(filename: string, relativeTo: string = 'engines'): string {
  return resolve(resolveDataDir(relativeTo), filename)
}

#!/usr/bin/env node
/**
 * Post-build: copy data/ to dist/data/ for Vercel Serverless
 */
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const src = resolve(process.cwd(), 'data')
const dest = resolve(process.cwd(), 'dist', 'data')

try {
  mkdirSync(dest, { recursive: true })
  cpSync(src, dest, { recursive: true, force: true })
  console.log(`✓ Copied data/ → dist/data/ (${readdirSync(dest).length} files)`)
} catch (err) {
  console.error('✗ Failed to copy data directory:', err.message)
  process.exit(1)
}

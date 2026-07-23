#!/usr/bin/env node
/**
 * Post-build: verify server compiled to api/server/
 */
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const dest = resolve(process.cwd(), 'api/server')

try {
  if (!existsSync(dest)) {
    console.error('✗ Server compilation failed: api/server/ not found')
    process.exit(1)
  }
  const files = readdirSync(dest, { recursive: true })
  console.log(`✓ Server compiled → api/server/ (${files.length} files)`)
} catch (err) {
  console.error('✗ Failed to verify server:', err.message)
  process.exit(1)
}

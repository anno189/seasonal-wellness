/**
 * Portable path resolution for server-side data files
 * Works in both local dev and Vercel Serverless environments
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
export function resolveDataDir(relativeTo = 'engines') {
    const candidate = resolve(dirname(fileURLToPath(import.meta.url)), '../../../data');
    // Verify the data directory exists
    if (existsSync(candidate))
        return candidate;
    // Fallback: try relative to cwd
    const cwdFallback = resolve(process.cwd(), 'data');
    if (existsSync(cwdFallback))
        return cwdFallback;
    // Last resort
    return candidate;
}
export function resolveDataFile(filename, relativeTo = 'engines') {
    return resolve(resolveDataDir(relativeTo), filename);
}

import fs from 'fs/promises';
import path from 'path';
import { DatabaseDump } from '@rs-planner/core';

/**
 * File operation utilities for database dumps
 */

export interface FileOperationOptions {
  outputFile: string;
  tempFile?: string;
}

/**
 * Ensure the directory exists for the given file path
 */
export async function ensureDirectory(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

/**
 * Load existing database dump from file
 */
export async function loadDatabaseDump<T = any>(filePath: string): Promise<DatabaseDump<T> | null> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as DatabaseDump<T>;
  } catch (error) {
    return null;
  }
}

/**
 * Save database dump to file atomically
 */
export async function saveDatabaseDump<T = any>(
  dump: DatabaseDump<T>,
  options: FileOperationOptions
): Promise<void> {
  const { outputFile, tempFile = `${outputFile}.tmp` } = options;
  
  await ensureDirectory(outputFile);
  
  // Write to temp file first, then rename for atomicity
  await fs.writeFile(tempFile, JSON.stringify(dump, null, 2), 'utf-8');
  await fs.rename(tempFile, outputFile);
  
  console.log(`Saved ${dump.items.length} items to ${outputFile}`);
}

/**
 * Create a database dump object
 */
export function createDatabaseDump<T = any>(
  items: T[],
  lastDataOffset: number
): DatabaseDump<T> {
  return {
    items,
    metadata: {
      totalItems: items.length,
      lastDataOffset,
      lastFetchTime: new Date().toISOString()
    }
  };
}

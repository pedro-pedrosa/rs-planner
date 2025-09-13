/**
 * A simple greeting function to demonstrate shared library functionality
 */
export function greet(name: string): string {
  return `Hello, ${name}! Welcome to the RS Planner.`;
}

/**
 * Example domain logic - skill level calculations
 */
export function calculateXpForLevel(level: number): number {
  if (level < 1 || level > 99) {
    throw new Error('Level must be between 1 and 99');
  }
  
  let totalXp = 0;
  for (let i = 1; i < level; i++) {
    totalXp += Math.floor(i + 300 * Math.pow(2, i / 7));
  }
  return Math.floor(totalXp / 4);
}

/**
 * Example data loading utility
 */
export async function loadGameData<T>(filename: string): Promise<T> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  // Look for data folder relative to the monorepo root
  const dataPath = path.join(process.cwd(), '../data', filename);
  const content = await fs.readFile(dataPath, 'utf-8');
  return JSON.parse(content);
}

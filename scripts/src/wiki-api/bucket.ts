/**
 * RuneScape Wiki Bucket API Client
 * Based on Extension:Bucket/Usage documentation
 * https://meta.weirdgloop.org/w/Extension:Bucket/Usage
 */

export interface BucketQueryOptions {
  bucket: string;
  select: string[];
  where?: WhereCondition[];
  join?: JoinConfig[];
  limit?: number;
  offset?: number;
  orderBy?: OrderByConfig;
}

export interface WhereCondition {
  selector: string;
  operand?: '=' | '!=' | '>=' | '<=' | '>' | '<';
  value: string | number | boolean;
}

export interface JoinConfig {
  bucket: string;
  primarySelector: string;
  joinSelector: string;
}

export interface OrderByConfig {
  selector: string;
  direction: 'asc' | 'desc';
}

export interface BucketApiResponse<T = any> {
  bucketQuery: string;
  bucket: T[];
}

/**
 * Build a Bucket query string based on the provided options
 */
export function buildBucketQuery(options: BucketQueryOptions): string {
  let query = `bucket('${options.bucket}')`;
  
  // Add select fields
  if (options.select.length > 0) {
    const selectFields = options.select.map(field => `'${field}'`).join(',');
    query += `.select(${selectFields})`;
  }
  
  // Add where conditions
  if (options.where && options.where.length > 0) {
    const whereConditions = options.where.map(condition => {
      const operand = condition.operand || '=';
      const value = typeof condition.value === 'string' ? `'${condition.value}'` : condition.value;
      return `{'${condition.selector}', '${operand}', ${value}}`;
    }).join(', ');
    query += `.where(${whereConditions})`;
  }
  
  // Add joins
  if (options.join && options.join.length > 0) {
    options.join.forEach(join => {
      query += `.join('${join.bucket}', '${join.primarySelector}', '${join.joinSelector}')`;
    });
  }
  
  // Add limit
  if (options.limit !== undefined) {
    query += `.limit(${options.limit})`;
  }
  
  // Add offset
  if (options.offset !== undefined) {
    query += `.offset(${options.offset})`;
  }
  
  // Add order by
  if (options.orderBy) {
    query += `.orderBy('${options.orderBy.selector}', '${options.orderBy.direction}')`;
  }
  
  // End with run()
  query += '.run()';
  
  return query;
}

/**
 * Execute a Bucket API query
 */
export async function executeBucketQuery<T = any>(
  options: BucketQueryOptions,
  baseUrl = 'https://runescape.wiki/api.php'
): Promise<BucketApiResponse<T>> {
  const query = buildBucketQuery(options);
  const url = `${baseUrl}?action=bucket&format=json&query=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as BucketApiResponse<T>;
  } catch (error) {
    throw new Error(`Bucket API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a raw Bucket query string
 */
export async function executeRawBucketQuery<T = any>(
  query: string,
  baseUrl = 'https://runescape.wiki/api.php'
): Promise<BucketApiResponse<T>> {
  const url = `${baseUrl}?action=bucket&format=json&query=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as BucketApiResponse<T>;
  } catch (error) {
    throw new Error(`Bucket API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper to create paginated queries
 */
export function createPaginatedQuery(
  baseOptions: Omit<BucketQueryOptions, 'limit' | 'offset'>,
  chunkSize = 5000,
  offset = 0
): BucketQueryOptions {
  return {
    ...baseOptions,
    limit: chunkSize,
    offset
  };
}

/**
 * Fetch all data with automatic pagination
 */
export async function fetchAllData<T = any>(
  baseOptions: Omit<BucketQueryOptions, 'limit' | 'offset'>,
  chunkSize = 5000,
  onProgress?: (items: T[], offset: number) => void
): Promise<T[]> {
  const allItems: T[] = [];
  let offset = 0;
  let consecutiveEmptyChunks = 0;
  const maxEmptyChunks = 3;
  
  while (consecutiveEmptyChunks < maxEmptyChunks) {
    const queryOptions = createPaginatedQuery(baseOptions, chunkSize, offset);
    const response = await executeBucketQuery<T>(queryOptions);
    
    if (response.bucket.length === 0) {
      consecutiveEmptyChunks++;
    } else {
      consecutiveEmptyChunks = 0;
      allItems.push(...response.bucket);
      
      if (onProgress) {
        onProgress(response.bucket, offset);
      }
    }
    
    offset += chunkSize;
    
    // Add a small delay to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return allItems;
}

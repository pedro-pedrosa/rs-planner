export interface DatabaseDump<T = any> {
  items: T[];
  metadata: {
    totalItems: number;
    lastDataOffset: number;
    lastFetchTime: string;
  };
}

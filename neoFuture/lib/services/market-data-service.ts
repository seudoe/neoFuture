import {
  PricePrediction,
  PricePredictionService,
  CacheEntry
} from '../types/market-data';

export class MarketDataService implements PricePredictionService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  /**
   * Generate cache key for commodity and state
   */
  private generateCacheKey(commodity: string, state?: string): string {
    return `price_prediction:${commodity.toLowerCase()}:${state?.toLowerCase() || 'all'}`;
  }

  /**
   * Check if cache entry is valid and not expired
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() < entry.expiresAt;
  }

  /**
   * Store data in cache with expiration
   */
  private setCacheEntry(key: string, data: PricePrediction): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_TTL
    };
    this.cache.set(key, entry);
  }

  /**
   * Search for commodity prices with caching
   */
  async searchCommodityPrices(productName: string, state?: string): Promise<PricePrediction | null> {
    try {
      console.log('Searching for commodity prices:', productName);
      
      // Check cache first
      const cacheKey = this.generateCacheKey(productName, state);
      const cachedEntry = this.cache.get(cacheKey);
      
      if (cachedEntry && this.isCacheValid(cachedEntry)) {
        console.log('Returning cached result for:', productName);
        return cachedEntry.data;
      }

      // Build API request URL
      const params = new URLSearchParams({
        productName: productName.trim()
      });

      if (state) {
        params.append('state', state);
      }

      console.log('Making API request for:', productName);

      // Make request to our API route
      const response = await fetch(`/api/market-data?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`API request failed: ${response.status}`);
        return null; // Graceful degradation
      }

      const data = await response.json();
      const prediction = data.prediction;

      console.log('API response received:', prediction ? 'Data found' : 'No data');

      if (prediction) {
        // Cache the result
        this.setCacheEntry(cacheKey, prediction);
      }

      return prediction;

    } catch (error) {
      console.error('Price prediction error:', error);
      // Return null for graceful degradation
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();
// Market Data Types for Price Prediction System

// Raw API response interfaces
export interface RawMarketRecord {
  State: string;
  District: string;
  Market: string;
  Commodity: string;
  Variety: string;
  Grade: string;
  Arrival_Date: string;
  Min_Price: string;
  Max_Price: string;
  Modal_Price: string;
}

export interface ApiResponse {
  records: RawMarketRecord[];
  total: number;
  count: number;
}

// Normalized market data interfaces
export interface MarketRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  arrivalDate: string;
  arrivalDateObj: Date;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

export interface PricePrediction {
  commodity: string;
  latestDate: string;
  records: MarketRecord[];
  summary: {
    minPrice: number;
    maxPrice: number;
    modalPrice: number;
    marketCount: number;
  };
}

// Error handling types
export enum PricePredictionErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_AUTH_ERROR = 'API_AUTH_ERROR',
  INVALID_DATA = 'INVALID_DATA',
  NO_DATA_FOUND = 'NO_DATA_FOUND',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export interface PricePredictionError {
  type: PricePredictionErrorType;
  message: string;
  retryable: boolean;
}

// Service interfaces
export interface PricePredictionService {
  searchCommodityPrices(productName: string, state?: string): Promise<PricePrediction | null>;
  clearCache(): void;
}

export interface CacheEntry {
  data: PricePrediction;
  timestamp: number;
  expiresAt: number;
}

// Component interfaces
export interface PriceDisplayProps {
  prediction: PricePrediction | null;
  loading: boolean;
  error: string | null;
  onReload?: () => void;
  productName?: string;
  stateName?: string;
}

export interface UsePricePredictionResult {
  prediction: PricePrediction | null;
  loading: boolean;
  error: string | null;
  searchPrices: (productName: string, state?: string) => void;
}

// API configuration types
export interface MarketDataApiConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}
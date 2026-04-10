/**
 * Error types and interfaces for the Price Prediction System
 * 
 * This file defines all error types, error handling interfaces, and
 * error recovery strategies used throughout the price prediction system.
 */

/**
 * Enumeration of all possible error types in the price prediction system
 */
export enum PricePredictionErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',           // Network connectivity issues
  API_AUTH_ERROR = 'API_AUTH_ERROR',         // API authentication failures
  INVALID_DATA = 'INVALID_DATA',             // Invalid or malformed API data
  NO_DATA_FOUND = 'NO_DATA_FOUND',           // No market data available for commodity
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',           // Request timeout
  PARSE_ERROR = 'PARSE_ERROR',               // Data parsing/conversion errors
  CACHE_ERROR = 'CACHE_ERROR',               // Cache-related errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',     // Data validation failures
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'            // Unexpected errors
}

/**
 * Structured error object for price prediction operations
 */
export interface PricePredictionError {
  type: PricePredictionErrorType;
  message: string;                           // User-friendly error message
  details?: string;                          // Technical details for debugging
  retryable: boolean;                        // Whether the operation can be retried
  timestamp: number;                         // When the error occurred
  context?: {                                // Additional context for debugging
    productName?: string;
    state?: string;
    endpoint?: string;
    statusCode?: number;
  };
}

/**
 * Error recovery configuration for different error types
 */
export interface ErrorRecoveryConfig {
  maxRetries: number;                        // Maximum number of retry attempts
  retryDelay: number;                        // Delay between retries in milliseconds
  backoffMultiplier: number;                 // Exponential backoff multiplier
  timeoutMs: number;                         // Request timeout in milliseconds
}

/**
 * Result wrapper that can contain either data or error
 * Used for operations that might fail gracefully
 */
export type Result<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: PricePredictionError;
};

/**
 * Validation error details for specific field failures
 */
export interface ValidationErrorDetail {
  field: string;                             // Field name that failed validation
  value: any;                                // The invalid value
  reason: string;                            // Why validation failed
  expected?: string;                         // What was expected
}

/**
 * Comprehensive validation error with multiple field failures
 */
export interface ValidationError extends Omit<PricePredictionError, 'details'> {
  type: PricePredictionErrorType.VALIDATION_ERROR;
  details: ValidationErrorDetail[];
}

/**
 * Network error with additional HTTP context
 */
export interface NetworkError extends PricePredictionError {
  type: PricePredictionErrorType.NETWORK_ERROR;
  context: {
    endpoint: string;
    statusCode?: number;
    method: string;
    headers?: Record<string, string>;
  };
}

/**
 * API authentication error with auth context
 */
export interface ApiAuthError extends PricePredictionError {
  type: PricePredictionErrorType.API_AUTH_ERROR;
  context: {
    endpoint: string;
    statusCode: number;
    authMethod: string;
  };
}

/**
 * Default error recovery configurations for different error types
 */
export const DEFAULT_ERROR_RECOVERY: Record<PricePredictionErrorType, ErrorRecoveryConfig> = {
  [PricePredictionErrorType.NETWORK_ERROR]: {
    maxRetries: 1,
    retryDelay: 2000,
    backoffMultiplier: 1.5,
    timeoutMs: 10000
  },
  [PricePredictionErrorType.API_AUTH_ERROR]: {
    maxRetries: 0,
    retryDelay: 0,
    backoffMultiplier: 1,
    timeoutMs: 5000
  },
  [PricePredictionErrorType.TIMEOUT_ERROR]: {
    maxRetries: 1,
    retryDelay: 1000,
    backoffMultiplier: 2,
    timeoutMs: 15000
  },
  [PricePredictionErrorType.INVALID_DATA]: {
    maxRetries: 0,
    retryDelay: 0,
    backoffMultiplier: 1,
    timeoutMs: 5000
  },
  [PricePredictionErrorType.NO_DATA_FOUND]: {
    maxRetries: 0,
    retryDelay: 0,
    backoffMultiplier: 1,
    timeoutMs: 5000
  },
  [PricePredictionErrorType.PARSE_ERROR]: {
    maxRetries: 0,
    retryDelay: 0,
    backoffMultiplier: 1,
    timeoutMs: 5000
  },
  [PricePredictionErrorType.CACHE_ERROR]: {
    maxRetries: 0,
    retryDelay: 0,
    backoffMultiplier: 1,
    timeoutMs: 5000
  },
  [PricePredictionErrorType.VALIDATION_ERROR]: {
    maxRetries: 0,
    retryDelay: 0,
    backoffMultiplier: 1,
    timeoutMs: 5000
  },
  [PricePredictionErrorType.UNKNOWN_ERROR]: {
    maxRetries: 1,
    retryDelay: 1000,
    backoffMultiplier: 1,
    timeoutMs: 10000
  }
};

/**
 * User-friendly error messages for different error types
 */
export const ERROR_MESSAGES: Record<PricePredictionErrorType, string> = {
  [PricePredictionErrorType.NETWORK_ERROR]: 'Unable to connect to market data service. Please check your internet connection.',
  [PricePredictionErrorType.API_AUTH_ERROR]: 'Market data service is temporarily unavailable. Please try again later.',
  [PricePredictionErrorType.INVALID_DATA]: 'Received invalid market data. Please try again.',
  [PricePredictionErrorType.NO_DATA_FOUND]: 'No market data available for this product.',
  [PricePredictionErrorType.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [PricePredictionErrorType.PARSE_ERROR]: 'Unable to process market data. Please try again.',
  [PricePredictionErrorType.CACHE_ERROR]: 'Cache error occurred. Data will be fetched fresh.',
  [PricePredictionErrorType.VALIDATION_ERROR]: 'Invalid data format received.',
  [PricePredictionErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};
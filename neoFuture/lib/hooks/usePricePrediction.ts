import { useState, useEffect, useCallback, useRef } from 'react';
import { PricePrediction, UsePricePredictionResult } from '../types/market-data';
import { marketDataService } from '../services/market-data-service';

export function usePricePrediction(): UsePricePredictionResult {
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for cleanup and debouncing
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  // Search function with debouncing
  const searchPrices = useCallback((productName: string, state?: string) => {
    console.log('🔍 searchPrices called with:', { productName, state });
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Clear previous error
    setError(null);

    // Don't search for empty or very short product names
    if (!productName || productName.trim().length < 2) {
      setPrediction(null);
      setLoading(false);
      return;
    }

    // Debounce the search by 500ms
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        // Cancel any ongoing request
        cleanup();

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        console.log('🚀 Making API request for:', { productName: productName.trim(), state });

        // Perform the search with state if provided
        const result = await marketDataService.searchCommodityPrices(
          productName.trim(),
          state
        );

        // Only update state if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setPrediction(result);
          setLoading(false);
          console.log('✅ Search completed:', result ? 'Data found' : 'No data');
        }

      } catch (err) {
        // Only update error state if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('❌ Price prediction search failed:', err);
          setError('Unable to fetch price data. Please try again.');
          setPrediction(null);
          setLoading(false);
        }
      }
    }, 500); // 500ms debounce delay

  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    prediction,
    loading,
    error,
    searchPrices
  };
}
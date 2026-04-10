'use client';

import { TrendingUp, RefreshCw, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { PriceDisplayProps } from '@/lib/types/market-data';

export default function PriceDisplay({ prediction, loading, error, onReload, productName, stateName }: PriceDisplayProps) {
  const handleReload = () => {
    console.log('🔄 Reload button clicked');
    if (onReload) {
      onReload();
    } else {
      console.warn('⚠️ No onReload function provided');
    }
  };
  
  // Debug logging to help track component state
  console.log('🎯 PriceDisplay render:', { 
    hasProductName: !!productName, 
    productName, 
    stateName, 
    hasPrediction: !!prediction, 
    loading, 
    error: !!error 
  });
  
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-4">
      {/* Header with reload button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Market Price Prediction</h3>
        </div>
        {onReload && (
          <button
            type="button"
            onClick={handleReload}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reload price data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin mr-2" />
          <div className="text-green-700">
            <div className="font-medium">Fetching market prices...</div>
            <div className="text-sm text-green-600 mt-1">
              {productName && stateName ? `Searching for ${productName} in ${stateName}` : 'Loading price data'}
            </div>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-orange-600 mr-2 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-orange-800 font-medium text-sm mb-1">Unable to Load Market Data</div>
            <div className="text-orange-700 text-sm">{error}</div>
            <div className="text-orange-600 text-xs mt-2">
              💡 Try clicking the reload button or check your internet connection
            </div>
          </div>
        </div>
      )}

      {!prediction && !loading && !error && (
        <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-blue-800 font-medium text-sm mb-1">Market Data Not Available</div>
            <div className="text-blue-700 text-sm">
              {productName && stateName ? (
                <>No market data found for <span className="font-medium">"{productName}"</span> in <span className="font-medium">{stateName}</span>.</>
              ) : productName && !stateName ? (
                <>Please select a state to check market prices for <span className="font-medium">"{productName}"</span>.</>
              ) : productName ? (
                <>No market data found for <span className="font-medium">"{productName}"</span> in the selected state.</>
              ) : (
                <>No market data available for this product in the selected state.</>
              )}
              {' '}Try a different state or use manual pricing.
            </div>
            {/* <div className="text-blue-600 text-xs mt-2 space-y-1">
              <div>💡 Tip: Major agricultura  l states like Gujarat, Punjab, Maharashtra usually have more market data</div>
              <div>🔄 Try: Different state names, or click the reload button to refresh data</div>
              <div>📍 Alternative: Use manual pricing based on your local market knowledge</div>
            </div> */}
          </div>
        </div>
      )}

      {prediction && !loading && (
        <div className="space-y-4">
          {/* Location info */}
          <div className="text-sm text-gray-600">
            Latest market data from {prediction.records[0]?.market || 'Various Markets'}, {prediction.records[0]?.district || 'Multiple Districts'}
            {prediction.records[0]?.state && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                📍 {prediction.records[0].state}
              </span>
            )}
          </div>

          {/* Price cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Minimum Price */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-700">Minimum Price</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ₹ {prediction.summary.minPrice}/quintal
              </div>
            </div>

            {/* Modal Price (Recommended) */}
            <div className="bg-white rounded-lg p-4 border-2 border-green-300 relative">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-700">Modal Price</span>
                <span className="ml-2 text-xs text-green-600 font-medium">(Recommended)</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                ₹ {prediction.summary.modalPrice}/quintal
              </div>
            </div>

            {/* Maximum Price */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-700">Maximum Price</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ₹ {prediction.summary.maxPrice}/quintal
              </div>
            </div>
          </div>

          {/* Pricing Suggestion */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-800 mb-1">Pricing Suggestion</h4>
                <p className="text-sm text-blue-700">
                  Based on current market data, consider pricing your {prediction.commodity.toLowerCase()} between{' '}
                  <span className="font-semibold">₹{prediction.summary.minPrice}</span> and{' '}
                  <span className="font-semibold">₹{prediction.summary.maxPrice}</span> per kg. The modal price of{' '}
                  <span className="font-semibold">₹{prediction.summary.modalPrice}</span> represents the most common market rate.
                </p>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-green-200">
            <div className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{prediction.summary.marketCount} market{prediction.summary.marketCount !== 1 ? 's' : ''} • Latest: {prediction.latestDate}</span>
            </div>
            <span>Prices are indicative and may vary</span>
          </div>
        </div>
      )}
    </div>
  );
}
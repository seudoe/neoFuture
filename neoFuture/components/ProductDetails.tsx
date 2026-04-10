'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, User, Phone, Package, DollarSign, Star, Heart, ShoppingCart, Brain, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { analyzeCropImage, urlToFile, formatClassName, getQualityColor, getConfidenceColor, type PredictionResponse } from '../lib/services/image-analysis-service';

interface Product {
  id: number;
  name: string;
  category: string;
  quantity: number;
  price_single: number;
  price_multiple: number;
  location: string;
  description: string;
  status: string;
  seller_name: string;
  seller_phone: string;
  seller_id?: number;
  photos?: string[];
}

interface ProductDetailsProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (productId: number, quantity: number) => void;
  userRole?: 'farmer' | 'buyer';
  currentUserId?: number;
}

export default function ProductDetails({ product, isOpen, onClose, onAddToCart, userRole, currentUserId }: ProductDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sellerRating, setSellerRating] = useState<{ averageRating: number; totalRatings: number } | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [analysisData, setAnalysisData] = useState<PredictionResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product.seller_id) {
      fetchSellerRating(product.seller_id);
      setSelectedQuantity(1); // Reset quantity when modal opens
    }
  }, [isOpen, product.seller_id]);

  const fetchSellerRating = async (sellerId: number) => {
    setRatingLoading(true);
    try {
      const response = await fetch(`/api/user-stats?userId=${sellerId}&userType=seller`);
      const data = await response.json();
      if (data.stats) {
        setSellerRating({
          averageRating: data.stats.averageRating,
          totalRatings: data.stats.totalRatings
        });
      }
    } catch (error) {
      console.error('Error fetching seller rating:', error);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!product.photos || product.photos.length === 0) {
      setAnalysisError('No image available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);

    try {
      const imageUrl = product.photos[currentImageIndex];
      const file = await urlToFile(imageUrl, `${product.name}-image.jpg`);
      
      if (!file) {
        throw new Error('Failed to process image');
      }

      const result = await analyzeCropImage(file);
      
      if (result) {
        setAnalysisData(result);
      } else {
        throw new Error('ML analysis service is currently unavailable');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  const photos = product.photos && product.photos.length > 0 
    ? product.photos 
    : ['/api/placeholder/400/300']; // Fallback placeholder

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % photos.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Analyze image when current image changes
  useEffect(() => {
    const analyzeCurrentImage = async () => {
      const currentPhoto = photos[currentImageIndex];
      
      // Skip analysis for placeholder images or invalid URLs
      if (!currentPhoto || 
          currentPhoto === '/api/placeholder/400/300' || 
          currentPhoto.includes('placeholder') ||
          typeof currentPhoto !== 'string') {
        setAnalysisData(null);
        setAnalysisError(null);
        setIsAnalyzing(false);
        return;
      }

      setIsAnalyzing(true);
      setAnalysisError(null);
      setAnalysisData(null);

      try {
        const file = await urlToFile(currentPhoto, `product-image-${currentImageIndex}.jpg`);
        
        if (!file) {
          setAnalysisError('Unable to process this image');
          return;
        }

        const result = await analyzeCropImage(file);
        
        if (result) {
          setAnalysisData(result);
        } else {
          setAnalysisError('ML analysis service is currently unavailable');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong with the image analysis';
        setAnalysisError(errorMessage);
        console.error('Image analysis error:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    if (isOpen) {
      analyzeCurrentImage();
    } else {
      // Reset state when modal closes
      setAnalysisData(null);
      setAnalysisError(null);
      setIsAnalyzing(false);
    }
  }, [currentImageIndex, isOpen, photos]);

  const bulkDiscount = product.price_single > product.price_multiple 
    ? Math.round(((product.price_single - product.price_multiple) / product.price_single) * 100)
    : 0;

  // Check if the current user is the seller of this product
  const isOwnProduct = userRole === 'farmer' && currentUserId === product.seller_id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            {isOwnProduct ? (
              <p className="text-sm text-green-600 mt-1">📋 Your Product - This is how buyers see your listing</p>
            ) : (
              <p className="text-sm text-blue-600 mt-1">🛒 Product Details - Add to cart or contact seller</p>
            )}
          </div>
          
          {/* Seller Rating in Top Right Corner */}
          <div className="flex items-center space-x-4">
            {sellerRating && sellerRating.totalRatings > 0 ? (
              <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(sellerRating.averageRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-yellow-800">
                  {sellerRating.averageRating.toFixed(1)} ({sellerRating.totalRatings})
                </span>
              </div>
            ) : ratingLoading ? (
              <div className="bg-gray-100 px-3 py-2 rounded-lg animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            ) : sellerRating && sellerRating.totalRatings === 0 ? (
              <div className="flex items-center space-x-1 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <Star className="w-4 h-4 text-gray-300" />
                <span className="text-sm text-gray-700">No ratings yet</span>
              </div>
            ) : null}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Image Slideshow */}
          <div className="space-y-4">
            <div className="relative">
              <img
                src={photos[currentImageIndex]}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-80 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/api/placeholder/400/300';
                }}
              />
              
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {photos.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder/64/64';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* ML Analysis Results */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Brain className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">AI Quality Analysis</h3>
              </div>

              {isAnalyzing && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analyzing image quality...</span>
                </div>
              )}

              {analysisError && (
                <div className="flex items-start space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-sm flex-1">
                    <div className="font-medium">Analysis Unavailable</div>
                    <div className="text-red-500 mt-1">{analysisError}</div>
                    {analysisError.includes('connect') || analysisError.includes('unavailable') ? (
                      <div className="text-xs text-red-400 mt-2">
                        The ML analysis service may be temporarily offline. Product quality can still be assessed manually.
                      </div>
                    ) : null}
                    <button
                      onClick={handleAnalyzeImage}
                      disabled={isAnalyzing}
                      className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {analysisData && !isAnalyzing && (
                <div className="space-y-3">
                  {/* Prediction Class */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Classification:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {formatClassName(analysisData.predicted_class)}
                    </span>
                  </div>

                  {/* Confidence Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Confidence:</span>
                    <span className={`text-sm font-semibold ${getConfidenceColor(analysisData.confidence_score)}`}>
                      {analysisData.confidence_score || 'N/A'}
                    </span>
                  </div>

                  {/* Quality Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Quality Score:</span>
                    <div className={`px-2 py-1 rounded border text-sm font-medium ${getQualityColor(analysisData.quality_score)}`}>
                      {typeof analysisData.quality_score === 'number' ? `${analysisData.quality_score}/5` : 'N/A'}
                      {analysisData.quality_score >= 4 && <CheckCircle className="w-3 h-3 inline ml-1" />}
                    </div>
                  </div>

                  {/* Quality Indicator Bar */}
                  {typeof analysisData.quality_score === 'number' && !isNaN(analysisData.quality_score) && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-700">
                        <span>Quality</span>
                        <span>{analysisData.quality_score}/5</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            analysisData.quality_score >= 4 ? 'bg-green-500' :
                            analysisData.quality_score >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(0, Math.min(100, (analysisData.quality_score / 5) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Analysis Message */}
                  {analysisData.message && (
                    <div className="text-xs text-gray-600 bg-white bg-opacity-50 rounded p-2">
                      {analysisData.message}
                    </div>
                  )}
                </div>
              )}

              {!analysisData && !isAnalyzing && !analysisError && (
                <div className="text-sm text-gray-700 text-center py-2">
                  {photos[currentImageIndex]?.includes('placeholder') || !photos[currentImageIndex] 
                    ? 'No image available for analysis' 
                    : 'Select an image to see AI quality analysis'
                  }
                </div>
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Category */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {product.category}
              </span>
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm text-gray-600">Single Unit Price</p>
                  <p className="text-2xl font-bold text-gray-900">₹{product.price_single}/kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bulk Price (10kg+)</p>
                  <p className="text-2xl font-bold text-green-600">₹{product.price_multiple}/kg</p>
                </div>
              </div>
              
              {bulkDiscount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 font-medium">
                    Save {bulkDiscount}% on bulk orders (10kg or more)
                  </p>
                </div>
              )}
            </div>

            {/* Stock and Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-700">Available Stock</p>
                  <p className="font-semibold text-green-700">{product.quantity} kg</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-700">Location</p>
                  <p className="font-semibold text-green-700">{product.location}</p>
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">
                  {isOwnProduct ? 'Your Information' : 'Seller Information'}
                </h3>
                {sellerRating && sellerRating.totalRatings > 0 && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {sellerRating.averageRating.toFixed(1)} rating
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{product.seller_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{product.seller_phone}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Action Buttons */}
            {!isOwnProduct && (
              <div className="space-y-4">
                {/* Add to Cart Section */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      max={product.quantity}
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                    />
                    <span className="text-sm text-gray-700">kg</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (onAddToCart) {
                        onAddToCart(product.id, selectedQuantity);
                        onClose(); // Close modal after adding to cart
                      }
                    }}
                    disabled={!onAddToCart || selectedQuantity > product.quantity}
                    className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                      !onAddToCart || selectedQuantity > product.quantity
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </button>
                </div>

                {/* Quantity Info */}
                {selectedQuantity > product.quantity && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                    Only {product.quantity}kg available in stock
                  </div>
                )}

                {/* Price Preview */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {selectedQuantity}kg × ₹{selectedQuantity >= 10 ? product.price_multiple : product.price_single}/kg
                    </span>
                    <span className="font-semibold text-lg text-gray-900">
                      ₹{selectedQuantity * (selectedQuantity >= 10 ? product.price_multiple : product.price_single)}
                    </span>
                  </div>
                  {selectedQuantity >= 10 && (
                    <div className="text-xs text-green-600 mt-1">
                      Bulk pricing applied! You save ₹{selectedQuantity * (product.price_single - product.price_multiple)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Farmer's Own Product Message */}
            {isOwnProduct && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="font-medium text-green-800">This is your product</h3>
                    <p className="text-sm text-green-700 mt-1">
                      This is how buyers see your product listing. You can edit it from your "My Crops" section.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Seller - Only show for buyers or other farmers */}
            {!isOwnProduct && (
              <button 
                onClick={() => {
                  if (product.seller_phone) {
                    window.open(`tel:${product.seller_phone}`, '_self');
                  }
                }}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Phone className="w-5 h-5" />
                <span>Call Seller: {product.seller_phone}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
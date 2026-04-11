'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { Plus, MapPin, Calculator, Tag, ImageIcon, Loader2 } from 'lucide-react';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { usePricePrediction } from '@/lib/hooks/usePricePrediction';
import { matchState, getStateSuggestions } from '@/lib/utils/state-matcher';
import PhotoUpload from '@/components/PhotoUpload';
import PriceDisplay from '@/components/PriceDisplay';
import toast from 'react-hot-toast';

export default function AddProductPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useDashboardData('seller');
  
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [productName, setProductName] = useState('');
  const [locationState, setLocationState] = useState('');
  const [stateSuggestions, setStateSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number, address?: string, state?: string} | null>(null);

  const { prediction, loading: priceLoading, error: priceError, searchPrices } = usePricePrediction();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`
            );
            
            if (response.ok) {
              const data = await response.json();
              const address = data.display_name || '';
              const state = data.address?.state || data.address?.region || '';
              
              setUserLocation({ 
                ...coords, 
                address,
                state: state
              });
              
              if (!locationState && state) {
                setLocationState(state);
              }
            } else {
              setUserLocation(coords);
            }
          } catch (error) {
            console.warn('Geocoding error:', error);
            setUserLocation(coords);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const productData = {
      name: formData.get('name'),
      category: formData.get('category'),
      quantity: parseInt(formData.get('quantity') as string),
      seller_id: user.id,
      price_single: parseFloat(formData.get('price_single') as string),
      price_multiple: parseFloat(formData.get('price_multiple') as string),
      location: formData.get('location'),
      description: formData.get('description')
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        const result = await response.json();
        const productId = result.product.id;
        
        if (selectedPhotos.length > 0) {
          const uploadedUrls: string[] = [];
          
          for (let i = 0; i < selectedPhotos.length; i++) {
            const file = selectedPhotos[i];
            const photoFormData = new FormData();
            photoFormData.append('file', file);
            photoFormData.append('userId', user.id.toString());
            photoFormData.append('productId', productId.toString());

            const uploadResponse = await fetch('/api/upload-photo', {
              method: 'POST',
              body: photoFormData
            });

            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json();
              uploadedUrls.push(uploadResult.url);
            }
          }

          if (uploadedUrls.length > 0) {
            await fetch('/api/upload-photos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: productId,
                photoUrls: uploadedUrls
              })
            });
          }
        }
        
        toast.success('Product added successfully!');
        router.push('/dashboard/farmer/my-crops');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error adding product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Plus className="w-6 h-6 text-green-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">{t('farmer.addProduct')}</h2>
        </div>

        <form onSubmit={handleAddProduct} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('forms.productName')}
            </label>
            <input
              type="text"
              name="name"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                const matchedState = matchState(locationState);
                const stateToUse = matchedState || locationState || userLocation?.state;
                searchPrices(e.target.value, stateToUse);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
              placeholder={t('placeholders.freshTomatoes')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('forms.category')}
            </label>
            <select name="category" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900" required>
              <option value="" className="text-gray-500">{t('forms.selectCategory')}</option>
              <option value="vegetables" className="text-gray-900">{t('product.categories.vegetables')}</option>
              <option value="fruits" className="text-gray-900">{t('product.categories.fruits')}</option>
              <option value="grains" className="text-gray-900">{t('product.categories.grains')}</option>
              <option value="herbs" className="text-gray-900">{t('product.categories.herbs')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('forms.availableQuantity')}
            </label>
            <input
              type="number"
              name="quantity"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
              placeholder={t('placeholders.quantity500')}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                {t('forms.singleUnitPrice')}
              </label>
              <input
                type="number"
                name="price_single"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                placeholder={t('placeholders.price500')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calculator className="w-4 h-4 inline mr-1" />
                {t('forms.bulkPrice')}
              </label>
              <input
                type="number"
                name="price_multiple"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                placeholder={t('placeholders.price450')}
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              {t('forms.state')}
            </label>
            <input
              type="text"
              name="location"
              value={locationState}
              onChange={(e) => {
                const inputValue = e.target.value;
                setLocationState(inputValue);
                
                if (inputValue.length > 0) {
                  const suggestions = getStateSuggestions(inputValue);
                  setStateSuggestions(suggestions);
                  setShowSuggestions(true);
                } else {
                  setShowSuggestions(false);
                }
                
                const matchedState = matchState(inputValue);
                const stateToUse = matchedState || inputValue || userLocation?.state;
                
                if (productName) {
                  searchPrices(productName, stateToUse);
                }
              }}
              onFocus={() => {
                if (locationState.length > 0) {
                  const suggestions = getStateSuggestions(locationState);
                  setStateSuggestions(suggestions);
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
              placeholder={t('placeholders.stateExample')}
              autoComplete="off"
            />
            
            {showSuggestions && stateSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {stateSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setLocationState(suggestion);
                      setShowSuggestions(false);
                      
                      if (productName) {
                        searchPrices(productName, suggestion);
                      }
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-green-50 hover:text-green-700 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-green-500 mr-2" />
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {locationState && matchState(locationState) && matchState(locationState) !== locationState && (
              <div className="mt-1 text-xs text-green-600 flex items-center">
                <span className="mr-1">🧠</span>
                <span>Smart match: "{matchState(locationState)}"</span>
              </div>
            )}
          </div>

          {productName && productName.trim().length >= 2 && (
            <PriceDisplay 
              prediction={prediction}
              loading={priceLoading}
              error={priceError}
              productName={productName}
              stateName={matchState(locationState) || locationState || userLocation?.state}
              onReload={() => {
                const matchedState = matchState(locationState);
                const stateToUse = matchedState || locationState || userLocation?.state;
                searchPrices(productName, stateToUse);
              }}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('forms.description')}
            </label>
            <textarea
              name="description"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none text-gray-900 placeholder-gray-500"
              placeholder={t('placeholders.describeProduct')}
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ImageIcon className="w-4 h-4 inline mr-1" />
              {t('forms.productPhotos')}
            </label>

            {/* Photo advice */}
            <div className="flex items-start gap-3 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-xl shrink-0">📸</span>
              <div>
                <p className="text-sm font-medium text-amber-900">Better photos = more buyers</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Take photos from <span className="font-medium">all sides</span> — front, back, close-up, and a full view.
                  Show the <span className="font-medium">colour, size, and freshness</span> clearly so buyers feel confident ordering.
                </p>
              </div>
            </div>

            <PhotoUpload
              onPhotosChange={setSelectedPhotos}
              userId={user?.id}
              maxPhotos={5}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                t('forms.addProduct')
              )}
            </button>
            <button
              type="button"
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              onClick={() => router.push('/dashboard/farmer/my-crops')}
            >
              {t('forms.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

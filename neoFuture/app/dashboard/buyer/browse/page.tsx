'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { ShoppingCart, ImageIcon } from 'lucide-react';
import { useDashboardData, useProducts, useCart } from '@/lib/hooks/useDashboardData';
import ProductDetails from '@/components/ProductDetails';

export default function BrowseProductsPage() {
  const { t } = useI18n();
  const { user } = useDashboardData('buyer');
  const { products, loading } = useProducts();
  const { addToCart } = useCart(user?.id);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState<{[key: number]: number}>({});

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.seller_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <ShoppingCart className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Browse Products</h2>
          </div>
          <div className="text-sm text-gray-500">
            {filteredProducts.length} {t('status.productsFound')}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden mb-6">
          <input
            type="text"
            placeholder={t('placeholders.searchProducts')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">{t('messages.loadingProducts')}</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('status.noProductsFound')}</h3>
            <p className="text-gray-500">{t('status.adjustSearchTerms')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product: any) => (
              <div 
                key={product.id} 
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center relative">
                  {product.photos && product.photos.length > 0 ? (
                    <img
                      src={product.photos[0]}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`fallback-icon w-full h-full flex items-center justify-center ${product.photos && product.photos.length > 0 ? 'absolute inset-0' : ''}`} style={{ display: product.photos && product.photos.length > 0 ? 'none' : 'flex' }}>
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <p>{t('productInfo.category')}: {product.category}</p>
                  <p>{t('productInfo.seller')}: {product.seller_name}</p>
                  <p>{t('productInfo.location')}: {product.location}</p>
                  <p>{t('productInfo.stock')}: {product.quantity}kg</p>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-blue-600 font-semibold">₹{product.price_single}/kg</span>
                    {product.price_multiple && (
                      <div className="text-xs text-gray-700">
                        {t('productInfo.bulk')}: ₹{product.price_multiple}/kg
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {product.price_multiple && (
                      <div className="text-xs text-green-600 font-medium">
                        {Math.round(((product.price_single - product.price_multiple) / product.price_single) * 100)}% off bulk
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max={product.quantity}
                      value={selectedQuantity[product.id] || 1}
                      onChange={(e) => setSelectedQuantity(prev => ({
                        ...prev,
                        [product.id]: parseInt(e.target.value) || 1
                      }))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-gray-700">kg</span>
                  </div>
                  <button 
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product.id, selectedQuantity[product.id] || 1);
                    }}
                  >
                    {t('Add to Cart')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          isOpen={showProductDetails}
          onClose={() => {
            setShowProductDetails(false);
            setSelectedProduct(null);
          }}
          onAddToCart={(productId, quantity) => {
            addToCart(productId, quantity);
            setShowProductDetails(false);
          }}
        />
      )}
    </>
  );
}

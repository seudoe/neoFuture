'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { Wheat, Plus, ImageIcon, Search, X } from 'lucide-react';
import { useDashboardData, useProducts } from '@/lib/hooks/useDashboardData';
import EditProduct from '@/components/EditProduct';
import ProductDetails from '@/components/ProductDetails';

export default function MyCropsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useDashboardData('seller');
  const { products, loading, refetch } = useProducts(user?.id);
  
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleViewProduct = (product: any) => {
    setViewingProduct(product);
    setShowProductDetails(true);
  };

  const handleSaveProduct = (updatedProduct: any) => {
    setShowEditModal(false);
    setEditingProduct(null);
    refetch();
  };

  const handleDeleteProduct = (productId: number) => {
    setShowEditModal(false);
    setEditingProduct(null);
    refetch();
  };

  if (!user) return null;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center">
            <Wheat className="w-6 h-6 text-green-600 mr-3 shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Crops</h2>
              <p className="text-sm text-gray-600 mt-0.5">Click on any product to see how buyers view it</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search crops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500 text-sm w-44"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => router.push('/dashboard/farmer/add-product')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('farmer.addProduct')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">{t('messages.loadingProducts')}</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Wheat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            {searchTerm ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No crops match "{searchTerm}"</h3>
                <button onClick={() => setSearchTerm('')} className="text-green-600 text-sm hover:underline">Clear search</button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('status.noProductsYet')}</h3>
                <p className="text-gray-500 mb-4">{t('status.startByAdding')}</p>
                <button
                  onClick={() => router.push('/dashboard/farmer/add-product')}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  {t('status.addYourFirstProduct')}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div 
                  className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center relative"
                  onClick={() => handleViewProduct(product)}
                >
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
                <div onClick={() => handleViewProduct(product)}>
                  <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{t('productInfo.category')}: {product.category}</p>
                    <p>{t('productInfo.singlePrice')}: ₹{product.price_single}/kg</p>
                    {product.price_multiple && <p>{t('productInfo.bulk')}: ₹{product.price_multiple}/kg</p>}
                    <p>{t('productInfo.stock')}: {product.quantity}kg</p>
                    <p>{t('productInfo.location')}: {product.location}</p>
                    {product.photos && product.photos.length > 0 && (
                      <p className="text-blue-600">📸 {product.photos.length} {product.photos.length > 1 ? t('productInfo.photosPlural') : t('productInfo.photos')}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    product.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {product.status}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProduct(product);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      {t('common.view')}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProduct(product);
                      }}
                      className="text-green-600 hover:text-green-700 text-sm font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
                    >
                      {t('common.edit')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditModal && editingProduct && user && (
        <EditProduct
          product={editingProduct}
          isOpen={showEditModal}
          userId={user.id}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {showProductDetails && viewingProduct && (
        <ProductDetails
          product={viewingProduct}
          isOpen={showProductDetails}
          onClose={() => {
            setShowProductDetails(false);
            setViewingProduct(null);
          }}
        />
      )}
    </>
  );
}

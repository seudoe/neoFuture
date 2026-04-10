'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { ShoppingCart, ImageIcon } from 'lucide-react';
import { useDashboardData, useCart } from '@/lib/hooks/useDashboardData';
import PaymentPortal from '@/components/PaymentPortal';
import ProductDetails from '@/components/ProductDetails';

export default function CartPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useDashboardData('buyer');
  const { cartItems, loading, updateCartQuantity, removeFromCart, refetch } = useCart(user?.id);
  
  const [showPaymentPortal, setShowPaymentPortal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  if (!user) return null;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <ShoppingCart className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">My Cart</h2>
          </div>
          <div className="text-sm text-gray-600">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading cart...</div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('status.yourCartIsEmpty')}</h3>
            <p className="text-gray-500 mb-4">{t('status.browseAndAdd')}</p>
            <button
              onClick={() => router.push('/dashboard/buyer/browse')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              {t('status.browseProducts')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-xl p-4 flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {product.photos && product.photos.length > 0 ? (
                    <img
                      src={product.photos[0]}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-700">by {product.seller_name}</p>
                  <p className="text-sm text-gray-700">Stock: {product.quantity}kg</p>
                  <p className="text-sm font-medium text-blue-600">
                    You have {product.cart_quantity}kg in cart
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-600">₹{product.price_single}/kg</div>
                  {product.price_multiple && (
                    <div className="text-sm text-gray-700">{t('productInfo.bulk')}: ₹{product.price_multiple}/kg</div>
                  )}
                  <div className="text-sm font-medium text-green-600 mt-1">
                    Total: ₹{(product.cart_quantity >= 10 ? product.price_multiple : product.price_single) * product.cart_quantity}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max={product.quantity}
                      value={product.cart_quantity}
                      onChange={(e) => updateCartQuantity(product.id, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                    />
                    <span className="text-xs text-gray-700">kg</span>
                  </div>
                  <button
                    onClick={() => handleProductClick(product)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-4 mt-6 text-gray-700">
              <div className="space-y-2 mb-4">
                {cartItems.map(item => {
                  const itemTotal = (item.cart_quantity >= 10 ? item.price_multiple : item.price_single) * item.cart_quantity;
                  return (
                    <div key={item.id} className="flex justify-between text-sm text-grey-700">
                      <span className="text-gray-700">{item.name} × {item.cart_quantity}kg</span>
                      <span>₹{itemTotal}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center mb-4 text-lg font-semibold">
                <span>Total:</span>
                <span>₹{cartItems.reduce((sum, item) => 
                  sum + ((item.cart_quantity >= 10 ? item.price_multiple : item.price_single) * item.cart_quantity), 0
                )}</span>
              </div>
              <button 
                onClick={() => setShowPaymentPortal(true)}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>

      {showPaymentPortal && (
        <PaymentPortal
          isOpen={showPaymentPortal}
          cartItems={cartItems}
          userId={user.id}
          user={user}
          onClose={() => setShowPaymentPortal(false)}
          onPaymentSuccess={() => {
            setShowPaymentPortal(false);
            refetch();
            router.push('/dashboard/buyer/my-orders');
          }}
        />
      )}

      {showProductDetails && selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          isOpen={showProductDetails}
          onClose={() => {
            setShowProductDetails(false);
            setSelectedProduct(null);
          }}
          onAddToCart={() => {
            setShowProductDetails(false);
            refetch();
          }}
        />
      )}
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Heart, 
  Handshake, 
  User, 
  Settings,
  Search,
  Star,
  DollarSign,
  Sprout,
  ImageIcon,
  Phone,
  ClipboardList
} from 'lucide-react';
import ProductDetails from '@/components/ProductDetails';
import PaymentPortal from '@/components/PaymentPortal';
import RatingModal from '@/components/RatingModal';
import RatingDisplay from '@/components/RatingDisplay';
import UserRatingDisplay from '@/components/UserRatingDisplay';
import Dashboard from '@/components/Dashboard';
import OrderRequests from '@/components/OrderRequests';
import ReorderModal from '@/components/ReorderModal';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface User {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  role: string;
  // role: string;
}

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
  seller_id: number;
  photos?: string[];
  cart_quantity?: number; // Added for cart items
}

interface CartItem {
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
  seller_id: number; // Added for PaymentPortal compatibility
  photos?: string[];
  cart_quantity: number;
}

export default function BuyerDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPaymentPortal, setShowPaymentPortal] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState<{[key: number]: number}>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<any>(null);
  const [orderRatings, setOrderRatings] = useState<{[key: number]: any}>({});
  const [receivedRatings, setReceivedRatings] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedOrderForReorder, setSelectedOrderForReorder] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number, address?: string, state?: string} | null>(null);

  useEffect(() => {
    // Get user from localStorage (runs only client-side after mount)
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.replace('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchCart(parsedUser.id);
    fetchOrders(parsedUser.id);
    fetchReceivedRatings(parsedUser.id);
    fetchUserStats(parsedUser.id);
    fetchProducts();
    fetchSuppliers();

    // Get user location for weather
    if (navigator.geolocation) {
      console.log('Requesting user location for weather...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          console.log('User location obtained:', coords);
          
          try {
            // Use reverse geocoding to get address information
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`
            );
            
            if (response.ok) {
              const data = await response.json();
              const address = data.display_name || '';
              const state = data.address?.state || data.address?.region || '';
              
              const locationData = { 
                ...coords, 
                address,
                state: state
              };
              
              console.log('Location data with address:', locationData);
              setUserLocation(locationData);
            } else {
              console.log('Geocoding failed, using coordinates only');
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
    } else {
      console.log('Geolocation not supported by browser');
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchCart = async (userId: number) => {
    try {
      const response = await fetch(`/api/cart?userId=${userId}`);
      const data = await response.json();
      setCartItems(data.cart?.products || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const fetchOrders = async (userId: number) => {
    try {
      const response = await fetch(`/api/orders?userId=${userId}&userType=buyer`);
      const data = await response.json();
      const ordersData = data.orders || [];
      setOrders(ordersData);
      
      // Fetch ratings for each order
      const ratingsMap: {[key: number]: any} = {};
      for (const order of ordersData) {
        try {
          const ratingsResponse = await fetch(`/api/ratings?orderId=${order.id}`);
          const ratingsData = await ratingsResponse.json();
          const buyerRating = ratingsData.ratings?.find((r: any) => r.rater_id === userId);
          if (buyerRating) {
            ratingsMap[order.id] = buyerRating;
          }
        } catch (error) {
          console.error(`Error fetching ratings for order ${order.id}:`, error);
        }
      }
      setOrderRatings(ratingsMap);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchReceivedRatings = async (userId: number) => {
    try {
      const response = await fetch(`/api/ratings?userId=${userId}&userType=buyer`);
      const data = await response.json();
      setReceivedRatings(data.ratings || []);
    } catch (error) {
      console.error('Error fetching received ratings:', error);
    }
  };

  const fetchUserStats = async (userId: number) => {
    setStatsLoading(true);
    try {
      const response = await fetch(`/api/user-stats?userId=${userId}&userType=buyer`);
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const result = await response.json();
      if (result.success) {
        // Refresh orders to show updated status
        if (user) {
          fetchOrders(user.id);
        }
        alert(`Order ${status} successfully!`);
      } else {
        alert(`Failed to ${status} order: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    }
  };

  const handleRateOrder = (order: any) => {
    setSelectedOrderForRating(order);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (rating: number, review: string) => {
    if (!selectedOrderForRating || !user) return;

    try {
      const existingRating = orderRatings[selectedOrderForRating.id];
      const method = existingRating ? 'PUT' : 'POST';
      const body = existingRating 
        ? { ratingId: existingRating.id, raterId: user.id, rating, review }
        : {
            orderId: selectedOrderForRating.id,
            raterId: user.id,
            ratedId: selectedOrderForRating.seller.id,
            raterType: 'buyer',
            rating,
            review
          };

      const response = await fetch('/api/ratings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (result.success) {
        // Update local ratings state
        setOrderRatings(prev => ({
          ...prev,
          [selectedOrderForRating.id]: result.rating
        }));
        alert(existingRating ? 'Rating updated successfully!' : 'Rating submitted successfully!');
      } else {
        // Check if it's a table missing error
        if (result.error?.includes('Ratings table does not exist')) {
          const shouldSetup = confirm(
            'The ratings table needs to be created first. Would you like to go to the setup page?'
          );
          if (shouldSetup) {
            window.open('/setup', '_blank');
          }
        } else {
          alert(result.error || 'Failed to submit rating');
        }
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Error submitting rating. Please check your connection and try again.');
    }
  };

  const handleReorder = async (order: any) => {
    setSelectedOrderForReorder(order);
    setShowReorderModal(true);
  };

  const handleConfirmReorder = async (quantity: number) => {
    if (!user || !selectedOrderForReorder) return;

    try {
      const order = selectedOrderForReorder;
      const newTotalPrice = quantity * order.unit_price;

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: user.id,
          sellerId: order.seller_id,
          productId: order.product_id,
          quantity: quantity,
          unitPrice: order.unit_price,
          totalPrice: newTotalPrice,
          deliveryAddress: order.delivery_address,
          notes: `Reorder of order #${order.id} (${quantity}kg)`
        })
      });

      const result = await response.json();
      if (result.success) {
        // Refresh orders to show the new order
        fetchOrders(user.id);
        alert(`Reorder placed successfully! New order #${result.order.id} has been created for ${quantity}kg.`);
      } else {
        alert(result.error || 'Failed to place reorder');
      }
    } catch (error) {
      console.error('Error placing reorder:', error);
      alert('Error placing reorder. Please try again.');
    }
  };

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId,
          quantity
        })
      });

      const result = await response.json();
      if (result.success) {
        fetchCart(user.id); // Refresh cart
        alert(`${quantity}kg added to cart!`);
        setSelectedQuantity(prev => ({ ...prev, [productId]: 1 })); // Reset quantity
      } else {
        alert(result.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding to cart');
    }
  };

  const updateCartQuantity = async (productId: number, quantity: number) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId,
          quantity
        })
      });

      const result = await response.json();
      if (result.success) {
        fetchCart(user.id); // Refresh cart
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeFromCart = async (productId: number) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId
        })
      });

      const result = await response.json();
      if (result.success) {
        fetchCart(user.id); // Refresh cart
        alert('Product removed from cart!');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Error removing from cart');
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const tabs = [
    { id: 'dashboard', name: t('navigation.dashboard'), icon: BarChart3 },
    { id: 'browse', name: t('navigation.browseProducts'), icon: ShoppingCart },
    { id: 'order-requests', name: t('navigation.orderRequests'), icon: ClipboardList },
    { id: 'my-orders', name: t('navigation.myOrders'), icon: Package },
    { id: 'cart', name: t('navigation.cart'), icon: ShoppingCart },
    { id: 'suppliers', name: t('navigation.suppliers'), icon: Handshake },
    { id: 'profile', name: t('navigation.profile'), icon: User },
    // { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.seller_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <h1 className="ml-3 text-xl font-semibold text-gray-900">AgriBridge</h1>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Buyer</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <span className="text-sm text-gray-600">{t('farmer.welcome')}, {user?.name}</span>
              <button onClick={() => { localStorage.removeItem('user'); router.push('/'); }} className="text-sm text-white hover:text-gray-700 px-4 py-1 bg-red-400 rounded-lg">
                Logout
              </button>
            </div>
          </div>
          
          {/* Mobile Header */}
          <div className="md:hidden py-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <h1 className="ml-3 text-xl font-semibold text-gray-900">AgriBridge</h1>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Buyer</span>
              </div>
              <div className="flex items-center space-x-2">
                <LanguageSwitcher />
                <button onClick={() => { localStorage.removeItem('user'); router.push('/'); }} className="text-sm text-white hover:text-gray-700  px-4 py-1 bg-red-400 rounded-lg">
                  Logout
                </button>
              </div>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-600">{t('farmer.welcome')}, {user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Mobile Tab Navigation */}
          <div className="lg:hidden">
            <div className="bg-white rounded-xl shadow-sm p-2 mb-4">
              <div className="flex overflow-x-auto space-x-2 pb-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-shrink-0 flex items-center px-3 py-2 rounded-lg transition-all text-sm ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      <span className="font-medium whitespace-nowrap">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-64">
            <nav className="bg-white rounded-2xl shadow-sm p-4">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 mr-3" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.quickStats')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('dashboard.availableProducts')}</span>
                  <span className="font-semibold text-blue-600">{products.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('dashboard.categories')}</span>
                  <span className="font-semibold text-purple-600">
                    {new Set(products.map(p => p.category)).size}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('dashboard.suppliers')}</span>
                  <span className="font-semibold text-blue-600">
                    {new Set(products.map(p => p.seller_name)).size}
                  </span>
                </div>
                {userStats?.stats && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('dashboard.myRating')}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-semibold text-yellow-600">
                        {userStats.stats.averageRating > 0 ? userStats.stats.averageRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Widget */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('common.search')} {t('dashboard.products')}</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={t('placeholders.searchProducts')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                />
                <button 
                  onClick={() => setActiveTab('browse')}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('common.search')}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Quick Stats */}
          <div className="lg:hidden grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{products.length}</div>
              <div className="text-xs text-gray-600">{t('dashboard.products')}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{new Set(products.map(p => p.category)).size}</div>
              <div className="text-xs text-gray-600">{t('dashboard.categories')}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-lg font-bold text-blue-600">{new Set(products.map(p => p.seller_name)).size}</div>
              <div className="text-xs text-gray-600">{t('dashboard.suppliers')}</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Order Requests Tab */}
            {activeTab === 'order-requests' && user && (
              <OrderRequests userId={user.id} />
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && user && (
              <div className="space-y-6">
                {/* User Rating Display */}
                {userStats && (
                  <UserRatingDisplay 
                    stats={userStats.stats} 
                    userType="buyer" 
                    isLoading={statsLoading}
                  />
                )}

                <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
                  <div className="flex items-center mb-6">
                    <User className="w-6 h-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">{t('labels.information')} {t('navigation.profile')}</h2>
                  </div>

                  <div className="max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.fullName')}</label>
                        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                          {user.name}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.role')}</label>
                        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 font-medium capitalize">
                          {user.role}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.emailAddress')}</label>
                        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                          {user.email}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('forms.phoneNumber')}</label>
                        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                          {user.phone_number || t('forms.notProvided')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                        {t('forms.editProfile')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Received Reviews Section */}
                {receivedRatings.length > 0 && (
                  <RatingDisplay
                    ratings={receivedRatings}
                    title="Reviews from Farmers"
                    emptyMessage="No reviews from farmers yet."
                  />
                )}
              </div>
            )}

            {/* Browse Products Tab */}
            {activeTab === 'browse' && (
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
                    {filteredProducts.map((product) => (
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
            )}

            {/* My Orders Tab */}
            {activeTab === 'my-orders' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <Package className="w-6 h-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
                  </div>
                  <div className="text-sm text-gray-600">
                    {orders.length} order{orders.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('status.noOrdersYet')}</h3>
                    <p className="text-gray-500 mb-4">{t('status.yourOrdersWillAppear')}</p>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      {t('status.startShopping')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              {order.product?.photos && order.product.photos.length > 0 ? (
                                <img
                                  src={order.product.photos[0]}
                                  alt={order.product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{order.product?.name}</h3>
                              <p className="text-sm text-gray-600">Order #{order.id}</p>
                              <p className="text-sm text-gray-600">
                                Ordered on {new Date(order.order_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-700">Seller</p>
                            <p className="font-medium text-gray-900">{order.seller?.name}</p>
                            <p className="text-sm text-gray-700">{order.seller?.phone_number}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-700">Quantity & Price</p>
                            <p className="font-medium text-red-400">{order.quantity}kg × ₹{order.unit_price}</p>
                            <p className="text-lg font-semibold text-blue-600">₹{order.total_price}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-700">Delivery Address</p>
                            <p className="text-sm text-gray-700">{order.delivery_address}</p>
                          </div>
                        </div>

                        {order.notes && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600">Special Instructions</p>
                            <p className="text-sm text-gray-700">{order.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {/* Rating button for all order statuses */}
                          <button 
                            onClick={() => handleRateOrder(order)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              orderRatings[order.id] 
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {orderRatings[order.id] ? 'Update Rating' : 'Rate & Review'}
                          </button>
                          
                          {/* Reorder button - only for delivered orders */}
                          {order.status === 'delivered' && (
                            <button 
                              onClick={() => handleReorder(order)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                            >
                              Reorder
                            </button>
                          )}
                          
                          {/* Order status specific actions */}
                          {(order.status === 'pending' || order.status === 'confirmed') && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                            >
                              Cancel Order
                            </button>
                          )}
                          
                          {/* Contact Seller - Functional dialer redirect */}
                          <button 
                            onClick={() => {
                              if (order.seller?.phone_number) {
                                window.open(`tel:${order.seller.phone_number}`, '_self');
                              }
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-1"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Contact Seller</span>
                          </button>
                        </div>

                        {/* Display existing rating if available */}
                        {orderRatings[order.id] && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-yellow-800">Your Rating:</span>
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= orderRatings[order.id].rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-yellow-700">
                                {orderRatings[order.id].rating}/5
                              </span>
                            </div>
                            {orderRatings[order.id].review && (
                              <p className="text-sm text-yellow-700 mt-1">
                                "{orderRatings[order.id].review}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* Display seller's rating for this buyer if available */}
                        {(() => {
                          const sellerRating = receivedRatings.find(r => r.order?.id === order.id);
                          return sellerRating ? (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium text-blue-800">Seller's Rating for You:</span>
                                <div className="flex space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= sellerRating.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-blue-700">
                                  {sellerRating.rating}/5
                                </span>
                              </div>
                              {sellerRating.review && (
                                <p className="text-sm text-blue-700 mt-1">
                                  "{sellerRating.review}"
                                </p>
                              )}
                            </div>
                          ) : null;
                        })()}

                        {/* Order Timeline */}
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className={`flex items-center ${order.status === 'pending' || order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                              Order Placed
                            </div>
                            <div className={`flex items-center ${order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                              Confirmed
                            </div>
                            <div className={`flex items-center ${order.status === 'shipped' || order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                              Shipped
                            </div>
                            <div className={`flex items-center ${order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                              Delivered
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cart Tab */}
            {activeTab === 'cart' && (
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

                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('status.yourCartIsEmpty')}</h3>
                    <p className="text-gray-500 mb-4">{t('status.browseAndAdd')}</p>
                    <button
                      onClick={() => setActiveTab('browse')}
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
                    
                    {/* Cart Summary */}
                    <div className="border-t pt-4 mt-6  text-gray-700">
                      <div className="space-y-2 mb-4">
                        {cartItems.map(item => {
                          const itemTotal = (item.cart_quantity >= 10 ? item.price_multiple : item.price_single) * item.cart_quantity;
                          return (
                            <div key={item.id} className="flex justify-between text-sm  text-grey-700">
                              <span className=' text-gray-700'>{item.name} × {item.cart_quantity}kg</span>
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
            )}

            {/* Suppliers Tab */}
            {activeTab === 'suppliers' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <Handshake className="w-6 h-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">Our Suppliers</h2>
                  </div>
                  <div className="text-sm text-gray-600">
                    {suppliers.length} Active Farmers
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading suppliers...</div>
                  </div>
                ) : suppliers.length === 0 ? (
                  <div className="text-center py-12">
                    <Handshake className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
                    <p className="text-gray-500">Check back later for new farmers joining our platform</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suppliers.map((supplier) => (
                      <div key={supplier.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        {/* Supplier Header */}
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="ml-4">
                            <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                            <p className="text-sm text-gray-600">Farmer since {supplier.joinedDate}</p>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="w-4 h-4 mr-2">📧</span>
                            <a 
                              href={`mailto:${supplier.email}`}
                              className="truncate hover:text-blue-600 transition-colors"
                              title={`Email ${supplier.name}`}
                            >
                              {supplier.email}
                            </a>
                          </div>
                          {supplier.phone_number && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="w-4 h-4 mr-2">📱</span>
                              <a 
                                href={`tel:${supplier.phone_number}`}
                                className="hover:text-blue-600 transition-colors"
                                title={`Call ${supplier.name}`}
                              >
                                {supplier.phone_number}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">{supplier.productCount}</div>
                            <div className="text-xs text-gray-600">Products</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">{supplier.totalStock}kg</div>
                            <div className="text-xs text-gray-600">Total Stock</div>
                          </div>
                        </div>

                        {/* Categories */}
                        {supplier.categories.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs text-gray-600 mb-2">Specializes in:</div>
                            <div className="flex flex-wrap gap-1">
                              {supplier.categories.slice(0, 3).map((category: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize"
                                >
                                  {category}
                                </span>
                              ))}
                              {supplier.categories.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                  +{supplier.categories.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Average Price */}
                        {supplier.avgPrice > 0 && (
                          <div className="mb-4">
                            <div className="text-xs text-gray-600">Average Price:</div>
                            <div className="text-sm font-semibold text-gray-900">₹{supplier.avgPrice}/kg</div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setSearchTerm(supplier.name);
                              setActiveTab('browse');
                            }}
                            className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                          >
                            View Products
                          </button>
                          {supplier.phone_number ? (
                            <a
                              href={`tel:${supplier.phone_number}`}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
                              title={`Call ${supplier.name}`}
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          ) : (
                            <button 
                              disabled
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center"
                              title="Phone number not available"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && user && (
              <Dashboard 
                userType="buyer"
                userId={user.id}
                products={products}
                orders={orders}
                userStats={userStats}
                userLocation={userLocation}
              />
            )}
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          isOpen={showProductDetails}
          onClose={() => {
            setShowProductDetails(false);
            setSelectedProduct(null);
          }}
          onAddToCart={addToCart}
          userRole="buyer"
          currentUserId={user?.id}
        />
      )}
      {/* Reorder Modal */}
      {selectedOrderForReorder && (
        <ReorderModal
          isOpen={showReorderModal}
          onClose={() => {
            setShowReorderModal(false);
            setSelectedOrderForReorder(null);
          }}
          order={selectedOrderForReorder}
          onConfirmReorder={handleConfirmReorder}
        />
      )}

      {/* Rating Modal */}
      {selectedOrderForRating && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedOrderForRating(null);
          }}
          order={selectedOrderForRating}
          currentUserId={user?.id || 0}
          currentUserType="buyer"
          onRatingSubmit={handleRatingSubmit}
          existingRating={orderRatings[selectedOrderForRating.id]}
        />
      )}

      {/* Payment Portal */}
      <PaymentPortal
        isOpen={showPaymentPortal}
        onClose={() => setShowPaymentPortal(false)}
        cartItems={cartItems}
        userId={user?.id || 0}
        user={user ? { name: user.name, email: user.email, phone_number: user.phone_number } : undefined}
        onPaymentSuccess={() => {
          fetchCart(user?.id || 0);
          fetchOrders(user?.id || 0);
          setShowPaymentPortal(false);
        }}
      />
    </div>
  );
}
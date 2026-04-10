'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { 
  BarChart3, 
  Wheat, 
  Package, 
  TrendingUp, 
  User, 
  Settings, 
  Plus,
  Sun,
  ArrowUp,
  MapPin,
  Calculator,
  Tag,
  Sprout,
  ImageIcon,
  Star,
  Award,
  ClipboardList,
  Phone
} from 'lucide-react';
import PhotoUpload from '@/components/PhotoUpload';
import EditProduct from '@/components/EditProduct';
import ProductDetails from '@/components/ProductDetails';
import PriceDisplay from '@/components/PriceDisplay';
import RatingModal from '@/components/RatingModal';
import RatingDisplay from '@/components/RatingDisplay';
import UserRatingDisplay from '@/components/UserRatingDisplay';
import SubsidiesPrograms from '@/components/SubsidiesPrograms';
import FarmerOrderRequests from '@/components/FarmerOrderRequests';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Dashboard from '@/components/Dashboard';
import { usePricePrediction } from '@/lib/hooks/usePricePrediction';
import { matchState, getStateSuggestions } from '@/lib/utils/state-matcher';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  role: string;
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
  photos?: string[];
}

export default function FarmerDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [newProductId, setNewProductId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [productName, setProductName] = useState('');
  const [locationState, setLocationState] = useState('');
  const [stateSuggestions, setStateSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number, address?: string, state?: string} | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<any>(null);
  const [orderRatings, setOrderRatings] = useState<{[key: number]: any}>({});
  const [receivedRatings, setReceivedRatings] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Price prediction hook
  const { prediction, loading: priceLoading, error: priceError, searchPrices } = usePricePrediction();

  useEffect(() => {
    // Get user from localStorage (runs only client-side after mount)
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.replace('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchProducts(parsedUser.id);
    fetchOrders(parsedUser.id);
    fetchReceivedRatings(parsedUser.id);
    fetchUserStats(parsedUser.id);

    // Get user location for state-based price prediction
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          try {
            // Use reverse geocoding to get state information
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
              
              // Auto-populate state field if it's empty
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

  const fetchProducts = async (sellerId: number) => {
    try {
      const response = await fetch(`/api/products?seller_id=${sellerId}`);
      const data = await response.json();
      
      // Add seller phone to each product for ProductDetails component
      const productsWithPhone = (data.products || []).map((product: any) => ({
        ...product,
        seller_phone: user?.phone_number || 'Not provided'
      }));
      
      setProducts(productsWithPhone);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (sellerId: number) => {
    try {
      const response = await fetch(`/api/orders?userId=${sellerId}&userType=seller`);
      const data = await response.json();
      const ordersData = data.orders || [];
      setOrders(ordersData);
      
      // Fetch ratings for each order
      const ratingsMap: {[key: number]: any} = {};
      for (const order of ordersData) {
        try {
          const ratingsResponse = await fetch(`/api/ratings?orderId=${order.id}`);
          const ratingsData = await ratingsResponse.json();
          const sellerRating = ratingsData.ratings?.find((r: any) => r.rater_id === sellerId);
          if (sellerRating) {
            ratingsMap[order.id] = sellerRating;
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
      const response = await fetch(`/api/ratings?userId=${userId}&userType=seller`);
      const data = await response.json();
      setReceivedRatings(data.ratings || []);
    } catch (error) {
      console.error('Error fetching received ratings:', error);
    }
  };

  const fetchUserStats = async (userId: number) => {
    setStatsLoading(true);
    try {
      const response = await fetch(`/api/user-stats?userId=${userId}&userType=seller`);
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', name: t('navigation.dashboard'), icon: BarChart3 },
    { id: 'my-crops', name: t('farmer.myCrops'), icon: Wheat },
    { id: 'add-product', name: t('farmer.addProduct'), icon: Plus },
    { id: 'order-requests', name: t('navigation.orderRequests'), icon: ClipboardList },
    { id: 'orders', name: t('navigation.myOrders'), icon: Package },
    { id: 'reviews', name: t('farmer.receivedReviews'), icon: Star },
    { id: 'subsidies', name: t('subsidies.title'), icon: Award },
    { id: 'profile', name: t('navigation.profile'), icon: User },
    // { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

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
        
        // If photos are selected, upload them automatically
        if (selectedPhotos.length > 0) {
          const uploadedUrls: string[] = [];
          
          for (let i = 0; i < selectedPhotos.length; i++) {
            const file = selectedPhotos[i];
            
            // Create FormData for server-side upload
            const photoFormData = new FormData();
            photoFormData.append('file', file);
            photoFormData.append('userId', user.id.toString());
            photoFormData.append('productId', productId.toString());

            // Upload via API route
            const uploadResponse = await fetch('/api/upload-photo', {
              method: 'POST',
              body: photoFormData
            });

            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json();
              uploadedUrls.push(uploadResult.url);
            }
          }

          // Update product with photo URLs
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
        
        // Refresh products list and orders, then reset form
        fetchProducts(user.id);
        fetchOrders(user.id);
        setActiveTab('my-crops');
        (e.target as HTMLFormElement).reset();
        setSelectedPhotos([]);
        setNewProductId(null);
        setProductName(''); // Reset product name state
        setLocationState(''); // Reset location state
        setShowSuggestions(false); // Hide suggestions
        setStateSuggestions([]); // Clear suggestions
        
        toast.success('Product added successfully!');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error adding product. Please try again.');
    }
  };

  const handlePhotosUploaded = async (photoUrls: string[]) => {
    if (!newProductId) return;

    try {
      const response = await fetch('/api/upload-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: newProductId,
          photoUrls
        })
      });

      if (response.ok) {
        // Refresh products list and reset form
        if (user) {
          fetchProducts(user.id);
        }
        setActiveTab('my-crops');
        setNewProductId(null);
        setSelectedPhotos([]);
        toast.success('Product and photos uploaded successfully!');
      }
    } catch (error) {
      console.error('Error updating product photos:', error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setShowProductDetails(true);
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    // Ensure seller_phone is preserved from the original product
    const productWithPhone = {
      ...updatedProduct,
      seller_phone: user?.phone_number || 'Not provided'
    };
    
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? productWithPhone : p));
    setShowEditModal(false);
    setEditingProduct(null);
    // Refresh orders in case stock changed
    if (user) {
      fetchOrders(user.id);
    }
  };

  const handleDeleteProduct = (productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setShowEditModal(false);
    setEditingProduct(null);
    // Refresh orders
    if (user) {
      fetchOrders(user.id);
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
        toast.success(`Order ${status} successfully!`);
      } else {
        toast.error(`Failed to ${status} order: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status');
    }
  };

  const handleRateBuyer = (order: any) => {
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
            ratedId: selectedOrderForRating.buyer.id,
            raterType: 'seller',
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
        toast.success(existingRating ? 'Rating updated successfully!' : 'Rating submitted successfully!');
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
          toast.error(result.error || 'Failed to submit rating');
        }
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Error submitting rating. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <h1 className="ml-3 text-xl font-semibold text-gray-900">AgriBridge</h1>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Farmer</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <span className="text-sm text-gray-600">{t('farmer.welcome')}, {user?.name}</span>
              <button onClick={() => { localStorage.removeItem('user'); router.push('/'); }} className="text-sm text-white hover:text-gray-700  px-4 py-1 bg-red-400 rounded-lg">
                Logout
              </button>
            </div>
          </div>
          
          {/* Mobile Header */}
          <div className="md:hidden py-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <h1 className="ml-3 text-xl font-semibold text-gray-900">AgriBridge</h1>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Farmer</span>
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
                          ? 'bg-green-100 text-green-700'
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
                          ? 'bg-green-100 text-green-700 border-l-4 border-green-500'
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
                  <span className="text-gray-600">{t('dashboard.activeListing')}</span>
                  <span className="font-semibold text-green-600">{products.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('dashboard.totalStock')}</span>
                  <span className="font-semibold text-orange-600">
                    {products.reduce((sum, p) => sum + p.quantity, 0)}kg
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('dashboard.avgPrice')}</span>
                  <span className="font-semibold text-green-600">
                    ₹{products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.price_single, 0) / products.length) : 0}/kg
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
          </div>

          {/* Mobile Quick Stats */}
          <div className="lg:hidden grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{products.length}</div>
              <div className="text-xs text-gray-600">{t('dashboard.activeListing')}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{products.reduce((sum, p) => sum + p.quantity, 0)}</div>
              <div className="text-xs text-gray-600">{t('dashboard.totalStock')} (kg)</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-lg font-bold text-green-600">
                ₹{products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.price_single, 0) / products.length) : 0}
              </div>
              <div className="text-xs text-gray-600">{t('dashboard.avgPrice')}/kg</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && user && (
              <div className="space-y-6">
                {/* User Rating Display */}
                {userStats && (
                  <UserRatingDisplay 
                    stats={userStats.stats} 
                    userType="seller" 
                    isLoading={statsLoading}
                  />
                )}

                <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
                  <div className="flex items-center mb-6">
                    <User className="w-6 h-6 text-green-600 mr-3" />
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
                        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 font-medium capitalize">
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
                      <button className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
                        {t('forms.editProfile')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Requests Tab */}
            {activeTab === 'order-requests' && user && (
              <FarmerOrderRequests userId={user.id} />
            )}

            {/* Subsidies & Programs Tab */}
            {activeTab === 'subsidies' && (
              <SubsidiesPrograms />
            )}

            {/* Add Product Form */}
            {activeTab === 'add-product' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center mb-6">
                    <Plus className="w-6 h-6 text-green-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">{t('farmer.addProduct')}</h2>
                  </div>

                  <form onSubmit={handleAddProduct} className="space-y-6">
                    {/* Product Name */}
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

                    {/* Category */}
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

                    {/* Quantity */}
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

                    {/* Pricing */}
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

                    {/* Location/State */}
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
                          
                          console.log('🏛️ State input changed:', inputValue);
                          
                          // Get suggestions for dropdown
                          if (inputValue.length > 0) {
                            const suggestions = getStateSuggestions(inputValue);
                            setStateSuggestions(suggestions);
                            setShowSuggestions(true);
                          } else {
                            setShowSuggestions(false);
                          }
                          
                          // Smart state matching for price prediction
                          const matchedState = matchState(inputValue);
                          const stateToUse = matchedState || inputValue || userLocation?.state;
                          
                          console.log('🧠 Smart state matching:', {
                            input: inputValue,
                            matched: matchedState,
                            using: stateToUse,
                            productName: productName
                          });
                          
                          // Trigger price prediction update when state changes
                          if (productName) {
                            console.log('🚀 Triggering price search with:', { productName, stateToUse });
                            searchPrices(productName, stateToUse);
                          } else {
                            console.log('⚠️ No product name, skipping price search');
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
                          // Delay hiding suggestions to allow clicking
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                        placeholder={t('placeholders.stateExample')}
                        autoComplete="off"
                      />
                      
                      {/* State Suggestions Dropdown */}
                      {showSuggestions && stateSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {stateSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setLocationState(suggestion);
                                setShowSuggestions(false);
                                
                                // Trigger price prediction with selected state
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
                      
                      {/* Smart matching indicator */}
                      {locationState && matchState(locationState) && matchState(locationState) !== locationState && (
                        <div className="mt-1 text-xs text-green-600 flex items-center">
                          <span className="mr-1">🧠</span>
                          <span>Smart match: "{matchState(locationState)}"</span>
                        </div>
                      )}
                    </div>

                    {/* Price Prediction Display - Always show when product name exists (never disappear) */}
                    {productName && productName.trim().length >= 2 && (
                      <PriceDisplay 
                        prediction={prediction}
                        loading={priceLoading}
                        error={priceError}
                        productName={productName}
                        stateName={matchState(locationState) || locationState || userLocation?.state}
                        onReload={() => {
                          console.log('🔄 Reloading price prediction for:', { productName, locationState });
                          const matchedState = matchState(locationState);
                          const stateToUse = matchedState || locationState || userLocation?.state;
                          console.log('🎯 Using state for reload:', stateToUse);
                          searchPrices(productName, stateToUse);
                        }}
                      />
                    )}

                    {/* Description */}
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

                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <ImageIcon className="w-4 h-4 inline mr-1" />
                        {t('forms.productPhotos')}
                      </label>
                      <PhotoUpload
                        onPhotosChange={setSelectedPhotos}
                        userId={user?.id}
                        maxPhotos={5}
                      />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                      <button
                        type="submit"
                        className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 transition-colors"
                      >
                        {t('forms.addProduct')}
                      </button>
                      <button
                        type="button"
                        className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        onClick={() => setActiveTab('my-crops')}
                      >
                        {t('forms.cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <Package className="w-6 h-6 text-green-600 mr-3" />
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
                    <p className="text-gray-500">{t('status.ordersWillAppear')}</p>
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
                                {new Date(order.order_date).toLocaleDateString()}
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
                            <p className="text-sm text-gray-700">Buyer</p>
                            <p className="font-medium text-gray-900">{order.buyer?.name}</p>
                            <p className="text-sm text-gray-700">{order.buyer?.phone_number}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-700">Quantity & Price</p>
                            <p className="font-medium text-red-400">{order.quantity}kg × ₹{order.unit_price}</p>
                            <p className="text-lg font-semibold text-green-600">₹{order.total_price}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-700">Delivery Address</p>
                            <p className="text-sm text-gray-700">{order.delivery_address}</p>
                          </div>
                        </div>

                        {order.notes && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-700">Notes</p>
                            <p className="text-sm text-gray-700">{order.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {/* Order status specific actions */}
                          {order.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                              >
                                Confirm Order
                              </button>
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {order.status === 'confirmed' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'shipped')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                            >
                              Mark as Shipped
                            </button>
                          )}
                          {order.status === 'shipped' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                            >
                              Mark as Delivered
                            </button>
                          )}
                          
                          {/* Rating button for all order statuses */}
                          <button 
                            onClick={() => handleRateBuyer(order)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              orderRatings[order.id] 
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {orderRatings[order.id] ? 'Update Rating' : 'Rate Buyer'}
                          </button>
                          
                          {/* Contact Buyer - Functional dialer redirect */}
                          <button 
                            onClick={() => {
                              if (order.buyer?.phone_number) {
                                window.open(`tel:${order.buyer.phone_number}`, '_self');
                              }
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-1"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Contact Buyer</span>
                          </button>
                        </div>

                        {/* Display existing rating if available */}
                        {orderRatings[order.id] && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-yellow-800">Your Rating for Buyer:</span>
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

                        {/* Display buyer's rating for this seller if available */}
                        {(() => {
                          const buyerRating = receivedRatings.find(r => r.order?.id === order.id);
                          return buyerRating ? (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium text-blue-800">Buyer's Rating & Review:</span>
                                <div className="flex space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= buyerRating.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-blue-700">
                                  {buyerRating.rating}/5
                                </span>
                              </div>
                              {buyerRating.review && (
                                <p className="text-sm text-blue-700 mt-1">
                                  "{buyerRating.review}"
                                </p>
                              )}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Received Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <Star className="w-6 h-6 text-green-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">Received Reviews</h2>
                  </div>
                </div>

                <RatingDisplay
                  ratings={receivedRatings}
                  title="Reviews from Buyers"
                  emptyMessage="No reviews yet. Complete some orders to receive reviews from buyers."
                />
              </div>
            )}

            {/* My Crops Tab */}
            {activeTab === 'my-crops' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <Wheat className="w-6 h-6 text-green-600 mr-3" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">My Crops</h2>
                      <p className="text-sm text-gray-600 mt-1">Click on any product to see how buyers view it</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('add-product')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('farmer.addProduct')}
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">{t('messages.loadingProducts')}</div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Wheat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('status.noProductsYet')}</h3>
                    <p className="text-gray-500 mb-4">{t('status.startByAdding')}</p>
                    <button
                      onClick={() => setActiveTab('add-product')}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                      {t('status.addYourFirstProduct')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
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
            )}

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && user && (
              <Dashboard 
                userType="farmer"
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
          currentUserType="seller"
          onRatingSubmit={handleRatingSubmit}
          existingRating={orderRatings[selectedOrderForRating.id]}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProduct
          product={editingProduct}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
          userId={user?.id || 0}
        />
      )}

      {/* Product Details Modal - What Buyers See */}
      {viewingProduct && (
        <ProductDetails
          product={viewingProduct}
          isOpen={showProductDetails}
          onClose={() => {
            setShowProductDetails(false);
            setViewingProduct(null);
          }}
          userRole="farmer"
          currentUserId={user?.id}
        />
      )}
    </div>
  );
}
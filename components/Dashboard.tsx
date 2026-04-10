'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  Star, 
  Users, 
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  Eye,
  Sunrise,
  Sunset,
  Thermometer,
  Activity,
  DollarSign,
  Target,
  Clock,
  MapPin,
  CheckCircle,
  BarChart3,
  ArrowUp,
  Briefcase,
  Bell,
  FileText,
  Truck
} from 'lucide-react';

interface WeatherData {
  location: string;
  region?: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  sunrise: string;
  sunset: string;
  pressure: number;
  visibility: number;
  uvIndex: number;
  feelsLike: number;
  isDemo?: boolean;
}

interface DashboardProps {
  userType: 'farmer' | 'buyer';
  userId: number;
  products?: any[];
  orders?: any[];
  userStats?: any;
  userLocation?: {latitude: number, longitude: number, address?: string, state?: string} | null;
}

export default function Dashboard({ userType, userId, products = [], orders = [], userStats, userLocation }: DashboardProps) {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [liveStats, setLiveStats] = useState<any>(userStats || null);
  const [liveOrders, setLiveOrders] = useState<any[]>(orders);

  useEffect(() => {
    if (userId) {
      fetchLiveStats();
      fetchLiveOrders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchLiveStats = async () => {
    try {
      const res = await fetch(`/api/user-stats?userId=${userId}&userType=${userType === 'farmer' ? 'seller' : 'buyer'}`);
      const data = await res.json();
      setLiveStats(data);
    } catch {}
  };

  const fetchLiveOrders = async () => {
    try {
      const res = await fetch(`/api/orders?userId=${userId}&userType=${userType === 'farmer' ? 'seller' : 'buyer'}`);
      const data = await res.json();
      setLiveOrders(data.orders || []);
    } catch {}
  };

  useEffect(() => {
    if (userId) fetchRecentActivity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, liveOrders.length, products.length]);

  const fetchRecentActivity = async () => {
    const activities: any[] = [];

    // Add order activities (last 4 orders)
    liveOrders.slice(0, 4).forEach((order: any) => {
      const isIncoming = userType === 'farmer';
      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        icon: isIncoming ? Truck : ShoppingCart,
        color: order.status === 'delivered' ? 'green' : order.status === 'pending' ? 'yellow' : 'blue',
        title: isIncoming
          ? `Order #${order.id} from ${order.buyer?.name || 'Buyer'}`
          : `Order #${order.id} — ${order.product?.name || 'Product'}`,
        subtitle: `Status: ${order.status}  •  ₹${order.total_amount || 0}`,
        time: order.created_at,
      });
    });

    // Add product activities for farmers
    if (userType === 'farmer') {
      products.slice(0, 2).forEach((product: any) => {
        activities.push({
          id: `product-${product.id}`,
          type: 'product',
          icon: Package,
          color: 'green',
          title: `Listed: ${product.name}`,
          subtitle: `₹${product.price_single}/kg  •  ${product.quantity}kg available`,
          time: product.created_at,
        });
      });
    }

    // Fetch job activity
    try {
      const endpoint = userType === 'farmer'
        ? `/api/jobs?lister_id=${userId}`
        : `/api/jobs?worker_id=${userId}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      const jobItems = userType === 'farmer' ? (data.jobs || []) : (data.applications || []);
      jobItems.slice(0, 2).forEach((item: any) => {
        const job = userType === 'farmer' ? item : item.jobs;
        if (!job) return;
        activities.push({
          id: `job-${item.id}`,
          type: 'job',
          icon: Briefcase,
          color: 'purple',
          title: userType === 'farmer' ? `Job posted: ${job.title}` : `Applied: ${job.title}`,
          subtitle: `${job.location}  •  ₹${job.fixed_pay}/day`,
          time: item.applied_at || item.created_at,
        });
      });
    } catch {}

    // Sort by time descending, take top 4
    activities.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
    setRecentActivity(activities.slice(0, 4));
  };

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [userLocation]);

  const fetchWeather = async () => {
    try {
      setWeatherLoading(true);
      let url = '/api/weather';
      
      if (userLocation) {
        url += `?lat=${userLocation.latitude}&lon=${userLocation.longitude}`;
        console.log('Fetching weather for coordinates:', userLocation.latitude, userLocation.longitude);
      } else {
        console.log('No user location available, using default location');
      }

      console.log('Weather API URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Weather API response:', data);
      
      if (data.success) {
        setWeather(data.weather);
        console.log('Weather data loaded:', data.weather.location, data.weather.region, data.weather.isDemo ? '(Demo)' : '(Real)');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const getWeatherIcon = (iconCode: string) => {
    switch (iconCode.substring(0, 2)) {
      case '01': return <Sun className="w-8 h-8 text-yellow-500" />;
      case '02': case '03': case '04': return <Cloud className="w-8 h-8 text-gray-500" />;
      case '09': case '10': return <CloudRain className="w-8 h-8 text-blue-500" />;
      default: return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  // Calculate statistics
  const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const avgPrice = products.length > 0 ? products.reduce((sum, p) => sum + (p.price_single || 0), 0) / products.length : 0;
  const activeListings = products.filter(p => p.status === 'active').length;
  const completedOrders = liveOrders.filter(o => o.status === 'delivered').length;
  const pendingOrders = liveOrders.filter(o => o.status === 'pending').length;
  const acceptedOrders = liveOrders.filter(o => o.status !== 'cancelled').length;
  const totalRevenue = liveOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total_price || o.total_amount || 0), 0);
  const avgRating = liveStats?.stats?.averageRating || 0;
  const farmerRevenueGoal = liveStats?.stats?.revenueGoal || 0;

  // This month's buyer stats
  const now = new Date();
  const thisMonthOrders = liveOrders.filter(o => {
    const d = new Date(o.created_at || o.order_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthSpend = thisMonthOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total_price || o.total_amount || 0), 0);

  // Progress calculations
  const stockProgress = Math.min((totalStock / 1000) * 100, 100);
  const ratingProgress = (avgRating / 5) * 100;
  const orderCompletionRate = acceptedOrders > 0 ? (completedOrders / acceptedOrders) * 100 : 0;
  const revenueProgress = farmerRevenueGoal > 0 ? Math.min((totalRevenue / farmerRevenueGoal) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-green-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}! 👋
            </h1>
            <p className="text-green-100">
              {userType === 'farmer' 
                ? "Ready to manage your farm and connect with buyers?" 
                : "Ready to discover fresh produce from local farmers?"
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-100">
              {currentTime.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-lg font-semibold">
              {currentTime.toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userType === 'farmer' ? (
          <>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Listings</p>
                  <p className="text-2xl font-bold text-gray-900">{activeListings}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    +{Math.round(Math.random() * 10)}% this week
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStock}kg</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stockProgress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Price</p>
                  <p className="text-2xl font-bold text-gray-900">₹{Math.round(avgPrice)}</p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Market rate
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}/5</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${ratingProgress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{liveOrders.length}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    +{Math.round(Math.random() * 15)}% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
                  <p className="text-xs text-green-600">
                    {liveOrders.length > 0 ? Math.round((completedOrders / liveOrders.length) * 100) : 0}% success rate
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
                  <p className="text-xs text-orange-600">
                    Awaiting confirmation
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">My Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}/5</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${ratingProgress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Weather and Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Widget */}
        <div className="bg-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Today's Weather</h3>
            <MapPin className="w-5 h-5 text-blue-200" />
          </div>
          
          {weatherLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          ) : weather ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold">{weather.temperature}°C</p>
                  <p className="text-blue-200 capitalize">{weather.description}</p>
                  <p className="text-sm text-blue-200">
                    {weather.location}
                    {weather.region && weather.region !== weather.location && (
                      <span className="text-blue-300"> • {weather.region}</span>
                    )}
                  </p>
                </div>
                {getWeatherIcon(weather.icon)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Thermometer className="w-4 h-4 mr-2 text-blue-200" />
                  <span>Feels {weather.feelsLike}°C</span>
                </div>
                <div className="flex items-center">
                  <Droplets className="w-4 h-4 mr-2 text-blue-200" />
                  <span>{weather.humidity}% humidity</span>
                </div>
                <div className="flex items-center">
                  <Wind className="w-4 h-4 mr-2 text-blue-200" />
                  <span>{weather.windSpeed} km/h</span>
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-blue-200" />
                  <span>{weather.visibility} km</span>
                </div>
              </div>
              
              <div className="flex justify-between mt-4 pt-4 border-t border-blue-400">
                <div className="flex items-center text-sm">
                  <Sunrise className="w-4 h-4 mr-1 text-yellow-300" />
                  <span>{weather.sunrise}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Sunset className="w-4 h-4 mr-1 text-orange-300" />
                  <span>{weather.sunset}</span>
                </div>
              </div>
              
              {weather.isDemo && (
                <p className="text-xs text-blue-200 mt-2 opacity-75">
                  * Demo data - Please check your OpenWeather API key configuration
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-blue-200">Weather data unavailable</p>
            </div>
          )}
        </div>

        {/* Performance / Analytics */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          {userType === 'farmer' ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Performance</h3>
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Revenue</span>
                    <span className="font-medium text-gray-700">
                      ₹{totalRevenue.toLocaleString()}
                      {farmerRevenueGoal > 0 && <span className="text-gray-400"> / ₹{farmerRevenueGoal.toLocaleString()}</span>}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all duration-1000"
                      style={{ width: farmerRevenueGoal > 0 ? `${revenueProgress}%` : '100%' }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {farmerRevenueGoal > 0 ? `${Math.round(revenueProgress)}% of revenue goal` : 'Set a revenue goal in your profile'}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Orders Completed</span>
                    <span className="font-medium text-gray-700">{completedOrders} / {acceptedOrders}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${orderCompletionRate}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(orderCompletionRate)}% completion rate</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Customer Satisfaction</span>
                    <span className="font-medium text-gray-700">{avgRating.toFixed(1)}/5.0</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-yellow-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${ratingProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Purchase Analytics</h3>
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">This Month's Orders</p>
                    <p className="text-2xl font-bold text-blue-700">{thisMonthOrders.length}</p>
                    <p className="text-xs text-gray-500 mt-1">{liveOrders.length} total all time</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">This Month's Spend</p>
                    <p className="text-2xl font-bold text-green-700">₹{thisMonthSpend.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {now.toLocaleString('en-IN', { month: 'long' })}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Orders Received</span>
                    <span className="font-medium text-gray-700">{completedOrders} / {liveOrders.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${liveOrders.length > 0 ? (completedOrders / liveOrders.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {liveOrders.length > 0 ? Math.round((completedOrders / liveOrders.length) * 100) : 0}% delivery rate
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">My Rating</span>
                    <span className="font-medium text-gray-700">{avgRating.toFixed(1)}/5.0</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-yellow-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${ratingProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          
          <div className="space-y-3">
            {userType === 'farmer' ? (
              <>
                <button onClick={() => router.push('/dashboard/farmer/add-product')} className="w-full flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                  <Package className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Add New Product</p>
                    <p className="text-xs text-gray-500">List fresh produce</p>
                  </div>
                </button>
                <button onClick={() => router.push('/dashboard/farmer/orders')} className="w-full flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                  <Truck className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Manage Orders</p>
                    <p className="text-xs text-gray-500">View & update order status</p>
                  </div>
                </button>
                <button onClick={() => router.push('/dashboard/farmer/order-requests')} className="w-full flex items-center p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
                  <FileText className="w-5 h-5 text-orange-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Order Requests</p>
                    <p className="text-xs text-gray-500">View buyer requests</p>
                  </div>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => router.push('/dashboard/buyer/browse')} className="w-full flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                  <ShoppingCart className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Browse Products</p>
                    <p className="text-xs text-gray-500">Find fresh produce</p>
                  </div>
                </button>
                <button onClick={() => router.push('/dashboard/buyer/my-orders')} className="w-full flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                  <Package className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">My Orders</p>
                    <p className="text-xs text-gray-500">Track purchases</p>
                  </div>
                </button>
                <button onClick={() => router.push('/dashboard/buyer/cart')} className="w-full flex items-center p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
                  <ShoppingCart className="w-5 h-5 text-orange-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">My Cart</p>
                    <p className="text-xs text-gray-500">Review & checkout</p>
                  </div>
                </button>
                <button onClick={() => router.push('/dashboard/buyer/suppliers')} className="w-full flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                  <Users className="w-5 h-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Find Suppliers</p>
                    <p className="text-xs text-gray-500">Connect with farmers</p>
                  </div>
                </button>
                <button onClick={() => router.push('/dashboard/buyer/order-requests')} className="w-full flex items-center p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left">
                  <FileText className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Order Requests</p>
                    <p className="text-xs text-gray-500">Request bulk produce</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity and Market Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((item) => {
              const Icon = item.icon;
              const colorMap: Record<string, string> = {
                green: 'bg-green-100 text-green-600',
                blue: 'bg-blue-100 text-blue-600',
                yellow: 'bg-yellow-100 text-yellow-600',
                purple: 'bg-purple-100 text-purple-600',
                orange: 'bg-orange-100 text-orange-600',
              };
              const dotMap: Record<string, string> = {
                green: 'bg-green-500',
                blue: 'bg-blue-500',
                yellow: 'bg-yellow-500',
                purple: 'bg-purple-500',
                orange: 'bg-orange-500',
              };
              return (
                <div key={item.id} className="flex items-center p-3 bg-gray-50 rounded-lg gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[item.color] || colorMap.blue}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${dotMap[item.color] || dotMap.blue}`}></div>
                    <span className="text-xs text-gray-400">
                      {item.time ? new Date(item.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Market Trends */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Market Trends</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">Tomatoes</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">+15%</p>
                <p className="text-xs text-gray-500">₹45/kg</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <TrendingDown className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">Onions</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-red-600">-8%</p>
                <p className="text-xs text-gray-500">₹32/kg</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">Potatoes</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600">+5%</p>
                <p className="text-xs text-gray-500">₹28/kg</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">Carrots</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-yellow-600">+12%</p>
                <p className="text-xs text-gray-500">₹38/kg</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
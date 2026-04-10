'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Handshake, 
  User, 
  ClipboardList,
  Sprout,
  Star
} from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useDashboardData, useProducts, useRatings } from '@/lib/hooks/useDashboardData';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useDashboardData('buyer');
  const { products } = useProducts();
  const { userStats } = useRatings(user?.id, 'buyer');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: t('navigation.dashboard'), icon: BarChart3, path: '/dashboard/buyer/overview' },
    { id: 'browse', name: t('navigation.browseProducts'), icon: ShoppingCart, path: '/dashboard/buyer/browse' },
    { id: 'order-requests', name: t('navigation.orderRequests'), icon: ClipboardList, path: '/dashboard/buyer/order-requests' },
    { id: 'my-orders', name: t('navigation.myOrders'), icon: Package, path: '/dashboard/buyer/my-orders' },
    { id: 'cart', name: t('navigation.cart'), icon: ShoppingCart, path: '/dashboard/buyer/cart' },
    { id: 'suppliers', name: t('navigation.suppliers'), icon: Handshake, path: '/dashboard/buyer/suppliers' },
    { id: 'profile', name: t('navigation.profile'), icon: User, path: '/dashboard/buyer/profile' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

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
              <span className="text-sm text-gray-600">{t('farmer.welcome')}, {user.name}</span>
              <button onClick={handleLogout} className="text-sm text-white hover:text-gray-700 px-4 py-1 bg-red-400 rounded-lg">
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
                <button onClick={handleLogout} className="text-sm text-white hover:text-gray-700 px-4 py-1 bg-red-400 rounded-lg">
                  Logout
                </button>
              </div>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-600">{t('farmer.welcome')}, {user.name}</span>
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
                  const isActive = pathname === tab.path;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => router.push(tab.path)}
                      className={`flex-shrink-0 flex items-center px-3 py-2 rounded-lg transition-all text-sm ${
                        isActive
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
                  const isActive = pathname === tab.path;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => router.push(tab.path)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all ${
                        isActive
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
                    {new Set(products.map((p: any) => p.category)).size}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('dashboard.suppliers')}</span>
                  <span className="font-semibold text-blue-600">
                    {new Set(products.map((p: any) => p.seller_name)).size}
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
                  onClick={() => router.push('/dashboard/buyer/browse')}
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
              <div className="text-2xl font-bold text-purple-600">{new Set(products.map((p: any) => p.category)).size}</div>
              <div className="text-xs text-gray-600">{t('dashboard.categories')}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-lg font-bold text-blue-600">{new Set(products.map((p: any) => p.seller_name)).size}</div>
              <div className="text-xs text-gray-600">{t('dashboard.suppliers')}</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

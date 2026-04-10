'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { Sprout } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: 'buyer' | 'farmer';
  userName?: string;
  tabs: Array<{
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    path: string;
  }>;
  quickStats?: React.ReactNode;
  sidebarWidget?: React.ReactNode;
}

export default function DashboardLayout({
  children,
  userType,
  userName,
  tabs,
  quickStats,
  sidebarWidget
}: DashboardLayoutProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const bgColor = userType === 'farmer' ? 'bg-green-50' : 'bg-blue-50';
  const accentColor = userType === 'farmer' ? 'green' : 'blue';
  const badgeColor = userType === 'farmer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className={`min-h-screen ${bgColor}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className={`w-8 h-8 bg-${accentColor}-600 rounded-full flex items-center justify-center`}>
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <h1 className="ml-3 text-xl font-semibold text-gray-900">AgriBridge</h1>
                <span className={`ml-2 px-2 py-1 ${badgeColor} text-xs rounded-full capitalize`}>
                  {userType}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <span className="text-sm text-gray-600">
                {t('farmer.welcome')}, {userName}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-white hover:text-gray-700 px-4 py-1 bg-red-400 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden py-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className={`w-8 h-8 bg-${accentColor}-600 rounded-full flex items-center justify-center`}>
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <h1 className="ml-3 text-xl font-semibold text-gray-900">AgriBridge</h1>
                <span className={`ml-2 px-2 py-1 ${badgeColor} text-xs rounded-full capitalize`}>
                  {userType}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <LanguageSwitcher />
                <button
                  onClick={handleLogout}
                  className="text-sm text-white hover:text-gray-700 px-4 py-1 bg-red-400 rounded-lg"
                >
                  Logout
                </button>
              </div>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-600">
                {t('farmer.welcome')}, {userName}
              </span>
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
                          ? `bg-${accentColor}-100 text-${accentColor}-700`
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
                          ? `bg-${accentColor}-100 text-${accentColor}-700 border-l-4 border-${accentColor}-500`
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
            {quickStats && (
              <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
                {quickStats}
              </div>
            )}

            {/* Sidebar Widget */}
            {sidebarWidget && (
              <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
                {sidebarWidget}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

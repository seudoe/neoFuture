'use client';

import { useI18n } from '@/lib/i18n/context';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function TestPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Language Switcher */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('auth.appTitle')} - i18n Test
          </h1>
          <LanguageSwitcher />
        </div>

        {/* Test Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Authentication Translations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Login Form</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• {t('auth.login')}</li>
                  <li>• {t('auth.register')}</li>
                  <li>• {t('auth.fullName')}</li>
                  <li>• {t('auth.email')}</li>
                  <li>• {t('auth.phoneNumber')}</li>
                  <li>• {t('auth.password')}</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">User Types</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• {t('auth.iAmA')}</li>
                  <li>• {t('auth.farmer')}</li>
                  <li>• {t('auth.buyer')}</li>
                  <li>• {t('auth.sellProduce')}</li>
                  <li>• {t('auth.buyProduce')}</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Navigation Translations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <span className="text-sm font-medium text-blue-700">
                  {t('navigation.dashboard')}
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <span className="text-sm font-medium text-blue-700">
                  {t('navigation.browseProducts')}
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <span className="text-sm font-medium text-blue-700">
                  {t('navigation.myOrders')}
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <span className="text-sm font-medium text-blue-700">
                  {t('navigation.cart')}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Product Translations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-700 mb-2">Product Fields</h3>
                <ul className="space-y-1 text-sm text-green-600">
                  <li>• {t('product.name')}</li>
                  <li>• {t('product.category')}</li>
                  <li>• {t('product.quantity')}</li>
                  <li>• {t('product.price')}</li>
                  <li>• {t('product.location')}</li>
                  <li>• {t('product.description')}</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-700 mb-2">Categories</h3>
                <ul className="space-y-1 text-sm text-green-600">
                  <li>• {t('product.categories.vegetables')}</li>
                  <li>• {t('product.categories.fruits')}</li>
                  <li>• {t('product.categories.grains')}</li>
                  <li>• {t('product.categories.herbs')}</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Common Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                {t('common.save')}
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                {t('common.cancel')}
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                {t('common.delete')}
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {t('common.edit')}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Switch languages using the globe icon above to see translations in action!
          </p>
          <div className="mt-4">
            <a href="/login" className="text-blue-600 hover:text-blue-800 underline">
              Go to Login Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
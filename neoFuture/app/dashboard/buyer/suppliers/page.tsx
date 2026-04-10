'use client';

import { useI18n } from '@/lib/i18n/context';
import { Handshake, User } from 'lucide-react';
import { useSuppliers } from '@/lib/hooks/useDashboardData';

export default function SuppliersPage() {
  const { t } = useI18n();
  const { suppliers, loading } = useSuppliers();

  return (
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
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                  <p className="text-sm text-gray-600">Farmer since {supplier.joinedDate}</p>
                </div>
              </div>

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

              {supplier.categories && supplier.categories.length > 0 && (
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

              {supplier.avgPrice > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Avg Price:</span> ₹{supplier.avgPrice}/kg
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

# Dashboard Migration Guide

## Overview
This guide explains how the dashboard has been restructured from a single-page tab-based system to a multi-route architecture.

## Structure

### Before:
```
/dashboard/buyer (single page with tabs)
/dashboard/farmer (single page with tabs)
```

### After:
```
/dashboard/buyer/overview - Dashboard overview
/dashboard/buyer/browse - Browse products
/dashboard/buyer/order-requests - Order requests
/dashboard/buyer/my-orders - My orders
/dashboard/buyer/cart - Shopping cart
/dashboard/buyer/suppliers - Suppliers list
/dashboard/buyer/profile - User profile

/dashboard/farmer/overview - Dashboard overview
/dashboard/farmer/my-crops - My crops listing
/dashboard/farmer/add-product - Add new product
/dashboard/farmer/order-requests - Order requests
/dashboard/farmer/orders - My orders
/dashboard/farmer/reviews - Received reviews
/dashboard/farmer/subsidies - Subsidies & programs
/dashboard/farmer/profile - User profile
```

## Shared Utilities Created

### `lib/hooks/useDashboardData.ts`
Contains reusable hooks for:
- `useDashboardData(userType)` - Get current user data
- `useProducts(sellerId?)` - Fetch and manage products
- `useOrders(userId, userType)` - Fetch and manage orders
- `useCart(userId)` - Manage shopping cart
- `useSuppliers()` - Fetch suppliers list
- `useRatings(userId, userType)` - Fetch ratings and stats

### `components/DashboardLayout.tsx`
Shared layout component with:
- Header with user info and logout
- Sidebar navigation (desktop)
- Mobile tab navigation
- Quick stats sidebar
- Consistent styling per user type

## Migration Steps for Each Route

### 1. Import Required Dependencies
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { useDashboardData, useProducts, useOrders, etc. } from '@/lib/hooks/useDashboardData';
// Import necessary components and icons
```

### 2. Use Shared Hooks
```typescript
const { user, loading } = useDashboardData('buyer'); // or 'seller'
const { products, loading: productsLoading, refetch } = useProducts(user?.id);
```

### 3. Extract Tab Content
- Find the corresponding `{activeTab === 'tab-name' && (` block from the original file
- Copy the JSX content inside
- Adapt any `setActiveTab` calls to `router.push` calls

### 4. Handle Navigation
Replace:
```typescript
onClick={() => setActiveTab('browse')}
```

With:
```typescript
onClick={() => router.push('/dashboard/buyer/browse')}
```

## Key Changes

1. **State Management**: Each route manages its own state instead of sharing state in a parent component
2. **Navigation**: Uses Next.js routing instead of React state
3. **Data Fetching**: Uses shared hooks for consistency
4. **Layout**: Wrapped in DashboardLayout for consistent UI

## Example Pattern

See `app/dashboard/buyer/overview/page.tsx` for a simple example.

## TODO

Complete the following route files by extracting content from the original dashboard pages:

### Buyer Routes:
- [ ] browse/page.tsx - Extract from `activeTab === 'browse'` block
- [ ] order-requests/page.tsx - Uses `<OrderRequests userId={user.id} />`
- [ ] my-orders/page.tsx - Extract from `activeTab === 'my-orders'` block
- [ ] cart/page.tsx - Extract from `activeTab === 'cart'` block
- [ ] suppliers/page.tsx - Extract from `activeTab === 'suppliers'` block
- [ ] profile/page.tsx - Extract from `activeTab === 'profile'` block

### Farmer Routes:
- [ ] my-crops/page.tsx - Extract from `activeTab === 'my-crops'` block
- [ ] add-product/page.tsx - Extract from `activeTab === 'add-product'` block
- [ ] order-requests/page.tsx - Uses `<FarmerOrderRequests userId={user.id} />`
- [ ] orders/page.tsx - Extract from `activeTab === 'orders'` block
- [ ] reviews/page.tsx - Extract from `activeTab === 'reviews'` block
- [ ] subsidies/page.tsx - Uses `<SubsidiesPrograms />`
- [ ] profile/page.tsx - Extract from `activeTab === 'profile'` block

## Notes

- The original dashboard files have been updated to redirect to `/overview`
- All modals (ProductDetails, PaymentPortal, RatingModal, etc.) should be managed within each route
- Shared components remain in the `components/` directory
- Each route should handle its own loading states

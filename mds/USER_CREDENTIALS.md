# AgriBridge - User Credentials & Features

## 🚀 Application Overview
AgriBridge is a digital marketplace connecting farmers directly with buyers, retailers, and consumers. The platform promotes transparency, fair pricing, and reduces dependency on middlemen.

## 👥 Demo User Accounts

### 🌾 FARMERS
1. **Rajesh Kumar**
   - Email: `rajesh.farmer@agribridge.com`
   - Phone: `+91-9876543210`
   - Password: `farmer123`
   - Products: 5 items (Fresh Tomatoes, Organic Carrots, Green Beans, Fresh Spinach, Red Onions)

2. **Priya Singh**
   - Email: `priya.farmer@agribridge.com`
   - Phone: `+91-9876543211`
   - Password: `farmer456`
   - Products: 5 items (Basmati Rice, Fresh Mangoes, Wheat Flour, Fresh Cauliflower, Green Peas)

### 🛒 BUYERS
1. **Amit Sharma**
   - Email: `amit.buyer@agribridge.com`
   - Phone: `+91-9876543212`
   - Password: `buyer123`

2. **Sunita Patel**
   - Email: `sunita.buyer@agribridge.com`
   - Phone: `+91-9876543213`
   - Password: `buyer456`

3. **Ravi Gupta**
   - Email: `ravi.buyer@agribridge.com`
   - Phone: `+91-9876543214`
   - Password: `buyer789`

## 🔐 Login Options
- **Email or Phone**: Users can login using either their email address or phone number
- **Role-based Access**: Automatic redirection to appropriate dashboard based on user role

## ✨ Features Implemented

### 🔑 Authentication System
- ✅ User registration with role selection (Farmer/Buyer)
- ✅ Login with email or phone number
- ✅ Password hashing with bcrypt
- ✅ Role-based dashboard redirection
- ✅ Form validation and error handling

### 🌾 Farmer Dashboard
- ✅ **Dashboard**: Welcome screen with weather and market trends
- ✅ **My Crops**: View all products with real-time stats
- ✅ **Add Product**: Complete form with pricing, bulk discounts, location
- ✅ **Profile**: View user details and role information
- ✅ **Real-time Stats**: Active listings, total stock, average price
- ✅ **Bulk Discount Calculator**: Automatic discount percentage calculation
- ✅ **Responsive Design**: Mobile-friendly with horizontal scrolling tabs

### 🛒 Buyer Dashboard
- ✅ **Dashboard**: Welcome screen with featured products and deals
- ✅ **Browse Products**: View all available products from all farmers
- ✅ **Search Functionality**: Search by product name, category, or seller
- ✅ **Product Details**: Pricing, stock, location, seller information
- ✅ **Profile**: View user details and role information
- ✅ **Quick Stats**: Available products, categories, suppliers count
- ✅ **Bulk Pricing Display**: Shows discount percentage for bulk orders

### 🗄️ Database Schema
- ✅ **Users Table**: name, email, phone_number, password (hashed), role
- ✅ **Products Table**: name, category, quantity, seller_id, price_single, price_multiple, location, description, photos, status
- ✅ **Sample Data**: 2 farmers with 10 products total, 3 buyers

### 🎨 UI/UX Features
- ✅ **Professional Icons**: Lucide React icons throughout
- ✅ **Color Themes**: Green for farmers, blue for buyers
- ✅ **Responsive Design**: PWA-ready mobile layouts
- ✅ **Input Accessibility**: Dark text with proper contrast
- ✅ **Loading States**: Proper loading indicators
- ✅ **Error Handling**: User-friendly error messages

### 📱 PWA Ready
- ✅ **Manifest File**: Configured for PWA installation
- ✅ **Responsive Layouts**: Mobile-first design
- ✅ **Touch-friendly**: Optimized for mobile interactions
- ✅ **Viewport Configuration**: Proper mobile viewport settings

## 🛠️ Technical Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL (Neon)
- **Authentication**: bcryptjs for password hashing
- **Icons**: Lucide React
- **Database**: PostgreSQL with proper schema and relationships

## 🚀 Getting Started
1. Visit the application at `http://localhost:3000`
2. Use any of the demo credentials above to login
3. Explore the role-specific dashboards
4. Test the add product functionality (farmers)
5. Browse and search products (buyers)

## 📝 Notes
- All passwords are securely hashed in the database
- Login supports both email and phone number
- Real product data is fetched from the database
- Bulk pricing automatically calculates discount percentages
- Profile pages show complete user information including roles
- The application is fully responsive and PWA-ready
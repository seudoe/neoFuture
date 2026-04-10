# Order Requests Feature Documentation

## Overview
The Order Requests feature allows buyers to request specific produce from farmers, and farmers to apply to fulfill these requests. This creates a reverse marketplace where demand drives supply.

## Features

### For Buyers
- 🛒 **Create Order Requests**: Specify product, quantity, deadline, and budget
- 👥 **Multiple Farmer Options**: Choose to allow multiple farmers or single farmer only
- 📋 **Application Management**: Review and accept/reject farmer applications
- 💰 **Price Control**: Set maximum price per unit (optional)
- 📅 **Deadline Management**: Set required delivery dates

### For Farmers
- 🔔 **Request Notifications**: See all open order requests
- 📝 **Easy Applications**: Apply with price, quantity, and delivery details
- 🏆 **Competitive Bidding**: Compete with other farmers when allowed
- 📞 **Direct Contact**: Access buyer contact information
- ⏰ **Real-time Status**: Track application status (pending/accepted/rejected)

## User Flow

### Buyer Journey
1. **Login** to buyer dashboard
2. **Navigate** to "Order Requests" tab
3. **Click** "New Request" button
4. **Fill Form**:
   - Product name (e.g., "Fresh Tomatoes")
   - Quantity in kg
   - Required by date
   - Maximum price per kg (optional)
   - Allow multiple farmers (checkbox)
   - Description/notes (optional)
5. **Submit** request
6. **Wait** for farmer applications
7. **Review** applications with farmer details and prices
8. **Accept/Reject** applications
9. **Contact** accepted farmers directly

### Farmer Journey
1. **Login** to farmer dashboard
2. **Navigate** to "Order Requests" tab
3. **Browse** available requests
4. **Click** "Apply Now" on suitable requests
5. **Fill Application**:
   - Your price per kg
   - Available quantity
   - Delivery date (optional)
   - Notes about quality/farming methods
6. **Submit** application
7. **Wait** for buyer response
8. **Get notified** of acceptance/rejection

## Technical Implementation

### Database Schema

#### order_requests table
```sql
- id (Primary Key)
- buyer_id (Foreign Key → users.id)
- product_name (VARCHAR)
- quantity (INTEGER)
- by_date (DATE)
- allow_multiple_farmers (BOOLEAN)
- description (TEXT)
- max_price_per_unit (DECIMAL)
- status (open/closed/cancelled)
- created_at, updated_at (TIMESTAMPS)
```

#### order_applications table
```sql
- id (Primary Key)
- order_request_id (Foreign Key → order_requests.id)
- farmer_id (Foreign Key → users.id)
- price_per_unit (DECIMAL)
- available_quantity (INTEGER)
- delivery_date (DATE)
- notes (TEXT)
- status (pending/accepted/rejected)
- created_at, updated_at (TIMESTAMPS)
```

### API Endpoints

#### `/api/order-requests`
- **GET**: Fetch order requests
  - `?buyer_id=X` - Get requests created by buyer
  - `?farmer_id=X` - Get open requests for farmer to apply
- **POST**: Create new order request (buyers only)

#### `/api/order-applications`
- **POST**: Submit application to order request (farmers only)
- **PUT**: Update application status (buyers only)

### Components

#### `OrderRequests.tsx` (Buyer Component)
- Create new order requests
- View own requests with applications
- Accept/reject farmer applications
- Modal form for request creation

#### `FarmerOrderRequests.tsx` (Farmer Component)
- Browse available order requests
- Submit applications
- Track application status
- Modal form for applications

## Security Features

### Row Level Security (RLS)
- **Buyers**: Can only see/modify their own requests
- **Farmers**: Can only see open requests and their own applications
- **Applications**: Buyers can only manage applications to their requests

### Data Validation
- **Positive Numbers**: Quantity and prices must be > 0
- **Future Dates**: Delivery dates must be in the future
- **Unique Applications**: Farmers can't apply twice to same request
- **Status Constraints**: Proper status transitions enforced

### Business Logic
- **Single Farmer Mode**: If `allow_multiple_farmers = false`, request closes after first acceptance
- **Multiple Farmer Mode**: Multiple farmers can be accepted for same request
- **Duplicate Prevention**: Same farmer can't apply twice to same request
- **Status Management**: Proper request and application status tracking

## UI/UX Features

### Design Consistency
- ✅ Matches green agricultural theme
- ✅ Responsive design (mobile + desktop)
- ✅ Consistent with existing dashboard UI
- ✅ Clear status indicators and badges

### User Experience
- 🎯 **Clear CTAs**: Prominent "New Request" and "Apply Now" buttons
- 📊 **Status Badges**: Color-coded status indicators
- 📱 **Mobile Friendly**: Full responsive design
- ⚡ **Real-time Updates**: Automatic refresh after actions
- 🔄 **Loading States**: Smooth loading animations
- ❌ **Error Handling**: User-friendly error messages

### Visual Elements
- **Green Theme**: Consistent with AgriBridge branding
- **Icons**: Lucide React icons for clarity
- **Cards**: Clean card-based layout
- **Badges**: Status indicators with appropriate colors
- **Forms**: Well-structured modal forms

## Setup Instructions

### 1. Database Setup
Run the SQL commands in `ORDER_REQUESTS_SETUP.sql` in your Supabase SQL editor.

### 2. Environment Variables
No additional environment variables needed - uses existing Supabase configuration.

### 3. Testing
1. Create a buyer account and farmer account
2. Login as buyer, create an order request
3. Login as farmer, apply to the request
4. Login as buyer, accept/reject the application

## Business Benefits

### For Platform
- 📈 **Increased Engagement**: More interactions between buyers and farmers
- 💰 **Revenue Opportunities**: Potential for commission on successful matches
- 📊 **Market Insights**: Data on demand patterns and pricing
- 🤝 **Stronger Network**: Builds relationships between users

### For Buyers
- 🎯 **Specific Sourcing**: Get exactly what they need
- 💰 **Competitive Pricing**: Farmers compete on price
- ⏰ **Time Efficiency**: No need to browse all products
- 🔍 **Quality Control**: Direct communication with farmers

### For Farmers
- 📢 **Market Visibility**: Know what buyers actually want
- 💰 **Better Pricing**: Compete fairly for orders
- 📈 **Demand Planning**: Plan production based on requests
- 🤝 **Direct Relationships**: Build connections with buyers

## Future Enhancements

### Phase 2 Features
- **Push Notifications**: Real-time alerts for new requests/applications
- **Advanced Filtering**: Filter requests by location, price range, etc.
- **Bulk Requests**: Create multiple requests at once
- **Request Templates**: Save and reuse common request formats
- **Negotiation System**: Allow price negotiation between parties

### Phase 3 Features
- **Smart Matching**: AI-powered farmer recommendations
- **Seasonal Insights**: Historical data and seasonal trends
- **Quality Ratings**: Rate farmers based on fulfilled orders
- **Contract Management**: Formal agreements and terms
- **Payment Integration**: Escrow and payment processing

## Troubleshooting

### Common Issues
1. **Database Errors**: Ensure SQL setup is complete
2. **Permission Errors**: Check RLS policies are applied
3. **Form Validation**: Ensure all required fields are filled
4. **Date Issues**: Dates must be in future

### Debug Tips
- Check browser console for API errors
- Verify user authentication status
- Ensure proper user roles (buyer/farmer)
- Check Supabase logs for database issues

## Files Added/Modified

### New Files
- `app/api/order-requests/route.ts` - Order requests API
- `app/api/order-applications/route.ts` - Applications API
- `components/OrderRequests.tsx` - Buyer component
- `components/FarmerOrderRequests.tsx` - Farmer component
- `ORDER_REQUESTS_SETUP.sql` - Database setup
- `ORDER_REQUESTS_FEATURE.md` - This documentation

### Modified Files
- `app/dashboard/buyer/page.tsx` - Added Order Requests tab
- `app/dashboard/farmer/page.tsx` - Added Order Requests tab

The Order Requests feature is now fully integrated and ready to connect buyers and farmers in a demand-driven marketplace! 🌾
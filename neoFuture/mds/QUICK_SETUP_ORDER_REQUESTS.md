# Quick Setup Guide - Order Requests Feature

## 🚀 **3-Step Setup**

### Step 1: Database Setup
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `ORDER_REQUESTS_SETUP.sql`
4. Click **Run** to create the tables

### Step 2: Test the Feature
1. **Start your development server**: `npm run dev`
2. **Login as a Buyer**:
   - Go to "Order Requests" tab
   - Click "New Request"
   - Fill out the form and submit
3. **Login as a Farmer**:
   - Go to "Order Requests" tab
   - See the buyer's request
   - Click "Apply Now" and submit application
4. **Back to Buyer**:
   - See the farmer's application
   - Accept or reject it

### Step 3: Verify Everything Works
- ✅ Buyers can create order requests
- ✅ Farmers can see and apply to requests
- ✅ Buyers can accept/reject applications
- ✅ Status updates work correctly
- ✅ UI matches the green theme

## 🎯 **Key Features Added**

### Buyer Dashboard
- **New Tab**: "Order Requests" with clipboard icon
- **Create Requests**: Modal form for new requests
- **Manage Applications**: Accept/reject farmer applications
- **Status Tracking**: See request status and application count

### Farmer Dashboard  
- **New Tab**: "Order Requests" with clipboard icon
- **Browse Requests**: See all open buyer requests
- **Apply to Orders**: Submit applications with pricing
- **Track Status**: Monitor application status

## 🔧 **Technical Details**

### Database Tables Created
- `order_requests` - Stores buyer requests
- `order_applications` - Stores farmer applications

### API Endpoints Added
- `GET/POST /api/order-requests` - Manage requests
- `POST/PUT /api/order-applications` - Manage applications

### Security Features
- **Row Level Security (RLS)** enabled
- **Proper permissions** for buyers and farmers
- **Data validation** and constraints

## 🎨 **UI Features**

- **Green Theme**: Matches AgriBridge design
- **Responsive**: Works on mobile and desktop
- **Status Badges**: Color-coded status indicators
- **Modal Forms**: Clean, user-friendly forms
- **Loading States**: Smooth user experience

## 📞 **Need Help?**

If you encounter any issues:
1. Check the browser console for errors
2. Verify the SQL setup completed successfully
3. Ensure you have both buyer and farmer accounts for testing
4. Check that users have proper roles in the database

**The Order Requests feature is now ready to use! 🌾**
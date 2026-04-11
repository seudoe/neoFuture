# QR-Based Order Tracking System - Implementation Guide

## 🎯 Overview

This guide covers the complete implementation of a QR-based supply chain tracking system with Amazon/Flipkart-style timeline UI for your AgriTech platform.

## 📦 What's Included

### 1. Database Schema
- **File**: `database/order_tracking_schema.sql`
- **Tables**:
  - `order_tracking_logs` - Stores all status changes with timestamps
  - `orders.tracking_code` - Unique tracking code for each order
- **Features**:
  - Automatic tracking code generation
  - Auto-logging of status changes via triggers
  - Indexed for fast queries
  - View for easy data retrieval

### 2. API Routes

#### `/api/tracking/[trackingCode]` (GET)
- **Purpose**: Public endpoint for tracking page
- **Returns**: Order details + tracking timeline
- **Security**: Only returns non-sensitive data

#### `/api/tracking/log` (POST/GET)
- **Purpose**: Add/retrieve tracking logs
- **POST**: Create new tracking log entry
- **GET**: Fetch logs for an order

#### `/api/setup-tracking` (POST/GET)
- **Purpose**: Setup tracking system
- **POST**: Create tables, generate tracking codes
- **GET**: Check setup status

### 3. React Components

#### `OrderQRCode.tsx`
- Generates QR code for tracking URL
- Download QR as PNG
- Copy tracking link
- Share functionality
- Beautiful UI with instructions

#### `OrderTimeline.tsx`
- Amazon-style delivery timeline
- Progress bar visualization
- Status icons and timestamps
- Notes and location support
- Estimated delivery info

#### `OrderDetailsModal.tsx`
- Comprehensive order details
- Tabbed interface (Timeline + QR)
- Product info, seller details
- Integrated QR and timeline

### 4. Public Tracking Page

#### `/track/[trackingCode]`
- **No login required**
- Beautiful gradient design
- Product details
- Delivery address
- Seller contact info
- Real-time timeline
- Mobile responsive

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
npm install qrcode.react date-fns
```

### Step 2: Setup Database

**Option A: Using Supabase Dashboard**
1. Go to Supabase SQL Editor
2. Copy contents of `database/order_tracking_schema.sql`
3. Execute the SQL

**Option B: Using API**
```bash
# Call the setup endpoint
curl -X POST http://localhost:3000/api/setup-tracking
```

### Step 3: Verify Setup

```bash
# Check if setup was successful
curl http://localhost:3000/api/setup-tracking
```

Expected response:
```json
{
  "success": true,
  "status": {
    "tableExists": true,
    "ordersWithTracking": 10,
    "sampleTrackingCodes": ["TRK-00000001-ABC123", ...]
  }
}
```

### Step 4: Update Existing Orders

The setup script automatically:
- Generates tracking codes for all existing orders
- Creates initial tracking logs
- Sets up triggers for future orders

## 💻 Usage Examples

### 1. Display QR Code in Order Page

```tsx
import OrderQRCode from '@/components/OrderQRCode';

// In your order details component
<OrderQRCode
  trackingCode={order.tracking_code}
  orderId={order.id}
  size={200}
/>
```

### 2. Show Timeline

```tsx
import OrderTimeline from '@/components/OrderTimeline';

// Fetch tracking logs first
const [trackingLogs, setTrackingLogs] = useState([]);

useEffect(() => {
  fetch(`/api/tracking/log?orderId=${orderId}`)
    .then(res => res.json())
    .then(data => setTrackingLogs(data.logs));
}, [orderId]);

// Display timeline
<OrderTimeline
  currentStatus={order.status}
  timeline={trackingLogs}
/>
```

### 3. Update Order Status (with logging)

```tsx
const updateOrderStatus = async (orderId, newStatus) => {
  // This will automatically create a tracking log
  const response = await fetch('/api/tracking/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      status: newStatus,
      updatedBy: userId,
      updatedByType: 'seller', // or 'buyer' or 'system'
      notes: 'Order status updated',
      location: 'Mumbai, India' // optional
    })
  });
};
```

### 4. Use Order Details Modal

```tsx
import OrderDetailsModal from '@/components/OrderDetailsModal';

const [showModal, setShowModal] = useState(false);
const [selectedOrder, setSelectedOrder] = useState(null);

// Show modal
<button onClick={() => {
  setSelectedOrder(order);
  setShowModal(true);
}}>
  View Details
</button>

// Modal
<OrderDetailsModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  order={selectedOrder}
/>
```

## 🔐 Security Considerations

### Public Tracking Page
- ✅ No authentication required
- ✅ Only shows minimal order info
- ✅ No access to user profiles
- ✅ No edit capabilities
- ✅ No navigation to dashboard

### Data Exposed on Public Page
- Product name, category, photo
- Order quantity and total price
- Delivery address
- Seller name and phone
- Tracking timeline
- ❌ No buyer personal info
- ❌ No payment details
- ❌ No internal IDs

### Tracking Code Security
- Unique per order
- Hard to guess (includes random hash)
- Format: `TRK-00000123-A1B2C3`

## 📱 Mobile Responsiveness

All components are fully responsive:
- QR code scales appropriately
- Timeline adapts to mobile screens
- Public tracking page is mobile-first
- Touch-friendly buttons and interactions

## 🎨 Customization

### Change Timeline Colors

Edit `components/OrderTimeline.tsx`:

```tsx
const statusConfig = {
  pending: {
    label: 'Order Placed',
    icon: Package,
    color: 'blue', // Change this
    description: 'Your order has been received'
  },
  // ... other statuses
};
```

### Customize QR Code

Edit `components/OrderQRCode.tsx`:

```tsx
<QRCodeSVG
  value={trackingUrl}
  size={size}
  level="H" // Error correction level: L, M, Q, H
  includeMargin={true}
  imageSettings={{
    src: '/your-logo.png', // Add your logo
    height: 40,
    width: 40,
    excavate: true,
  }}
/>
```

### Modify Public Page Design

Edit `app/track/[trackingCode]/page.tsx`:
- Change gradient colors
- Modify layout
- Add/remove sections
- Customize branding

## 🧪 Testing Checklist

### Database Setup
- [ ] Tables created successfully
- [ ] Tracking codes generated for existing orders
- [ ] Initial logs created
- [ ] Triggers working for new orders

### QR Code Functionality
- [ ] QR code displays correctly
- [ ] Download QR works
- [ ] Copy link works
- [ ] Share functionality works
- [ ] QR scans to correct URL

### Timeline Display
- [ ] Shows all status steps
- [ ] Progress bar updates correctly
- [ ] Timestamps display properly
- [ ] Icons show correctly
- [ ] Notes and location display

### Public Tracking Page
- [ ] Accessible without login
- [ ] Shows correct order info
- [ ] Timeline displays
- [ ] Mobile responsive
- [ ] Seller contact works
- [ ] No sensitive data exposed

### Status Updates
- [ ] Status changes create logs
- [ ] Timestamps are accurate
- [ ] Timeline updates in real-time
- [ ] Multiple status changes work

## 🐛 Troubleshooting

### Issue: Tracking codes not generated

**Solution**:
```bash
# Run setup endpoint
curl -X POST http://localhost:3000/api/setup-tracking
```

### Issue: Timeline not showing

**Check**:
1. Are tracking logs being created?
2. Is the API endpoint working?
3. Check browser console for errors

**Debug**:
```tsx
// Add logging
useEffect(() => {
  fetch(`/api/tracking/log?orderId=${orderId}`)
    .then(res => res.json())
    .then(data => {
      console.log('Tracking logs:', data);
      setTrackingLogs(data.logs);
    });
}, [orderId]);
```

### Issue: QR code not scanning

**Check**:
1. Is tracking code valid?
2. Is URL correct?
3. Try increasing QR size
4. Check error correction level

### Issue: Public page shows 404

**Check**:
1. Is tracking code correct?
2. Does order exist?
3. Check API response

## 🚀 Deployment Checklist

### Before Deploying
- [ ] Run database migrations
- [ ] Generate tracking codes for all orders
- [ ] Test public tracking page
- [ ] Verify QR codes work
- [ ] Test on mobile devices
- [ ] Check all API endpoints
- [ ] Review security settings

### Environment Variables
Ensure these are set:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Post-Deployment
- [ ] Test tracking page with real QR codes
- [ ] Verify status updates work
- [ ] Check mobile responsiveness
- [ ] Monitor API performance
- [ ] Test with different order statuses

## 📊 Database Queries

### Get order with full tracking history
```sql
SELECT * FROM order_tracking_view WHERE order_id = 123;
```

### Get all orders with tracking codes
```sql
SELECT id, tracking_code, status FROM orders WHERE tracking_code IS NOT NULL;
```

### Get recent tracking updates
```sql
SELECT * FROM order_tracking_logs 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Count orders by status
```sql
SELECT status, COUNT(*) 
FROM orders 
GROUP BY status;
```

## 🎯 Next Steps & Enhancements

### Optional Features to Add

1. **SMS Notifications**
   - Send tracking link via SMS
   - Status update notifications

2. **Email Tracking**
   - Email QR code to buyer
   - Automated status emails

3. **Advanced Timeline**
   - Add photos at each step
   - GPS location tracking
   - Delivery person details

4. **Analytics**
   - Track QR scans
   - Monitor delivery times
   - Status change analytics

5. **Multi-language Support**
   - Translate tracking page
   - Regional date formats

6. **Estimated Delivery**
   - Calculate based on location
   - Show delivery time window
   - Update dynamically

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review console logs
3. Check API responses
4. Verify database setup
5. Test with sample data

## 🎉 Success Criteria

Your tracking system is working when:
- ✅ Every order has a unique tracking code
- ✅ QR codes can be scanned and open tracking page
- ✅ Timeline shows all status changes
- ✅ Public page works without login
- ✅ Status updates create tracking logs
- ✅ Mobile experience is smooth
- ✅ No sensitive data is exposed

## 📝 Summary

You now have a complete QR-based tracking system with:
- Unique tracking codes for every order
- Downloadable QR codes
- Public tracking page (no login)
- Amazon-style timeline UI
- Automatic status logging
- Mobile-responsive design
- Secure and scalable architecture

Happy tracking! 🚀📦

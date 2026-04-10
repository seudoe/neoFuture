# 🚀 Quick Start - Order Tracking System

## ⚡ 5-Minute Setup

### 1. Install Dependencies (30 seconds)

```bash
npm install qrcode.react date-fns
```

### 2. Setup Database (2 minutes)

**Option A: Automatic (Recommended)**
```bash
# Start your dev server
npm run dev

# In another terminal, call setup endpoint
curl -X POST http://localhost:3000/api/setup-tracking
```

**Option B: Manual (Supabase Dashboard)**
1. Open Supabase SQL Editor
2. Copy and paste from `database/order_tracking_schema.sql`
3. Click "Run"

### 3. Verify Setup (30 seconds)

```bash
curl http://localhost:3000/api/setup-tracking
```

Should return:
```json
{
  "success": true,
  "status": {
    "tableExists": true,
    "ordersWithTracking": 5
  }
}
```

### 4. Test It! (2 minutes)

1. **View an order** in your dashboard
2. **Click "View Details"** or add the OrderDetailsModal component
3. **See the QR code** in the QR tab
4. **Scan the QR** with your phone
5. **View the public tracking page** - no login needed!

## 🎯 Integration Points

### Add to Buyer Orders Page

```tsx
// app/dashboard/buyer/my-orders/page.tsx
import OrderDetailsModal from '@/components/OrderDetailsModal';

// Add state
const [showDetailsModal, setShowDetailsModal] = useState(false);
const [selectedOrder, setSelectedOrder] = useState(null);

// Add button in your order list
<button 
  onClick={() => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  }}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
>
  View Tracking
</button>

// Add modal
<OrderDetailsModal
  isOpen={showDetailsModal}
  onClose={() => setShowDetailsModal(false)}
  order={selectedOrder}
/>
```

### Add to Farmer Orders Page

```tsx
// app/dashboard/farmer/orders/page.tsx
// Same as above - works for both buyer and seller views
```

## 📱 Test the Public Page

1. Get a tracking code from any order
2. Visit: `http://localhost:3000/track/TRK-00000001-ABC123`
3. Should see beautiful tracking page with timeline
4. No login required!

## 🎨 What You Get

### For Buyers
- ✅ View order tracking timeline
- ✅ Download QR code
- ✅ Share tracking link
- ✅ See real-time status updates

### For Sellers
- ✅ Update order status (auto-logs)
- ✅ Share QR with delivery person
- ✅ Track order progress

### For Everyone
- ✅ Public tracking page (no login)
- ✅ Beautiful timeline UI
- ✅ Mobile responsive
- ✅ Secure and fast

## 🔥 Quick Demo

### Update Order Status (Creates Tracking Log)

```tsx
const updateStatus = async () => {
  await fetch('/api/tracking/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: 123,
      status: 'shipped',
      updatedByType: 'seller',
      notes: 'Package picked up by courier',
      location: 'Mumbai Warehouse'
    })
  });
};
```

### Get Tracking Data

```tsx
const getTracking = async (trackingCode) => {
  const res = await fetch(`/api/tracking/${trackingCode}`);
  const data = await res.json();
  console.log(data.tracking);
};
```

## ✅ Success Checklist

After setup, verify:
- [ ] Orders have tracking codes
- [ ] QR codes display
- [ ] QR codes scan correctly
- [ ] Public tracking page works
- [ ] Timeline shows status history
- [ ] Status updates create logs

## 🐛 Common Issues

### "Table doesn't exist"
```bash
# Run setup again
curl -X POST http://localhost:3000/api/setup-tracking
```

### "No tracking code"
```bash
# Setup generates codes for existing orders
# New orders get codes automatically
```

### "Timeline empty"
```bash
# Update order status to create logs
# Or run setup to create initial logs
```

## 🎉 You're Done!

Your tracking system is ready. Now:
1. Add OrderDetailsModal to your order pages
2. Test with real orders
3. Share QR codes
4. Enjoy the tracking experience!

## 📚 Full Documentation

See `TRACKING_SYSTEM_GUIDE.md` for:
- Detailed API documentation
- Customization options
- Security considerations
- Advanced features
- Troubleshooting guide

## 🚀 Next Steps

1. **Customize colors** in OrderTimeline.tsx
2. **Add your logo** to QR codes
3. **Style the public page** to match your brand
4. **Add SMS/Email** notifications (optional)
5. **Deploy** and test in production

Happy tracking! 📦✨

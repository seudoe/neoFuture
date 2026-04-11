# Receipt System - Quick Start Guide

## 🚀 Setup in 3 Steps

### Step 1: Database Setup
Run this API endpoint to add receipt columns to your orders table:

```bash
POST http://localhost:3000/api/setup-receipts
```

Or run the SQL directly:
```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMP;
```

### Step 2: Create Supabase Storage Bucket

**Option A: Via Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to Storage
4. Click "New bucket"
5. Name it: `receipts`
6. Make it **Public**
7. Click "Create bucket"

**Option B: Automatic (handled by code)**
The system will attempt to create the bucket automatically on first use.

### Step 3: Test It!

1. Start your dev server:
```bash
npm run dev
```

2. Login as a buyer or farmer

3. Navigate to an order with status "delivered"

4. Click "Generate Receipt" button

5. View or download the PDF!

---

## 📋 What Was Installed

### New Files Created:
- `lib/receiptGenerator.ts` - PDF generation
- `lib/supabaseStorage.ts` - Storage upload
- `app/api/generate-receipt/route.ts` - API endpoint
- `app/api/setup-receipts/route.ts` - Database setup
- `components/ReceiptButton.tsx` - UI component
- `database/receipt_schema.sql` - SQL migration

### Files Modified:
- `app/dashboard/buyer/my-orders/page.tsx` - Added receipt button
- `app/dashboard/farmer/orders/page.tsx` - Added receipt button

### Dependencies Added:
- `jspdf` - PDF generation library

---

## 🎯 How It Works

1. **User clicks "Generate Receipt"** on a delivered order
2. **API fetches** complete order details from database
3. **PDF is generated** with order info, buyer/farmer details, products
4. **PDF is uploaded** to Supabase Storage bucket
5. **Database is updated** with receipt URL
6. **User can view/download** the receipt anytime

---

## 🔍 Quick Test

### Test Receipt Generation via API:

```bash
curl -X POST http://localhost:3000/api/generate-receipt \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1}'
```

Expected response:
```json
{
  "success": true,
  "receiptUrl": "https://xkqqvavqxegsijtgpzfo.supabase.co/storage/v1/object/public/receipts/receipt-1.pdf",
  "message": "Receipt generated successfully"
}
```

---

## 📱 User Experience

### For Buyers (My Orders page):
- See "Generate Receipt" button on delivered orders
- Click to generate PDF receipt
- View in browser or download
- Receipt includes all order details

### For Farmers (Orders page):
- Same functionality as buyers
- Access receipts for all delivered orders
- Professional PDF for record-keeping

---

## ✅ Verification Checklist

- [ ] Database columns added (check with `\d orders` in psql)
- [ ] Supabase bucket `receipts` exists
- [ ] Environment variables set in `.env.local`
- [ ] Dev server running
- [ ] Test order with "delivered" status exists
- [ ] Receipt button appears on delivered orders
- [ ] PDF generates successfully
- [ ] PDF opens in new tab
- [ ] Download works correctly

---

## 🐛 Common Issues

### "Bucket not found"
**Solution**: Create the `receipts` bucket in Supabase Dashboard

### "Receipt not generating"
**Solution**: Check browser console for errors, verify Supabase credentials

### "Button not showing"
**Solution**: Ensure order status is "delivered"

### "Database error"
**Solution**: Run the setup-receipts API endpoint

---

## 📖 Full Documentation

See `RECEIPT_SYSTEM_GUIDE.md` for complete documentation including:
- Detailed architecture
- Security considerations
- Production recommendations
- Troubleshooting guide
- Future enhancements

---

## 🎉 You're Done!

Your receipt system is now ready. Every delivered order can have a professional PDF receipt generated and stored automatically!

**Next Steps:**
1. Test with real orders
2. Customize PDF layout if needed
3. Consider adding email integration
4. Set up automatic generation on delivery

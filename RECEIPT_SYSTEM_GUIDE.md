# Digital Receipt Generation System - Complete Guide

## Overview
This system automatically generates PDF receipts for completed orders and stores them in Supabase Storage, making them accessible to both buyers and farmers.

---

## 🗄️ Database Setup

### Step 1: Run Database Migration

Execute this in your PostgreSQL database:

```bash
# Option 1: Via API (Recommended)
POST http://localhost:3000/api/setup-receipts

# Option 2: Via SQL Editor
Run the SQL in: database/receipt_schema.sql
```

This adds three new columns to the `orders` table:
- `receipt_url` (TEXT) - Stores the Supabase Storage URL
- `receipt_generated` (BOOLEAN) - Tracks if receipt was created
- `receipt_generated_at` (TIMESTAMP) - When receipt was generated

---

## ☁️ Supabase Storage Setup

### Step 2: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named: `receipts`
3. Set it as **Public** (for easy access)
4. Or use the API to create it automatically (handled in code)

### Storage Policies (Optional - for production)

```sql
-- Allow public read access
CREATE POLICY "Allow public read access to receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- Allow service role to upload
CREATE POLICY "Allow service role to upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts');
```

---

## 📦 Dependencies

Already installed:
```bash
npm install jspdf
```

Supabase client is already configured in your project.

---

## 🔧 System Components

### 1. PDF Generator (`lib/receiptGenerator.ts`)
- Generates professional PDF receipts using jsPDF
- Includes order details, buyer/farmer info, product list, total amount
- Optional: QR code linking to tracking page
- Clean, readable layout with AgriLink branding

### 2. Storage Uploader (`lib/supabaseStorage.ts`)
- Uploads PDF to Supabase Storage bucket
- Returns public URL for database storage
- Handles bucket creation if needed
- File naming: `receipt-{orderId}.pdf`

### 3. API Route (`app/api/generate-receipt/route.ts`)
- **Endpoint**: `POST /api/generate-receipt`
- **Input**: `{ orderId: number }`
- **Process**:
  1. Checks if receipt already exists (prevents duplicates)
  2. Fetches complete order details from database
  3. Generates PDF using receiptGenerator
  4. Uploads to Supabase Storage
  5. Updates order record with receipt URL
- **Output**: `{ success: boolean, receiptUrl: string }`

### 4. Receipt Button Component (`components/ReceiptButton.tsx`)
- Smart button that shows different states:
  - Hidden for non-delivered orders
  - "Generate Receipt" for delivered orders without receipt
  - "View Receipt" + "Download" for orders with receipt
- Handles generation, viewing, and downloading
- Shows loading states and error handling

---

## 🎯 Usage

### For Buyers (My Orders Page)

The receipt button appears automatically for delivered orders:

```tsx
<ReceiptButton
  orderId={order.id}
  receiptUrl={order.receipt_url}
  receiptGenerated={order.receipt_generated}
  orderStatus={order.status}
/>
```

### For Farmers (Orders Page)

Same component, same functionality - both parties can access receipts.

---

## 🔄 Receipt Generation Flow

### Automatic Trigger (Recommended)
When order status changes to "delivered":

```typescript
// In your order status update logic
if (newStatus === 'delivered') {
  // Trigger receipt generation
  await fetch('/api/generate-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  });
}
```

### Manual Trigger
Users can click "Generate Receipt" button on delivered orders.

---

## 📄 Receipt Contents

Each PDF receipt includes:

**Header**
- AgriLink branding with green header
- "Digital Transaction Receipt" subtitle

**Order Details**
- Order ID
- Order Date
- Delivery Date (if delivered)
- Order Status

**Transaction Parties**
- Buyer Name & Email
- Farmer Name & Email

**Items Table**
- Product Name
- Quantity (kg)
- Price per Unit
- Total per Item

**Summary**
- Total Amount (₹)
- Tracking Link (if available)

**Footer**
- Generation timestamp
- "Digitally generated - no signature required"
- AgriLink tagline

---

## 🔒 Security Considerations

### Current Implementation (Hackathon-Friendly)
- Public bucket with public URLs
- Anyone with URL can access receipt
- Simple and fast

### Production Recommendations
1. Use **signed URLs** with expiry:
```typescript
const { data } = await supabase.storage
  .from('receipts')
  .createSignedUrl(filePath, 3600); // 1 hour expiry
```

2. Add authentication checks in API route
3. Implement row-level security (RLS) policies
4. Encrypt sensitive data in PDFs

---

## 🧪 Testing

### Test Receipt Generation

1. Create an order
2. Update status to "delivered"
3. Click "Generate Receipt" button
4. Verify PDF is generated and uploaded
5. Check database for receipt_url
6. Test "View Receipt" and "Download" buttons

### Manual API Test

```bash
curl -X POST http://localhost:3000/api/generate-receipt \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1}'
```

---

## 🐛 Troubleshooting

### Receipt Not Generating
- Check Supabase credentials in `.env.local`
- Verify `receipts` bucket exists
- Check browser console for errors
- Verify order exists and has all required data

### Upload Failing
- Check Supabase service role key
- Verify bucket permissions
- Check file size (should be < 5MB)
- Ensure bucket is public or has correct policies

### PDF Not Displaying Correctly
- Check order data completeness
- Verify product, buyer, and seller info exists
- Check console for jsPDF errors

---

## 📊 Database Queries

### Check Receipt Status
```sql
SELECT id, receipt_generated, receipt_url, receipt_generated_at 
FROM orders 
WHERE status = 'delivered';
```

### Find Orders Without Receipts
```sql
SELECT id, status 
FROM orders 
WHERE status = 'delivered' 
AND receipt_generated = FALSE;
```

### Regenerate All Receipts
```sql
UPDATE orders 
SET receipt_generated = FALSE, 
    receipt_url = NULL 
WHERE status = 'delivered';
```

---

## 🚀 Future Enhancements

1. **Batch Generation**: Generate receipts for multiple orders
2. **Email Integration**: Auto-send receipt via email
3. **WhatsApp Integration**: Send receipt link via WhatsApp
4. **Custom Branding**: Allow farmers to add their logo
5. **Multi-language**: Generate receipts in local languages
6. **Tax Calculations**: Add GST/tax breakdowns
7. **Payment Integration**: Link with payment gateway
8. **Analytics**: Track receipt downloads and views

---

## 📝 File Structure

```
├── database/
│   └── receipt_schema.sql          # Database migration
├── lib/
│   ├── receiptGenerator.ts         # PDF generation logic
│   └── supabaseStorage.ts          # Storage upload logic
├── app/api/
│   ├── generate-receipt/
│   │   └── route.ts                # Receipt generation API
│   └── setup-receipts/
│       └── route.ts                # Database setup API
├── components/
│   └── ReceiptButton.tsx           # UI component
└── app/dashboard/
    ├── buyer/my-orders/page.tsx    # Buyer integration
    └── farmer/orders/page.tsx      # Farmer integration
```

---

## ✅ Implementation Checklist

- [x] Database schema updated
- [x] Supabase Storage configured
- [x] PDF generator implemented
- [x] Storage uploader created
- [x] API route for generation
- [x] Receipt button component
- [x] Buyer dashboard integration
- [x] Farmer dashboard integration
- [x] Error handling
- [x] Loading states
- [x] Documentation

---

## 💡 Use Cases

1. **Financial Transparency**: Clear record of all transactions
2. **Proof of Purchase**: Legal document for disputes
3. **Credit Eligibility**: Use receipts for loan applications
4. **Tax Filing**: Maintain records for tax purposes
5. **Inventory Tracking**: Track purchases over time
6. **Audit Trail**: Complete transaction history

---

## 🎓 Key Benefits

- **Automated**: No manual receipt creation needed
- **Professional**: Clean, branded PDF documents
- **Accessible**: Available to both parties instantly
- **Secure**: Stored in reliable cloud storage
- **Scalable**: Handles unlimited receipts
- **Cost-effective**: Minimal storage costs

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review console logs
3. Verify Supabase configuration
4. Check database connection

---

**Built with ❤️ for AgriLink Platform**

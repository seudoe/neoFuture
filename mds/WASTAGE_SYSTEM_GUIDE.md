# Wastage/Quality Issue Reporting System - Complete Guide

## Overview
This system allows buyers to report quality issues, damaged goods, or missing items when receiving agricultural products. Payment is automatically adjusted based on actual delivered quantity, ensuring fairness and transparency.

---

## 🎯 Key Features

1. **Quality Verification**: Buyers verify quantity and quality before marking as delivered
2. **Wastage Reporting**: Report damaged, rotten, or missing items
3. **Automatic Payment Adjustment**: Payment calculated based on delivered quantity
4. **Updated Receipts**: PDF receipts reflect wastage and adjusted amounts
5. **Transparency**: Both parties see wastage details and payment adjustments

---

## 🗄️ Database Setup

### Step 1: Run Migration

```bash
# Via API (Recommended)
POST http://localhost:3000/api/setup-wastage

# Or run SQL directly
Execute: database/wastage_schema.sql
```

### New Database Fields

**orders table additions:**
- `ordered_quantity` - Original quantity ordered
- `delivered_quantity` - Actual quantity received in good condition
- `wasted_quantity` - Quantity damaged/rotten/missing
- `original_amount` - Original payment amount
- `adjusted_amount` - Final payment after wastage adjustment
- `verification_status` - pending/verified/disputed

**New table: order_wastage_reports**
- `id` - Primary key
- `order_id` - Foreign key to orders
- `reported_by` - Buyer who reported
- `delivered_quantity` - Good quantity received
- `wasted_quantity` - Damaged quantity
- `reason` - Text explanation
- `photo_urls` - Array of proof photos (optional)
- `created_at` - Timestamp

---

## 🔄 Order Flow

### Old Flow:
```
ordered → confirmed → shipped → delivered
```

### New Flow:
```
ordered → confirmed → shipped → [VERIFICATION] → delivered
```

### Detailed Steps:

1. **Buyer places order** → Status: `pending`
2. **Farmer confirms** → Status: `confirmed`
3. **Farmer ships** → Status: `shipped`
4. **Buyer receives & verifies** → Opens verification modal
5. **Buyer reports quantities**:
   - Delivered quantity (good condition)
   - Wasted quantity (damaged/missing)
   - Reason (if wastage exists)
6. **System processes**:
   - Calculates adjusted payment
   - Updates order record
   - Marks as `delivered`
   - Regenerates receipt if wastage exists
7. **Both parties see final amounts**

---

## 💰 Payment Calculation

### Formula:
```
Final Payment = Delivered Quantity × Unit Price
```

### Example:
```
Ordered: 5 kg × Rs 40 = Rs 200
Delivered: 4 kg (good)
Wasted: 1 kg (rotten)

Final Payment: 4 kg × Rs 40 = Rs 160
Buyer Saves: Rs 40
```

---

## 🎨 UI Components

### 1. WastageReportModal (Buyer Side)

**Location**: `components/WastageReportModal.tsx`

**Triggered when**: Buyer clicks "Verify & Mark as Delivered" on shipped orders

**Features**:
- Shows order summary
- Input fields for delivered and wasted quantities
- Auto-calculates totals
- Requires reason if wastage > 0
- Shows payment adjustment preview
- Validation before submission

**Validation Rules**:
- Delivered + Wasted ≤ Ordered
- Reason required if wastage > 0
- Cannot submit negative quantities
- One-time submission (no edits after)

### 2. WastageInfo (Farmer Side)

**Location**: `components/WastageInfo.tsx`

**Shows**:
- Ordered vs Delivered vs Wasted quantities
- Original amount vs Adjusted payment
- Deduction amount
- Visual indicators (green for full delivery, yellow for wastage)

---

## 📄 Receipt Updates

### Without Wastage:
```
Product: Banana
Quantity: 5 kg
Price/Unit: Rs 40.00
Total: Rs 200.00

Total Amount: Rs 200.00
```

### With Wastage:
```
Product: Banana
Quantity: 4 kg
Price/Unit: Rs 40.00
Total: Rs 160.00

Wastage Adjustment: -1 kg (-Rs 40.00)

Original Amount: Rs 200.00
Adjusted Amount: Rs 160.00
```

---

## 🔧 API Endpoints

### 1. Setup Wastage System
```
POST /api/setup-wastage
```
Creates database tables and columns

### 2. Report Wastage
```
POST /api/report-wastage
Body: {
  orderId: number,
  buyerId: number,
  deliveredQuantity: number,
  wastedQuantity: number,
  reason: string (optional),
  photoUrls: string[] (optional)
}
```

**Response**:
```json
{
  "success": true,
  "message": "Wastage report submitted successfully",
  "data": {
    "orderId": 17,
    "deliveredQuantity": 4,
    "wastedQuantity": 1,
    "originalAmount": 200,
    "adjustedAmount": 160,
    "savings": 40
  }
}
```

### 3. Get Wastage Report
```
GET /api/report-wastage?orderId=17
```

**Response**:
```json
{
  "found": true,
  "report": {
    "id": 1,
    "order_id": 17,
    "reported_by": 12,
    "delivered_quantity": 4,
    "wasted_quantity": 1,
    "reason": "1 kg was rotten",
    "created_at": "2026-04-11T10:30:00Z",
    "reporter_name": "buyerboy",
    "reporter_email": "buyerboy@gmail.com"
  }
}
```

---

## ✅ Validation Rules

### Backend Validation:
1. `deliveredQuantity + wastedQuantity ≤ orderedQuantity`
2. No negative quantities
3. Only buyer can report wastage
4. Only one report per order
5. Cannot modify after verification
6. Reason required if wastage > 0

### Frontend Validation:
1. Real-time quantity validation
2. Auto-adjustment of complementary field
3. Visual feedback for errors
4. Disabled submit if invalid

---

## 🧪 Testing Guide

### Test Scenario 1: Full Delivery (No Wastage)
1. Create order for 5 kg
2. Farmer confirms and ships
3. Buyer clicks "Verify & Mark as Delivered"
4. Enter: Delivered = 5, Wasted = 0
5. Submit
6. ✅ Order marked delivered
7. ✅ Full payment (Rs 200)
8. ✅ Green confirmation shown

### Test Scenario 2: Partial Wastage
1. Create order for 5 kg @ Rs 40 = Rs 200
2. Farmer confirms and ships
3. Buyer clicks "Verify & Mark as Delivered"
4. Enter: Delivered = 4, Wasted = 1
5. Enter reason: "1 kg was rotten"
6. Submit
7. ✅ Order marked delivered
8. ✅ Adjusted payment (Rs 160)
9. ✅ Buyer saves Rs 40
10. ✅ Farmer sees wastage info
11. ✅ Receipt regenerated with wastage

### Test Scenario 3: Validation
1. Try to enter: Delivered = 4, Wasted = 2 (total = 6 > 5)
2. ❌ Error: "Total quantity cannot exceed ordered quantity"
3. Try wastage without reason
4. ❌ Error: "Please provide a reason for wastage"

---

## 🔒 Security & Constraints

### Access Control:
- Only buyer can report wastage
- Only for their own orders
- Only once per order
- No edits after submission

### Data Integrity:
- Database constraints prevent invalid quantities
- Transaction-based updates (all or nothing)
- Unique constraint on order_wastage_reports

### Audit Trail:
- All reports timestamped
- Reporter tracked
- Original amounts preserved
- Cannot be deleted

---

## 📊 Business Logic

### When Wastage is Reported:

1. **Insert wastage report** into `order_wastage_reports`
2. **Update order**:
   - Set `delivered_quantity`
   - Set `wasted_quantity`
   - Calculate `adjusted_amount`
   - Set `verification_status = 'verified'`
   - Set `status = 'delivered'`
3. **If wastage > 0**:
   - Mark receipt for regeneration
   - Clear existing receipt URL
4. **Commit transaction**

### Payment Impact:
- Farmer receives payment for delivered quantity only
- Buyer pays for what they actually received
- Platform maintains fairness

---

## 🎓 Use Cases

### 1. Rotten Produce
```
Scenario: 2 kg of tomatoes arrived rotten
Action: Buyer reports 8 kg delivered, 2 kg wasted
Reason: "2 kg were completely rotten"
Result: Payment reduced by Rs 80 (2 kg × Rs 40)
```

### 2. Missing Items
```
Scenario: Package short by 1 kg
Action: Buyer reports 4 kg delivered, 1 kg wasted
Reason: "Package was 1 kg short"
Result: Payment adjusted accordingly
```

### 3. Damaged in Transit
```
Scenario: Items damaged during shipping
Action: Buyer reports actual good quantity
Reason: "Damaged during transport"
Result: Fair payment for usable goods
```

### 4. Perfect Delivery
```
Scenario: All items in perfect condition
Action: Buyer confirms full quantity
Result: Full payment, green confirmation
```

---

## 🚀 Future Enhancements

1. **Photo Upload**: Add proof of damaged goods
2. **Dispute System**: Allow farmer to contest report
3. **Rating Impact**: Factor wastage into seller ratings
4. **Analytics**: Track wastage patterns by farmer/product
5. **Insurance**: Integrate with insurance for high-value orders
6. **Partial Acceptance**: Allow buyer to reject entire order
7. **Quality Grades**: Rate quality (A/B/C) not just quantity
8. **Automatic Refunds**: Trigger payment refunds automatically

---

## 📝 File Structure

```
├── database/
│   └── wastage_schema.sql              # Database migration
├── app/api/
│   ├── setup-wastage/route.ts          # Setup endpoint
│   └── report-wastage/route.ts         # Report & fetch endpoints
├── components/
│   ├── WastageReportModal.tsx          # Buyer verification modal
│   └── WastageInfo.tsx                 # Farmer wastage display
├── lib/
│   └── receiptGenerator.ts             # Updated with wastage
└── app/dashboard/
    ├── buyer/my-orders/page.tsx        # Buyer integration
    └── farmer/orders/page.tsx          # Farmer integration
```

---

## 💡 Key Benefits

### For Buyers:
- Pay only for what you receive
- Report quality issues easily
- Automatic payment adjustment
- Fair and transparent process

### For Farmers:
- See exactly what was reported
- Understand payment deductions
- Improve quality based on feedback
- Build trust through transparency

### For Platform:
- Reduces disputes
- Builds trust
- Encourages quality
- Fair marketplace

---

## 🐛 Troubleshooting

### Issue: Button not showing
**Solution**: Ensure order status is "shipped"

### Issue: Cannot submit report
**Solution**: Check validation errors, ensure reason provided if wastage > 0

### Issue: Payment not adjusted
**Solution**: Check database update, verify adjusted_amount column exists

### Issue: Receipt not regenerating
**Solution**: Check receipt_generated flag reset to FALSE

---

## 📞 Support

For issues:
1. Check browser console for errors
2. Verify database migration ran successfully
3. Check API response for error messages
4. Ensure order is in correct status

---

**Built with fairness and transparency for AgriLink Platform** 🌾

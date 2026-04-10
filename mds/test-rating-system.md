# Testing the Rating System

## Setup Steps

1. **Start the development server:**
   ```bash
   cd tech-a-thon
   npm run dev
   ```

2. **Create the ratings table:**
   - Visit: `http://localhost:3000/api/create-ratings-table`
   - Send a POST request (you can use browser dev tools or Postman)
   - Or run: `node setup-ratings.js`

## Testing Flow

### Test as Buyer

1. **Login as a buyer**
2. **Place an order:**
   - Go to "Browse Products" tab
   - Add items to cart
   - Proceed to checkout
   - Complete payment

3. **Simulate order completion:**
   - As a farmer (login with farmer account), go to "Orders" tab
   - Confirm the order → Mark as Shipped → Mark as Delivered

4. **Rate the farmer:**
   - As buyer, go to "My Orders" tab
   - Find the delivered order
   - Click "Rate & Review" button
   - Select stars (1-5) and write a review
   - Submit rating

5. **Verify rating display:**
   - Rating should appear under the order
   - Farmer should see the rating in their "Received Reviews" tab

### Test as Farmer

1. **Login as a farmer**
2. **After order is delivered:**
   - Go to "Orders" tab
   - Find the delivered order
   - Click "Rate Buyer" button
   - Select stars and write review
   - Submit rating

3. **Verify rating display:**
   - Rating should appear under the order
   - Buyer should see the farmer's rating in their order history

## Expected Behavior

### Buyer Dashboard
- ✅ "Rate & Review" button appears only for delivered orders
- ✅ Button changes to "Update Rating" if already rated
- ✅ Own ratings display in yellow boxes under orders
- ✅ Received ratings from farmers display in blue boxes

### Farmer Dashboard
- ✅ "Rate Buyer" button appears only for delivered orders
- ✅ Button changes to "Update Rating" if already rated
- ✅ "Received Reviews" tab shows all buyer reviews
- ✅ Own ratings display in yellow boxes under orders
- ✅ Received ratings from buyers display in blue boxes

### Rating Modal
- ✅ Shows order details and target user info
- ✅ Star rating interface (1-5 stars)
- ✅ Optional review text area (500 char limit)
- ✅ Form validation (rating required)
- ✅ Proper button states and loading

## API Testing

You can test the API endpoints directly:

### Create Rating
```bash
POST /api/ratings
{
  "orderId": 1,
  "raterId": 2,
  "ratedId": 1,
  "raterType": "buyer",
  "rating": 5,
  "review": "Great farmer, excellent produce!"
}
```

### Get Order Ratings
```bash
GET /api/ratings?orderId=1
```

### Get User Ratings
```bash
GET /api/ratings?userId=1&userType=seller
```

## Troubleshooting

### Common Issues

1. **"Rate & Review" button not showing:**
   - Ensure order status is "delivered"
   - Check if user is logged in correctly

2. **Rating modal not opening:**
   - Check browser console for errors
   - Verify order data is loaded

3. **Rating submission fails:**
   - Check if ratings table exists
   - Verify API endpoint is accessible
   - Check network tab for error details

4. **Ratings not displaying:**
   - Refresh the page
   - Check if ratings were saved in database
   - Verify API responses

### Database Verification

Check if ratings table exists and has data:
```sql
-- Check table structure
\d ratings

-- Check ratings data
SELECT * FROM ratings;

-- Check ratings with user names
SELECT r.*, 
       rater.name as rater_name, 
       rated.name as rated_name 
FROM ratings r
JOIN users rater ON r.rater_id = rater.id
JOIN users rated ON r.rated_id = rated.id;
```
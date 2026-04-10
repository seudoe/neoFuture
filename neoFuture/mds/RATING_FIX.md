# Rating System Fix

## The Problem
The error "Failed to check existing rating" occurs because the `ratings` table doesn't exist in your database yet.

## Quick Fix

### Option 1: Use the Setup Page (Recommended)
1. Visit: `http://localhost:3000/setup`
2. Click "Check Tables" to see which tables are missing
3. Click "Create Tables" to create all required tables including the ratings table
4. Go back to your dashboard and try rating again

### Option 2: Manual API Call
1. Visit: `http://localhost:3000/api/setup-all-tables` (POST request)
2. Or use the browser console:
   ```javascript
   fetch('/api/setup-all-tables', { method: 'POST' })
     .then(r => r.json())
     .then(console.log)
   ```

### Option 3: Direct Supabase SQL
If the above doesn't work, go to your Supabase dashboard and run this SQL:

```sql
-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rater_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rater_type VARCHAR(10) NOT NULL CHECK (rater_type IN ('buyer', 'seller')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(order_id, rater_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ratings_order_id ON ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_id ON ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_type ON ratings(rater_type);
```

## What Was Fixed

1. **Better Error Handling**: The API now provides clearer error messages when tables don't exist
2. **Graceful Degradation**: If the ratings table doesn't exist, the system returns empty arrays instead of crashing
3. **User Guidance**: The dashboard now offers to redirect users to the setup page when tables are missing
4. **Complete Setup**: Created a comprehensive setup page that creates all required tables

## Testing After Fix

1. **Create the tables** using one of the methods above
2. **Place an order** as a buyer
3. **Mark it as delivered** (as the farmer)
4. **Try rating** - it should now work without errors
5. **Check the ratings** appear in both buyer and farmer dashboards

## Additional Tables Created

The setup also ensures these tables exist:
- `users` - User accounts
- `products` - Product listings  
- `orders` - Order records
- `cart` - Shopping cart items
- `ratings` - Rating and review data

All tables include proper foreign key relationships and indexes for optimal performance.
# Rating & Review System

This document describes the comprehensive rating and review system implemented for the AgriBridge platform.

## Features

### For Buyers
- **Rate Farmers**: After order delivery, buyers can rate farmers (1-5 stars) and leave reviews
- **View Own Ratings**: See ratings and reviews they've given to farmers
- **View Received Ratings**: See ratings and reviews received from farmers
- **Update Ratings**: Modify existing ratings and reviews

### For Farmers
- **Rate Buyers**: After order delivery, farmers can rate buyers (1-5 stars) and leave reviews
- **View Received Reviews**: Dedicated tab to view all reviews from buyers
- **View Own Ratings**: See ratings and reviews they've given to buyers
- **Update Ratings**: Modify existing ratings and reviews

## Database Structure

### Ratings Table
```sql
CREATE TABLE ratings (
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
```

## API Endpoints

### GET /api/ratings
- **Query Parameters:**
  - `orderId`: Get ratings for a specific order
  - `userId` + `userType`: Get ratings received by a user
- **Returns:** Array of ratings with user and order details

### POST /api/ratings
- **Body:** `{ orderId, raterId, ratedId, raterType, rating, review }`
- **Returns:** Created rating object
- **Validation:** Prevents duplicate ratings for same order/rater

### PUT /api/ratings
- **Body:** `{ ratingId, raterId, rating, review }`
- **Returns:** Updated rating object
- **Security:** Only allows rater to update their own ratings

## Components

### RatingModal
- Modal for submitting/updating ratings
- Star rating interface (1-5 stars)
- Optional review text area
- Form validation and submission

### RatingDisplay
- Displays list of ratings with stars and reviews
- Shows average rating and total count
- Responsive design for mobile and desktop

## Setup Instructions

1. **Create the ratings table:**
   ```bash
   node setup-ratings.js
   ```
   Or visit: `http://localhost:3000/api/create-ratings-table` (POST request)

2. **The system is automatically integrated into:**
   - Buyer Dashboard (`/dashboard/buyer`)
   - Farmer Dashboard (`/dashboard/farmer`)

## User Flow

### Buyer Rating Flow
1. Buyer places order
2. Order goes through: pending → confirmed → shipped → delivered
3. Once delivered, "Rate & Review" button appears
4. Buyer clicks button, modal opens
5. Buyer selects stars (1-5) and optionally writes review
6. Rating is saved and displayed in order history
7. Farmer can see the rating in their "Received Reviews" tab

### Farmer Rating Flow
1. Same order flow as above
2. Once delivered, "Rate Buyer" button appears for farmer
3. Farmer rates buyer's communication, payment, etc.
4. Buyer can see farmer's rating in their order history

## Security Features

- **Authorization**: Users can only rate orders they're part of
- **Duplicate Prevention**: One rating per user per order
- **Input Validation**: Rating must be 1-5, review max 500 chars
- **Update Permissions**: Users can only update their own ratings

## UI/UX Features

- **Visual Feedback**: Different button states for rated/unrated orders
- **Star Display**: Intuitive 5-star rating system
- **Color Coding**: 
  - Yellow for own ratings
  - Blue for received ratings
  - Green for action buttons
- **Responsive Design**: Works on mobile and desktop
- **Real-time Updates**: Ratings appear immediately after submission

## Future Enhancements

- **Average Rating Display**: Show user's overall rating
- **Rating Filters**: Filter orders by rating
- **Rating Analytics**: Charts and insights for farmers
- **Notification System**: Notify users when they receive ratings
- **Rating Verification**: Verify only delivered orders can be rated
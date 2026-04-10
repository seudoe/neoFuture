# Order Scheduling System Setup

## Overview
The Order Scheduling system allows buyers (like restaurant owners) to create recurring order requests that automatically post to farmers at specified intervals.

## Features
- **Recurring Orders**: Monthly, weekly, or daily schedules
- **Auto-Generation**: Orders are automatically created and posted to farmers
- **Visual Distinction**: Scheduled orders are highlighted with purple styling
- **Flexible Timing**: Configure when orders are posted relative to delivery date
- **Full Management**: Pause, activate, or delete schedules

## Database Setup

### 1. Run the Schedule Setup SQL
Execute the SQL commands in `ORDER_SCHEDULE_SETUP.sql` in your Supabase SQL editor:

```bash
# This adds the scheduling tables and columns
```

### 2. Verify Tables
After running the SQL, verify these tables exist:
- `order_schedules` - Stores recurring order configurations
- `order_requests` - Updated with `is_scheduled` and `schedule_id` columns

## How It Works

### 1. Creating Schedules
Buyers can create schedules by:
1. Going to Order Requests tab
2. Clicking "Schedule Orders" button
3. Filling out the recurring order form
4. Selecting frequency (monthly/weekly/daily)

### 2. Automatic Processing
The system processes schedules via the `/api/process-schedules` endpoint:
- Checks for schedules due today
- Creates new order requests automatically
- Updates next execution dates
- Marks orders as scheduled with special styling

### 3. Farmer View
Farmers see scheduled orders with:
- Purple border and background gradient
- "Recurring Order Request" badge
- Same application process as regular orders

## Schedule Types

### Monthly
- **Configuration**: Day of month (1-31)
- **Example**: "Every 5th of the month"
- **Use Case**: Monthly restaurant supply orders

### Weekly  
- **Configuration**: Day of week (Sunday-Saturday)
- **Example**: "Every Monday"
- **Use Case**: Weekly fresh produce delivery

### Daily
- **Configuration**: No additional settings needed
- **Example**: "Every day"
- **Use Case**: Daily bread or milk delivery

## Automation Setup

### Option 1: Manual Processing
Call the API endpoint manually to process schedules:
```bash
POST /api/process-schedules
```

### Option 2: Cron Job (Recommended)
Set up a daily cron job to automatically process schedules:

```bash
# Add to your server's crontab (runs daily at 9 AM)
0 9 * * * curl -X POST https://your-domain.com/api/process-schedules
```

### Option 3: Vercel Cron (if using Vercel)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/process-schedules",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## Configuration Options

### Days Before Needed
- **Purpose**: How many days before delivery to post the order
- **Default**: 7 days
- **Example**: If delivery needed on March 15th and set to 7 days, order posts on March 8th

### Multiple Farmers
- **Enabled**: Multiple farmers can apply to the same scheduled order
- **Disabled**: Only one farmer can apply (first-come-first-served)

### Max Price
- **Optional**: Set maximum price per kg for the scheduled orders
- **Helps**: Farmers know the budget constraints upfront

## User Interface

### Buyer Dashboard
- **Two Tabs**: "Order Requests" and "Scheduled Orders"
- **Create Buttons**: "New Request" (green) and "Schedule Orders" (purple)
- **Management**: View, pause, activate, or edit schedules

### Farmer Dashboard
- **Visual Distinction**: Scheduled orders have purple styling
- **Badge**: "Recurring Order Request" badge for easy identification
- **Same Process**: Apply to scheduled orders just like regular orders

## Example Use Cases

### Restaurant Owner
```
Product: Fresh Onions
Quantity: 100 kg
Schedule: Monthly on 5th
Days Before: 7 days
Max Price: ₹40/kg
```
**Result**: Every month on the 5th, an order request for 100kg onions posts to farmers, needed 7 days later (12th).

### Cafe Owner
```
Product: Tomatoes  
Quantity: 50 kg
Schedule: Weekly on Monday
Days Before: 3 days
Max Price: ₹45/kg
```
**Result**: Every Monday, an order request for 50kg tomatoes posts to farmers, needed by Thursday.

## Monitoring

### Check Schedules Due
```bash
GET /api/process-schedules
```
Returns schedules that are due for processing without actually processing them.

### Process Schedules
```bash
POST /api/process-schedules
```
Actually processes the schedules and creates order requests.

## Troubleshooting

### Schedules Not Processing
1. Check if schedules are active (`is_active = true`)
2. Verify `next_execution_date` is today or earlier
3. Check API logs for errors
4. Ensure cron job is running

### Orders Not Appearing
1. Verify schedule was processed successfully
2. Check if order request was created in database
3. Ensure farmers are looking at the correct date range

### Visual Issues
1. Scheduled orders should have purple styling
2. Check `is_scheduled` flag in order_requests table
3. Verify `schedule_id` is properly linked

## Security Notes

- Schedules are tied to buyer accounts (buyer_id)
- Only schedule owners can modify their schedules
- Automatic processing respects all existing security rules
- Scheduled orders follow same application/approval process

## Future Enhancements

Potential improvements:
- Email notifications when schedules execute
- Advanced scheduling (every 2 weeks, specific dates)
- Bulk schedule management
- Schedule templates
- Integration with inventory management
# Quick Test Checklist

## How to Test

1. Start the dev server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Login as a buyer or farmer
4. Follow the test cases below

## Critical Tests (Must Pass)

### 🛒 Buyer Flow
- [ ] Navigate to Browse Products (`/dashboard/buyer/browse`)
- [ ] Click on a product to open details modal
- [ ] Add product to cart from modal
- [ ] Navigate to Cart (`/dashboard/buyer/cart`)
- [ ] Click "Proceed to Checkout"
- [ ] Fill in delivery details
- [ ] Complete payment
- [ ] Verify redirect to My Orders
- [ ] Navigate to My Orders (`/dashboard/buyer/my-orders`)
- [ ] Click "Rate & Review" on an order
- [ ] Submit a rating
- [ ] Verify rating appears on the order

### 🌾 Farmer Flow
- [ ] Navigate to My Crops (`/dashboard/farmer/my-crops`)
- [ ] Click "Edit" on a product
- [ ] Update product details
- [ ] Save changes
- [ ] Navigate to Orders (`/dashboard/farmer/orders`)
- [ ] Click "Rate Buyer" on an order
- [ ] Submit a rating
- [ ] Verify rating appears on the order

## Component-Specific Tests

### RatingModal
- [ ] Opens when clicking "Rate & Review" or "Rate Buyer"
- [ ] Shows correct order details
- [ ] Shows correct target user (seller for buyer, buyer for seller)
- [ ] Star rating works
- [ ] Review text can be entered
- [ ] Submit button works
- [ ] Update existing rating works
- [ ] Close button works
- [ ] No console errors

### PaymentPortal
- [ ] Opens from cart page
- [ ] Shows all cart items
- [ ] Calculates total correctly
- [ ] Delivery form validation works
- [ ] Payment method selection works
- [ ] Payment processing works
- [ ] Success screen shows
- [ ] Cart is cleared after payment
- [ ] Orders are created
- [ ] No console errors

### ProductDetails
- [ ] Opens when clicking a product
- [ ] Shows all product information
- [ ] Image slideshow works
- [ ] AI quality analysis displays
- [ ] Quantity selector works
- [ ] Add to cart button works
- [ ] Close button works
- [ ] No console errors

### EditProduct
- [ ] Opens when clicking "Edit" on farmer's product
- [ ] All fields are populated
- [ ] Form validation works
- [ ] Photo upload works
- [ ] Photo deletion works
- [ ] Save changes works
- [ ] Delete product works (with confirmation)
- [ ] Close button works
- [ ] No console errors

### ReorderModal
- [ ] Opens when clicking "Reorder" on delivered order
- [ ] Shows original order details
- [ ] Quantity adjustment works
- [ ] Price calculation is correct
- [ ] Confirm button creates new order
- [ ] Close button works
- [ ] No console errors

## Navigation Tests

### Buyer Dashboard
- [ ] Overview route works
- [ ] Browse route works
- [ ] Order Requests route works
- [ ] My Orders route works
- [ ] Cart route works
- [ ] Suppliers route works
- [ ] Profile route works
- [ ] Sidebar navigation works
- [ ] Mobile menu works

### Farmer Dashboard
- [ ] Overview route works
- [ ] My Crops route works
- [ ] Add Product route works
- [ ] Order Requests route works
- [ ] Orders route works
- [ ] Reviews route works
- [ ] Subsidies route works
- [ ] Profile route works
- [ ] Sidebar navigation works
- [ ] Mobile menu works

## Error Scenarios to Test

- [ ] Try to rate an order without selecting stars (should show error)
- [ ] Try to checkout with empty cart (should redirect to browse)
- [ ] Try to add more quantity than available stock (should show error)
- [ ] Try to submit payment without filling required fields (should show validation)
- [ ] Try to edit product without making changes (should still save)
- [ ] Try to delete product (should show confirmation)

## Console Checks

Open browser console (F12) and verify:
- [ ] No red errors on page load
- [ ] No errors when opening modals
- [ ] No errors when submitting forms
- [ ] No errors when navigating between routes
- [ ] API calls are successful (check Network tab)

## Performance Checks

- [ ] Pages load quickly
- [ ] No unnecessary re-renders
- [ ] Images load properly
- [ ] Modals open/close smoothly
- [ ] Navigation is instant

## Mobile Responsiveness

- [ ] Test on mobile viewport (Chrome DevTools)
- [ ] Sidebar becomes hamburger menu
- [ ] All modals are scrollable
- [ ] Forms are usable on mobile
- [ ] Images scale properly

## Pass Criteria

✅ All critical tests pass
✅ No console errors
✅ All modals work correctly
✅ All forms submit successfully
✅ Navigation works smoothly
✅ Data persists correctly

## If Tests Fail

1. Check browser console for errors
2. Check Network tab for failed API calls
3. Verify database connection
4. Check component props are correct
5. Verify user authentication state
6. Check for null/undefined values

## Quick Fixes

If you encounter issues:

1. **Modal not opening**: Check `isOpen` prop is passed
2. **Form not submitting**: Check all required props are passed
3. **Data not loading**: Check API endpoints are working
4. **Navigation not working**: Check route paths are correct
5. **Console errors**: Check component prop types match

## Report Issues

When reporting issues, include:
1. Which test failed
2. Error message from console
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots if applicable

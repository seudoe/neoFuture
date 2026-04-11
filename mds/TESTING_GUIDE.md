# Testing Guide - Dashboard Routes

## Quick Test Checklist

### Buyer Dashboard Testing

#### 1. Overview Page (`/dashboard/buyer/overview`)
- [ ] Page loads without errors
- [ ] Dashboard component displays
- [ ] Weather widget shows (if location enabled)
- [ ] Stats are visible
- [ ] Navigation works

#### 2. Browse Products (`/dashboard/buyer/browse`)
- [ ] Products list displays
- [ ] Search functionality works
- [ ] Product cards show images (or fallback icon)
- [ ] Quantity selector works
- [ ] "Add to Cart" button works
- [ ] Product details modal opens on click
- [ ] Toast notifications appear

#### 3. Order Requests (`/dashboard/buyer/order-requests`)
- [ ] Order requests component loads
- [ ] Can view order requests
- [ ] Can respond to requests

#### 4. My Orders (`/dashboard/buyer/my-orders`)
- [ ] Orders list displays
- [ ] Order status badges show correctly
- [ ] Can rate orders
- [ ] Rating modal opens and submits
- [ ] Can reorder delivered items
- [ ] Reorder modal works
- [ ] Can cancel pending/confirmed orders
- [ ] Contact seller button works (opens dialer)
- [ ] Order timeline displays correctly
- [ ] Existing ratings display

#### 5. Cart (`/dashboard/buyer/cart`)
- [ ] Cart items display
- [ ] Can update quantities
- [ ] Can remove items
- [ ] Cart total calculates correctly
- [ ] Bulk pricing applies (10kg+)
- [ ] "View Details" opens product modal
- [ ] "Proceed to Checkout" opens payment portal
- [ ] Payment portal works
- [ ] Cart clears after successful order

#### 6. Suppliers (`/dashboard/buyer/suppliers`)
- [ ] Suppliers list displays
- [ ] Supplier cards show info
- [ ] Email links work
- [ ] Phone links work (opens dialer)
- [ ] Stats display correctly
- [ ] Categories show

#### 7. Profile (`/dashboard/buyer/profile`)
- [ ] User info displays
- [ ] Rating stats show
- [ ] Received reviews display
- [ ] Edit profile button present

### Farmer Dashboard Testing

#### 1. Overview Page (`/dashboard/farmer/overview`)
- [ ] Page loads without errors
- [ ] Dashboard component displays
- [ ] Weather widget shows (if location enabled)
- [ ] Stats are visible
- [ ] Navigation works

#### 2. My Crops (`/dashboard/farmer/my-crops`)
- [ ] Products list displays
- [ ] Product cards show images (or fallback icon)
- [ ] Product info displays correctly
- [ ] "View" button opens product details
- [ ] "Edit" button opens edit modal
- [ ] Edit modal works
- [ ] Can update product
- [ ] Can delete product
- [ ] "Add Product" button navigates correctly

#### 3. Add Product (`/dashboard/farmer/add-product`)
- [ ] Form displays
- [ ] Product name field works
- [ ] Category dropdown works
- [ ] Quantity field works
- [ ] Price fields work
- [ ] State field with autocomplete works
- [ ] State suggestions dropdown appears
- [ ] Smart state matching works
- [ ] Price prediction displays
- [ ] Price prediction updates on changes
- [ ] Photo upload works
- [ ] Can select multiple photos
- [ ] Form submits successfully
- [ ] Redirects to my-crops after submit
- [ ] Cancel button works

#### 4. Order Requests (`/dashboard/farmer/order-requests`)
- [ ] Order requests component loads
- [ ] Can view order requests
- [ ] Can respond to requests

#### 5. Orders (`/dashboard/farmer/orders`)
- [ ] Orders list displays
- [ ] Order status badges show correctly
- [ ] Can confirm pending orders
- [ ] Can decline pending orders
- [ ] Can mark as shipped
- [ ] Can mark as delivered
- [ ] Can rate buyers
- [ ] Rating modal opens and submits
- [ ] Contact buyer button works (opens dialer)
- [ ] Existing ratings display
- [ ] Buyer ratings for farmer display

#### 6. Reviews (`/dashboard/farmer/reviews`)
- [ ] Reviews component loads
- [ ] Received reviews display
- [ ] Rating stats show
- [ ] Empty state shows if no reviews

#### 7. Subsidies (`/dashboard/farmer/subsidies`)
- [ ] Subsidies component loads
- [ ] Subsidy information displays
- [ ] Links work (if any)

#### 8. Profile (`/dashboard/farmer/profile`)
- [ ] User info displays
- [ ] Rating stats show
- [ ] Edit profile button present

### Navigation Testing

#### Desktop
- [ ] Sidebar displays on left
- [ ] All sidebar links work
- [ ] Active route highlights correctly
- [ ] Quick stats display in sidebar
- [ ] Search widget works (buyer only)
- [ ] Header displays correctly
- [ ] Logout button works

#### Mobile
- [ ] Tabs display at top
- [ ] All tabs work
- [ ] Active tab highlights correctly
- [ ] Quick stats cards display
- [ ] Header displays correctly
- [ ] Logout button works
- [ ] Horizontal scroll works for tabs

### Cross-Route Testing

#### Authentication
- [ ] Redirects to login if not authenticated
- [ ] User data persists across routes
- [ ] Logout works from any route

#### Data Consistency
- [ ] Adding product shows in my-crops
- [ ] Adding to cart updates cart count
- [ ] Placing order updates orders list
- [ ] Rating updates display immediately
- [ ] Status changes reflect immediately

#### Browser Navigation
- [ ] Back button works
- [ ] Forward button works
- [ ] Direct URL access works
- [ ] Refresh preserves state

### Error Handling

- [ ] Network errors show toast
- [ ] Loading states display
- [ ] Empty states display correctly
- [ ] Form validation works
- [ ] API errors handled gracefully

## Common Issues and Solutions

### Issue: Page shows "Loading..." forever
**Solution**: Check browser console for errors, verify API endpoints are working

### Issue: Navigation doesn't work
**Solution**: Check that layout.tsx is properly wrapping the routes

### Issue: Data doesn't load
**Solution**: Verify user is logged in, check localStorage for user data

### Issue: Images don't display
**Solution**: Check photo URLs, verify fallback icon displays

### Issue: Modals don't open
**Solution**: Check state management, verify modal components are imported

### Issue: Forms don't submit
**Solution**: Check form validation, verify API endpoints, check network tab

## Performance Testing

- [ ] Pages load quickly
- [ ] Images load progressively
- [ ] No memory leaks
- [ ] Smooth navigation
- [ ] Responsive on mobile

## Browser Testing

Test on:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] Alt text on images

## Final Checklist

- [ ] All buyer routes work
- [ ] All farmer routes work
- [ ] Navigation is smooth
- [ ] Data persists correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All features functional
- [ ] Ready for production

## Reporting Issues

When reporting issues, include:
1. Route/page where issue occurs
2. User type (buyer/farmer)
3. Steps to reproduce
4. Expected vs actual behavior
5. Browser and device info
6. Console errors (if any)
7. Network errors (if any)

## Success Criteria

✅ All routes accessible
✅ All features working
✅ No console errors
✅ Smooth navigation
✅ Data consistency
✅ Mobile responsive
✅ Good performance

Once all items are checked, the migration is ready for production! 🚀

# Tests:

## Buyer
1. Login as Buyer
2. Check all tabs
3. Is it fetching all products
   1. is add to cart working
   2. add to cart with different quantities
   3. Clickin on product card opens detailed component
      1. All details are valid?
      2. Add to cart in it
      3. Contact seller in it
4. fetch all orders
   1. cancel order works?
   2. contact seller works?
   3. track order works?
   4. All the status about delivery
5. fetch all carts
   1. fetch your cart details
   2. view details working?
   3. remove - removes from cart
   4. updating quantity updates price amount shown 
   5. Clicking on **proceed to checkout** reduces quantity of the products in farmer's inventoryf
6. fetch all suppliers (farmers)
   1. All details of the supplier are valid
   2. Clicking on view products redirects to Browse products with Supplier name searched in search-box
   3. clicking on **phone** button redirect to dialing
7. profile
   1. Editing info works


## Farmer
1. login as buyer
2. Check all tabs 
3. My crops - shows all products by farmer
   1. clicking on add product redirects to add-Product tab
   2. Clicking on the product-card OR View opens same product_details component as buyer
      1. Shows AI quality analysis
   3. clicking on Edit on product card opens editable values of the product details
      1. adding more photos works fine 
         1. geolocation works fine
      2. max 5 photos
   4. Save changes works fine
   5. Delete product works fine
4. Add product almost same as above
5. Orders - shows how many orders on my products
   1. Confirming order shows confirmed in both cards : here and buyers orders tab
   2. contact buyer works 
6. Analytics
7. Profile just like buyers profile


---

## Extras - (edge cases)
- Deleting product by a farmer OR Exhaustion of quantity (out of stock) - should not result into disappearance of orders on that product in both farmer's and buyer's pages
- 
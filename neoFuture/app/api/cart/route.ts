import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface CartItem {
  product_id: number;
  quantity: number;
}

// GET - Fetch user's cart
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's cart
    const { data: cart, error } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', parseInt(userId))
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Cart fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cart' },
        { status: 500 }
      );
    }

    // If no cart exists, return empty cart
    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json({
        cart: {
          user_id: parseInt(userId),
          items: [],
          products: []
        }
      });
    }

    // Get product IDs from cart items
    const productIds = cart.items.map((item: CartItem) => item.product_id);

    // Get product details for items in cart
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        users!products_seller_id_fkey (
          name,
          phone_number
        )
      `)
      .in('id', productIds)
      .eq('status', 'active');

    if (productsError) {
      console.error('Products fetch error:', productsError);
      return NextResponse.json({
        cart: {
          ...cart,
          products: []
        }
      });
    }

    // Transform products data and add quantities
    const transformedProducts = products?.map(product => {
      const cartItem = cart.items.find((item: CartItem) => item.product_id === product.id);
      return {
        ...product,
        seller_name: product.users?.name,
        seller_phone: product.users?.phone_number,
        photos: product.photos || [],
        cart_quantity: cartItem?.quantity || 0
      };
    }) || [];

    return NextResponse.json({
      cart: {
        ...cart,
        products: transformedProducts
      }
    });

  } catch (error) {
    console.error('Cart GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add item to cart or update quantity
export async function POST(request: NextRequest) {
  try {
    const { userId, productId, quantity = 1 } = await request.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'User ID and Product ID are required' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if cart exists for user
    const { data: existingCart, error: fetchError } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Cart fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch cart' },
        { status: 500 }
      );
    }

    let updatedItems: CartItem[] = [];

    if (existingCart && existingCart.items) {
      // Cart exists, update or add item
      updatedItems = [...existingCart.items];
      const existingItemIndex = updatedItems.findIndex(item => item.product_id === productId);

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        updatedItems.push({ product_id: productId, quantity });
      }

      // Update existing cart
      const { data: updatedCart, error: updateError } = await supabase
        .from('cart')
        .update({ items: updatedItems })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Cart update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update cart' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        cart: updatedCart,
        message: 'Product added to cart'
      });

    } else {
      // Create new cart
      const newItems = [{ product_id: productId, quantity }];
      
      const { data: newCart, error: createError } = await supabase
        .from('cart')
        .insert({
          user_id: userId,
          items: newItems
        })
        .select()
        .single();

      if (createError) {
        console.error('Cart creation error:', createError);
        return NextResponse.json(
          { error: 'Failed to create cart' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        cart: newCart,
        message: 'Product added to cart'
      });
    }

  } catch (error) {
    console.error('Cart POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update item quantity in cart
export async function PUT(request: NextRequest) {
  try {
    const { userId, productId, quantity } = await request.json();

    if (!userId || !productId || quantity === undefined) {
      return NextResponse.json(
        { error: 'User ID, Product ID, and quantity are required' },
        { status: 400 }
      );
    }

    // Get user's cart
    const { data: cart, error: fetchError } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Cart fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    let updatedItems: CartItem[] = cart.items || [];

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      updatedItems = updatedItems.filter(item => item.product_id !== productId);
    } else {
      // Update quantity
      const itemIndex = updatedItems.findIndex(item => item.product_id === productId);
      if (itemIndex >= 0) {
        updatedItems[itemIndex].quantity = quantity;
      }
    }

    const { data: updatedCart, error: updateError } = await supabase
      .from('cart')
      .update({ items: updatedItems })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Cart update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update cart' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cart: updatedCart,
      message: 'Cart updated'
    });

  } catch (error) {
    console.error('Cart PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const { userId, productId } = await request.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'User ID and Product ID are required' },
        { status: 400 }
      );
    }

    // Get user's cart
    const { data: cart, error: fetchError } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Cart fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Remove product from cart
    const updatedItems = (cart.items || []).filter((item: CartItem) => item.product_id !== productId);

    const { data: updatedCart, error: updateError } = await supabase
      .from('cart')
      .update({ items: updatedItems })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Cart update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update cart' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cart: updatedCart,
      message: 'Product removed from cart'
    });

  } catch (error) {
    console.error('Cart DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
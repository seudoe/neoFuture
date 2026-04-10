import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  role: string;
}

export function useDashboardData(userType: 'buyer' | 'seller') {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.replace('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setLoading(false);
  }, [router]);

  return { user, loading };
}

export function useProducts(sellerId?: number) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (id?: number) => {
    try {
      const url = id ? `/api/products?seller_id=${id}` : '/api/products';
      const response = await fetch(url);
      if (!response.ok) return;
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sellerId !== undefined) {
      fetchProducts(sellerId);
    } else {
      fetchProducts();
    }
  }, [sellerId]);

  return { products, loading, refetch: () => fetchProducts(sellerId) };
}

export function useOrders(userId: number | undefined, userType: 'buyer' | 'seller') {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/orders?userId=${userId}&userType=${userType}`);
      if (!response.ok) return;
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId, userType]);

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const result = await response.json();
      if (result.success) {
        fetchOrders();
        toast.success(`Order ${status} successfully!`);
      } else {
        toast.error(`Failed to ${status} order: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status');
    }
  };

  return { orders, loading, refetch: fetchOrders, updateOrderStatus };
}

export function useCart(userId: number | undefined) {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/cart?userId=${userId}`);
      if (!response.ok) return;
      const data = await response.json();
      setCartItems(data.cart?.products || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [userId]);

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity })
      });

      const result = await response.json();
      if (result.success) {
        fetchCart();
        toast.success(`${quantity}kg added to cart!`);
      } else {
        toast.error(result.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error adding to cart');
    }
  };

  const updateCartQuantity = async (productId: number, quantity: number) => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity })
      });

      const result = await response.json();
      if (result.success) {
        fetchCart();
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeFromCart = async (productId: number) => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId })
      });

      const result = await response.json();
      if (result.success) {
        fetchCart();
        toast.success('Product removed from cart!');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Error removing from cart');
    }
  };

  return { cartItems, loading, addToCart, updateCartQuantity, removeFromCart, refetch: fetchCart };
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('/api/suppliers');
        if (!response.ok) return;
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  return { suppliers, loading };
}

export function useRatings(userId: number | undefined, userType: 'buyer' | 'seller') {
  const [receivedRatings, setReceivedRatings] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      try {
        const [ratingsRes, statsRes] = await Promise.all([
          fetch(`/api/ratings?userId=${userId}&userType=${userType}`),
          fetch(`/api/user-stats?userId=${userId}&userType=${userType}`)
        ]);

        if (ratingsRes.ok) {
          const ratingsData = await ratingsRes.json();
          setReceivedRatings(ratingsData.ratings || []);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setUserStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching ratings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, userType]);

  return { receivedRatings, userStats, loading };
}

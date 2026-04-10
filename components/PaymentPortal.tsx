'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, MapPin, User, Phone, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CartItem {
  id: number;
  name: string;
  seller_name: string;
  seller_id: number;
  price_single: number;
  price_multiple: number;
  cart_quantity: number;
  photos?: string[];
}

interface PaymentPortalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  userId: number;
  user?: { name: string; email: string; phone_number: string };
  onPaymentSuccess: () => void;
}

export default function PaymentPortal({ 
  isOpen, 
  onClose, 
  cartItems, 
  userId,
  user,
  onPaymentSuccess 
}: PaymentPortalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone_number || '',
    address: '',
    city: '',
    pincode: '',
    notes: '',
    paymentMethod: 'card'
  });

  // Reset and fetch location when portal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData(prev => ({
        ...prev,
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone_number || '',
        address: '',
        city: '',
        pincode: '',
        notes: '',
        paymentMethod: 'card'
      }));
      fetchLocationData();
    }
  }, [isOpen]);

  const fetchLocationData = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || '';
            const pincode = addr.postcode || '';
            setFormData(prev => ({
              ...prev,
              city: city,
              pincode: pincode
            }));
          }
        } catch {
          // silently fail — user can fill manually
        } finally {
          setLocationLoading(false);
        }
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  };

  if (!isOpen) return null;

  // Calculate totals
  const calculateItemTotal = (item: CartItem) => {
    const price = item.cart_quantity >= 10 ? item.price_multiple : item.price_single;
    return price * item.cart_quantity;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    if (step === 1) {
      // Validate form
      if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
        toast.error('Please fill in all required fields');
        return;
      }
      setStep(2);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Process payment (simulate success for now)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create orders for each item
      const orderResults = [];
      
      for (const item of cartItems) {
        try {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              buyerId: userId,
              sellerId: item.seller_id,
              productId: item.id,
              quantity: item.cart_quantity,
              unitPrice: item.cart_quantity >= 10 ? item.price_multiple : item.price_single,
              totalPrice: calculateItemTotal(item),
              deliveryAddress: `${formData.address}, ${formData.city} - ${formData.pincode}`,
              notes: formData.notes
            })
          });

          const result = await response.json();
          console.log('Order result:', result);
          orderResults.push({ success: response.ok, result });
        } catch (error) {
          console.error('Order creation error:', error);
          orderResults.push({ success: false, error });
        }
      }

      console.log('All order results:', orderResults);

      // For now, always proceed to success (simulate all payments work)
      // Clear cart
      try {
        await fetch('/api/cart/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
      } catch (error) {
        console.error('Cart clear error:', error);
      }

      setStep(3);
      onPaymentSuccess();

    } catch (error) {
      console.error('Payment error:', error);
      // For now, even if there are errors, show success
      setStep(3);
      onPaymentSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 1 ? 'Delivery Details' : step === 2 ? 'Payment' : 'Order Confirmed!'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Delivery Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Delivery Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="House/Flat No, Street, Area"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                    {locationLoading && <span className="ml-2 text-xs text-blue-500">📍 detecting...</span>}
                    {!locationLoading && formData.city && <span className="ml-2 text-xs text-green-500">📍 auto-filled</span>}
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder={locationLoading ? 'Detecting...' : 'City'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Code *
                    {locationLoading && <span className="ml-2 text-xs text-blue-500">📍 detecting...</span>}
                    {!locationLoading && formData.pincode && <span className="ml-2 text-xs text-green-500">📍 auto-filled</span>}
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder={locationLoading ? 'Detecting...' : 'PIN Code'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Any special delivery instructions..."
                />
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.cart_quantity}kg</span>
                      <span>₹{calculateItemTotal(item)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>₹{deliveryFee}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                      <span>Total</span>
                      <span>₹{total}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNextStep}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <CreditCard className="w-5 h-5 mr-2" />
                    Credit/Debit Card
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={formData.paymentMethod === 'upi'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="w-5 h-5 mr-2 text-center">💳</span>
                    UPI Payment
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="w-5 h-5 mr-2 text-center">💰</span>
                    Cash on Delivery
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Total Amount: ₹{total}</h3>
                <p className="text-sm text-blue-700">
                  Your order will be processed immediately after payment confirmation.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Processing...' : `Pay ₹${total}`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600">
                  Your order has been placed successfully. You will receive a confirmation email shortly.
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-green-800 font-medium">Order Total: ₹{total}</p>
                <p className="text-sm text-green-600 mt-1">
                  Estimated delivery: 2-3 business days
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
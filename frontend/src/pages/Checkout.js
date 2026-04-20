import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import LocationSelector from '../components/LocationSelector';
import { toast } from 'sonner';
import { CreditCard, Banknote, ArrowLeft, Check, MapPin } from 'lucide-react';

const Checkout = () => {
  const { cartItems, cartRestaurant, cartTotal, clearCart, selectedAddress, setSelectedAddress } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  const [address, setAddress] = useState({
    street: selectedAddress?.street || user?.address?.street || '',
    city: selectedAddress?.city || user?.address?.city || 'Mumbai',
    state: selectedAddress?.state || user?.address?.state || 'Maharashtra',
    pincode: selectedAddress?.pincode || user?.address?.pincode || '',
    lat: selectedAddress?.lat,
    lng: selectedAddress?.lng,
  });
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Update address if selectedAddress changes (from context)
    if (selectedAddress) {
      setAddress({
        street: selectedAddress.street || '',
        city: selectedAddress.city || 'Mumbai',
        state: selectedAddress.state || 'Maharashtra',
        pincode: selectedAddress.pincode || '',
        lat: selectedAddress.lat,
        lng: selectedAddress.lng,
      });
    }
  }, [selectedAddress]);

  const handleSelectAddress = (selectedAddr) => {
    setSelectedAddress(selectedAddr);
    setAddress({
      street: selectedAddr.street || '',
      city: selectedAddr.city || 'Mumbai',
      state: selectedAddr.state || 'Maharashtra',
      pincode: selectedAddr.pincode || '',
      lat: selectedAddr.lat,
      lng: selectedAddr.lng,
    });
    toast.success('Address updated!');
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const handlePlaceOrder = async () => {
    if (!address.street || !phone) {
      toast.error('Please fill in all delivery details');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        restaurantId: cartRestaurant._id,
        items: cartItems.map(item => ({
          menuItemId: item._id,
          name: item.name,
          quantity: item.quantity
        })),
        deliveryAddress: address,
        paymentMethod,
        customerPhone: phone,
        notes
      };

      const response = await api.post('/api/orders', orderData);

      if (paymentMethod === 'online' && response.data.razorpayOrderId) {
        toast.info('Razorpay test mode: Payment simulated successfully');
        await api.post('/api/orders/verify-payment', {
          orderId: response.data.order._id,
          razorpayPaymentId: 'pay_test_' + Date.now(),
          razorpayOrderId: response.data.razorpayOrderId,
          razorpaySignature: 'test_signature'
        }).catch(() => {});
      }

      clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8" data-testid="checkout-page">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cart')} className="rounded-full" data-testid="back-to-cart">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-heading font-semibold">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left: Delivery + Payment */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-border/50" data-testid="delivery-section">
            <h2 className="font-heading font-medium text-lg mb-4">Delivery Address</h2>
            <div className="space-y-4">
              <Button
                onClick={() => setShowLocationSelector(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
                data-testid="open-address-selector"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {address.street ? `📍 ${address.street}` : 'Select Delivery Location'}
              </Button>

              {/* Display Selected Address */}
              {address.street && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-xs font-semibold text-green-800 mb-1">Delivery Address</p>
                  <p className="text-sm text-green-700">
                    {address.street}, {address.city}, {address.state} {address.pincode}
                  </p>
                </div>
              )}

              <div>
                <Label>Phone Number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className="mt-1" data-testid="phone-checkout-input" />
              </div>
              <div>
                <Label>Delivery Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." className="mt-1" data-testid="notes-input" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-border/50" data-testid="payment-section">
            <h2 className="font-heading font-medium text-lg mb-4">Payment Method</h2>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
                <RadioGroupItem value="cash" id="cash" data-testid="payment-cash" />
                <Banknote className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
                <RadioGroupItem value="online" id="online" data-testid="payment-online" />
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">Pay Online (Razorpay)</p>
                  <p className="text-xs text-muted-foreground">UPI, Cards, Net Banking (Test Mode)</p>
                </div>
              </label>
            </RadioGroup>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl p-6 border border-border/50 sticky top-20" data-testid="order-summary">
            <h2 className="font-heading font-medium text-lg mb-4">Order Summary</h2>
            <p className="text-sm text-muted-foreground mb-4">From {cartRestaurant?.name}</p>
            <div className="space-y-3 mb-4">
              {cartItems.map(item => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>&#8377;{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>&#8377;{cartTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span data-testid="checkout-total">&#8377;{cartTotal}</span>
              </div>
            </div>
            <Button
              className="w-full rounded-full mt-6"
              onClick={handlePlaceOrder}
              disabled={loading}
              data-testid="place-order-button"
            >
              {loading ? 'Placing Order...' : `Place Order - ₹${cartTotal}`}
            </Button>
          </div>
        </div>
      </div>

      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onSelectAddress={handleSelectAddress}
      />
    </div>
  );
};

export default Checkout;

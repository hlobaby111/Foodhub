import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Separator } from '../components/ui/separator';
import LocationSelector from '../components/LocationSelector';
import AddressSelector from '../components/AddressSelector';
import { toast } from 'sonner';
import { openRazorpay } from '../utils/razorpay';
import {
  Trash2, Plus, Minus, ArrowLeft, ShoppingCart, StickyNote,
  Tag, Clock, CreditCard, Banknote, ChevronRight, Sparkles, MapPin
} from 'lucide-react';

const Cart = () => {
  const { cartItems, cartRestaurant, updateQuantity, removeFromCart, clearCart, cartTotal, selectedAddress, setSelectedAddress } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
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

  useEffect(() => {
    if (cartRestaurant) {
      fetchSuggestedItems();
    }
  }, [cartRestaurant]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSuggestedItems = async () => {
    try {
      const response = await api.get(`/api/restaurants/${cartRestaurant._id}`);
      const allMenu = response.data.menuItems || [];
      const cartIds = cartItems.map(i => i._id);
      const suggestions = allMenu.filter(i => !cartIds.includes(i._id)).slice(0, 4);
      setSuggestedItems(suggestions);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Enter a coupon code');
      return;
    }
    if (couponCode.toUpperCase() === 'WELCOME50') {
      setCouponApplied({ code: 'WELCOME50', discount: Math.min(50, cartTotal * 0.1), type: '10% off up to 50' });
      toast.success('Coupon applied! 10% off up to Rs.50');
    } else if (couponCode.toUpperCase() === 'FOOD100') {
      setCouponApplied({ code: 'FOOD100', discount: Math.min(100, cartTotal * 0.15), type: '15% off up to 100' });
      toast.success('Coupon applied! 15% off up to Rs.100');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const { addToCart } = useCart();

  const handleAddSuggested = (item) => {
    addToCart(item, cartRestaurant);
    toast.success(`${item.name} added`);
    setSuggestedItems(prev => prev.filter(i => i._id !== item._id));
  };

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

  const discount = couponApplied?.discount || 0;
  const finalTotal = cartTotal - discount;
  const deliveryFee = cartTotal >= 299 ? 0 : 30;
  const grandTotal = finalTotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!address.street || !phone) {
      toast.error('Please fill in all delivery details');
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        restaurantId: cartRestaurant._id,
        items: cartItems.map(item => ({ menuItemId: item._id, name: item.name, quantity: item.quantity })),
        deliveryAddress: address,
        paymentMethod,
        customerPhone: phone,
        notes
      };
      const response = await api.post('/api/orders', orderData);
      if (paymentMethod === 'online' && response.data.razorpayOrderId) {
        await openRazorpay({
          orderId: response.data.order._id,
          razorpayOrderId: response.data.razorpayOrderId,
          razorpayKeyId: response.data.razorpayKeyId,
          amount: totalAmount,
          customerPhone: phone,
          onSuccess: async () => {
            clearCart();
            toast.success('Payment successful! Order placed.');
            navigate('/orders', { state: { newOrder: response.data.order } });
          },
          onFailure: () => {
            toast.error('Payment failed or was cancelled.');
          },
        });
        return; // navigation handled inside onSuccess
      }
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders', { state: { newOrder: response.data.order } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4" data-testid="empty-cart">
        <img
          src="https://static.prod-images.emergentagent.com/jobs/d81d7df0-2199-4d49-83c7-9882eb41f4a9/images/733b2ed47afd50d90ab55f20895f67fff35045ac833601662c30a886b1ab42a3.png"
          alt="Empty cart"
          className="w-40 h-40 sm:w-48 sm:h-48 object-contain mb-6 opacity-80"
        />
        <h2 className="text-xl sm:text-2xl font-heading font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6 text-sm">Add some delicious food to get started</p>
        <Button className="rounded-full" onClick={() => navigate('/home')} data-testid="browse-restaurants-button">
          Browse Restaurants
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8" data-testid="cart-page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full flex-shrink-0" data-testid="back-from-cart">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-semibold">Your Cart</h1>
          {cartRestaurant && (
            <p className="text-xs sm:text-sm text-muted-foreground">From {cartRestaurant.name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-5">

          {/* Cart Items */}
          <div className="bg-white rounded-2xl border border-border/50 overflow-hidden" data-testid="cart-items-section">
            <div className="p-4 sm:p-5 border-b border-border/50">
              <h2 className="font-heading font-medium text-base sm:text-lg flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                Cart Items ({cartItems.length})
              </h2>
            </div>
            <div className="divide-y divide-border/50">
              {cartItems.map(item => (
                <div key={item._id} className="flex items-center gap-3 p-4 sm:p-5" data-testid={`cart-item-${item._id}`}>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.image?.url || 'https://images.unsplash.com/photo-1617686578451-46fa5f114c9d?w=200&h=200&fit=crop'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.isVegetarian && (
                        <span className="w-3.5 h-3.5 border border-green-600 rounded-sm flex items-center justify-center flex-shrink-0">
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                        </span>
                      )}
                      <h3 className="font-medium text-sm sm:text-base truncate">{item.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">&#8377;{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <Button size="icon" variant="outline" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" onClick={() => updateQuantity(item._id, item.quantity - 1)} data-testid={`cart-decrease-${item._id}`}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-medium w-6 text-center text-sm" data-testid={`cart-quantity-${item._id}`}>{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" onClick={() => updateQuantity(item._id, item.quantity + 1)} data-testid={`cart-increase-${item._id}`}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm sm:text-base">&#8377;{item.price * item.quantity}</p>
                    <button onClick={() => removeFromCart(item._id)} className="text-xs text-red-500 hover:text-red-700 mt-1" data-testid={`cart-remove-${item._id}`}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Add More Items */}
            <div className="p-4 sm:p-5 border-t border-border/50">
              <Button
                variant="ghost"
                className="text-primary hover:text-primary/80 text-sm font-medium p-0 h-auto"
                onClick={() => navigate(`/restaurant/${cartRestaurant?._id}`)}
                data-testid="add-more-items-button"
              >
                <Plus className="w-4 h-4 mr-1" /> Add more items
              </Button>
            </div>
          </div>

          {/* Notes for Restaurant */}
          <div className="bg-white rounded-2xl border border-border/50 p-4 sm:p-5" data-testid="notes-section">
            <h3 className="font-heading font-medium text-sm sm:text-base flex items-center gap-2 mb-3">
              <StickyNote className="w-4 h-4 text-muted-foreground" />
              Add a note for the restaurant
            </h3>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra spicy, no onions, ring the bell..."
              className="text-sm"
              data-testid="restaurant-notes-input"
            />
          </div>

          {/* Suggested Items */}
          {suggestedItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-border/50 p-4 sm:p-5" data-testid="suggested-items-section">
              <h3 className="font-heading font-medium text-sm sm:text-base flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Add something more
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedItems.map(item => (
                  <div key={item._id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-border transition-colors" data-testid={`suggested-${item._id}`}>
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image?.url || 'https://images.unsplash.com/photo-1617686578451-46fa5f114c9d?w=120&h=120&fit=crop'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">&#8377;{item.price}</p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-full text-xs h-7 px-3 flex-shrink-0" onClick={() => handleAddSuggested(item)} data-testid={`add-suggested-${item._id}`}>
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply Coupon */}
          <div className="bg-white rounded-2xl border border-border/50 p-4 sm:p-5" data-testid="coupon-section">
            <h3 className="font-heading font-medium text-sm sm:text-base flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-primary" />
              Apply Coupon
            </h3>
            {couponApplied ? (
              <div className="flex items-center justify-between bg-green-50 rounded-xl p-3" data-testid="coupon-applied">
                <div>
                  <p className="font-medium text-sm text-green-800">{couponApplied.code}</p>
                  <p className="text-xs text-green-600">{couponApplied.type} &middot; Saving &#8377;{couponApplied.discount.toFixed(0)}</p>
                </div>
                <Button size="sm" variant="ghost" className="text-red-500 text-xs h-7" onClick={() => { setCouponApplied(null); setCouponCode(''); }} data-testid="remove-coupon">
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 text-sm uppercase"
                  data-testid="coupon-input"
                />
                <Button variant="outline" className="rounded-full text-sm" onClick={handleApplyCoupon} data-testid="apply-coupon-button">
                  Apply
                </Button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">Try: WELCOME50, FOOD100</p>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-2xl border border-border/50 p-4 sm:p-5" data-testid="delivery-details-section">
            <h3 className="font-heading font-medium text-sm sm:text-base flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Delivery Details
            </h3>
            <div className="bg-accent/50 rounded-xl p-3 mb-4 flex items-center gap-3" data-testid="delivery-time-estimate">
              <Clock className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Estimated delivery: {cartRestaurant?.deliveryTime || '30-40 mins'}</p>
                <p className="text-xs text-muted-foreground">From {cartRestaurant?.name}</p>
              </div>
            </div>
            <div className="space-y-3">
              {/* Location Button */}
              <Button
                onClick={() => setShowLocationSelector(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
                data-testid="open-address-selector"
              >
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
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

              {/* Phone Input */}
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className="mt-1 text-sm" data-testid="cart-phone-input" />
              </div>
            </div>
          </div>

          {/* Payment Method - visible on mobile, hidden on desktop (shown in sidebar) */}
          <div className="lg:hidden bg-white rounded-2xl border border-border/50 p-4 sm:p-5" data-testid="payment-mobile">
            <h3 className="font-heading font-medium text-sm sm:text-base mb-3">Payment Method</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
                <RadioGroupItem value="cash" data-testid="payment-cash-mobile" />
                <Banknote className="w-4 h-4 text-green-600" />
                <span className="font-medium">Cash on Delivery</span>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
                <RadioGroupItem value="online" data-testid="payment-online-mobile" />
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Pay Online (Test Mode)</span>
              </label>
            </RadioGroup>
          </div>
        </div>

        {/* Right Sidebar - Order Summary */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20 space-y-5">
            {/* Payment on desktop */}
            <div className="hidden lg:block bg-white rounded-2xl border border-border/50 p-5" data-testid="payment-desktop">
              <h3 className="font-heading font-medium text-base mb-3">Payment Method</h3>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
                  <RadioGroupItem value="cash" data-testid="payment-cash" />
                  <Banknote className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Cash on Delivery</p>
                    <p className="text-[11px] text-muted-foreground">Pay when delivered</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
                  <RadioGroupItem value="online" data-testid="payment-online" />
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Pay Online</p>
                    <p className="text-[11px] text-muted-foreground">UPI, Cards (Test Mode)</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-border/50 p-4 sm:p-5" data-testid="order-summary">
              <h3 className="font-heading font-medium text-base sm:text-lg mb-4">Order Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>&#8377;{cartTotal}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({couponApplied.code})</span>
                    <span>-&#8377;{discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  {deliveryFee === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span>&#8377;{deliveryFee}</span>
                  )}
                </div>
                {deliveryFee > 0 && (
                  <p className="text-[11px] text-muted-foreground">Free delivery on orders above &#8377;299</p>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base pt-1">
                  <span>Total</span>
                  <span data-testid="cart-grand-total">&#8377;{grandTotal.toFixed(0)}</span>
                </div>
              </div>

              <Button
                className="w-full rounded-full mt-5 h-12 text-sm sm:text-base"
                onClick={handlePlaceOrder}
                disabled={loading}
                data-testid="place-order-button"
              >
                {loading ? 'Placing Order...' : `Place Order - ₹${grandTotal.toFixed(0)}`}
              </Button>

              <Button variant="ghost" className="w-full mt-2 text-xs text-muted-foreground" onClick={clearCart} data-testid="clear-cart-button">
                Clear Cart
              </Button>
            </div>
          </div>
        </div>
      </div>

      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onSelectAddress={handleSelectAddress}
        onAddManualAddress={() => setShowAddressSelector(true)}
      />

      <AddressSelector
        isOpen={showAddressSelector}
        onClose={() => setShowAddressSelector(false)}
        onSelectAddress={handleSelectAddress}
        currentLocation={{ lat: address.lat, lng: address.lng }}
      />
    </div>
  );
};

export default Cart;

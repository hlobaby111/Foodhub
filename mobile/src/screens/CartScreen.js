import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { theme } from '../utils/theme';
import RazorpayCheckout from '../components/RazorpayCheckout';

const CartScreen = () => {
  const navigation = useNavigation();
  const { cartItems, cartRestaurant, updateQuantity, removeFromCart, clearCart, cartTotal, selectedAddress, setSelectedAddress } = useCart();
  const { user } = useAuth();

  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [suggestedItems, setSuggestedItems] = useState([]);
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
  const [razorpayModal, setRazorpayModal] = useState(null); // { razorpayKeyId, razorpayOrderId, orderId, amount, orderObj }

  useEffect(() => {
    if (cartRestaurant) {
      fetchSuggestedItems();
    }
  }, [cartRestaurant]);

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
    if (!couponCode.trim()) return;

    if (couponCode.toUpperCase() === 'WELCOME50') {
      setCouponApplied({ code: 'WELCOME50', discount: Math.min(50, cartTotal * 0.1), type: '10% off up to 50' });
    } else if (couponCode.toUpperCase() === 'FOOD100') {
      setCouponApplied({ code: 'FOOD100', discount: Math.min(100, cartTotal * 0.15), type: '15% off up to 100' });
    }
  };

  const { addToCart } = useCart();

  const handleAddSuggested = (item) => {
    addToCart(item, cartRestaurant);
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
  };

  const discount = couponApplied?.discount || 0;
  const finalTotal = cartTotal - discount;
  const deliveryFee = cartTotal >= 299 ? 0 : 30;
  const grandTotal = finalTotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!address.street || !phone) {
      alert('Please fill in all delivery details');
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
        setRazorpayModal({
          razorpayKeyId: response.data.razorpayKeyId,
          razorpayOrderId: response.data.razorpayOrderId,
          orderId: response.data.order._id,
          amount: grandTotal,
          orderObj: response.data.order,
        });
        return; // wait for WebView callback
      }

      if (paymentMethod === 'online' && !response.data.razorpayOrderId) {
        throw new Error('Online payment could not be initialized. Please try again or use Cash on Delivery.');
      }

      clearCart();
      navigation.navigate('Orders', { newOrder: response.data.order });
    } catch (error) {
      console.error('Failed to place order:', error);
      alert(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Image
          source={{ uri: 'https://static.prod-images.emergentagent.com/jobs/d81d7df0-2199-4d49-83c7-9882eb41f4a9/images/733b2ed47afd50d90ab55f20895f67fff35045ac833601662c30a886b1ab42a3.png' }}
          style={styles.emptyImage}
        />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add some delicious food to get started</Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('HomeMain')}
        >
          <Text style={styles.browseButtonText}>Browse Restaurants</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Your Cart</Text>
          {cartRestaurant && (
            <Text style={styles.headerSubtitle}>From {cartRestaurant.name}</Text>
          )}
        </View>
      </View>

      {/* Cart Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="cart" size={16} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Cart Items ({cartItems.length})</Text>
        </View>

        {cartItems.map(item => (
          <View key={item._id} style={styles.cartItem}>
            <Image
              source={{
                uri: item.image?.url || 'https://images.unsplash.com/photo-1617686578451-46fa5f114c9d?w=200&h=200&fit=crop'
              }}
              style={styles.cartItemImage}
            />
            <View style={styles.cartItemInfo}>
              <View style={styles.cartItemHeader}>
                {item.isVegetarian && (
                  <View style={styles.vegIconBorder}>
                    <View style={styles.vegIconDot} />
                  </View>
                )}
                <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
              </View>
              <Text style={styles.cartItemPrice}>₹{item.price} each</Text>
            </View>

            <View style={styles.cartItemControls}>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item._id, item.quantity - 1)}
                >
                  <Icon name="minus" size={14} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item._id, item.quantity + 1)}
                >
                  <Icon name="plus" size={14} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.cartItemTotal}>₹{item.price * item.quantity}</Text>
              <TouchableOpacity onPress={() => removeFromCart(item._id)}>
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={() => navigation.navigate('RestaurantDetail', { id: cartRestaurant?._id })}
        >
          <Icon name="plus" size={16} color={theme.colors.primary} />
          <Text style={styles.addMoreText}>Add more items</Text>
        </TouchableOpacity>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="note-text" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.sectionTitle}>Add a note for the restaurant</Text>
        </View>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Extra spicy, no onions, ring the bell..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />
      </View>

      {/* Suggested Items */}
      {suggestedItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="sparkles" size={16} color="#EAB308" />
            <Text style={styles.sectionTitle}>Add something more</Text>
          </View>
          {suggestedItems.map(item => (
            <View key={item._id} style={styles.suggestedItem}>
              <Image
                source={{
                  uri: item.image?.url || 'https://images.unsplash.com/photo-1617686578451-46fa5f114c9d?w=120&h=120&fit=crop'
                }}
                style={styles.suggestedImage}
              />
              <View style={styles.suggestedInfo}>
                <Text style={styles.suggestedName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.suggestedPrice}>₹{item.price}</Text>
              </View>
              <TouchableOpacity
                style={styles.suggestedAddButton}
                onPress={() => handleAddSuggested(item)}
              >
                <Icon name="plus" size={12} color={theme.colors.primary} />
                <Text style={styles.suggestedAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Coupon */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="tag" size={16} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Apply Coupon</Text>
        </View>

        {couponApplied ? (
          <View style={styles.couponApplied}>
            <View>
              <Text style={styles.couponCode}>{couponApplied.code}</Text>
              <Text style={styles.couponDiscount}>
                {couponApplied.type} · Saving ₹{couponApplied.discount.toFixed(0)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { setCouponApplied(null); setCouponCode(''); }}>
              <Text style={styles.removeCoupon}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                value={couponCode}
                onChangeText={(text) => setCouponCode(text.toUpperCase())}
                placeholder="Enter coupon code"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.applyCouponButton} onPress={handleApplyCoupon}>
                <Text style={styles.applyCouponText}>Apply</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.couponHint}>Try: WELCOME50, FOOD100</Text>
          </>
        )}
      </View>

      {/* Delivery Details */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="clock-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.sectionTitle}>Delivery Details</Text>
        </View>

        <View style={styles.deliveryEstimate}>
          <Icon name="clock-outline" size={20} color={theme.colors.primary} />
          <View style={styles.deliveryEstimateText}>
            <Text style={styles.deliveryTime}>
              Estimated delivery: {cartRestaurant?.deliveryTime || '30-40 mins'}
            </Text>
            <Text style={styles.deliveryFrom}>From {cartRestaurant?.name}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => navigation.navigate('LocationSelector', {
            onSelectAddress: handleSelectAddress,
          })}
        >
          <Icon name="map-marker" size={18} color={theme.colors.primary} />
          <Text style={styles.locationButtonText}>
            {address.street ? `📍 ${address.street}` : 'Select Delivery Location'}
          </Text>
        </TouchableOpacity>

        {/* Display Selected Address */}
        {address.street && (
          <View style={styles.selectedAddressBox}>
            <Text style={styles.selectedAddressLabel}>Delivery Address</Text>
            <Text style={styles.selectedAddressText}>
              {address.street}, {address.city}, {address.state} {address.pincode}
            </Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="9876543210"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>

        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
          onPress={() => setPaymentMethod('cash')}
        >
          <Icon name="cash" size={16} color={theme.colors.green[600]} />
          <Text style={styles.paymentOptionText}>Cash on Delivery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'online' && styles.paymentOptionActive]}
          onPress={() => setPaymentMethod('online')}
        >
          <Icon name="credit-card" size={16} color={theme.colors.info} />
          <Text style={styles.paymentOptionText}>Pay Online (Test Mode)</Text>
        </TouchableOpacity>
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)
          </Text>
          <Text style={styles.summaryValue}>₹{cartTotal}</Text>
        </View>

        {couponApplied && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.green[600] }]}>
              Coupon ({couponApplied.code})
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.green[600] }]}>
              -₹{discount.toFixed(0)}
            </Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          {deliveryFee === 0 ? (
            <Text style={[styles.summaryValue, { color: theme.colors.green[600] }]}>Free</Text>
          ) : (
            <Text style={styles.summaryValue}>₹{deliveryFee}</Text>
          )}
        </View>

        {deliveryFee > 0 && (
          <Text style={styles.deliveryHint}>Free delivery on orders above ₹299</Text>
        )}

        <View style={styles.separator} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotal}>Total</Text>
          <Text style={styles.summaryTotal}>₹{grandTotal.toFixed(0)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order - ₹{grandTotal.toFixed(0)}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearCartButton} onPress={clearCart}>
          <Text style={styles.clearCartText}>Clear Cart</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>

    <RazorpayCheckout
      visible={!!razorpayModal}
      razorpayKeyId={razorpayModal?.razorpayKeyId}
      razorpayOrderId={razorpayModal?.razorpayOrderId}
      orderId={razorpayModal?.orderId}
      amount={razorpayModal?.amount}
      customerPhone={phone}
      onSuccess={() => {
        const orderObj = razorpayModal?.orderObj;
        setRazorpayModal(null);
        clearCart();
        navigation.navigate('Orders', { newOrder: orderObj });
      }}
      onFailure={(msg) => { alert(msg || 'Payment failed.'); }}
      onClose={() => setRazorpayModal(null)}
    />
  </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: theme.colors.background,
  },
  emptyImage: {
    width: 160,
    height: 160,
    opacity: 0.8,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Section
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },

  // Cart Items
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cartItemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: theme.colors.muted,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vegIconBorder: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.green[600],
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.green[600],
  },
  cartItemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  cartItemPrice: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  cartItemControls: {
    alignItems: 'flex-end',
    gap: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 12,
    color: theme.colors.text,
  },
  cartItemTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  removeButton: {
    fontSize: 12,
    color: theme.colors.error,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },

  // Notes
  notesInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // Suggested Items
  suggestedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 12,
  },
  suggestedImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: theme.colors.muted,
  },
  suggestedInfo: {
    flex: 1,
  },
  suggestedName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  suggestedPrice: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  suggestedAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  suggestedAddText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
  },

  // Coupon
  couponApplied: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.green[50],
    padding: 12,
    borderRadius: 12,
  },
  couponCode: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.green[700],
  },
  couponDiscount: {
    fontSize: 12,
    color: theme.colors.green[600],
    marginTop: 2,
  },
  removeCoupon: {
    fontSize: 12,
    color: theme.colors.error,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text,
  },
  applyCouponButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  applyCouponText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  couponHint: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },

  // Delivery
  deliveryEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.muted,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  deliveryEstimateText: {
    flex: 1,
  },
  deliveryTime: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  deliveryFrom: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  formGroup: {
    marginTop: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 12,
    color: theme.colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text,
  },

  // Payment
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 8,
  },
  paymentOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}08`,
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: theme.colors.text,
  },
  deliveryHint: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  placeOrderButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  clearCartButton: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  clearCartText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 10,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  selectedAddressBox: {
    backgroundColor: '#C8E6C9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  selectedAddressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  selectedAddressText: {
    fontSize: 13,
    color: '#1B5E20',
    lineHeight: 18,
  },
});

export default CartScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TextInput, Button, RadioButton, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { theme } from '../utils/theme';

export default function CheckoutScreen({ navigation }) {
  const { user } = useAuth();
  const { cart, restaurant, cartTotal, clearCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // New address form
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    label: 'Home',
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/addresses');
      const addressList = response.data.addresses || [];
      setAddresses(addressList);
      
      if (addressList.length > 0 && !selectedAddress) {
        setSelectedAddress(addressList[0]._id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      Alert.alert('Error', 'Please fill all address fields');
      return;
    }

    try {
      const response = await api.post('/api/addresses', newAddress);
      const savedAddress = response.data.address;
      setAddresses([...addresses, savedAddress]);
      setSelectedAddress(savedAddress._id);
      setShowAddAddress(false);
      setNewAddress({ street: '', city: '', state: '', zipCode: '', label: 'Home' });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    try {
      setPlacing(true);
      const orderData = {
        restaurantId: restaurant._id,
        items: cart.map((item) => ({
          menuItem: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress: selectedAddress,
        paymentMethod,
        deliveryNotes,
      };

      const response = await api.post('/api/orders', orderData);
      const order = response.data.order;

      // Clear cart
      await clearCart();

      // Navigate to order tracking
      navigation.reset({
        index: 0,
        routes: [
          { name: 'Main' },
          { name: 'OrderTracking', params: { orderId: order._id } },
        ],
      });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const deliveryFee = 40;
  const gst = (cartTotal * 0.05).toFixed(0);
  const total = cartTotal + deliveryFee + parseFloat(gst);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          
          {addresses.map((address) => (
            <TouchableOpacity
              key={address._id}
              style={[
                styles.addressCard,
                selectedAddress === address._id && styles.selectedAddress,
              ]}
              onPress={() => setSelectedAddress(address._id)}
            >
              <RadioButton
                value={address._id}
                status={selectedAddress === address._id ? 'checked' : 'unchecked'}
                onPress={() => setSelectedAddress(address._id)}
                color={theme.colors.primary}
              />
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>{address.label}</Text>
                <Text style={styles.addressText}>
                  {address.street}, {address.city}, {address.state} {address.zipCode}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {!showAddAddress ? (
            <Button
              mode="outlined"
              onPress={() => setShowAddAddress(true)}
              style={styles.addAddressButton}
              textColor={theme.colors.primary}
            >
              + Add New Address
            </Button>
          ) : (
            <View style={styles.newAddressForm}>
              <TextInput
                label="Street Address"
                value={newAddress.street}
                onChangeText={(text) => setNewAddress({ ...newAddress, street: text })}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="City"
                value={newAddress.city}
                onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="State"
                value={newAddress.state}
                onChangeText={(text) => setNewAddress({ ...newAddress, state: text })}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="ZIP Code"
                value={newAddress.zipCode}
                onChangeText={(text) => setNewAddress({ ...newAddress, zipCode: text })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
              <View style={styles.formButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowAddAddress(false)}
                  style={styles.formButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAddAddress}
                  style={styles.formButton}
                  buttonColor={theme.colors.primary}
                >
                  Save
                </Button>
              </View>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => setPaymentMethod('cod')}
          >
            <RadioButton
              value="cod"
              status={paymentMethod === 'cod' ? 'checked' : 'unchecked'}
              onPress={() => setPaymentMethod('cod')}
              color={theme.colors.primary}
            />
            <Icon name="cash" size={24} color={theme.colors.text} />
            <Text style={styles.paymentText}>Cash on Delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => setPaymentMethod('online')}
          >
            <RadioButton
              value="online"
              status={paymentMethod === 'online' ? 'checked' : 'unchecked'}
              onPress={() => setPaymentMethod('online')}
              color={theme.colors.primary}
            />
            <Icon name="credit-card" size={24} color={theme.colors.text} />
            <Text style={styles.paymentText}>Online Payment</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Instructions (Optional)</Text>
          <TextInput
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            placeholder="Add instructions for delivery partner..."
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
        </View>

        {/* Bill Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{cartTotal.toFixed(0)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{deliveryFee}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>GST (5%)</Text>
            <Text style={styles.billValue}>₹{gst}</Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotal}>Total</Text>
            <Text style={styles.billTotal}>₹{total.toFixed(0)}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          loading={placing}
          disabled={placing || !selectedAddress}
          style={styles.placeOrderButton}
          buttonColor={theme.colors.primary}
          contentStyle={styles.placeOrderButtonContent}
        >
          Place Order - ₹{total.toFixed(0)}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  selectedAddress: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.green[50] + '40',
  },
  addressInfo: {
    flex: 1,
    marginLeft: theme.spacing.xs,
  },
  addressLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  addressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  addAddressButton: {
    marginTop: theme.spacing.sm,
  },
  newAddressForm: {
    marginTop: theme.spacing.sm,
  },
  input: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  formButton: {
    flex: 1,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  paymentText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  notesInput: {
    backgroundColor: theme.colors.background,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  billLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  billValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  billDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  billTotal: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  footer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    elevation: 8,
  },
  placeOrderButton: {
    borderRadius: theme.borderRadius.lg,
  },
  placeOrderButtonContent: {
    height: 48,
  },
});

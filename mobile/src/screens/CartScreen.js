import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Button, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../contexts/CartContext';
import { theme } from '../utils/theme';

const CartItem = ({ item, onIncrement, onDecrement, onRemove }) => {
  return (
    <View style={styles.cartItem}>
      <View
        style={[
          styles.vegIcon,
          { borderColor: item.isVeg ? theme.colors.green[600] : theme.colors.red[500] },
        ]}
      >
        <View
          style={[
            styles.vegDot,
            { backgroundColor: item.isVeg ? theme.colors.green[600] : theme.colors.red[500] },
          ]}
        />
      </View>

      <View style={styles.cartItemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>

      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onDecrement(item._id)}
        >
          <Icon name="minus" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onIncrement(item._id)}
        >
          <Icon name="plus" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(0)}</Text>
    </View>
  );
};

export default function CartScreen({ navigation }) {
  const { cart, restaurant, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="cart-off" size={80} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Add items from a restaurant to get started</Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Home')}
          style={styles.emptyButton}
          buttonColor={theme.colors.primary}
        >
          Browse Restaurants
        </Button>
      </View>
    );
  }

  const deliveryFee = 40;
  const gst = (cartTotal * 0.05).toFixed(0);
  const total = cartTotal + deliveryFee + parseFloat(gst);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Restaurant Info */}
        <View style={styles.restaurantCard}>
          <Text style={styles.restaurantName}>{restaurant?.name}</Text>
          <TouchableOpacity onPress={() => clearCart()}>
            <Text style={styles.clearCart}>Clear Cart</Text>
          </TouchableOpacity>
        </View>

        <Divider />

        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {cart.map((item) => (
            <CartItem
              key={item._id}
              item={item}
              onIncrement={(id) => updateQuantity(id, item.quantity + 1)}
              onDecrement={(id) => updateQuantity(id, item.quantity - 1)}
              onRemove={removeFromCart}
            />
          ))}
        </View>

        {/* Bill Details */}
        <View style={styles.billContainer}>
          <Text style={styles.billTitle}>Bill Details</Text>
          
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

          <Divider style={styles.billDivider} />

          <View style={styles.billRow}>
            <Text style={styles.billTotal}>Total</Text>
            <Text style={styles.billTotal}>₹{total.toFixed(0)}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>₹{total.toFixed(0)}</Text>
          <Text style={styles.totalLabel}>Total</Text>
        </View>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Checkout')}
          style={styles.checkoutButton}
          buttonColor={theme.colors.primary}
          contentStyle={styles.checkoutButtonContent}
        >
          Proceed to Checkout
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    borderRadius: theme.borderRadius.lg,
  },
  scrollView: {
    flex: 1,
  },
  restaurantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
  },
  restaurantName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  clearCart: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  itemsContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  vegIcon: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cartItemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  itemPrice: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    marginHorizontal: theme.spacing.sm,
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    minWidth: 60,
    textAlign: 'right',
  },
  billContainer: {
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  billTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
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
    marginVertical: theme.spacing.sm,
  },
  billTotal: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    elevation: 8,
  },
  totalContainer: {
    marginRight: theme.spacing.md,
  },
  totalText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  totalLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  checkoutButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
  },
  checkoutButtonContent: {
    height: 48,
  },
});

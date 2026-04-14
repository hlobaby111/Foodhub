import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ActivityIndicator, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import { theme } from '../utils/theme';
import { ORDER_STATUS_LABELS } from '../utils/constants';

const OrderCard = ({ order, onPress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return theme.colors.green[600];
      case 'CANCELLED':
        return theme.colors.red[500];
      case 'OUT_FOR_DELIVERY':
        return theme.colors.primary;
      default:
        return theme.colors.warning;
    }
  };

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <View style={styles.orderRestaurant}>
          <Icon name="store" size={20} color={theme.colors.text} />
          <Text style={styles.restaurantName}>{order.restaurant?.name}</Text>
        </View>
        <Chip
          style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) + '20' }]}
          textStyle={[styles.statusText, { color: getStatusColor(order.status) }]}
        >
          {ORDER_STATUS_LABELS[order.status] || order.status}
        </Chip>
      </View>

      <View style={styles.orderItems}>
        <Text style={styles.itemsText}>
          {order.items?.map((item) => `${item.menuItem?.name} x${item.quantity}`).join(', ')}
        </Text>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.orderPrice}>
          <Icon name="currency-inr" size={16} color={theme.colors.text} />
          <Text style={styles.priceText}>{order.totalAmount?.toFixed(0)}</Text>
        </View>
        <Text style={styles.orderDate}>
          {new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/orders/my');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="receipt-text-outline" size={80} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptyText}>Start ordering from your favorite restaurants</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.ordersContainer}>
        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            onPress={() => navigation.navigate('OrderTracking', { orderId: order._id })}
          />
        ))}
      </View>
    </ScrollView>
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
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
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
  },
  ordersContainer: {
    padding: theme.spacing.md,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  orderRestaurant: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  restaurantName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  orderItems: {
    marginBottom: theme.spacing.sm,
  },
  itemsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  orderPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginLeft: 2,
  },
  orderDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});

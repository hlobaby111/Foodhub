import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ActivityIndicator, Button, Portal, Dialog, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { theme } from '../utils/theme';
import { BACKEND_URL, ORDER_STATUS, ORDER_STATUS_LABELS } from '../utils/constants';

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrder();
    setupWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [orderId]);

  const setupWebSocket = async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const newSocket = io(BACKEND_URL, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token: accessToken },
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      newSocket.emit('join_order', orderId);
    });

    newSocket.on('order_update', (updatedOrder) => {
      console.log('Order update received:', updatedOrder);
      setOrder(updatedOrder);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    setSocket(newSocket);
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason || cancelReason.trim().length < 10) {
      Alert.alert('Error', 'Please provide a reason (minimum 10 characters)');
      return;
    }

    try {
      setCancelling(true);
      await api.put(`/api/orders/${orderId}/cancel`, {
        cancellationReason: cancelReason.trim(),
      });
      
      setShowCancelDialog(false);
      setCancelReason('');
      await fetchOrder();
      Alert.alert('Success', 'Order cancelled successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusSteps = () => {
    return [
      { status: 'PLACED', label: 'Order Placed', icon: 'check-circle' },
      { status: 'ACCEPTED', label: 'Accepted', icon: 'check-circle' },
      { status: 'PREPARING', label: 'Preparing', icon: 'chef-hat' },
      { status: 'READY', label: 'Ready', icon: 'check-circle' },
      { status: 'PICKED_UP', label: 'Picked Up', icon: 'motorbike' },
      { status: 'OUT_FOR_DELIVERY', label: 'On the Way', icon: 'map-marker-path' },
      { status: 'DELIVERED', label: 'Delivered', icon: 'check-circle' },
    ];
  };

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    const steps = getStatusSteps();
    return steps.findIndex((step) => step.status === order.status);
  };

  const canCancelOrder = () => {
    if (!order) return false;
    return !['DELIVERED', 'CANCELLED', 'OUT_FOR_DELIVERY'].includes(order.status);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const currentStepIndex = getCurrentStepIndex();
  const statusSteps = getStatusSteps();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Order Status Header */}
        <View style={styles.statusHeader}>
          <Icon
            name={order.status === 'DELIVERED' ? 'check-circle' : 'clock-outline'}
            size={48}
            color={order.status === 'DELIVERED' ? theme.colors.green[600] : theme.colors.primary}
          />
          <Text style={styles.statusTitle}>
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </Text>
          <Text style={styles.statusSubtitle}>
            Order ID: #{order._id?.slice(-6)}
          </Text>
        </View>

        {/* Status Timeline */}
        {order.status !== 'CANCELLED' && (
          <View style={styles.timeline}>
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <View key={step.status} style={styles.timelineItem}>
                  <View style={styles.timelineIconContainer}>
                    <View
                      style={[
                        styles.timelineIcon,
                        isCompleted && styles.timelineIconCompleted,
                        isCurrent && styles.timelineIconCurrent,
                      ]}
                    >
                      <Icon
                        name={step.icon}
                        size={20}
                        color={isCompleted ? theme.colors.surface : theme.colors.textSecondary}
                      />
                    </View>
                    {index < statusSteps.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          isCompleted && styles.timelineLineCompleted,
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.timelineLabel,
                      isCompleted && styles.timelineLabelCompleted,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Restaurant Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant</Text>
          <View style={styles.restaurantCard}>
            <Icon name="store" size={24} color={theme.colors.primary} />
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{order.restaurant?.name}</Text>
              <Text style={styles.restaurantLocation}>{order.restaurant?.location}</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items?.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View
                style={[
                  styles.vegIcon,
                  { borderColor: item.menuItem?.isVeg ? theme.colors.green[600] : theme.colors.red[500] },
                ]}
              >
                <View
                  style={[
                    styles.vegDot,
                    { backgroundColor: item.menuItem?.isVeg ? theme.colors.green[600] : theme.colors.red[500] },
                  ]}
                />
              </View>
              <Text style={styles.itemName}>{item.menuItem?.name}</Text>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <Icon name="map-marker" size={24} color={theme.colors.primary} />
            <Text style={styles.addressText}>
              {order.deliveryAddress?.street}, {order.deliveryAddress?.city}, 
              {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}
            </Text>
          </View>
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Total Amount</Text>
            <Text style={styles.billValue}>₹{order.totalAmount?.toFixed(0)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Payment Method</Text>
            <Text style={styles.billValue}>
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
            </Text>
          </View>
        </View>

        {/* Cancel Order Button */}
        {canCancelOrder() && (
          <View style={styles.section}>
            <Button
              mode="outlined"
              onPress={() => setShowCancelDialog(true)}
              textColor={theme.colors.red[500]}
              style={styles.cancelButton}
            >
              Cancel Order
            </Button>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Cancel Dialog */}
      <Portal>
        <Dialog visible={showCancelDialog} onDismiss={() => setShowCancelDialog(false)}>
          <Dialog.Title>Cancel Order</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Please provide a reason for cancellation (minimum 10 characters)
            </Text>
            <TextInput
              value={cancelReason}
              onChangeText={setCancelReason}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Enter reason..."
              style={styles.cancelInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCancelDialog(false)}>Cancel</Button>
            <Button
              onPress={handleCancelOrder}
              loading={cancelling}
              disabled={cancelling}
              textColor={theme.colors.red[500]}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  statusHeader: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statusTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statusSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  timeline: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconCompleted: {
    backgroundColor: theme.colors.green[600],
  },
  timelineIconCurrent: {
    backgroundColor: theme.colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: theme.colors.border,
    marginTop: 4,
  },
  timelineLineCompleted: {
    backgroundColor: theme.colors.green[600],
  },
  timelineLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    paddingTop: theme.spacing.sm,
  },
  timelineLabelCompleted: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  section: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  restaurantName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  restaurantLocation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  orderItem: {
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
  itemName: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  itemQuantity: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  itemPrice: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    minWidth: 60,
    textAlign: 'right',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  addressText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    lineHeight: 20,
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
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  cancelButton: {
    borderColor: theme.colors.red[500],
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  dialogText: {
    marginBottom: theme.spacing.sm,
  },
  cancelInput: {
    marginTop: theme.spacing.sm,
  },
});

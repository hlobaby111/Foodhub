import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { theme } from '../utils/theme';

const statusConfig = {
  placed: { label: 'Placed', color: theme.colors.blue[100], textColor: theme.colors.blue[800], icon: 'package-variant' },
  accepted: { label: 'Accepted', color: theme.colors.indigo[100], textColor: theme.colors.indigo[800], icon: 'check' },
  preparing: { label: 'Preparing', color: theme.colors.yellow[100], textColor: theme.colors.yellow[800], icon: 'chef-hat' },
  out_for_delivery: { label: 'Out for Delivery', color: theme.colors.orange[100], textColor: theme.colors.orange[800], icon: 'truck' },
  delivered: { label: 'Delivered', color: theme.colors.green[50], textColor: theme.colors.green[700], icon: 'check' },
  cancelled: { label: 'Cancelled', color: '#FEE2E2', textColor: '#991B1B', icon: 'close-circle' },
};

const OrdersScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders/my');
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewDialog) return;
    setSubmittingReview(true);
    try {
      await api.post('/api/reviews', {
        orderId: reviewDialog._id,
        restaurantId: reviewDialog.restaurant?._id,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewDialog(null);
      setReviewRating(5);
      setReviewComment('');
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>My Orders</Text>

        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="package-variant" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No orders yet</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.browseButtonText}>Browse Restaurants</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map(order => {
              const statusInfo = statusConfig[order.orderStatus] || statusConfig.placed;
              return (
                <View key={order._id} style={styles.orderCard}>
                  {/* Header */}
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
                      <Text style={styles.restaurantName}>{order.restaurant?.name || 'Restaurant'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                      <Icon name={statusInfo.icon} size={14} color={statusInfo.textColor} />
                      <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
                        {statusInfo.label}
                      </Text>
                    </View>
                  </View>

                  {/* Items */}
                  <View style={styles.itemsList}>
                    {order.items?.map((item, i) => (
                      <View key={i} style={styles.orderItem}>
                        <Text style={styles.orderItemName}>{item.name} x{item.quantity}</Text>
                        <Text style={styles.orderItemPrice}>₹{item.price * item.quantity}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Footer */}
                  <View style={styles.orderFooter}>
                    <View style={styles.orderMeta}>
                      <Icon name="clock-outline" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.orderMetaText}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                      <Text style={styles.orderMetaText}>·</Text>
                      <Text style={styles.orderMetaText}>
                        {order.paymentMethod === 'cash' ? 'COD' : 'Online'}
                      </Text>
                    </View>
                    <Text style={styles.orderTotal}>₹{order.totalAmount}</Text>
                  </View>

                  {/* Status Tracker */}
                  <View style={styles.statusTracker}>
                    <View style={styles.statusSteps}>
                      {['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'].map((step, i) => {
                        const isCompleted = order.statusHistory?.some(h => h.status === step);
                        const isCurrent = order.orderStatus === step;
                        return (
                          <React.Fragment key={step}>
                            <View
                              style={[
                                styles.statusStep,
                                (isCompleted || isCurrent) && styles.statusStepActive
                              ]}
                            >
                              {isCompleted ? (
                                <Icon name="check" size={12} color="white" />
                              ) : (
                                <Text style={styles.statusStepNumber}>{i + 1}</Text>
                              )}
                            </View>
                            {i < 4 && (
                              <View
                                style={[
                                  styles.statusLine,
                                  isCompleted && styles.statusLineActive
                                ]}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </View>
                    <View style={styles.statusLabels}>
                      {['Placed', 'Accepted', 'Preparing', 'On Way', 'Delivered'].map(s => (
                        <Text key={s} style={styles.statusLabel}>{s}</Text>
                      ))}
                    </View>
                  </View>

                  {/* Actions */}
                  {order.orderStatus === 'delivered' && (
                    <View style={styles.orderActions}>
                      <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={() => {
                          setReviewDialog(order);
                          setReviewRating(5);
                          setReviewComment('');
                        }}
                      >
                        <Icon name="star" size={14} color="#EAB308" />
                        <Text style={styles.reviewButtonText}>Rate & Review</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {!['delivered', 'cancelled'].includes(order.orderStatus) && (
                    <View style={styles.orderActions}>
                      <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => navigation.navigate('OrderTracking', { orderId: order._id })}
                      >
                        <Icon name="map-marker-path" size={14} color="white" />
                        <Text style={styles.trackButtonText}>Track Order</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {order.orderStatus === 'cancelled' && order.cancellationReason && (
                    <View style={styles.cancelledInfo}>
                      <Icon name="close-circle" size={16} color={theme.colors.error} />
                      <View style={styles.cancelledText}>
                        <Text style={styles.cancelledTitle}>Cancelled</Text>
                        <Text style={styles.cancelledReason}>{order.cancellationReason}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Review Modal */}
      {reviewDialog && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rate & Review</Text>
              <Text style={styles.modalSubtitle}>{reviewDialog.restaurant?.name}</Text>

              {/* Star Rating */}
              <View style={styles.starRating}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                    <Icon
                      name="star"
                      size={32}
                      color={star <= reviewRating ? '#EAB308' : theme.colors.muted}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Comment */}
              <TextInput
                style={styles.reviewInput}
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Share your experience..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={4}
              />

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setReviewDialog(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSubmitButton}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Submit Review</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
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

  // Orders List
  ordersList: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Items
  itemsList: {
    gap: 4,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemName: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  orderItemPrice: {
    fontSize: 13,
    color: theme.colors.text,
  },

  // Footer
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderMetaText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },

  // Status Tracker
  statusTracker: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statusSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusStepActive: {
    backgroundColor: theme.colors.primary,
  },
  statusStepNumber: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  statusLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.muted,
  },
  statusLineActive: {
    backgroundColor: theme.colors.primary,
  },
  statusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    width: '20%',
    textAlign: 'center',
  },

  // Actions
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
  },
  trackButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'white',
  },

  // Cancelled
  cancelledInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
  },
  cancelledText: {
    flex: 1,
  },
  cancelledTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#991B1B',
  },
  cancelledReason: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 2,
  },

  // Review Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  starRating: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
});

export default OrdersScreen;

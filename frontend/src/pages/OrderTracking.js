import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { io } from 'socket.io-client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import logger from '../utils/logger';
import {
  ArrowLeft, MapPin, Clock, Phone, Check, ChefHat, Truck,
  Package, XCircle, Star, Store, AlertTriangle, Navigation2, Utensils
} from 'lucide-react';

const statusSteps = [
  { key: 'placed', label: 'Order Placed', icon: Package, description: 'Your order has been placed' },
  { key: 'accepted', label: 'Accepted', icon: Check, description: 'Restaurant accepted your order' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Your food is being prepared' },
  { key: 'ready', label: 'Ready', icon: Utensils, description: 'Food is ready, waiting for pickup' },
  { key: 'picked_up', label: 'Picked Up', icon: Truck, description: 'Delivery partner picked up your order' },
  { key: 'out_for_delivery', label: 'On the Way', icon: Navigation2, description: 'Your order is on its way!' },
  { key: 'delivered', label: 'Delivered', icon: Check, description: 'Order delivered! Enjoy your meal' },
];

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const [deliveryLocation, setDeliveryLocation] = useState(null);

  // Fixed: Wrap fetchOrder in useCallback to stabilize reference
  const fetchOrder = useCallback(async () => {
    try {
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data.order);
    } catch (error) {
      logger.apiError(`/api/orders/${id}`, error);
      toast.error('Order not found');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]); // Fixed: Added all dependencies

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]); // Fixed: Added fetchOrder dependency

  // WebSocket connection for real-time updates
  useEffect(() => {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    const socket = io(BACKEND_URL, { path: '/api/socket.io', transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      logger.socketEvent('connect', { orderId: id });
      socket.emit('join_order', id);
    });

    socket.on('order_update', (data) => {
      logger.socketEvent('order_update', data);
      fetchOrder();
      toast.info(`Order status: ${data.status?.replace(/_/g, ' ')}`);
    });

    socket.on('delivery_location', (data) => {
      setDeliveryLocation(data);
    });

    return () => {
      socket.emit('leave_order', id);
      socket.disconnect();
    };
  }, [id, fetchOrder]); // Fixed: Added fetchOrder dependency

  const handleCancel = async () => {
    if (cancelReason.trim().length < 10) {
      toast.error('Please enter at least 10 characters for the reason');
      return;
    }
    setCancelling(true);
    try {
      await api.put(`/api/orders/${id}/cancel`, { reason: cancelReason });
      toast.success('Order cancelled successfully');
      setShowCancel(false);
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) return null;

  const isCancelled = order.orderStatus === 'cancelled';
  const isDelivered = order.orderStatus === 'delivered';
  const canCancel = !['delivered', 'cancelled', 'out_for_delivery'].includes(order.orderStatus);
  const currentStepIndex = statusSteps.findIndex(s => s.key === order.orderStatus);

  const getTimestamp = (status) => {
    const entry = order.statusHistory?.find(h => h.status === status);
    return entry ? new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8" data-testid="order-tracking-page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')} className="rounded-full flex-shrink-0" data-testid="back-to-orders">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-heading font-semibold">Track Order</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">#{order.orderNumber}</p>
        </div>
      </div>

      {/* Restaurant Info Card */}
      <div className="bg-white rounded-2xl border border-border/50 p-4 sm:p-5 mb-5" data-testid="tracking-restaurant-info">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-medium text-sm sm:text-base">{order.restaurant?.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" /> {order.restaurant?.location}
            </p>
          </div>
          {order.restaurant?.phone && (
            <a href={`tel:${order.restaurant.phone}`} className="ml-auto">
              <Button size="icon" variant="outline" className="rounded-full h-9 w-9" data-testid="call-restaurant">
                <Phone className="w-4 h-4" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 mb-5" data-testid="cancelled-banner">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-heading font-medium text-red-800">Order Cancelled</h3>
              <p className="text-sm text-red-600 mt-1">Reason: {order.cancellationReason}</p>
              <p className="text-xs text-red-400 mt-1">
                {order.cancelledAt && new Date(order.cancelledAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}

      {isDelivered && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 sm:p-5 mb-5" data-testid="delivered-banner">
          <div className="flex items-center gap-3">
            <Check className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-heading font-medium text-green-800">Order Delivered</h3>
              <p className="text-sm text-green-600">Enjoy your meal!</p>
            </div>
          </div>
        </div>
      )}

      {/* Live Tracking Steps */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-border/50 p-5 sm:p-6 mb-5" data-testid="tracking-steps">
          <h3 className="font-heading font-medium text-sm sm:text-base mb-6">Order Status</h3>
          <div className="space-y-0">
            {statusSteps.map((step, i) => {
              const isCompleted = order.statusHistory?.some(h => h.status === step.key);
              const isCurrent = order.orderStatus === step.key;
              const isActive = isCompleted || isCurrent;
              const StepIcon = step.icon;
              const timestamp = getTimestamp(step.key);
              const isLast = i === statusSteps.length - 1;

              return (
                <div key={step.key} className="flex gap-4" data-testid={`step-${step.key}`}>
                  {/* Line & Circle */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                      isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse' :
                      isCompleted ? 'bg-primary text-primary-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <StepIcon className="w-5 h-5" />
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-12 my-1 transition-colors duration-500 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
                    )}
                  </div>
                  {/* Text */}
                  <div className="pt-2 pb-4 min-w-0">
                    <p className={`font-medium text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                      {isCurrent && !isDelivered && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary font-normal">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    {timestamp && <p className="text-[11px] text-muted-foreground mt-0.5">{timestamp}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Items */}
      {/* Delivery Partner Live Location */}
      {(deliveryLocation || order.deliveryPartnerLocation) && ['picked_up', 'out_for_delivery'].includes(order.orderStatus) && (
        <div className="bg-white rounded-2xl border border-border/50 p-4 sm:p-5 mb-5" data-testid="delivery-partner-location">
          <h3 className="font-heading font-medium text-sm sm:text-base mb-3 flex items-center gap-2">
            <Navigation2 className="w-4 h-4 text-primary animate-pulse" /> Delivery Partner Location
          </h3>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-green-800">Your delivery partner is on the way!</p>
                <p className="text-xs text-green-600 mt-0.5">
                  Live location: {(deliveryLocation?.lat || order.deliveryPartnerLocation?.lat)?.toFixed(4)}, {(deliveryLocation?.lng || order.deliveryPartnerLocation?.lng)?.toFixed(4)}
                </p>
                <p className="text-[10px] text-green-500 mt-0.5">
                  Updated: {new Date(deliveryLocation?.updatedAt || order.deliveryPartnerLocation?.updatedAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border/50 p-4 sm:p-5 mb-5" data-testid="tracking-order-items">
        <h3 className="font-heading font-medium text-sm sm:text-base mb-3">Order Details</h3>
        <div className="space-y-2">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{item.name} <span className="text-muted-foreground">x{item.quantity}</span></span>
              <span>&#8377;{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border/50 mt-3 pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span data-testid="tracking-total">&#8377;{order.totalAmount}</span>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="capitalize">Payment: {order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online'}</span>
          <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Delivery Address */}
      {order.deliveryAddress && (
        <div className="bg-white rounded-2xl border border-border/50 p-4 sm:p-5 mb-5" data-testid="tracking-delivery-address">
          <h3 className="font-heading font-medium text-sm sm:text-base mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" /> Delivery Address
          </h3>
          <p className="text-sm text-muted-foreground">
            {order.deliveryAddress.street}, {order.deliveryAddress.city} {order.deliveryAddress.pincode}
          </p>
        </div>
      )}

      {/* Cancel Order */}
      {canCancel && (
        <div className="text-center">
          <Button
            variant="outline"
            className="rounded-full text-red-600 border-red-200 hover:bg-red-50 text-sm"
            onClick={() => setShowCancel(true)}
            data-testid="cancel-order-button"
          >
            <XCircle className="w-4 h-4 mr-1" /> Cancel Order
          </Button>
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Cancel Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel order <strong>#{order.orderNumber}</strong>? This action cannot be undone.
            </p>
            <div>
              <label className="text-sm font-medium">
                Reason for cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please tell us why you want to cancel (minimum 10 characters)..."
                className="mt-1 w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                data-testid="cancel-reason-input"
              />
              <p className={`text-xs mt-1 ${cancelReason.trim().length < 10 ? 'text-red-500' : 'text-green-600'}`}>
                {cancelReason.trim().length}/10 characters minimum
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowCancel(false)} data-testid="cancel-dialog-back">
                Go Back
              </Button>
              <Button
                className="flex-1 rounded-full bg-red-600 hover:bg-red-700"
                onClick={handleCancel}
                disabled={cancelling || cancelReason.trim().length < 10}
                data-testid="confirm-cancel-button"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderTracking;

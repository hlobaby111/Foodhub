import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Clock, Package, Check, Truck, ChefHat, Star, MessageSquare, ExternalLink, XCircle } from 'lucide-react';

const statusConfig = {
  placed: { label: 'Placed', color: 'bg-blue-100 text-blue-800', icon: Package },
  accepted: { label: 'Accepted', color: 'bg-indigo-100 text-indigo-800', icon: Check },
  preparing: { label: 'Preparing', color: 'bg-yellow-100 text-yellow-800', icon: ChefHat },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: Check },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: Package },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const navigate = useNavigate();

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
      toast.success('Review submitted! Thanks for your feedback.');
      setReviewDialog(null);
      setReviewRating(5);
      setReviewComment('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-semibold mb-8">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8" data-testid="orders-page">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-semibold mb-6 sm:mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 sm:py-20" data-testid="no-orders">
          <Package className="w-14 h-14 sm:w-16 sm:h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-base sm:text-lg text-muted-foreground">No orders yet</p>
          <Button className="rounded-full mt-4" onClick={() => navigate('/')} data-testid="browse-link">
            Browse Restaurants
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const statusInfo = statusConfig[order.orderStatus] || statusConfig.placed;
            const StatusIcon = statusInfo.icon;
            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-border/50 p-4 sm:p-6"
                data-testid={`order-${order._id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                    <h3 className="font-heading font-medium text-base sm:text-lg">{order.restaurant?.name || 'Restaurant'}</h3>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {statusInfo.label}
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                      <span>&#8377;{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-3 sm:pt-4 gap-2">
                  <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="capitalize">{order.paymentMethod === 'cash' ? 'COD' : 'Online'}</span>
                  </div>
                  <span className="font-semibold text-base sm:text-lg" data-testid={`order-total-${order._id}`}>
                    &#8377;{order.totalAmount}
                  </span>
                </div>

                {/* Status Tracker */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'].map((step, i) => {
                      const isCompleted = order.statusHistory?.some(h => h.status === step);
                      const isCurrent = order.orderStatus === step;
                      return (
                        <React.Fragment key={step}>
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs flex-shrink-0 ${
                            isCompleted || isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {isCompleted ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : i + 1}
                          </div>
                          {i < 4 && (
                            <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {['Placed', 'Accepted', 'Preparing', 'On Way', 'Delivered'].map(s => (
                      <span key={s} className="text-[9px] sm:text-[10px] text-muted-foreground text-center" style={{ width: '20%' }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* Review Button for delivered orders */}
                {order.orderStatus === 'delivered' && (
                  <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs sm:text-sm"
                      onClick={() => { setReviewDialog(order); setReviewRating(5); setReviewComment(''); }}
                      data-testid={`review-order-${order._id}`}
                    >
                      <Star className="w-3.5 h-3.5 mr-1 text-yellow-500" /> Rate & Review
                    </Button>
                  </div>
                )}

                {/* Track Order / Cancel for active orders */}
                {!['delivered', 'cancelled'].includes(order.orderStatus) && (
                  <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="rounded-full text-xs sm:text-sm"
                      onClick={() => navigate(`/track/${order._id}`)}
                      data-testid={`track-order-${order._id}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Track Order
                    </Button>
                  </div>
                )}

                {/* Cancelled info */}
                {order.orderStatus === 'cancelled' && order.cancellationReason && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-xs">Cancelled</p>
                        <p className="text-xs text-red-500 mt-0.5">{order.cancellationReason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(open) => { if (!open) setReviewDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Rate your order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">From {reviewDialog?.restaurant?.name}</p>
              <div className="flex gap-1" data-testid="review-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1"
                    data-testid={`star-${star}`}
                  >
                    <Star className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${star <= reviewRating ? 'text-yellow-500 fill-current' : 'text-muted'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Input
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience (optional)"
                data-testid="review-comment-input"
              />
            </div>
            <Button
              className="w-full rounded-full"
              onClick={handleSubmitReview}
              disabled={submittingReview}
              data-testid="submit-review-button"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;

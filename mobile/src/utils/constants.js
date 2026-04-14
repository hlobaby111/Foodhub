export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

export const ORDER_STATUS = {
  PLACED: 'PLACED',
  ACCEPTED: 'ACCEPTED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  PICKED_UP: 'PICKED_UP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_STATUS_LABELS = {
  PLACED: 'Order Placed',
  ACCEPTED: 'Accepted by Restaurant',
  PREPARING: 'Being Prepared',
  READY: 'Ready for Pickup',
  PICKED_UP: 'Picked Up',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const USER_ROLES = {
  CUSTOMER: 'customer',
  OWNER: 'owner',
  DELIVERY: 'delivery',
  ADMIN: 'admin',
};

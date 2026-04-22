import client from './client';

// AUTH
export const sendOtp = (phone) => client.post('/otp-auth/send-otp', { phone });
export const verifyOtp = (phone, otp) => client.post('/otp-auth/verify-otp', { phone, otp });

// DASHBOARD
export const getDashboard = () => client.get('/admin/dashboard');
export const getStats = () => client.get('/admin/stats');

// RESTAURANTS
export const listRestaurants = (params) => client.get('/admin/restaurants', { params });
export const listPendingRestaurants = () => client.get('/admin/restaurants/pending');
export const getRestaurantDetails = (id) => client.get(`/admin/restaurants/${id}`);
export const decideRestaurant = (id, status) => client.put(`/admin/restaurants/${id}/status`, { status });
export const toggleRestaurantActive = (id) => client.put(`/admin/restaurants/${id}/toggle-active`);
export const updateRestaurantCommission = (id, commissionPercent) =>
  client.put(`/admin/restaurants/${id}/commission`, { commissionPercent });
export const createRestaurantMenuItem = (restaurantId, data) =>
  client.post(`/admin/restaurants/${restaurantId}/menu`, data);
export const updateRestaurantMenuItem = (restaurantId, menuItemId, data) =>
  client.put(`/admin/restaurants/${restaurantId}/menu/${menuItemId}`, data);
export const deleteRestaurantMenuItem = (restaurantId, menuItemId) =>
  client.delete(`/admin/restaurants/${restaurantId}/menu/${menuItemId}`);

export const uploadRestaurantMenuItemImage = (menuItemId, file) => {
  const form = new FormData();
  form.append('image', file);
  return client.post(`/upload/admin/menu-item/${menuItemId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// DELIVERY PARTNERS
export const listDeliveryPartners = (params) => client.get('/admin/delivery/partners', { params });
export const decidePartnerKyc = (id, decision) => client.put(`/admin/delivery/partners/${id}/kyc`, { decision });
export const togglePartner = (id) => client.put(`/admin/delivery/partners/${id}/toggle`);

// CUSTOMERS
export const listUsers = (params) => client.get('/admin/users', { params });
export const toggleUserStatus = (id) => client.put(`/admin/users/${id}/toggle-status`);

// ORDERS
export const listOrders = (params) => client.get('/admin/orders', { params });
export const getOrderDetails = (id) => client.get(`/admin/orders/${id}`);
export const adminCancelOrder = (id, reason) => client.post(`/admin/orders/${id}/cancel`, { reason });
export const adminAssignDelivery = (id, deliveryPartnerId) => 
  client.post(`/admin/orders/${id}/assign-delivery`, { deliveryPartnerId });
export const adminIssueRefund = (id, reason, amount) => 
  client.post(`/admin/orders/${id}/refund`, { reason, amount });

// OFFERS
export const listOffers = (params) => client.get('/admin/offers', { params });
export const createOffer = (data) => client.post('/admin/offers', data);
export const toggleOffer = (id) => client.put(`/admin/offers/${id}/toggle`);
export const deleteOffer = (id) => client.delete(`/admin/offers/${id}`);

// REFUNDS
export const listRefunds = (params) => client.get('/admin/refunds', { params });
export const decideRefund = (id, decision, adminNote) =>
  client.put(`/admin/refunds/${id}/decide`, { decision, adminNote });

// PAYOUTS
export const listPayouts = (params) => client.get('/admin/payouts', { params });
export const triggerPayout = (data) => client.post('/admin/payouts/restaurant', data);
export const markPayoutPaid = (id, transactionId) =>
  client.put(`/admin/payouts/${id}/paid`, { transactionId });
export const holdPayout = (id, reason) => client.put(`/admin/payouts/${id}/hold`, { reason });

// SETTINGS
export const getSettings = () => client.get('/admin/settings');
export const updateSettings = (data) => client.put('/admin/settings', data);
export const pausePlatform = (reason) => client.post('/admin/settings/pause', { reason });
export const resumePlatform = () => client.post('/admin/settings/resume');

// REPORTS
export const getMonthlyRevenue = (months = 6) =>
  client.get('/admin/reports/monthly-revenue', { params: { months } });
export const getTopRestaurants = (limit = 10) =>
  client.get('/admin/reports/top-restaurants', { params: { limit } });
export const getCuisineBreakdown = () => client.get('/admin/reports/cuisine-breakdown');
export const getOrdersOverview = () => client.get('/admin/reports/orders-overview');

// USER DETAILS
export const getUserDetails = (id) => client.get(`/admin/users/${id}`);

// AUDIT LOGS
export const getAuditLogs = (params) => client.get('/admin/audit-logs', { params });

// BANNERS
export const getBanners = () => client.get('/admin/banners');
export const createBanner = (data) => client.post('/admin/banners', data);
export const deleteBanner = (id) => client.delete(`/admin/banners/${id}`);

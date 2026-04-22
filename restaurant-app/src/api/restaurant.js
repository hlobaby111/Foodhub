import client from './client';

export const sendOtp = (phone) => client.post('/otp-auth/send-otp', { phone });
export const verifyOtp = (phone, otp, extra = {}) =>
  client.post('/otp-auth/verify-otp', { phone, otp, ...extra });

export const getMyRestaurants = () => client.get('/restaurants/my');
export const toggleMyRestaurantActive = () => client.put('/restaurants/my/toggle-active');
export const upsertRestaurantProfile = (data) => client.put('/restaurants/profile', data);
export const updateRestaurantDoc = (field, url, storagePath) =>
  client.put('/restaurants/profile/doc', { field, url, storagePath });

export const uploadDocument = (file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/upload/document', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getRestaurantOrders = (status) =>
  client.get('/orders/restaurant', {
    params: status && status !== 'all' ? { status } : undefined,
  });

export const updateOrderStatus = (id, status) =>
  client.put(`/orders/${id}/status`, { status });

export const getMyMenuItems = () => client.get('/menu/my');
export const createMenuItem = (data) => client.post('/menu', data);
export const updateMenuItem = (id, data) => client.put(`/menu/${id}`, data);
export const deleteMenuItem = (id) => client.delete(`/menu/${id}`);

export const uploadMenuItemImage = (menuItemId, file) => {
  const form = new FormData();
  form.append('image', file);
  return client.post(`/upload/menu-item/${menuItemId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

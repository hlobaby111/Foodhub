/**
 * Web platform Razorpay checkout — loads Razorpay's JS SDK directly in the browser.
 * Metro picks this file over RazorpayCheckout.js when platform=web.
 */
import { useEffect } from 'react';
import api from '../services/api';

function loadScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function RazorpayCheckout({ visible, razorpayKeyId, razorpayOrderId, orderId, amount, customerPhone, onSuccess, onFailure, onClose }) {
  useEffect(() => {
    if (!visible) return;

    let rzp;
    loadScript().then((loaded) => {
      if (!loaded) {
        alert('Failed to load Razorpay. Check your internet connection.');
        onClose();
        onFailure?.('Script load failed');
        return;
      }

      rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: amount * 100,
        currency: 'INR',
        name: 'FoodHub',
        description: 'Food Order Payment',
        order_id: razorpayOrderId,
        prefill: { contact: customerPhone },
        theme: { color: '#f97316' },
        handler: async (response) => {
          onClose();
          try {
            await api.post('/api/orders/verify-payment', {
              orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            onSuccess?.();
          } catch {
            onFailure?.('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            onClose();
            onFailure?.('Payment was cancelled.');
          },
        },
      });
      rzp.open();
    });
  }, [visible]);

  return null; // no DOM — Razorpay renders its own overlay
}

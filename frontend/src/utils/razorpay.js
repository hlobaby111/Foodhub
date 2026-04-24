import api from './api';

/**
 * Load the Razorpay checkout script dynamically (idempotent).
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Open the Razorpay checkout modal and handle verification.
 *
 * @param {object} opts
 * @param {string} opts.orderId         - Internal DB order _id
 * @param {string} opts.razorpayOrderId - Razorpay order id (order_xxx)
 * @param {string} opts.razorpayKeyId   - Razorpay key id
 * @param {number} opts.amount          - Amount in INR (will be converted to paise)
 * @param {string} opts.customerPhone   - Customer phone
 * @param {Function} opts.onSuccess     - Called after successful verification
 * @param {Function} opts.onFailure     - Called when payment is cancelled / fails
 */
export async function openRazorpay({ orderId, razorpayOrderId, razorpayKeyId, amount, customerPhone, onSuccess, onFailure }) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    alert('Failed to load Razorpay. Please check your internet connection.');
    onFailure?.();
    return;
  }

  const options = {
    key: razorpayKeyId,
    amount: amount * 100, // paise
    currency: 'INR',
    name: 'FoodHub',
    description: 'Food Order Payment',
    order_id: razorpayOrderId,
    prefill: {
      contact: customerPhone,
    },
    theme: { color: '#f97316' },
    handler: async function (paymentResponse) {
      try {
        await api.post('/api/orders/verify-payment', {
          orderId,
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpaySignature: paymentResponse.razorpay_signature,
        });
        onSuccess?.();
      } catch {
        alert('Payment verification failed. Contact support.');
        onFailure?.();
      }
    },
    modal: {
      ondismiss: function () {
        onFailure?.();
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

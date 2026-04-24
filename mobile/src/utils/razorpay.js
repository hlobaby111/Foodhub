/**
 * Builds an HTML page that opens the Razorpay checkout modal automatically.
 * The WebView renders this page; postMessage is used to relay success/failure.
 */
export function buildRazorpayHtml({ razorpayKeyId, razorpayOrderId, amount, customerPhone }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; }
    .loading { color: #fff; font-family: sans-serif; font-size: 16px; }
  </style>
</head>
<body>
  <div class="loading" id="msg">Opening payment gateway...</div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    var options = {
      key: "${razorpayKeyId}",
      amount: ${amount * 100},
      currency: "INR",
      name: "FoodHub",
      description: "Food Order Payment",
      order_id: "${razorpayOrderId}",
      prefill: { contact: "${customerPhone}" },
      theme: { color: "#f97316" },
      handler: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "PAYMENT_SUCCESS",
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        }));
      },
      modal: {
        ondismiss: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "PAYMENT_CANCELLED" }));
        }
      }
    };
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function(response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "PAYMENT_FAILED",
        error: response.error.description,
      }));
    });
    rzp.open();
    document.getElementById('msg').style.display = 'none';
  </script>
</body>
</html>
`;
}

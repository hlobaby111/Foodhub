/**
 * Native (iOS/Android) Razorpay payment modal using react-native-webview.
 */
import React from 'react';
import { Modal, View, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { buildRazorpayHtml } from '../utils/razorpay';
import api from '../services/api';

export default function RazorpayCheckout({ visible, razorpayKeyId, razorpayOrderId, orderId, amount, customerPhone, onSuccess, onFailure, onClose }) {
  if (!visible) return null;

  const html = buildRazorpayHtml({ razorpayKeyId, razorpayOrderId, amount, customerPhone });

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PAYMENT_SUCCESS') {
        onClose();
        try {
          await api.post('/api/orders/verify-payment', {
            orderId,
            razorpayPaymentId: data.razorpay_payment_id,
            razorpayOrderId: data.razorpay_order_id,
            razorpaySignature: data.razorpay_signature,
          });
          onSuccess?.();
        } catch {
          onFailure?.('Payment verification failed. Contact support.');
        }
      } else if (data.type === 'PAYMENT_CANCELLED' || data.type === 'PAYMENT_FAILED') {
        onClose();
        onFailure?.(data.error || 'Payment was cancelled.');
      }
    } catch {}
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <TouchableOpacity onPress={onClose} style={{ padding: 16, backgroundColor: '#111' }}>
          <Text style={{ color: '#fff', fontSize: 16 }}>✕  Cancel Payment</Text>
        </TouchableOpacity>
        <WebView
          source={{ html }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          style={{ flex: 1 }}
        />
      </View>
    </Modal>
  );
}

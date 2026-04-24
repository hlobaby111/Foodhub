import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Loader } from 'lucide-react';
import api from '../utils/api';

const PhoneAuth = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/otp-auth/send-otp', { phone });
      navigate('/verify-otp', {
        state: {
          phone,
          devOTP: response.data?.otp,
          waitSeconds: 30,
        },
      });
    } catch (err) {
      const waitSeconds = err.response?.data?.waitSeconds;
      if (err.response?.status === 429) {
        setError(`Too many requests. Try again after ${waitSeconds || 30} seconds.`);
      } else {
        setError(err.response?.data?.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(value);
    setError('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="phone-auth-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Phone className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">FoodHub</h1>
          <p className="text-muted-foreground text-lg">Order food from your favorite restaurants</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-border p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Enter Phone Number</h2>
            <p className="text-sm text-muted-foreground">We'll send you an OTP to verify your number</p>
          </div>

          <form onSubmit={handleSendOTP}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Mobile Number</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-xl border border-border">
                  <span className="text-lg">IN</span>
                  <span className="text-foreground font-medium">+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="9876543210"
                  className="flex-1 px-4 py-3 text-lg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  maxLength={10}
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                  <span className="inline-block w-4 h-4 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center">!</span>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhoneAuth;

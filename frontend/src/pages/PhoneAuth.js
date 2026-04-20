import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const isValidIndianMobile = (phone) => /^[6-9]\d{9}$/.test(phone);

const PhoneAuth = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!isValidIndianMobile(phone)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/otp-auth/send-otp', { phone });

      navigate(`/auth/otp?phone=${phone}`, {
        replace: true,
        state: {
          devOTP: response.data?.otp,
          waitSeconds: 30,
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" data-testid="phone-auth-page">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🍔</div>
          <h1 className="text-3xl font-heading font-semibold">Welcome to FoodHub</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your mobile number to get started</p>
        </div>

        <form onSubmit={handleSendOTP} className="space-y-5">
          <div>
            <Label htmlFor="phone">Mobile Number</Label>
            <div className="mt-1 flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-input px-3 text-sm text-muted-foreground bg-muted/30">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="rounded-l-none"
                placeholder="10-digit mobile number"
                data-testid="phone-input"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={loading || phone.length !== 10}
            data-testid="send-otp-button"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>

          <p className="text-xs text-muted-foreground text-center leading-5">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  );
};

export default PhoneAuth;

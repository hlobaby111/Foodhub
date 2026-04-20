import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const OTPAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTPLogin } = useAuth();

  const phone = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('phone') || '';
  }, [location.search]);

  const devOTP = location.state?.devOTP;
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(location.state?.waitSeconds ?? 30);

  useEffect(() => {
    if (!phone) {
      navigate('/auth/phone', { replace: true });
      return;
    }

    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [phone, timer, navigate]);

  useEffect(() => {
    if (devOTP) {
      setOTP(devOTP.split('').slice(0, 6));
    }
  }, [devOTP]);

  const otpCode = otp.join('');

  const updateDigit = (value, index) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...otp];
    updated[index] = digit;
    setOTP(updated);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    try {
      setLoading(true);
      const data = await verifyOTPLogin({ phone, otp: otpCode });
      toast.success(data.message || 'Login successful');
      navigate(data.needsProfile ? '/profile' : '/', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
      setOTP(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      const response = await api.post('/api/otp-auth/send-otp', { phone });
      setTimer(response.data?.waitSeconds || 30);
      setOTP(['', '', '', '', '', '']);
      toast.success('OTP sent again');
    } catch (error) {
      const waitSeconds = error.response?.data?.waitSeconds;
      if (waitSeconds) setTimer(waitSeconds);
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" data-testid="otp-auth-page">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-semibold">Verify OTP</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the 6-digit code sent to <span className="font-medium text-foreground">+91 {phone}</span>
          </p>
          <button
            type="button"
            onClick={() => navigate('/auth/phone', { replace: true })}
            className="mt-2 text-sm text-primary hover:underline"
            data-testid="change-number-button"
          >
            Change number
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div className="grid grid-cols-6 gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                value={digit}
                onChange={(e) => updateDigit(e.target.value, index)}
                maxLength={1}
                inputMode="numeric"
                className="h-12 text-center text-lg font-semibold"
                data-testid={`otp-digit-${index}`}
              />
            ))}
          </div>

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={loading || otpCode.length !== 6}
            data-testid="verify-otp-button"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>

          <div className="text-center text-sm">
            {timer > 0 ? (
              <span className="text-muted-foreground">Resend OTP in {timer}s</span>
            ) : (
              <button
                type="button"
                className="text-primary hover:underline disabled:opacity-50"
                onClick={handleResend}
                disabled={resending}
                data-testid="resend-otp-button"
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>

          {devOTP ? (
            <p className="text-xs rounded-md bg-green-50 text-green-700 p-3 text-center" data-testid="dev-otp-info">
              Dev Mode OTP: {devOTP}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
};

export default OTPAuth;

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Loader, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTPLogin } = useAuth();
  const phone = location.state?.phone;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(location.state?.waitSeconds ?? 30);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!phone) {
      navigate('/phone-auth', { replace: true });
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (location.state?.devOTP) {
      const dev = String(location.state.devOTP).slice(0, 6).split('');
      setOtp([...dev, ...Array(6 - dev.length).fill('')]);
    }
  }, [location.state]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    const newValue = value.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = newValue;
    setOtp(newOtp);
    setError('');

    if (newValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && newValue) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pastedData.split('');
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);

    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
      handleVerifyOTP(pastedData);
    }
  };

  const handleVerifyOTP = async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyOTPLogin({ phone, otp: otpCode });
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    try {
      const response = await api.post('/api/otp-auth/send-otp', { phone });
      setResendTimer(response.data?.waitSeconds || 30);
      setError('');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const waitSeconds = err.response?.data?.waitSeconds;
      if (waitSeconds) setResendTimer(waitSeconds);
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="otp-verification-page">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/phone-auth')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Change Number</span>
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Verify Phone Number</h2>
          <p className="text-muted-foreground">
            OTP sent to <span className="font-semibold text-foreground">+91 {phone}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-border p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-4 text-center">Enter 6-digit OTP</label>

            <div className="flex gap-3 justify-center mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-semibold border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            <button
              onClick={() => handleVerifyOTP()}
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>
          </div>

          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend OTP in <span className="font-semibold text-foreground">{resendTimer}s</span>
              </p>
            ) : (
              <button onClick={handleResendOTP} className="text-sm font-medium text-primary hover:underline">
                Resend OTP
              </button>
            )}
          </div>

          {location.state?.devOTP ? (
            <p className="text-xs rounded-md bg-green-50 text-green-700 p-3 text-center mt-4">
              Dev Mode OTP: {location.state.devOTP}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;

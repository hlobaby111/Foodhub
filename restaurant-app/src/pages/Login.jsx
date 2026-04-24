import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChefHat, ArrowLeft, Phone } from 'lucide-react';
import { sendOtp, verifyOtp, getMyRestaurants } from '../api/restaurant';
import { useAuth } from '../contexts/AuthContext';

const DEMO_PHONE = '9999999999';

export default function Login() {
  const { applyLoginResult } = useAuth();
  const [phone, setPhone] = useState(DEMO_PHONE);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) return;

    setLoading(true);
    setError('');
    try {
      await sendOtp(phone);
      setStep('otp');
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

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(phone, otp);
      applyLoginResult(res.data);
      // Route based on restaurant approval status
      try {
        const rRes = await getMyRestaurants();
        const r = rRes.data?.restaurants?.[0];
        if (!r) { navigate('/profile-setup'); return; }
        if (r.status === 'approved') { navigate('/dashboard'); return; }
        navigate('/status');
      } catch {
        navigate('/profile-setup');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-white p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-8">
          <ArrowLeft size={20} /> Back to home
        </Link>
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <ChefHat className="text-white" size={22} />
            </div>
            <h1 className="text-2xl font-bold text-dark">Partner Login</h1>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit number"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none"
                />
              </div>
              {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}
              <button type="submit" disabled={loading || phone.length !== 10} className="btn-primary w-full mt-6 disabled:opacity-50">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <p className="text-sm text-gray-600 mb-4">Enter OTP sent to +91 {phone}</p>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none text-center text-2xl tracking-widest font-bold"
              />
              {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full mt-6 disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button type="button" onClick={() => setStep('phone')} className="text-sm text-primary font-medium mt-4 w-full">
                Change phone number
              </button>
            </form>
          )}

          <div className="mt-6 rounded-lg border border-primary/30 bg-primary-light p-3 text-sm text-dark">
            <p className="font-semibold">Demo Phone</p>
            <p>Phone: {DEMO_PHONE}</p>
            <p>Use backend OTP from development response/logs.</p>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            New restaurant?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

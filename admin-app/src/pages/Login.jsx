import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Shield } from 'lucide-react';
import { sendOtp, verifyOtp } from '../api/admin';
import { useAuth } from '../contexts/AuthContext';

const SUPER_ADMIN_PHONE = '7206111151';

export default function Login() {
  const { applyLoginResult } = useAuth();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState(SUPER_ADMIN_PHONE);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const submitPhone = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res.data.otp) setDevOtp(res.data.otp);
      setStep('otp');
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const res = await verifyOtp(phone, otp);
      applyLoginResult(res.data);
      navigate('/dashboard');
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-sidebar text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/30 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"><ChefHat size={22} /></div>
          <p className="text-xl font-bold">Foodhub</p>
        </div>
        <div className="relative">
          <Shield size={56} className="text-primary mb-6" />
          <h1 className="text-4xl font-extrabold mb-4">Super Admin Portal</h1>
          <p className="text-gray-300 text-lg max-w-md">Control center for everything - orders, restaurants, delivery & finance.</p>
        </div>
        <p className="relative text-sm text-gray-400">© 2026 Foodhub. All rights reserved.</p>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-extrabold text-ink mb-2">Welcome back</h2>
          <p className="text-gray-600 mb-8">Sign in with your admin phone number</p>

          <div className="bg-blue-50 border border-blue-200 text-blue-900 text-sm p-3 rounded-lg mb-4">
            <p className="font-semibold">Super Admin Login</p>
            <p>Phone: <strong>{SUPER_ADMIN_PHONE}</strong></p>
            <p className="text-xs mt-0.5">OTP will appear on screen after clicking Send OTP</p>
          </div>

          {err && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{err}</div>}

          {step === 'phone' ? (
            <form onSubmit={submitPhone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input type="tel" maxLength={10} value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="input" required />
              </div>
              <button type="submit" disabled={loading || phone.length !== 10} className="btn-primary w-full py-3 disabled:opacity-50">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitOtp} className="space-y-4">
              <p className="text-sm text-gray-600">OTP sent to +91 {phone}</p>
              {devOtp && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded-lg font-mono">
                  Your OTP: <strong className="text-lg tracking-widest">{devOtp}</strong>
                </div>
              )}
              <input type="text" maxLength={6} value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="input text-center text-2xl tracking-widest font-bold"
                placeholder="6-digit OTP" required />
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3 disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={() => setStep('phone')} className="text-sm text-primary w-full">
                ← Change phone number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

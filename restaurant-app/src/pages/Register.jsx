import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChefHat, User, Mail, Phone, ArrowRight, KeyRound } from 'lucide-react';
import { sendOtp, verifyOtp } from '../api/restaurant';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { applyLoginResult } = useAuth();
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDetails = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required');
    if (!form.phone || form.phone.length !== 10) return setError('Enter a valid 10-digit mobile number');
    setError('');
    setLoading(true);
    try {
      const res = await sendOtp(form.phone);
      if (res.data.otp) setDevOtp(res.data.otp); // dev only
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError('Enter the 6-digit OTP');
    setError('');
    setLoading(true);
    try {
      const res = await verifyOtp(form.phone, otp, {
        isRegister: true,
        role: 'restaurant_owner',
        name: form.name,
        email: form.email || undefined,
      });
      applyLoginResult(res.data);
      navigate('/profile-setup');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-4">
            <ChefHat className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-dark">Join Foodhub</h1>
          <p className="text-gray-500 mt-1">Register your restaurant</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'details' ? (
            <>
              <h2 className="text-lg font-semibold text-dark mb-6">Create your account</h2>
              <form onSubmit={handleDetails} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Sending OTP…' : <>Continue <ArrowRight size={18} /></>}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('details'); setOtp(''); setError(''); }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                ← Back
              </button>
              <h2 className="text-lg font-semibold text-dark mb-1">Verify your number</h2>
              <p className="text-sm text-gray-500 mb-6">OTP sent to +91 {form.phone}</p>

              {devOtp && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm mb-4">
                  <strong>Dev mode OTP:</strong> {devOtp}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="relative">
                  <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary tracking-widest text-center text-lg font-mono"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Verifying…' : 'Verify & Create Account'}
                </button>

                <button
                  type="button"
                  onClick={handleDetails}
                  className="w-full text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Resend OTP
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

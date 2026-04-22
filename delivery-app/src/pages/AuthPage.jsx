import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bike, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DEMO_EMAIL = 'delivery.demo@foodhub.com';
const DEMO_PASSWORD = 'demo123';

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isLogin = mode === 'login';

  const handleSubmit = (e) => {
    e.preventDefault();

    if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      setError('Invalid demo credentials. Use the demo values shown below.');
      return;
    }

    setError('');
    // Login user
    login({
      id: 'DP12345',
      name: 'Rajesh Kumar',
      email: DEMO_EMAIL,
      phone: '+91 98765 43210',
      vehicle: 'Motorcycle',
      vehicleNumber: 'KA01AB1234'
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-green-700 mb-6">
          <ArrowLeft size={18} /> Back to home
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-green-600 rounded-lg flex items-center justify-center">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{isLogin ? 'Partner Login' : 'Partner Registration'}</h1>
              <p className="text-sm text-gray-500">Delivery Partner Portal</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-600 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-600 outline-none"
                  required
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <p className="font-semibold mb-1">Demo Credentials</p>
            <p>Email: {DEMO_EMAIL}</p>
            <p>Password: {DEMO_PASSWORD}</p>
          </div>

          <p className="mt-5 text-sm text-gray-600 text-center">
            {isLogin ? 'New partner?' : 'Already have an account?'}{' '}
            <Link
              to={isLogin ? '/register' : '/login'}
              className="font-semibold text-green-700 hover:underline"
            >
              {isLogin ? 'Register here' : 'Login here'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

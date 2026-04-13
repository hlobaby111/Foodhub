import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(email, password);
      toast.success('Login successful!');
      
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'restaurant_owner') {
        navigate('/owner/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundImage: 'url(https://static.prod-images.emergentagent.com/jobs/d81d7df0-2199-4d49-83c7-9882eb41f4a9/images/156a3ff87eee489a1a81f7635e44d4b57a948af45f6828b682b44c3277a9d018.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg" data-testid="login-form">
        <div>
          <h2 className="text-3xl font-heading font-semibold text-center">Welcome Back</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                data-testid="email-input"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                data-testid="password-input"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={loading}
            data-testid="login-submit-button"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/register" className="text-primary hover:underline" data-testid="register-link">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
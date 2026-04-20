import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthSplash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/auth/phone', { replace: true });
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-700"
      data-testid="auth-splash-page"
    >
      <div className="text-center text-white animate-fade-in">
        <div className="text-7xl mb-4">🍔</div>
        <h1 className="text-5xl font-heading font-bold tracking-wide">FoodHub</h1>
        <p className="mt-3 text-white/90 text-sm">Delicious food, delivered fast</p>
      </div>
    </div>
  );
};

export default AuthSplash;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (loading) return;

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    const navigateTimer = setTimeout(() => {
      if (user) {
        navigate('/home', { replace: true });
      } else {
        navigate('/phone-auth', { replace: true });
      }
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navigateTimer);
    };
  }, [user, loading, navigate]);

  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br from-primary via-primary/90 to-orange-600 flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      data-testid="splash-screen"
    >
      <div className="text-center">
        <div className="mb-8 animate-bounce-slow">
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl scale-110 animate-pulse"></div>

            <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-16 h-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>

            <div className="absolute inset-0 border-4 border-white/30 border-t-white rounded-full animate-spin-slow"></div>
          </div>
        </div>

        <h1 className="text-5xl font-bold text-white mb-3 tracking-tight animate-fade-in">FoodHub</h1>
        <p className="text-xl text-white/90 font-medium mb-12 animate-fade-in-delay">Your favorite food, delivered</p>

        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce-dot"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce-dot animation-delay-200"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce-dot animation-delay-400"></div>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float-delayed"></div>
      </div>
    </div>
  );
};

export default SplashScreen;

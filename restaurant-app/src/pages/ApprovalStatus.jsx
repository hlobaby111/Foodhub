import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Clock, CheckCircle, XCircle, Edit, LogOut } from 'lucide-react';
import { getMyRestaurants } from '../api/restaurant';
import { useAuth } from '../contexts/AuthContext';

export default function ApprovalStatus() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyRestaurants()
      .then(res => {
        const r = res.data?.restaurants?.[0];
        setRestaurant(r || null);
        if (r?.status === 'approved') navigate('/dashboard');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  const statusConfig = {
    pending: {
      icon: Clock,
      iconClass: 'text-yellow-500',
      bgClass: 'bg-yellow-50 border-yellow-200',
      title: 'Under Review',
      message: 'Your restaurant profile is submitted and is currently being reviewed by our team. This usually takes 24–48 hours.',
    },
    rejected: {
      icon: XCircle,
      iconClass: 'text-red-500',
      bgClass: 'bg-red-50 border-red-200',
      title: 'Application Not Approved',
      message: 'Unfortunately, your application was not approved at this time. Please update your profile with correct documents and resubmit.',
    },
    approved: {
      icon: CheckCircle,
      iconClass: 'text-green-500',
      bgClass: 'bg-green-50 border-green-200',
      title: 'Approved!',
      message: 'Your restaurant is approved. Redirecting to dashboard…',
    },
  };

  const cfg = statusConfig[restaurant?.status] || statusConfig.pending;
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <ChefHat className="text-white" size={20} />
            </div>
            <span className="font-bold text-dark">Foodhub Partner</span>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
        {loading ? (
          <div className="text-center text-gray-400 py-20">Checking status…</div>
        ) : (
          <>
            <div className={`rounded-2xl border p-8 text-center space-y-4 ${cfg.bgClass}`}>
              <Icon size={56} className={`mx-auto ${cfg.iconClass}`} />
              <h2 className="text-xl font-bold text-dark">{cfg.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{cfg.message}</p>
            </div>

            {restaurant && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
                <h3 className="font-semibold text-dark mb-1">Application Details</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Store:</span> {restaurant.name}</p>
                  <p><span className="font-medium">Submitted by:</span> {user.name || user.phone}</p>
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      restaurant.status === 'approved' ? 'bg-green-100 text-green-700' :
                      restaurant.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {restaurant.status}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Profile completion:</span>{' '}
                    {restaurant.profileCompleted ? (
                      <span className="text-green-600">Complete</span>
                    ) : (
                      <span className="text-orange-500">Incomplete</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/profile-setup')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors"
              >
                <Edit size={18} /> Edit Profile
              </button>
              <button
                onClick={() => { setLoading(true); getMyRestaurants().then(res => { const r = res.data?.restaurants?.[0]; setRestaurant(r || null); if (r?.status === 'approved') navigate('/dashboard'); }).finally(() => setLoading(false)); }}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
              >
                Refresh Status
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

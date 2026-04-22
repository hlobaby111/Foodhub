import { useState } from 'react';
import { ArrowLeft, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Earnings() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('week');

  const stats = {
    today: 420,
    week: 2890,
    month: 12450,
    total: 45670
  };

  const history = [
    { date: '2025-04-22', deliveries: 12, amount: 420 },
    { date: '2025-04-21', deliveries: 15, amount: 510 },
    { date: '2025-04-20', deliveries: 11, amount: 385 },
    { date: '2025-04-19', deliveries: 14, amount: 490 },
    { date: '2025-04-18', deliveries: 13, amount: 455 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-bold">Earnings</h2>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2 overflow-x-auto">
          {['today', 'week', 'month', 'total'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize whitespace-nowrap ${
                period === p
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Total Earnings Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={24} />
            <p className="text-lg opacity-90">Total Earnings ({period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'})</p>
          </div>
          <p className="text-6xl font-bold mb-2">₹{stats[period]?.toLocaleString()}</p>
          <p className="text-sm opacity-90">Keep up the great work!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <TrendingUp size={20} />
              <p className="font-semibold">Today</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">₹{stats.today}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Calendar size={20} />
              <p className="font-semibold">This Week</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">₹{stats.week}</p>
          </div>
        </div>

        {/* Earning History */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-4">Recent History</h3>
          <div className="space-y-3">
            {history.map((day, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-semibold text-gray-900">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                  <p className="text-sm text-gray-500">{day.deliveries} deliveries</p>
                </div>
                <p className="text-xl font-bold text-green-600">₹{day.amount}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payout Info */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">Payout Schedule</h3>
          <p className="text-sm text-blue-700">Earnings are automatically transferred to your bank account every Monday. Next payout: Monday, Apr 28, 2025</p>
        </div>
      </div>
    </div>
  );
}

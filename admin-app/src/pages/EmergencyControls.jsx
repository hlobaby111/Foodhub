import { useState, useEffect } from 'react';
import { AlertTriangle, Pause, Ban, Store } from 'lucide-react';
import { getSettings, pausePlatform, resumePlatform } from '../api/admin';

export default function EmergencyControls() {
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getSettings().then((r) => setPaused(r.data.settings.platformPaused)); }, []);

  const handlePause = async () => {
    if (!confirm('Pause ALL orders platform-wide? Customers will be unable to order.')) return;
    const reason = prompt('Reason:') || 'Emergency pause';
    setLoading(true);
    try { await pausePlatform(reason); setPaused(true); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleResume = async () => {
    if (!confirm('Resume platform?')) return;
    setLoading(true);
    try { await resumePlatform(); setPaused(false); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink flex items-center gap-2">
          <AlertTriangle className="text-red-500" /> Emergency Controls
        </h1>
        <p className="text-sm text-gray-500">Actions take effect immediately - use with caution</p>
      </div>

      {paused && (
        <div className="card p-5 bg-red-50 border-2 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={22} />
            <div>
              <p className="font-bold text-red-900">Platform is currently PAUSED</p>
              <p className="text-sm text-red-700">No new orders are being accepted.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`card p-6 border-2 ${paused ? 'border-green-200' : 'border-red-200'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${paused ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            <Pause size={22} />
          </div>
          <h3 className="font-bold text-ink mb-2">{paused ? 'Resume Platform' : 'Pause All Orders'}</h3>
          <p className="text-sm text-gray-600 mb-4">
            {paused ? 'Bring the platform back online for customers.' : 'Temporarily stop accepting all new orders. Use only in emergencies.'}
          </p>
          <button
            onClick={paused ? handleResume : handlePause}
            disabled={loading}
            className={`w-full ${paused ? 'btn-success' : 'btn-danger'} disabled:opacity-50`}
          >
            {loading ? 'Working...' : paused ? 'Resume Now' : 'Pause Now'}
          </button>
        </div>

        <div className="card p-6">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center mb-4"><Store size={22} /></div>
          <h3 className="font-bold text-ink mb-2">Disable Specific Restaurant</h3>
          <p className="text-sm text-gray-600 mb-4">Use the Restaurants page to toggle individual restaurants instantly.</p>
          <a href="/restaurants" className="btn-outline w-full block text-center">Go to Restaurants</a>
        </div>

        <div className="card p-6">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center mb-4"><Ban size={22} /></div>
          <h3 className="font-bold text-ink mb-2">Block User Instantly</h3>
          <p className="text-sm text-gray-600 mb-4">Use the Customers page to block users by phone number.</p>
          <a href="/customers" className="btn-outline w-full block text-center">Go to Customers</a>
        </div>
      </div>
    </div>
  );
}

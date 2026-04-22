import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getSettings, updateSettings } from '../api/admin';

export default function Settings() {
  const [tab, setTab] = useState('platform');
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getSettings().then((res) => setSettings(res.data.settings)); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await updateSettings(settings);
      setSettings(res.data.settings);
      alert('Saved!');
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const upd = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  if (!settings) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  const tabs = [
    { k: 'platform', label: 'Platform Fees' },
    { k: 'location', label: 'Delivery' },
    { k: 'rules', label: 'Order Rules' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">System Settings</h1>
        <p className="text-sm text-gray-500">Configure platform-wide policies</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px ${tab === t.k ? 'text-primary border-primary' : 'text-gray-600 border-transparent'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-6 max-w-2xl space-y-4">
        {tab === 'platform' && (
          <>
            <Field label="Platform Fee (₹ per order)" value={settings.platformFee} onChange={(v) => upd('platformFee', v)} />
            <Field label="GST %" value={settings.gstPercent} onChange={(v) => upd('gstPercent', v)} />
            <Field label="Default Commission %" value={settings.defaultCommissionPercent} onChange={(v) => upd('defaultCommissionPercent', v)} />
          </>
        )}
        {tab === 'location' && (
          <>
            <Field label="Default Delivery Radius (km)" value={settings.defaultDeliveryRadiusKm} onChange={(v) => upd('defaultDeliveryRadiusKm', v)} />
            <Field label="Base Delivery Charge (₹)" value={settings.baseDeliveryCharge} onChange={(v) => upd('baseDeliveryCharge', v)} />
            <Field label="Per km Charge (₹)" value={settings.perKmCharge} onChange={(v) => upd('perKmCharge', v)} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.surgePricingEnabled}
                onChange={(e) => upd('surgePricingEnabled', e.target.checked)}
                className="w-4 h-4 accent-primary" />
              <span className="text-sm">Enable surge pricing</span>
            </label>
            {settings.surgePricingEnabled && (
              <Field label="Surge Multiplier" value={settings.surgeMultiplier} onChange={(v) => upd('surgeMultiplier', v)} />
            )}
          </>
        )}
        {tab === 'rules' && (
          <>
            <Field label="Minimum Order Value (₹)" value={settings.minimumOrderValue} onChange={(v) => upd('minimumOrderValue', v)} />
            <Field label="Free Cancellation Window (min)" value={settings.freeCancellationWindowMin} onChange={(v) => upd('freeCancellationWindowMin', v)} />
            <Field label="Cancellation Fee (₹)" value={settings.cancellationFee} onChange={(v) => upd('cancellationFee', v)} />
          </>
        )}
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type="number" value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))} className="input" />
    </div>
  );
}

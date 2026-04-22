import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChefHat, Store, User, Clock, Truck, Tag, Phone, CreditCard,
  FileText, CheckCircle, Upload, Save, Send, AlertCircle, X
} from 'lucide-react';
import { upsertRestaurantProfile, uploadDocument, updateRestaurantDoc, getMyRestaurants } from '../api/restaurant';
import { useAuth } from '../contexts/AuthContext';

// ─── field definitions for progress meter ──────────────────────────────────
const REQUIRED_FIELDS = [
  'name', 'ownerName', 'openingHours', 'deliveryType', 'cuisineType',
  'phone', 'ownerPan', 'bankDetails'
];
const OPTIONAL_FIELDS = ['secondaryPhone', 'ownerAadhar', 'firmPan', 'gstDoc', 'fssaiDoc', 'menuDoc'];
const ALL_FOR_PROGRESS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

function pct(profile) {
  const filled = ALL_FOR_PROGRESS.filter(k => {
    const v = profile[k];
    if (!v) return false;
    if (typeof v === 'object') return Object.values(v).some(Boolean);
    return String(v).trim() !== '';
  });
  return Math.round((filled.length / ALL_FOR_PROGRESS.length) * 100);
}

function FileUploadField({ label, required, hint, value, field, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setErr('');
    try {
      const res = await uploadDocument(file);
      onUploaded(field, res.data.url, res.data.storagePath);
    } catch (er) {
      setErr(er.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && <span className="text-gray-400 text-xs ml-1">({hint})</span>}
      </label>
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleChange} />
        {value?.url ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">File uploaded</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <Upload size={18} />
            <span className="text-sm">{uploading ? 'Uploading…' : 'Click to upload (Image or PDF, max 10 MB)'}</span>
          </div>
        )}
        {value?.url && (
          <a
            href={value.url}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-xs text-primary hover:underline"
          >
            View
          </a>
        )}
      </div>
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
    </div>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon size={18} className="text-primary" />
        </div>
        <h3 className="font-semibold text-dark">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState({
    name: '',
    ownerName: user.name || '',
    openingHours: '',
    deliveryType: 'platform',
    cuisineType: '',
    phone: user.phone || '',
    secondaryPhone: '',
    description: '',
    location: '',
    address: { street: '', city: '', state: '', pincode: '' },
    ownerAadhar: null,
    ownerPan: null,
    firmPan: null,
    gstDoc: null,
    fssaiDoc: null,
    menuDoc: null,
    bankDetails: { holderName: '', accountName: '', accountNo: '', ifsc: '' },
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const progress = pct(profile);
  const canSubmit = progress === 100;

  // Load existing restaurant profile if available
  useEffect(() => {
    getMyRestaurants().then(res => {
      const r = res.data?.restaurants?.[0];
      if (!r) return;
      if (r.status === 'approved') { navigate('/dashboard'); return; }
      if (r.status === 'pending' && r.profileCompleted) { setSubmitted(true); }
      setProfile(prev => ({
        ...prev,
        name: r.name || '',
        ownerName: user.name || '',
        openingHours: r.openingHours || '',
        deliveryType: r.deliveryType || 'platform',
        cuisineType: r.cuisineType?.join(', ') || '',
        phone: r.phone || user.phone || '',
        secondaryPhone: r.secondaryPhone || '',
        description: r.description || '',
        location: r.location || '',
        address: r.address || { street: '', city: '', state: '', pincode: '' },
        ownerAadhar: r.ownerAadhar || null,
        ownerPan: r.ownerPan || null,
        firmPan: r.firmPan || null,
        gstDoc: r.gstDoc || null,
        fssaiDoc: r.fssaiDoc || null,
        menuDoc: r.menuDoc || null,
        bankDetails: r.bankDetails || { holderName: '', accountName: '', accountNo: '', ifsc: '' },
      }));
    }).catch(() => {});
  }, []);

  const set = (key, val) => {
    setSaved(false);
    setProfile(prev => ({ ...prev, [key]: val }));
  };
  const setNested = (parent, key, val) => {
    setSaved(false);
    setProfile(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: val } }));
  };

  const onDocUploaded = async (field, url, storagePath) => {
    setSaved(false);
    try {
      await updateRestaurantDoc(field, url, storagePath);
    } catch (_) {}
    setProfile(prev => ({ ...prev, [field]: { url, storagePath } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: profile.name,
        description: profile.description || profile.name,
        phone: profile.phone,
        secondaryPhone: profile.secondaryPhone,
        email: user.email,
        location: profile.location || profile.address?.city || 'India',
        address: profile.address,
        openingHours: profile.openingHours,
        deliveryType: profile.deliveryType,
        cuisineType: profile.cuisineType ? profile.cuisineType.split(',').map(s => s.trim()).filter(Boolean) : [],
        bankDetails: profile.bankDetails,
        ownerName: profile.ownerName,
      };
      await upsertRestaurantProfile(payload);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await handleSave();
      setSubmitted(true);
      navigate('/status');
    } catch (err) {
      setError('Please save your details before submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <ChefHat className="text-white" size={20} />
            </div>
            <div>
              <p className="font-bold text-dark text-sm leading-tight">Foodhub Partner</p>
              <p className="text-xs text-gray-400">Restaurant Setup</p>
            </div>
          </div>
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Progress meter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-dark">Complete Your Profile</h2>
              <p className="text-sm text-gray-500">Fill all required details to submit for approval</p>
            </div>
            <div className={`text-2xl font-bold ${progress === 100 ? 'text-green-600' : 'text-primary'}`}>
              {progress}%
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 ? (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <CheckCircle size={15} /> Profile complete! You can now submit for approval.
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-2">
              {ALL_FOR_PROGRESS.length - Math.round((progress / 100) * ALL_FOR_PROGRESS.length)} fields remaining
            </p>
          )}
        </div>

        {submitted && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl px-5 py-4 flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Profile submitted for review</p>
              <p className="text-sm mt-0.5">Our team will review your application and approve it shortly.</p>
            </div>
          </div>
        )}

        {/* Store Details */}
        <Section icon={Store} title="Store Details">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Store Name <span className="text-red-500">*</span></label>
              <input
                type="text" placeholder="e.g. Pizza Palace"
                value={profile.name} onChange={e => set('name', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Category <span className="text-red-500">*</span></label>
              <input
                type="text" placeholder="e.g. Food, Bakery, Beverages"
                value={profile.cuisineType} onChange={e => set('cuisineType', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Delivery <span className="text-red-500">*</span></label>
              <select
                value={profile.deliveryType} onChange={e => set('deliveryType', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
              >
                <option value="platform">Platform (Foodhub delivery)</option>
                <option value="self">Self Delivery</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Open / Close Timing <span className="text-red-500">*</span></label>
              <input
                type="text" placeholder="e.g. 9:00 AM – 10:00 PM"
                value={profile.openingHours} onChange={e => set('openingHours', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Address / Location</label>
              <div className="grid grid-cols-2 gap-2">
                {['street', 'city', 'state', 'pincode'].map(f => (
                  <input key={f} type="text" placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                    value={profile.address?.[f] || ''}
                    onChange={e => setNested('address', f, e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Owner Details */}
        <Section icon={User} title="Owner Details">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Owner Name <span className="text-red-500">*</span></label>
              <input
                type="text" placeholder="Full name as per PAN"
                value={profile.ownerName} onChange={e => set('ownerName', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Owner Mobile <span className="text-red-500">*</span></label>
              <input
                type="tel" maxLength={10} placeholder="10-digit number"
                value={profile.phone} onChange={e => set('phone', e.target.value.replace(/\D/, ''))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Secondary Mobile</label>
              <input
                type="tel" maxLength={10} placeholder="Alternate number"
                value={profile.secondaryPhone} onChange={e => set('secondaryPhone', e.target.value.replace(/\D/, ''))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
        </Section>

        {/* KYC Documents */}
        <Section icon={FileText} title="KYC Documents">
          <FileUploadField label="Aadhar Card" field="ownerAadhar" hint="Upload up to 5 files, max 10 MB each"
            value={profile.ownerAadhar} onUploaded={onDocUploaded} />
          <FileUploadField label="PAN Card of Owner" required field="ownerPan" hint="Upload up to 5 files, max 10 MB each"
            value={profile.ownerPan} onUploaded={onDocUploaded} />
          <FileUploadField label="Firm PAN Card" field="firmPan" hint="Optional"
            value={profile.firmPan} onUploaded={onDocUploaded} />
          <FileUploadField label="GST Certificate" field="gstDoc" hint="If applicable"
            value={profile.gstDoc} onUploaded={onDocUploaded} />
          <FileUploadField label="FSSAI License" field="fssaiDoc" hint="If applicable"
            value={profile.fssaiDoc} onUploaded={onDocUploaded} />
          <FileUploadField label="Menu" field="menuDoc" hint="If applicable"
            value={profile.menuDoc} onUploaded={onDocUploaded} />
        </Section>

        {/* Bank Details */}
        <Section icon={CreditCard} title="Bank Details">
          {[
            { key: 'holderName', label: 'Account Holder Name', required: true },
            { key: 'accountName', label: 'Bank Name', required: false },
            { key: 'accountNo', label: 'Account Number', required: true },
            { key: 'ifsc', label: 'IFSC Code', required: true },
          ].map(({ key, label, required }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text" placeholder={label}
                value={profile.bankDetails?.[key] || ''}
                onChange={e => setNested('bankDetails', key, e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          ))}
        </Section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <X size={16} /> {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 disabled:opacity-50 transition-colors"
          >
            <Save size={18} /> {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            title={!canSubmit ? 'Complete all required fields first' : 'Submit for admin approval'}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} /> {submitting ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}

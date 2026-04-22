import { Plus, Shield, Edit2, Trash2 } from 'lucide-react';

const admins = [
  { id: 'A001', name: 'Super Admin', email: 'admin@foodhub.com', role: 'Super Admin', status: 'active' },
  { id: 'A002', name: 'Ramesh K.', email: 'ramesh@foodhub.com', role: 'Finance Admin', status: 'active' },
  { id: 'A003', name: 'Priya S.', email: 'priya@foodhub.com', role: 'Sub Admin', status: 'active' },
  { id: 'A004', name: 'Vikas M.', email: 'vikas@foodhub.com', role: 'Sub Admin', status: 'disabled' },
];

const roleColor = { 'Super Admin': 'badge-red', 'Finance Admin': 'badge-blue', 'Sub Admin': 'badge-gray' };

export default function Roles() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Roles & Permissions</h1>
          <p className="text-sm text-gray-500">Manage admin users and access control</p>
        </div>
        <button className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Admin</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { role: 'Super Admin', count: 1, perms: ['Full platform access', 'User management', 'Financial control'] },
          { role: 'Finance Admin', count: 1, perms: ['Payments & payouts', 'Refunds approval', 'Reports'] },
          { role: 'Sub Admin', count: 2, perms: ['Orders', 'Customer support', 'Limited restaurant control'] },
        ].map((r) => (
          <div key={r.role} className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-primary" size={20} />
              <h3 className="font-bold text-ink">{r.role}</h3>
              <span className="ml-auto badge badge-gray">{r.count}</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 mt-3">
              {r.perms.map((p) => <li key={p} className="flex items-center gap-2">• {p}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold">{a.name}</td>
                <td className="px-6 py-4 text-gray-700">{a.email}</td>
                <td className="px-6 py-4"><span className={`badge ${roleColor[a.role]}`}>{a.role}</span></td>
                <td className="px-6 py-4"><span className={`badge ${a.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{a.status}</span></td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={16} className="text-gray-600" /></button>
                    <button className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={16} className="text-red-600" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

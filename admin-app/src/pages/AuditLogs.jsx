import { Shield, User, FileText, Loader2 } from 'lucide-react';
import { getAuditLogs } from '../api/admin';
import { useApi } from '../hooks/useApi';

const actionIcons = {
  CANCEL_ORDER: '🚫',
  ASSIGN_DELIVERY: '🚚',
  ISSUE_REFUND: '💰',
  APPROVE_RESTAURANT: '✅',
  REJECT_RESTAURANT: '❌',
  BLOCK_USER: '🔒',
  UNBLOCK_USER: '🔓',
  UPDATE_SETTINGS: '⚙️',
  PAUSE_PLATFORM: '⏸️',
  RESUME_PLATFORM: '▶️'
};

export default function AuditLogs() {
  const { data, loading } = useApi(() => getAuditLogs({ limit: 100 }));
  const logs = data?.logs || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink flex items-center gap-2">
          <Shield className="text-primary" size={28} /> Audit Log
        </h1>
        <p className="text-sm text-gray-500">Track all admin actions for compliance and security</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Action</th>
                <th className="px-6 py-3 text-left">Admin</th>
                <th className="px-6 py-3 text-left">Details</th>
                <th className="px-6 py-3 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{actionIcons[log.action] || '📋'}</span>
                      <span className="font-semibold">{log.action.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="font-medium">{log.adminName || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {log.orderNumber && <span className="badge badge-blue mr-2">#{log.orderNumber}</span>}
                    {log.reason && <span className="text-xs text-gray-600">{log.reason}</span>}
                    {log.amount && <span className="font-semibold text-primary ml-2">₹{log.amount}</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan="4" className="text-center py-12 text-gray-500">No audit logs found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <div className="card p-4 bg-blue-50 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-900">
            <p className="font-bold mb-1">Audit Log Retention</p>
            <p>All admin actions are logged and retained for compliance purposes. Logs cannot be deleted or modified.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

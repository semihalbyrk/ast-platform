import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Plus, ArrowUpDown } from 'lucide-react';

interface PO { id: string; poNumber: string; client?: { name: string }; status: string; totalExclVat: number; totalInclVat: number; issueDate: string; periodStart: string; periodEnd: string; }

const STATUS_SELECT_STYLES: Record<string, string> = {
  ready: 'border-yellow-300 bg-yellow-50 text-yellow-800 focus:border-yellow-400',
  paid: 'border-green-300 bg-green-25 text-green-700',
  rejected: 'border-red-300 bg-red-50 text-red-700',
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function fetchOrders() {
    api.get<{ data: PO[] }>('/api/purchase-orders?limit=100')
      .then((res) => setOrders(res.data)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(() => { fetchOrders(); }, []);

  async function updateStatus(id: string, status: 'ready' | 'paid' | 'rejected') {
    try { await api.patch(`/api/purchase-orders/${id}/status`, { status }); fetchOrders(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Status update failed'); }
  }

  if (loading) return <div className="text-grey-500 text-sm">Loading...</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;

  return (
    <div>
      <div className="bg-white rounded-lg border border-grey-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-grey-200">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-grey-900">Purchase Invoices</h2>
            <Link to="/purchase-orders/generate" className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-500 hover:text-green-700">
              <Plus size={16} strokeWidth={2} /> Generate
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <p className="px-5 py-8 text-grey-500 text-sm text-center">No purchase invoices yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-grey-50 border-b border-grey-200">
              {['Purchase Invoice Number', 'Client (Opdrachtgever)', 'Status', 'Period', 'Total (excl VAT)', 'Issue Date'].map((h) => (
                <th key={h} className={`px-4 py-3 text-xs font-medium text-grey-500 uppercase tracking-wide ${h.includes('Total') ? 'text-right' : 'text-left'}`}>
                  <span className="inline-flex items-center gap-1">{h}<ArrowUpDown size={12} className="text-grey-400" /></span>
                </th>
              ))}
            </tr></thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po.id} className="border-b border-grey-100 hover:bg-grey-50">
                  <td className="px-4 py-3.5"><Link to={`/purchase-orders/${po.id}`} className="text-green-500 font-medium hover:underline">{po.poNumber}</Link></td>
                  <td className="px-4 py-3.5 text-grey-700">{po.client?.name || '—'}</td>
                  <td className="px-4 py-3.5">
                    <select
                      className={`h-9 min-w-[140px] rounded-md border px-2.5 text-sm font-semibold outline-none ${STATUS_SELECT_STYLES[po.status] ?? 'border-grey-300 bg-white text-grey-700'} ${po.status !== 'ready' ? 'cursor-not-allowed' : ''}`}
                      value={po.status}
                      disabled={po.status !== 'ready'}
                      onChange={(e) => {
                        const v = e.target.value as 'ready' | 'paid' | 'rejected';
                        if (v === po.status) return;
                        void updateStatus(po.id, v);
                      }}
                    >
                      <option value="ready">Ready</option>
                      <option value="paid">Paid</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-grey-700">{new Date(po.periodStart).toLocaleDateString()} — {new Date(po.periodEnd).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5 text-right text-grey-700">€{Number(po.totalExclVat).toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-grey-700">{new Date(po.issueDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

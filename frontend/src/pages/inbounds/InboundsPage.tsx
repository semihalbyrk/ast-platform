import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Plus, ArrowUpDown } from 'lucide-react';

interface Inbound {
  id: string;
  weegbonNr: string;
  inboundDate: string;
  licensePlate?: string;
  supplier?: { name: string };
  material?: { name: string };
  grossWeight?: number;
  netWeight?: number;
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  weighed_in: 'bg-[#eff8ff] text-[#1570ef] border-[#84caff]',
  in_yard: 'bg-[#fffaeb] text-[#b54708] border-[#fec84b]',
  quality_checked: 'bg-[#f4f3ff] text-[#5925dc] border-[#d9d6fe]',
  weighed_out: 'bg-[#fffaeb] text-[#b54708] border-[#fec84b]',
  completed: 'bg-green-25 text-green-700 border-green-300',
  rejected: 'bg-red-50 text-red-700 border-red-300',
};

const formatEnumLabel = (value: string) =>
  value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

export default function InboundsPage() {
  const [inbounds, setInbounds] = useState<Inbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ data: Inbound[]; meta: { total: number } }>('/api/inbounds?limit=100')
      .then((res) => setInbounds(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-grey-500 text-sm">Loading...</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;

  return (
    <div>
      <div className="bg-white rounded-lg border border-grey-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-grey-200">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-grey-900">Inbounds</h2>
            <Link to="/inbounds/weigh-in" className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-500 hover:text-green-700">
              <Plus size={16} strokeWidth={2} /> Add
            </Link>
          </div>
        </div>

        {inbounds.length === 0 ? (
          <p className="px-5 py-8 text-grey-500 text-sm text-center">No inbounds yet. Create a weigh-in to get started.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead><tr className="bg-grey-50 border-b border-grey-200">
                {['Weegbon Nr', 'Date', 'Plate', 'Supplier', 'Material'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">
                    <span className="inline-flex items-center gap-1">{h}<ArrowUpDown size={12} className="text-grey-400" /></span>
                  </th>
                ))}
                {['Gross (kg)', 'Net (kg)'].map((h) => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">
                    <span className="inline-flex items-center gap-1 justify-end">{h}<ArrowUpDown size={12} className="text-grey-400" /></span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Status</th>
              </tr></thead>
              <tbody>
                {inbounds.map((ib) => (
                  <tr key={ib.id} className="border-b border-grey-100 hover:bg-grey-50">
                    <td className="px-4 py-3.5"><Link to={`/inbounds/${ib.id}`} className="text-green-500 font-medium hover:underline">{ib.weegbonNr}</Link></td>
                    <td className="px-4 py-3.5 text-grey-700">{new Date(ib.inboundDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5 text-grey-700">{ib.licensePlate || '—'}</td>
                    <td className="px-4 py-3.5 text-grey-700">{ib.supplier?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-grey-700">{ib.material?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-right text-grey-700">{ib.grossWeight ? Number(ib.grossWeight).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3.5 text-right text-grey-700">{ib.netWeight ? Number(ib.netWeight).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[ib.status] || 'bg-grey-100 text-grey-700 border-grey-300'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {formatEnumLabel(ib.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-5 py-3 border-t border-grey-200 text-sm text-grey-500">
              <span>1-{inbounds.length} of {inbounds.length} items</span>
              <span className="text-xs text-grey-400">10 / Page</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

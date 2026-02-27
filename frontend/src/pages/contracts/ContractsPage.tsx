import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Plus, MoreVertical, ArrowUpDown } from 'lucide-react';

interface Contract {
  id: string; number: string; type: string; client?: { name: string }; entity?: { name: string };
  transporter?: { name: string }; material?: { name: string }; price: number; impDeduction?: number;
  agreedVolume: number; freights?: number; processedWeight?: number; notes?: string; startDate: string; endDate: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  function fetchContracts() {
    api.get<{ data: Contract[] }>('/api/contracts?includeGesloten=true')
      .then((res) => setContracts(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { fetchContracts(); }, []);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this contract?')) return;
    try { await api.delete(`/api/contracts/${id}`); fetchContracts(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); }
  }

  if (loading) return <div className="text-grey-500 text-sm">Loading...</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;

  return (
    <div>
      <div className="bg-white rounded-lg border border-grey-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-grey-200">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-grey-900">Contracts</h2>
            <Link to="/contracts/new" className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-500 hover:text-green-700">
              <Plus size={16} strokeWidth={2} /> Add
            </Link>
          </div>
        </div>

        {contracts.length === 0 ? (
          <p className="px-5 py-8 text-grey-500 text-sm text-center">No contracts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1400px]">
              <thead><tr className="bg-grey-50 border-b border-grey-200">
                {['Number', 'Type', 'Client (Opdrachtgever)', 'Supplier (Leverancier)', 'Transporter', 'Material', 'Price/ton', 'Imp Deduction', 'Agreed Weight', 'Freights', 'Processed', 'Notes', 'Period'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">
                    <span className="inline-flex items-center gap-1">{h}<ArrowUpDown size={12} className="text-grey-400" /></span>
                  </th>
                ))}
                <th className="w-12 px-4 py-3"></th>
              </tr></thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b border-grey-100 hover:bg-grey-50 group">
                    <td className="px-4 py-3.5"><Link to={`/contracts/${c.id}`} className="text-green-500 font-medium hover:underline">{c.number}</Link></td>
                    <td className="px-4 py-3.5 text-grey-700">{c.type.charAt(0).toUpperCase() + c.type.slice(1)}</td>
                    <td className="px-4 py-3.5 text-grey-700">{c.client?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-grey-700">{c.entity?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-grey-700">{c.transporter?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-grey-700">{c.material?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-grey-700">€{Number(c.price).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-grey-700">€{Number(c.impDeduction || 0).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-grey-700">{Number(c.agreedVolume).toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-grey-700">{c.freights != null ? Number(c.freights).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
                    <td className="px-4 py-3.5 text-grey-700">{c.processedWeight != null ? Number(c.processedWeight).toLocaleString() : '0'}</td>
                    <td className="px-4 py-3.5 text-grey-700 max-w-[200px] truncate" title={c.notes || ''}>{c.notes || '—'}</td>
                    <td className="px-4 py-3.5 text-xs text-grey-700">{new Date(c.startDate).toLocaleDateString()} — {new Date(c.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5 relative">
                      <button onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                        className="opacity-0 group-hover:opacity-100 text-grey-400 hover:text-grey-600 transition-opacity">
                        <MoreVertical size={18} strokeWidth={1.5} />
                      </button>
                      {menuOpen === c.id && (
                        <div className="absolute right-4 top-10 z-10 bg-white border border-grey-200 rounded-md shadow-md py-1 min-w-[120px]">
                          <Link to={`/contracts/${c.id}`} className="block px-3 py-2 text-sm text-grey-700 hover:bg-grey-50" onClick={() => setMenuOpen(null)}>Edit</Link>
                          <button onClick={() => { setMenuOpen(null); handleDelete(c.id); }} className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

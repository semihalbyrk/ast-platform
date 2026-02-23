import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Plus, MoreVertical } from 'lucide-react';

interface YardLocation { id: string; name: string; capacity?: number; active: boolean; }

export default function YardLocationsPage() {
  const [locations, setLocations] = useState<YardLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  function fetchLocations() {
    api.get<{ data: YardLocation[] }>('/api/yard-locations').then((res) => setLocations(res.data)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(() => { fetchLocations(); }, []);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this yard location?')) return;
    try { await api.delete(`/api/yard-locations/${id}`); fetchLocations(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); }
  }

  if (loading) return <div className="text-grey-500 text-sm">Loading...</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;

  return (
    <div>
      <div className="bg-white rounded-lg border border-grey-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-grey-200">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-grey-900">Yard Locations</h2>
            <Link to="/yard-locations/new" className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-500 hover:text-green-700">
              <Plus size={16} strokeWidth={2} /> Add
            </Link>
          </div>
        </div>

        {locations.length === 0 ? (
          <p className="px-5 py-8 text-grey-500 text-sm text-center">No yard locations yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-grey-50 border-b border-grey-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Capacity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Status</th>
              <th className="w-12 px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {locations.map((l) => (
                <tr key={l.id} className="border-b border-grey-100 hover:bg-grey-50 group">
                  <td className="px-4 py-3.5"><Link to={`/yard-locations/${l.id}`} className="text-green-500 font-medium hover:underline">{l.name}</Link></td>
                  <td className="px-4 py-3.5 text-grey-700">{l.capacity ? `${l.capacity} kg` : '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${l.active ? 'bg-green-25 text-green-700 border-green-300' : 'bg-grey-100 text-grey-500 border-grey-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${l.active ? 'bg-green-500' : 'bg-grey-400'}`} />
                      {l.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 relative">
                    <button onClick={() => setMenuOpen(menuOpen === l.id ? null : l.id)} className="opacity-0 group-hover:opacity-100 text-grey-400 hover:text-grey-600 transition-opacity">
                      <MoreVertical size={18} strokeWidth={1.5} /></button>
                    {menuOpen === l.id && (
                      <div className="absolute right-4 top-10 z-10 bg-white border border-grey-200 rounded-md shadow-md py-1 min-w-[120px]">
                        <Link to={`/yard-locations/${l.id}`} className="block px-3 py-2 text-sm text-grey-700 hover:bg-grey-50" onClick={() => setMenuOpen(null)}>Edit</Link>
                        <button onClick={() => { setMenuOpen(null); handleDelete(l.id); }} className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

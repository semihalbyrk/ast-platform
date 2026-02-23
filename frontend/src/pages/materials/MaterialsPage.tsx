import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Plus, MoreVertical } from 'lucide-react';

interface Material { id: string; name: string; hazardous: boolean; weightUom: string; }

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  function fetchMaterials() {
    api.get<{ data: Material[] }>('/api/materials').then((res) => setMaterials(res.data)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(() => { fetchMaterials(); }, []);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this material?')) return;
    try { await api.delete(`/api/materials/${id}`); fetchMaterials(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); }
  }

  if (loading) return <div className="text-grey-500 text-sm">Loading...</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;

  return (
    <div>
      <div className="bg-white rounded-lg border border-grey-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-grey-200">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-grey-900">Materials</h2>
            <Link to="/materials/new" className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-500 hover:text-green-700">
              <Plus size={16} strokeWidth={2} /> Add
            </Link>
          </div>
        </div>

        {materials.length === 0 ? (
          <p className="px-5 py-8 text-grey-500 text-sm text-center">No materials yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-grey-50 border-b border-grey-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Hazardous</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Weight UOM</th>
              <th className="w-12 px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id} className="border-b border-grey-100 hover:bg-grey-50 group">
                  <td className="px-4 py-3.5"><Link to={`/materials/${m.id}`} className="text-green-500 font-medium hover:underline">{m.name}</Link></td>
                  <td className="px-4 py-3.5 text-grey-700">{m.hazardous ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3.5 text-grey-700">{m.weightUom.toUpperCase()}</td>
                  <td className="px-4 py-3.5 relative">
                    <button onClick={() => setMenuOpen(menuOpen === m.id ? null : m.id)} className="opacity-0 group-hover:opacity-100 text-grey-400 hover:text-grey-600 transition-opacity">
                      <MoreVertical size={18} strokeWidth={1.5} /></button>
                    {menuOpen === m.id && (
                      <div className="absolute right-4 top-10 z-10 bg-white border border-grey-200 rounded-md shadow-md py-1 min-w-[120px]">
                        <Link to={`/materials/${m.id}`} className="block px-3 py-2 text-sm text-grey-700 hover:bg-grey-50" onClick={() => setMenuOpen(null)}>Edit</Link>
                        <button onClick={() => { setMenuOpen(null); handleDelete(m.id); }} className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
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

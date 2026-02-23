import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Plus, MoreVertical } from 'lucide-react';

const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

interface Entity {
  id: string;
  name: string;
  type: string[];
  city?: string;
}

const TABS = [
  { key: 'client', label: 'Clients' },
  { key: 'supplier', label: 'Suppliers' },
  { key: 'transporter', label: 'Transporters' },
] as const;

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [activeTab, setActiveTab] = useState<'client' | 'supplier' | 'transporter'>('client');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  function fetchEntities() {
    api.get<{ data: Entity[] }>('/api/entities')
      .then((res) => setEntities(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchEntities(); }, []);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this entity?')) return;
    try { await api.delete(`/api/entities/${id}`); fetchEntities(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); }
  }

  if (loading) return <div className="text-grey-500 text-sm">Loading...</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;

  const filtered = entities.filter((e) => Array.isArray(e.type) && e.type.includes(activeTab));

  return (
    <div>
      <div className="bg-white rounded-lg border border-grey-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-grey-200">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-grey-900">Entities</h2>
            <Link to="/entities/new" className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-500 hover:text-green-700">
              <Plus size={16} strokeWidth={2} /> Add
            </Link>
          </div>
        </div>

        <div className="px-5 border-b border-grey-200">
          <div className="flex items-center gap-10 sm:gap-14 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'text-green-500 border-green-500 font-semibold'
                    : 'text-grey-500 border-transparent hover:text-grey-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-grey-500 text-sm text-center">
            No {activeTab === 'client' ? 'clients' : activeTab === 'supplier' ? 'suppliers' : 'transporters'} yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-grey-50 border-b border-grey-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">City</th>
              <th className="w-12 px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-grey-100 hover:bg-grey-50 group">
                  <td className="px-4 py-3.5"><Link to={`/entities/${e.id}`} className="text-green-500 font-medium hover:underline">{e.name}</Link></td>
                  <td className="px-4 py-3.5 text-grey-700">{Array.isArray(e.type) ? e.type.map((t) => formatLabel(t)).join(', ') : e.type}</td>
                  <td className="px-4 py-3.5 text-grey-700">{e.city || '—'}</td>
                  <td className="px-4 py-3.5 relative">
                    <button onClick={() => setMenuOpen(menuOpen === e.id ? null : e.id)}
                      className="opacity-0 group-hover:opacity-100 text-grey-400 hover:text-grey-600 transition-opacity">
                      <MoreVertical size={18} strokeWidth={1.5} />
                    </button>
                    {menuOpen === e.id && (
                      <div className="absolute right-4 top-10 z-10 bg-white border border-grey-200 rounded-md shadow-md py-1 min-w-[120px]">
                        <Link to={`/entities/${e.id}`} className="block px-3 py-2 text-sm text-grey-700 hover:bg-grey-50" onClick={() => setMenuOpen(null)}>Edit</Link>
                        <button onClick={() => { setMenuOpen(null); handleDelete(e.id); }} className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
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

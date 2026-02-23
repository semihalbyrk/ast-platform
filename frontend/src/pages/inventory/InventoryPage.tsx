import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Boxes, Scale, DollarSign } from 'lucide-react';

interface Position { id: string; material?: { code: string; name: string }; location?: { code: string; name: string }; quantityKg: number; avgCostEurTon: number; totalCostEur: number; }
interface Movement { id: string; type: string; material?: { code: string; name: string }; location?: { code: string; name: string }; quantityKg: number; costEur: number; reason?: string; createdAt: string; }
interface Summary { totalPositions?: number; totalQuantityKg?: number; totalValueEur?: number; }
type Tab = 'positions' | 'movements';

const MOVEMENT_STYLES: Record<string, string> = {
  inbound: 'bg-green-25 text-green-700 border-green-300',
  outbound: 'bg-red-50 text-red-700 border-red-300',
  adjustment: 'bg-[#fffaeb] text-[#b54708] border-[#fec84b]',
};

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('positions');
  const [positions, setPositions] = useState<Position[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [summary, setSummary] = useState<Summary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<{ data: Position[] }>('/api/inventory?limit=200'),
      api.get<{ data: Movement[] }>('/api/inventory/movements?limit=200'),
      api.get<{ data: Summary }>('/api/inventory/summary'),
    ]).then(([p, m, s]) => { setPositions(p.data); setMovements(m.data); setSummary(s.data); })
      .catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-grey-500 text-sm">Loading...</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-grey-900">Inventory</h1>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {[
          { icon: Boxes, label: 'Positions', value: String(summary.totalPositions ?? positions.length) },
          { icon: Scale, label: 'Total Quantity', value: `${(summary.totalQuantityKg ?? 0).toLocaleString()} kg` },
          { icon: DollarSign, label: 'Total Value', value: `€${(summary.totalValueEur ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-lg border border-grey-200 shadow-sm p-5">
            <div className="flex items-center gap-2 text-sm text-grey-500"><card.icon size={16} strokeWidth={1.5} />{card.label}</div>
            <div className="text-2xl font-bold text-grey-900 mt-2">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-grey-200">
        <div className="flex gap-6">
          {(['positions', 'movements'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'text-green-500 border-green-500 font-semibold' : 'text-grey-500 border-transparent hover:text-grey-700'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'positions' && (
        positions.length === 0 ? <p className="mt-4 text-grey-500 text-sm">No inventory positions.</p> : (
          <div className="bg-white rounded-lg border border-grey-200 shadow-sm overflow-hidden mt-0">
            <table className="w-full text-sm">
              <thead><tr className="bg-grey-50 border-b border-grey-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Material</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Location</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Quantity (kg)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Avg Cost/ton</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Total Cost</th>
              </tr></thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.id} className="border-b border-grey-100 hover:bg-grey-50">
                    <td className="px-4 py-3.5 text-grey-700">{p.material?.code ? `${p.material.code} — ${p.material.name}` : '—'}</td>
                    <td className="px-4 py-3.5 text-grey-700">{p.location?.code ? `${p.location.code} — ${p.location.name}` : '—'}</td>
                    <td className="px-4 py-3.5 text-right text-grey-700">{Number(p.quantityKg).toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-grey-700">€{Number(p.avgCostEurTon).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-right text-grey-700">€{Number(p.totalCostEur).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'movements' && (
        movements.length === 0 ? <p className="mt-4 text-grey-500 text-sm">No inventory movements.</p> : (
          <div className="bg-white rounded-lg border border-grey-200 shadow-sm overflow-hidden mt-0">
            <table className="w-full text-sm">
              <thead><tr className="bg-grey-50 border-b border-grey-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Material</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Location</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Quantity (kg)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Reason</th>
              </tr></thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-grey-100 hover:bg-grey-50">
                    <td className="px-4 py-3.5 text-grey-700">{new Date(m.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${MOVEMENT_STYLES[m.type] || 'bg-grey-100 text-grey-700 border-grey-300'}`}>{m.type}</span>
                    </td>
                    <td className="px-4 py-3.5 text-grey-700">{m.material?.code || '—'}</td>
                    <td className="px-4 py-3.5 text-grey-700">{m.location?.code || '—'}</td>
                    <td className="px-4 py-3.5 text-right text-grey-700">{Number(m.quantityKg).toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-grey-700">€{Number(m.costEur).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-grey-500">{m.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

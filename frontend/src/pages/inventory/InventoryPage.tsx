import { useEffect, useState, type ElementType } from 'react';
import { api } from '../../api/client';
import { Boxes, Scale, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';

interface Position {
  id: string;
  material?: { code: string; name: string };
  location?: { id?: string; code: string; name: string };
  quantityKg: number;
  avgCostEurTon: number;
  totalCostEur: number;
  impurityKg?: number;
  cleanKg?: number;
  impurityPct?: number;
}
interface Movement { id: string; type: string; material?: { code: string; name: string }; location?: { code: string; name: string }; quantityKg: number; costEur: number; reason?: string; createdAt: string; }
interface SummaryMaterial { code?: string | null; quantityKg: number; valueEur: number; }
interface SummaryLocation {
  id: string;
  code?: string | null;
  name: string;
  quantityKg: number;
  valueEur: number;
  capacityKg?: number | null;
  utilizationPct?: number | null;
}
interface Summary { totalPositions?: number; totalQuantityKg?: number; totalValueEur?: number; materials?: SummaryMaterial[]; locations?: SummaryLocation[]; }
type Tab = 'positions' | 'movements';
interface KpiCard { icon: ElementType; label: string; value: string; sub?: string }

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
  const [openLocations, setOpenLocations] = useState<Record<string, boolean>>({});

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

  const groupedPositions = positions.reduce<Record<string, { key: string; label: string; rows: Position[] }>>((acc, p) => {
    const key = p.location?.id ?? p.location?.code ?? 'unknown';
    const label = p.location?.code ? `${p.location.code} — ${p.location.name}` : (p.location?.name ?? 'Unknown Location');
    if (!acc[key]) acc[key] = { key, label, rows: [] };
    acc[key].rows.push(p);
    return acc;
  }, {});
  const locationGroups = Object.values(groupedPositions).sort((a, b) => a.label.localeCompare(b.label));
  const locationSummaryByKey = (summary.locations ?? []).reduce<Record<string, SummaryLocation>>((acc, l) => {
    acc[l.id] = l;
    if (l.code) acc[l.code] = l;
    return acc;
  }, {});
  const kpiCards: KpiCard[] = [
    { icon: Boxes, label: 'Positions', value: String(summary.totalPositions ?? positions.length) },
    { icon: Scale, label: 'Total Weight', value: `${(summary.totalQuantityKg ?? 0).toLocaleString()} kg` },
    { icon: DollarSign, label: 'Total Value', value: `€${(summary.totalValueEur ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    ...(summary.materials ?? []).map((m) => ({
      icon: Scale,
      label: `${m.code ?? 'Material'} Weight`,
      value: `${Number(m.quantityKg ?? 0).toLocaleString()} kg`,
    })),
    ...(summary.locations ?? []).map((l) => ({
      icon: Boxes,
      label: `${l.code ?? l.name} Utilization`,
      value: l.utilizationPct != null ? `${Number(l.utilizationPct).toFixed(2)}%` : 'N/A',
      sub: l.capacityKg != null ? `${Number(l.quantityKg).toLocaleString()} / ${Number(l.capacityKg).toLocaleString()} kg` : `${Number(l.quantityKg).toLocaleString()} kg`,
    })),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-grey-900">Inventory</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg border border-grey-200 shadow-sm p-5">
            <div className="flex items-center gap-2 text-sm text-grey-500"><card.icon size={16} strokeWidth={1.5} />{card.label}</div>
            <div className="text-2xl font-bold text-grey-900 mt-2">{card.value}</div>
            {card.sub ? <div className="text-xs text-grey-500 mt-1">{card.sub}</div> : null}
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
          <div className="mt-4 space-y-3">
            {locationGroups.map((group) => {
              const totalWeight = group.rows.reduce((sum, row) => sum + Number(row.quantityKg || 0), 0);
              const totalImpurity = group.rows.reduce((sum, row) => sum + Number(row.impurityKg || 0), 0);
              const totalClean = Math.max(0, totalWeight - totalImpurity);
              const impurityPct = totalWeight > 0 ? (totalImpurity / totalWeight) * 100 : 0;
              const isOpen = openLocations[group.key] ?? true;
              const locSummary = locationSummaryByKey[group.key];
              const capacityKg = locSummary?.capacityKg ?? null;
              const capacityUtilization = locSummary?.utilizationPct ?? (capacityKg && capacityKg > 0 ? (totalWeight / capacityKg) * 100 : null);

              return (
                <div key={group.key} className="bg-white rounded-lg border border-grey-200 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenLocations((prev) => ({ ...prev, [group.key]: !isOpen }))}
                    className="w-full px-4 py-3.5 border-b border-grey-200 bg-grey-25 hover:bg-grey-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-grey-900">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <span>{group.label}</span>
                      </div>
                      <div className="flex items-center gap-5 text-xs text-grey-600">
                        <span>Total Weight: <b className="text-grey-800">{totalWeight.toLocaleString()} kg</b></span>
                        <span>Impurity: <b className="text-grey-800">{totalImpurity.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg</b></span>
                        <span>Clean: <b className="text-grey-800">{totalClean.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg</b></span>
                        <span>Impurity %: <b className="text-grey-800">{impurityPct.toFixed(2)}%</b></span>
                        <span>Capacity: <b className="text-grey-800">{capacityKg != null ? `${Number(capacityKg).toLocaleString()} kg` : 'N/A'}</b></span>
                        <span>Capacity Utilization: <b className="text-grey-800">{capacityUtilization != null ? `${Number(capacityUtilization).toFixed(2)}%` : 'N/A'}</b></span>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <table className="w-full text-sm">
                      <thead><tr className="bg-grey-50 border-b border-grey-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Material</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Weight (kg)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Impurity (kg)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Clean (kg)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Impurity %</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Avg Cost/ton</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Total Cost</th>
                      </tr></thead>
                      <tbody>
                        {group.rows
                          .slice()
                          .sort((a, b) => (a.material?.code ?? a.material?.name ?? '').localeCompare(b.material?.code ?? b.material?.name ?? ''))
                          .map((p) => (
                            <tr key={p.id} className="border-b border-grey-100 hover:bg-grey-50">
                              <td className="px-4 py-3.5 text-grey-700">{p.material?.code ? `${p.material.code} — ${p.material.name}` : '—'}</td>
                              <td className="px-4 py-3.5 text-right text-grey-700">{Number(p.quantityKg).toLocaleString()}</td>
                              <td className="px-4 py-3.5 text-right text-grey-700">{Number(p.impurityKg ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                              <td className="px-4 py-3.5 text-right text-grey-700">{Number(p.cleanKg ?? p.quantityKg).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                              <td className="px-4 py-3.5 text-right text-grey-700">{Number(p.impurityPct ?? 0).toFixed(2)}%</td>
                              <td className="px-4 py-3.5 text-right text-grey-700">€{Number(p.avgCostEurTon).toFixed(2)}</td>
                              <td className="px-4 py-3.5 text-right text-grey-700">€{Number(p.totalCostEur).toFixed(2)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
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
                <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Weight (kg)</th>
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

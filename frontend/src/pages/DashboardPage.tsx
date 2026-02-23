import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { TrendingUp, Package, FileText, AlertTriangle } from 'lucide-react';

interface InboundPeriod {
  count: number;
  total_weight_kg: number;
  total_value_eur: number;
}

interface DashboardData {
  inbounds_today: InboundPeriod;
  inbounds_this_week: InboundPeriod;
  inbounds_this_month: InboundPeriod;
  inventory: {
    total_quantity_kg: number;
    total_value_eur: number;
    position_count: number;
  };
  purchase_orders: {
    ready_count: number;
    ready_value_eur: number;
    paid_count: number;
    paid_value_eur: number;
  };
  recent_inbounds: {
    id: string;
    weegbon_nr: string;
    supplier: string;
    material: string;
    net_weight_kg: number;
    total_value_eur: number;
    created_at: string;
  }[];
  contracts_at_risk: {
    id: string;
    number: string;
    supplier: string;
    days_remaining: number;
    utilization_pct: number;
  }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ data: DashboardData }>('/api/dashboard/summary')
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message));
  }, []);

  if (!data && !error) return <div className="text-grey-500 text-sm">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-grey-900">Dashboard</h1>
      <p className="text-sm text-grey-500 mt-1">Welcome, {user?.name} ({user?.role})</p>

      {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <KpiCard icon={TrendingUp} label="Inbounds Today" value={data.inbounds_today.count} sub={`${data.inbounds_today.total_weight_kg.toLocaleString()} kg`} />
            <KpiCard icon={TrendingUp} label="This Week" value={data.inbounds_this_week.count} sub={`€${data.inbounds_this_week.total_value_eur.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
            <KpiCard icon={TrendingUp} label="This Month" value={data.inbounds_this_month.count} sub={`${data.inbounds_this_month.total_weight_kg.toLocaleString()} kg`} />
            <KpiCard icon={Package} label="Inventory" value={data.inventory.position_count} sub={`€${data.inventory.total_value_eur.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg border border-grey-200 shadow-sm p-5">
              <div className="flex items-center gap-2 text-sm text-grey-500"><FileText size={16} strokeWidth={1.5} />Ready POs</div>
              <div className="text-2xl font-bold text-grey-900 mt-2">{data.purchase_orders.ready_count}</div>
              <div className="text-xs text-grey-400 mt-1">€{data.purchase_orders.ready_value_eur.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-white rounded-lg border border-grey-200 shadow-sm p-5">
              <div className="flex items-center gap-2 text-sm text-grey-500"><FileText size={16} strokeWidth={1.5} />Paid POs</div>
              <div className="text-2xl font-bold text-grey-900 mt-2">{data.purchase_orders.paid_count}</div>
              <div className="text-xs text-grey-400 mt-1">€{data.purchase_orders.paid_value_eur.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          {data.contracts_at_risk.length > 0 && (
            <div className="mt-6 bg-white rounded-lg border border-grey-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-grey-200">
                <AlertTriangle size={16} className="text-orange-500" strokeWidth={1.5} />
                <h2 className="text-base font-semibold text-grey-900">Contracts at Risk</h2>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-grey-50 border-b border-grey-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Contract</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Days Left</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Utilization</th>
                </tr></thead>
                <tbody>
                  {data.contracts_at_risk.map((c) => (
                    <tr key={c.id} className="border-b border-grey-100 hover:bg-grey-50">
                      <td className="px-4 py-3.5 font-medium text-grey-700">{c.number}</td>
                      <td className="px-4 py-3.5 text-grey-700">{c.supplier}</td>
                      <td className="px-4 py-3.5"><span className={c.days_remaining <= 7 ? 'text-red-600 font-medium' : 'text-grey-700'}>{c.days_remaining}d</span></td>
                      <td className="px-4 py-3.5 text-grey-700">{c.utilization_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.recent_inbounds.length > 0 && (
            <div className="mt-6 bg-white rounded-lg border border-grey-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-grey-200">
                <h2 className="text-base font-semibold text-grey-900">Recent Inbounds</h2>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-grey-50 border-b border-grey-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Weegbon</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Material</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Net Weight</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wide">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wide">Date</th>
                </tr></thead>
                <tbody>
                  {data.recent_inbounds.map((ib) => (
                    <tr key={ib.id} className="border-b border-grey-100 hover:bg-grey-50">
                      <td className="px-4 py-3.5 font-medium text-green-500">{ib.weegbon_nr}</td>
                      <td className="px-4 py-3.5 text-grey-700">{ib.supplier}</td>
                      <td className="px-4 py-3.5 text-grey-700">{ib.material}</td>
                      <td className="px-4 py-3.5 text-right text-grey-700">{ib.net_weight_kg?.toLocaleString()} kg</td>
                      <td className="px-4 py-3.5 text-right text-grey-700">€{ib.total_value_eur?.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-grey-700">{new Date(ib.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number; sub: string }) {
  return (
    <div className="bg-white rounded-lg border border-grey-200 shadow-sm p-5">
      <div className="flex items-center gap-2 text-sm text-grey-500"><Icon size={16} strokeWidth={1.5} />{label}</div>
      <div className="text-2xl font-bold text-grey-900 mt-2">{value}</div>
      <div className="text-xs text-grey-400 mt-1">{sub}</div>
    </div>
  );
}

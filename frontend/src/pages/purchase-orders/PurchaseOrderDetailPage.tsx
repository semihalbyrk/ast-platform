import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api/client';
import { ArrowLeft, Download } from 'lucide-react';

interface InboundRef { id: string; weegbonNr: string; licensePlate?: string; inboundDate: string; netWeight?: number; impPct?: number; impWeight?: number; netWeightAfterImp?: number; material?: { name: string }; contract?: { number: string }; }
interface LineItem { id: string; lineType: string; inboundId?: string; inbound?: InboundRef; quantityKg: number; unitPrice: number; lineTotal: number; }
interface PO { id: string; poNumber: string; client?: { name: string; street?: string; postalCode?: string; city?: string; vatNr?: string }; contract?: { number: string; paymentTerms?: number }; status: string; periodStart: string; periodEnd: string; issueDate: string; totalExclVat: number; vat: number; totalInclVat: number; lineItems?: LineItem[]; notes?: string; }

const STATUS_STYLES: Record<string, string> = {
  ready: 'bg-yellow-50 text-yellow-800 border-yellow-300',
  rejected: 'bg-red-50 text-red-700 border-red-300',
  paid: 'bg-green-25 text-green-700 border-green-300',
};
const formatStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

interface InboundRow { inbound?: InboundRef; materialUnitPrice: number; impUnitPrice: number; }

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState<PO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState('');

  function fetchPO() { api.get<{ data: PO }>(`/api/purchase-orders/${id}`).then((res) => setPo(res.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }
  useEffect(() => { fetchPO(); }, [id]);

  async function updateStatus(status: 'paid' | 'rejected') {
    setActing(true); setActionError('');
    try { await api.patch(`/api/purchase-orders/${id}/status`, { status }); fetchPO(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Status update failed'); }
    finally { setActing(false); }
  }

  function downloadPdf() {
    const token = getToken(); const link = document.createElement('a');
    link.href = `/api/purchase-orders/${id}/pdf`;
    if (token) link.href += `?token=${encodeURIComponent(token)}`;
    link.target = '_blank'; link.click();
  }

  if (loading) return <div className="text-grey-500 text-sm">Loading...</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;
  if (!po) return <div className="text-grey-500 text-sm">Not found</div>;

  const inboundMap = new Map<string, InboundRow>();
  for (const li of po.lineItems ?? []) {
    const key = li.inboundId ?? li.id;
    if (!inboundMap.has(key)) inboundMap.set(key, { inbound: li.inbound, materialUnitPrice: 0, impUnitPrice: 0 });
    const entry = inboundMap.get(key)!;
    if (li.lineType === 'material') entry.materialUnitPrice = Number(li.unitPrice);
    else entry.impUnitPrice = Math.abs(Number(li.unitPrice));
  }
  const rows = Array.from(inboundMap.values());
  let grandTotal = 0;
  const formatNum = (v: number, d: number) => v.toFixed(d);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="w-full">
      <button onClick={() => navigate('/purchase-orders')} className="inline-flex items-center gap-1.5 text-sm font-medium text-green-500 hover:text-green-700 mb-4">
        <ArrowLeft size={16} strokeWidth={1.5} /> Back to Purchase Invoices
      </button>

      <div className="bg-white rounded-lg border border-grey-200 shadow-sm p-6 mb-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-xl font-bold text-grey-900">Inkoopfactuur / Credit Nota</h1>
            <p className="text-sm text-grey-500">Purchase Invoice / Credit Note</p>
            <div className="mt-4 text-sm space-y-1">
              <div className="flex gap-2"><span className="font-semibold w-24 text-grey-700">Invoice Nr:</span><span className="text-grey-900">{po.poNumber}</span></div>
              <div className="flex gap-2"><span className="font-semibold w-24 text-grey-700">Date:</span><span className="text-grey-900">{formatDate(po.issueDate)}</span></div>
              <div className="flex gap-2"><span className="font-semibold w-24 text-grey-700">Client:</span><span className="text-grey-900">{po.client?.name ?? '—'}</span></div>
              {po.client?.street && <div className="flex gap-2"><span className="w-24" /><span className="text-grey-600">{`${po.client.street}, ${po.client.postalCode ?? ''} ${po.client.city ?? ''}`.trim()}</span></div>}
              {po.client?.vatNr && <div className="flex gap-2"><span className="w-24" /><span className="text-grey-600">BTW: {po.client.vatNr}</span></div>}
            </div>
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[po.status] || ''}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />{formatStatus(po.status)}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-grey-600 space-y-0.5">
            <div className="flex justify-end mb-2">
              <img src="/AST-Logo.png" alt="Amsterdam Scrap Terminal" className="h-10 w-auto object-contain" />
            </div>
            <div className="font-bold text-sm text-grey-900">Amsterdam Scrap Terminal B.V.</div>
            <div>Vlothavenweg 1</div><div>1013 BJ Amsterdam</div><div>Tel: +31(0)20 705 2333</div>
            <div>KvK: 67207405</div><div>BTW: NL856875983B01</div><div>IBAN: NL76UGBI0709898894</div>
          </div>
        </div>
      </div>

      {actionError && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">{actionError}</div>}

      <div className="bg-white rounded-lg border border-grey-200 shadow-sm overflow-x-auto mb-6">
        <table className="w-full text-xs">
          <thead><tr className="bg-grey-50 border-b border-grey-200 text-grey-700">
            {['Receipt Nr', 'Plate', 'Date', 'Material', 'Contract Nr'].map((h) => <th key={h} className="px-3 py-2.5 text-left text-xs font-medium">{h}</th>)}
            {['Total Ton', 'Imp %', 'Imp Ton', 'Net Ton', 'Contract Price €', 'Imp Price €', 'Total Price'].map((h) => <th key={h} className="px-3 py-2.5 text-right text-xs font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((row, idx) => {
              const ib = row.inbound;
              const netWeightKg = Number(ib?.netWeight ?? 0);
              const impPctVal = Number(ib?.impPct ?? 0);
              const impWeightKg = Number(ib?.impWeight ?? 0);
              const netAfterImpKg = Number(ib?.netWeightAfterImp ?? netWeightKg);
              const contractPrice = row.materialUnitPrice;
              const impPrice = row.impUnitPrice;
              const rowTotal = (netAfterImpKg / 1000) * contractPrice - (impWeightKg / 1000) * impPrice;
              grandTotal += rowTotal;
              return (
                <tr key={ib?.id ?? idx} className={`border-b border-grey-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-grey-50'}`}>
                  <td className="px-3 py-2.5 font-medium text-grey-900">{ib?.weegbonNr ?? '—'}</td>
                  <td className="px-3 py-2.5 text-grey-700">{ib?.licensePlate ?? '—'}</td>
                  <td className="px-3 py-2.5 text-grey-700">{ib ? formatDate(ib.inboundDate) : '—'}</td>
                  <td className="px-3 py-2.5 text-grey-700">{ib?.material?.name ?? '—'}</td>
                  <td className="px-3 py-2.5 text-grey-700">{ib?.contract?.number ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right text-grey-700">{formatNum(netWeightKg / 1000, 3)}</td>
                  <td className="px-3 py-2.5 text-right text-grey-700">{formatNum(impPctVal, 2)}%</td>
                  <td className="px-3 py-2.5 text-right text-grey-700">{formatNum(impWeightKg / 1000, 3)}</td>
                  <td className="px-3 py-2.5 text-right text-grey-700">{formatNum(netAfterImpKg / 1000, 3)}</td>
                  <td className="px-3 py-2.5 text-right text-grey-700">{formatNum(contractPrice, 2)}</td>
                  <td className="px-3 py-2.5 text-right text-grey-700">{formatNum(impPrice, 2)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-grey-900">{formatNum(rowTotal, 2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-grey-200 px-3 py-3 text-sm">
          <div className="flex justify-end gap-8"><span className="font-semibold text-grey-700">Total:</span><span className="font-semibold w-28 text-right text-grey-900">€ {formatNum(grandTotal, 2)}</span></div>
          <div className="flex justify-end gap-8 text-grey-500"><span>BTW (0%):</span><span className="w-28 text-right">€ 0.00</span></div>
          <div className="flex justify-end gap-8 mt-1 pt-1 border-t border-grey-200 text-base font-bold text-grey-900"><span>Total incl. BTW:</span><span className="w-28 text-right">€ {formatNum(grandTotal, 2)}</span></div>
        </div>
      </div>

      <div className="text-xs text-grey-500 mb-6 space-y-1">
        <p>EU reverse charge: BTW verlegd naar afnemer.</p>
        <p>Betaling binnen {po.contract?.paymentTerms ?? 7} dagen na factuurdatum op NL76UGBI0709898894.</p>
      </div>

      <div className="flex gap-3 flex-wrap mb-6">
        {po.status === 'ready' && (
          <select className="h-9 rounded-md border border-grey-300 px-3 text-sm text-grey-700 focus:border-green-500 outline-none" defaultValue="" disabled={acting}
            onChange={(e) => { const v = e.target.value as 'paid' | 'rejected' | ''; if (!v) return; void updateStatus(v); }}>
            <option value="">Set Status...</option><option value="paid">Paid</option><option value="rejected">Rejected</option>
          </select>
        )}
        <button onClick={downloadPdf} className="h-9 px-4 bg-white text-grey-700 border border-grey-300 rounded-md text-sm font-semibold hover:bg-grey-50 inline-flex items-center gap-2">
          <Download size={16} strokeWidth={1.5} /> Download PDF
        </button>
      </div>
    </div>
  );
}

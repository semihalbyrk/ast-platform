import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api/client';
import { ArrowLeft, Download, FileText, Scale } from 'lucide-react';

interface Inbound {
  id: string;
  weegbonNr: string;
  inboundDate: string;
  status: string;
  licensePlate?: string;
  supplierId?: string;
  supplier?: { id: string; name: string };
  transporter?: { id: string; name: string } | null;
  material?: { name: string; code: string };
  contract?: { number: string; price: number; impDeduction: number; entityId?: string; entity?: { name: string }; client?: { name: string } | null };
  location?: { name: string };
  pricePerTon?: number;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  hmsaPct?: number;
  hmsbPct?: number;
  impPct?: number;
  impWeight?: number;
  netWeightAfterImp?: number;
  materialCost?: number;
  impurityDeduction?: number;
  totalInboundValue?: number;
  arrivalNotes?: string;
  qualityNotes?: string;
  specialFindings?: Record<string, unknown>;
}

interface YardLocation { id: string; name: string }

const STATUS_STEPS = ['weighed_in', 'quality_checked', 'weighed_out', 'completed'];

const STATUS_STYLES: Record<string, string> = {
  weighed_in: 'bg-[#eff8ff] text-[#1570ef] border-[#84caff]',
  in_yard: 'bg-[#fffaeb] text-[#b54708] border-[#fec84b]',
  quality_checked: 'bg-[#f4f3ff] text-[#5925dc] border-[#d9d6fe]',
  weighed_out: 'bg-[#fffaeb] text-[#b54708] border-[#fec84b]',
  completed: 'bg-green-25 text-green-700 border-green-300',
};

const formatEnumLabel = (value: string) =>
  value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

export default function InboundDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inbound, setInbound] = useState<Inbound | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [acting, setActing] = useState(false);
  const [existingPoId, setExistingPoId] = useState<string | null>(null);
  const [poChecking, setPoChecking] = useState(false);

  const [locations, setLocations] = useState<YardLocation[]>([]);
  const [locationId, setLocationId] = useState('');
  const [hmsaPct, setHmsaPct] = useState('');
  const [hmsbPct, setHmsbPct] = useState('');
  const [impPct, setImpPct] = useState('');
  const [qualityNotes, setQualityNotes] = useState('');
  const [tareWeight, setTareWeight] = useState('');
  const [tarePreviewWeight, setTarePreviewWeight] = useState<number | null>(null);

  function fetchInbound() {
    api.get<{ data: Inbound }>(`/api/inbounds/${id}`)
      .then((res) => setInbound(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchInbound();
    api.get<{ data: YardLocation[] }>('/api/yard-locations').then((res) => setLocations(res.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id || inbound?.status !== 'completed') return;
    setPoChecking(true);
    api.get<{ data: Array<{ id: string }> }>(`/api/purchase-orders?inboundId=${id}&limit=1`)
      .then((res) => setExistingPoId(res.data[0]?.id ?? null))
      .catch(() => setExistingPoId(null))
      .finally(() => setPoChecking(false));
  }, [id, inbound?.status]);

  async function submitQuality(e: FormEvent) {
    e.preventDefault(); setActionError(''); setActing(true);
    try {
      await api.patch(`/api/inbounds/${id}/quality`, { locationId, hmsaPct: Number(hmsaPct), hmsbPct: Number(hmsbPct), impPct: Number(impPct), qualityNotes: qualityNotes || undefined });
      fetchInbound();
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Quality update failed'); }
    finally { setActing(false); }
  }

  async function submitWeighOut(e: FormEvent) {
    e.preventDefault(); setActionError(''); setActing(true);
    try {
      const tare = Number(tareWeight);
      await api.patch(`/api/inbounds/${id}/weigh-out`, { tareWeight: tare });
      setTarePreviewWeight(tare);
      fetchInbound();
    }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Weigh-out failed'); }
    finally { setActing(false); }
  }

  async function submitComplete() {
    setActionError(''); setActing(true);
    try { await api.patch(`/api/inbounds/${id}/complete`, {}); fetchInbound(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Completion failed'); }
    finally { setActing(false); }
  }

  function simulateTareWeighbridge() {
    setTareWeight(String(Math.floor(Math.random() * (12000 - 7000 + 1)) + 7000));
  }

  if (loading) return <div className="text-grey-500 text-sm">Loading...</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;
  if (!inbound) return <div className="text-grey-500 text-sm">Not found</div>;

  const stepIndexMap: Record<string, number> = {
    weighed_in: 1,
    in_yard: 1,
    quality_checked: 2,
    weighed_out: 3,
    completed: 3,
  };
  const currentStep = stepIndexMap[inbound.status] ?? 0;
  const inputCls = 'mt-1.5 block w-full h-10 rounded-md border border-grey-300 px-3.5 text-sm text-grey-900 focus:border-green-500 focus:ring-[3px] focus:ring-green-500/15 outline-none';
  const labelCls = 'block text-sm font-medium text-grey-700';
  const clientName = inbound.contract?.client?.name ?? inbound.contract?.entity?.name ?? inbound.supplier?.name ?? '—';
  const formatKg = (value?: number | null) => (value != null ? `${Number(value).toLocaleString()} kg` : '—');
  const formatPct = (value?: number) => (value != null ? `${Number(value).toFixed(2)}%` : '—');
  const formatEur = (value?: number) => (value != null ? `€${Number(value).toFixed(2)}` : '—');
  const previewGross = inbound.grossWeight ?? null;
  const previewTare = inbound.tareWeight ?? tarePreviewWeight;
  const previewNet = previewGross != null && previewTare != null ? previewGross - previewTare : inbound.netWeight ?? null;
  const metaItems = [
    { label: 'License Plate', value: inbound.licensePlate ?? '—' },
    { label: 'Supplier', value: inbound.supplier?.name ?? '—' },
    { label: 'Transporter', value: inbound.transporter?.name ?? '—' },
    { label: 'Contract', value: inbound.contract?.number ?? '—' },
    { label: 'Date', value: new Date(inbound.inboundDate).toLocaleString() },
    { label: 'Client', value: clientName },
  ];

  return (
    <div className="w-full">
      <button onClick={() => navigate('/inbounds')} className="inline-flex items-center gap-1.5 text-sm font-medium text-green-500 hover:text-green-700 mb-4">
        <ArrowLeft size={16} strokeWidth={1.5} /> Back to Inbounds
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start mb-6">
        <div className="space-y-6">
          {/* Header + metadata + stepper */}
          <div className="bg-white rounded-lg border border-grey-200 shadow-sm p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-2xl font-bold text-grey-900 tracking-tight">{inbound.weegbonNr}</div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[inbound.status] || 'bg-grey-100 text-grey-700 border-grey-300'}`}>
                {formatEnumLabel(inbound.status)}
              </span>
            </div>
            <div className="mt-4 rounded-md border border-grey-200 px-4 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2">
                {metaItems.map((item) => (
                  <div key={item.label} className="min-w-0">
                    <span className="text-xs text-grey-500">{item.label}: </span>
                    <span className="text-sm font-semibold text-grey-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center flex-1 last:flex-[0]">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-semibold ${
                        i <= currentStep
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-grey-300 text-grey-500'
                      }`}
                    >
                      {i + 1}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-[2px] ${i < currentStep ? 'bg-green-500' : 'bg-grey-300'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-grey-500 mt-2">
                {STATUS_STEPS.map((s) => <span key={s}>{formatEnumLabel(s)}</span>)}
              </div>
            </div>
          </div>

          {actionError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">{actionError}</div>}

          {/* Quality info (shows after quality submit) */}
          {(['quality_checked', 'weighed_out', 'completed'].includes(inbound.status)) && (
            <div className="bg-white rounded-lg border border-grey-200 p-5">
              <h2 className="text-base font-semibold text-grey-900 pb-3 mb-4 border-b border-grey-200">Quality</h2>
              <div className="flex flex-wrap gap-8 text-sm">
                <div><span className="text-grey-500">HMSA:</span> <span className="font-semibold text-grey-900">{formatPct(inbound.hmsaPct)}</span></div>
                <div><span className="text-grey-500">HMSB:</span> <span className="font-semibold text-grey-900">{formatPct(inbound.hmsbPct)}</span></div>
                <div><span className="text-grey-500">Impurity:</span> <span className="font-semibold text-grey-900">{formatPct(inbound.impPct)}</span></div>
                <div><span className="text-grey-500">Imp Weight:</span> <span className="font-semibold text-grey-900">{formatKg(inbound.impWeight)}</span></div>
                <div><span className="text-grey-500">Net after Imp:</span> <span className="font-semibold text-grey-900">{formatKg(inbound.netWeightAfterImp)}</span></div>
              </div>
            </div>
          )}

          {/* Financial info (shows after tare submit) */}
          {(['weighed_out', 'completed'].includes(inbound.status)) && (
            <div className="bg-white rounded-lg border border-grey-200 p-5">
              <h2 className="text-base font-semibold text-grey-900 pb-3 mb-4 border-b border-grey-200">Financial</h2>
              <div className="flex flex-wrap gap-8 text-sm">
                <div><span className="text-grey-500">Material Cost:</span> <span className="font-semibold text-grey-900">{formatEur(inbound.materialCost)}</span></div>
                <div><span className="text-grey-500">Imp Deduction:</span> <span className="font-semibold text-grey-900">{formatEur(inbound.impurityDeduction)}</span></div>
                <div><span className="text-grey-500 font-semibold">Total Value:</span> <span className="font-bold text-grey-900">{formatEur(inbound.totalInboundValue)}</span></div>
              </div>
            </div>
          )}

        {/* Quality Check form */}
        {(inbound.status === 'weighed_in' || inbound.status === 'in_yard') && (
          <form onSubmit={submitQuality} className="bg-white rounded-lg border border-grey-200 p-5 mb-4 space-y-4">
            <h2 className="text-base font-semibold text-grey-900">Quality Check</h2>
            <div><label className={labelCls}>Yard Location *</label>
              <select required value={locationId} onChange={(e) => setLocationId(e.target.value)} className={inputCls}>
                <option value="">Select location...</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={labelCls}>HMSA % *</label><input type="number" required min={0} max={100} step={0.01} value={hmsaPct} onChange={(e) => setHmsaPct(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>HMSB % *</label><input type="number" required min={0} max={100} step={0.01} value={hmsbPct} onChange={(e) => setHmsbPct(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Impurity % *</label><input type="number" required min={0} max={100} step={0.01} value={impPct} onChange={(e) => setImpPct(e.target.value)} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Notes</label><textarea value={qualityNotes} onChange={(e) => setQualityNotes(e.target.value)} className={`${inputCls} h-auto min-h-[80px] py-2.5`} rows={2} /></div>
            <button type="submit" disabled={acting} className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {acting ? 'Saving...' : 'Submit Quality Check'}
            </button>
          </form>
        )}

        {/* Weigh-Out form */}
        {(['weighed_in', 'in_yard', 'quality_checked'].includes(inbound.status)) && (
          <form onSubmit={submitWeighOut} className="bg-white rounded-lg border border-grey-200 p-5 mb-4 space-y-4">
            <h2 className="text-base font-semibold text-grey-900">Weigh-Out</h2>
            <div><label className={labelCls}>Tare Weight (kg) *</label>
              <div className="flex gap-2 mt-1.5">
                <input type="number" required min={1} value={tareWeight} onChange={(e) => setTareWeight(e.target.value)}
                  className="block flex-1 h-10 rounded-md border border-grey-300 px-3.5 text-sm focus:border-green-500 focus:ring-[3px] focus:ring-green-500/15 outline-none" placeholder="e.g. 12000" />
                <button type="button" onClick={simulateTareWeighbridge}
                  className="h-10 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 whitespace-nowrap inline-flex items-center gap-1.5">
                  <Scale size={16} strokeWidth={1.5} /> Weighbridge
                </button>
              </div>
            </div>
            <button type="submit" disabled={acting} className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {acting ? 'Saving...' : 'Record Weigh-Out'}
            </button>
          </form>
        )}

        {/* Complete */}
        {inbound.status === 'weighed_out' && (
          <div className="bg-white rounded-lg border border-grey-200 p-5 mb-4">
            <h2 className="text-base font-semibold text-grey-900 mb-3">Complete Inbound</h2>
            <p className="text-sm text-grey-600 mb-3">This will finalize the inbound, update inventory, and generate the weighbridge ticket PDF.</p>
            <button onClick={submitComplete} disabled={acting} className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {acting ? 'Completing...' : 'Mark as Completed'}
            </button>
          </div>
        )}

        {/* Completed actions */}
        {inbound.status === 'completed' && (
          <div className="mb-6 flex gap-3">
            <button onClick={() => {
              const token = getToken();
              const link = document.createElement('a');
              link.href = `/api/inbounds/${id}/pdf`;
              if (token) link.href += `?token=${encodeURIComponent(token)}`;
              link.target = '_blank'; link.click();
            }} className="h-9 px-4 bg-white text-grey-700 border border-grey-300 rounded-md text-sm font-semibold hover:bg-grey-50 inline-flex items-center gap-2">
              <Download size={16} strokeWidth={1.5} /> Download Ticket PDF
            </button>
            {existingPoId ? (
              <button onClick={() => navigate(`/purchase-orders/${existingPoId}`)}
                className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 inline-flex items-center gap-2">
                <FileText size={16} strokeWidth={1.5} /> View PO
              </button>
            ) : (
              <button disabled={acting || poChecking} onClick={async () => {
                const clientId = inbound.contract?.entityId ?? inbound.supplierId;
                if (!clientId) { setActionError('No client found for this inbound'); return; }
                setActing(true); setActionError('');
                try {
                  const res = await api.post<{ data: { id: string } }>('/api/purchase-orders/generate', { clientId, inboundIds: [inbound.id] });
                  navigate(`/purchase-orders/${res.data.id}`);
                } catch (err) { setActionError(err instanceof Error ? err.message : 'PO generation failed'); }
                finally { setActing(false); }
              }} className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                {poChecking ? 'Checking...' : acting ? 'Generating...' : 'Generate PO'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right summary panel */}
      <aside className="bg-white rounded-lg border border-grey-200 shadow-sm p-5 space-y-4 xl:sticky xl:top-5">
        <div>
          <div className="text-xs text-grey-500 uppercase mb-1">Material Type</div>
          <div className="text-xl font-bold text-grey-900">{inbound.material?.name ?? '—'}</div>
        </div>
        <div>
          <div className="text-xs text-grey-500 uppercase mb-1">Unit Price</div>
          <div className="text-lg font-semibold text-grey-900">{inbound.pricePerTon != null ? `€${Number(inbound.pricePerTon).toFixed(2)}/ton` : '—'}</div>
        </div>
        <div className="pt-2 border-t border-grey-200 space-y-3">
          <div>
            <div className="text-xs text-grey-500 uppercase mb-1">Gross Weight</div>
            <div className="text-lg font-semibold text-grey-900">{formatKg(previewGross)}</div>
          </div>
          <div>
            <div className="text-xs text-grey-500 uppercase mb-1">Tare Weight</div>
            <div className="text-lg font-semibold text-grey-900">{formatKg(previewTare)}</div>
          </div>
          <div>
            <div className="text-xs text-grey-500 uppercase mb-1">Net Weight</div>
            <div className="text-xl font-bold text-green-700">{formatKg(previewNet)}</div>
          </div>
        </div>
      </aside>
      </div>

    </div>
  );
}

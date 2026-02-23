import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { ArrowLeft, Scale } from 'lucide-react';

interface Entity { id: string; name: string; type: string[] }
interface Material { id: string; name: string }
interface Contract {
  id: string; number: string; entityId: string; entity?: Entity; material?: Material;
  materialId: string; price: number; transporter?: Entity | null; transporterId?: string | null; endDate: string; status: string;
}

const RECEIVER = 'Amsterdam Scrap Terminal B.V.';

export default function InboundWeighInForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Entity[]>([]);
  const [suppliers, setSuppliers] = useState<Entity[]>([]);
  const [transporters, setTransporters] = useState<Entity[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [clientId, setClientId] = useState('');
  const [contractId, setContractId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [transporterId, setTransporterId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [pricePerTon, setPricePerTon] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [arrivalNotes, setArrivalNotes] = useState('');
  const [supplierLocked, setSupplierLocked] = useState(false);
  const [materialLocked, setMaterialLocked] = useState(false);
  const hasContract = !!contractId;

  useEffect(() => {
    Promise.all([
      api.get<{ data: Entity[] }>('/api/entities?type=client'),
      api.get<{ data: Entity[] }>('/api/entities?type=supplier'),
      api.get<{ data: Entity[] }>('/api/entities?type=transporter'),
      api.get<{ data: Material[] }>('/api/materials'),
    ]).then(([c, s, t, m]) => { setClients(c.data); setSuppliers(s.data); setTransporters(t.data); setMaterials(m.data); })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!clientId) { setContracts([]); resetContractFields(); return; }
    setLoadingContracts(true);
    api.get<{ data: Contract[] }>(`/api/contracts?status=lopend&entityId=${clientId}`)
      .then((res) => { const today = new Date().toISOString().split('T')[0]; setContracts(res.data.filter((c) => c.endDate >= today)); })
      .catch(() => setContracts([]))
      .finally(() => setLoadingContracts(false));
    setContractId(''); resetContractFields();
  }, [clientId]);

  function resetContractFields() { setSupplierId(''); setTransporterId(''); setMaterialId(''); setPricePerTon(''); setSupplierLocked(false); setMaterialLocked(false); }

  useEffect(() => {
    if (!contractId) { resetContractFields(); return; }
    const c = contracts.find((x) => x.id === contractId);
    if (!c) return;
    setSupplierId(c.entityId); setSupplierLocked(true); setTransporterId(c.transporterId ?? '');
    setMaterialId(c.materialId); setMaterialLocked(true); setPricePerTon(String(Number(c.price)));
  }, [contractId]);

  function simulateWeighbridge() { setGrossWeight(String(Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000)); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const body: Record<string, unknown> = { supplierId, grossWeight: Number(grossWeight), arrivalNotes: arrivalNotes || undefined, licensePlate: licensePlate || undefined };
      if (contractId) { body.contractId = contractId; body.pricePerTon = Number(pricePerTon); if (transporterId) body.transporterId = transporterId; }
      else { body.materialId = materialId; body.pricePerTon = pricePerTon ? Number(pricePerTon) : undefined; if (transporterId) body.transporterId = transporterId; }
      const res = await api.post<{ data: { id: string } }>('/api/inbounds/weigh-in', body);
      navigate(`/inbounds/${res.data.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create inbound'); }
    finally { setSubmitting(false); }
  }

  const inputCls = 'mt-1.5 block w-full h-10 rounded-md border border-grey-300 px-3.5 text-sm text-grey-900 focus:border-green-500 focus:ring-[3px] focus:ring-green-500/15 outline-none';
  const disabledCls = `${inputCls} opacity-50 cursor-not-allowed`;
  const lockedCls = 'mt-1.5 block w-full h-10 rounded-md border border-grey-200 bg-grey-50 px-3.5 text-sm text-grey-700 flex items-center';
  const labelCls = 'block text-sm font-medium text-grey-700';

  return (
    <div className="form-page">
      <button onClick={() => navigate('/inbounds')} className="inline-flex items-center gap-1.5 text-sm font-medium text-green-500 hover:text-green-700 mb-4">
        <ArrowLeft size={16} strokeWidth={1.5} /> Back to Inbounds
      </button>
      <h1 className="text-2xl font-bold text-grey-900">New Inbound</h1>

      <form onSubmit={handleSubmit} className="form-card space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelCls}>Client <span className="text-red-500">*</span></label>
            <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls}>
              <option value="">Select client...</option>
              {clients.map((en) => <option key={en.id} value={en.id}>{en.name}</option>)}
            </select></div>
          <div><label className={labelCls}>Contract</label>
            <select value={contractId} onChange={(e) => setContractId(e.target.value)} disabled={!clientId || loadingContracts} className={!clientId ? disabledCls : inputCls}>
              <option value="">{loadingContracts ? 'Loading...' : contracts.length === 0 && clientId ? 'No active contracts' : 'Select contract...'}</option>
              {contracts.map((c) => <option key={c.id} value={c.id}>{c.number} | {c.material?.name ?? '—'} | €{Number(c.price).toFixed(2)}/ton | {c.entity?.name ?? '—'} | {c.transporter?.name ?? 'No transporter'}</option>)}
            </select></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelCls}>Receiver</label><div className={lockedCls}>{RECEIVER}</div></div>
          <div><label className={labelCls}>Supplier <span className="text-red-500">*</span></label>
            {supplierLocked ? <div className={lockedCls}>{suppliers.find((e) => e.id === supplierId)?.name ?? clients.find((e) => e.id === supplierId)?.name ?? supplierId}</div>
            : <select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)} disabled={!hasContract && !clientId} className={!hasContract && !clientId ? disabledCls : inputCls}>
              <option value="">Select supplier...</option>{suppliers.map((en) => <option key={en.id} value={en.id}>{en.name}</option>)}</select>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelCls}>Transporter</label>
            <select value={transporterId} onChange={(e) => setTransporterId(e.target.value)} disabled={!hasContract} className={!hasContract ? disabledCls : inputCls}>
              <option value="">No transporter</option>{transporters.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div><label className={labelCls}>Material <span className="text-red-500">*</span></label>
            {materialLocked ? <div className={lockedCls}>{materials.find((m) => m.id === materialId)?.name ?? materialId}</div>
            : <select required value={materialId} onChange={(e) => setMaterialId(e.target.value)} className={inputCls}>
              <option value="">Select material...</option>{materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelCls}>Unit Price (€/ton)</label>
            <input type="number" step="0.01" min={0} value={pricePerTon} onChange={(e) => setPricePerTon(e.target.value)} className={inputCls} placeholder="e.g. 250.00" /></div>
          <div><label className={labelCls}>Gross Weight (kg) <span className="text-red-500">*</span></label>
            <div className="flex gap-2 mt-1.5">
              <input type="number" required min={1} value={grossWeight} onChange={(e) => setGrossWeight(e.target.value)}
                className="block flex-1 h-10 rounded-md border border-grey-300 px-3.5 text-sm focus:border-green-500 focus:ring-[3px] focus:ring-green-500/15 outline-none" placeholder="e.g. 25000" />
              <button type="button" onClick={simulateWeighbridge}
                className="h-10 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 whitespace-nowrap inline-flex items-center gap-1.5">
                <Scale size={16} strokeWidth={1.5} /> Weighbridge
              </button>
            </div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelCls}>License Plate (Kenteken)</label>
            <input type="text" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} className={inputCls} placeholder="AB-123-CD" /></div>
        </div>

        <div><label className={labelCls}>Arrival Notes</label>
          <textarea value={arrivalNotes} onChange={(e) => setArrivalNotes(e.target.value)} className={`${inputCls} h-auto min-h-[80px] py-2.5`} rows={3} /></div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
            {submitting ? 'Creating...' : 'Submit'}</button>
          <button type="button" onClick={() => navigate('/inbounds')} className="h-9 px-4 bg-white text-grey-700 border border-grey-300 rounded-md text-sm font-semibold hover:bg-grey-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}

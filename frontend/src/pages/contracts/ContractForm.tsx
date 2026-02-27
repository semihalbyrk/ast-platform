import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { ArrowLeft } from 'lucide-react';

interface Option { id: string; name?: string; code?: string; type?: string[] }
const CONTRACT_TYPES = [{ value: 'inkoop', label: 'Inkoop' }, { value: 'verkoop', label: 'Verkoop' }];

interface FormData {
  type: string; clientId: string; supplierId: string; transporterId: string;
  materialId: string; price: string; impDeduction: string; agreedWeight: string; freights: string;
  startDate: string; endDate: string; processedWeight: string; notes: string;
}

const emptyForm: FormData = {
  type: 'inkoop', clientId: '', supplierId: '', transporterId: '', materialId: '',
  price: '', impDeduction: '0', agreedWeight: '', freights: '', startDate: '', endDate: '', processedWeight: '0', notes: '',
};

export default function ContractForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [entities, setEntities] = useState<Option[]>([]);
  const [materials, setMaterials] = useState<Option[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get<{ data: Option[] }>('/api/entities'), api.get<{ data: Option[] }>('/api/materials')])
      .then(([e, m]) => { setEntities(e.data); setMaterials(m.data); });
  }, []);

  useEffect(() => {
    if (!id) return;
    api.get<{ data: Record<string, unknown> }>(`/api/contracts/${id}`)
      .then((res) => {
        const d = res.data;
        setForm({
          type: (d.type as string) || 'inkoop',
          clientId: (d.clientId as string) || '', supplierId: (d.entityId as string) || '',
          transporterId: (d.transporterId as string) || '', materialId: (d.materialId as string) || '',
          price: d.price?.toString() || '', impDeduction: d.impDeduction?.toString() || '0',
          agreedWeight: d.agreedVolume?.toString() || '', freights: d.freights?.toString() || '',
          startDate: d.startDate ? (d.startDate as string).slice(0, 10) : '',
          endDate: d.endDate ? (d.endDate as string).slice(0, 10) : '',
          processedWeight: d.processedWeight?.toString() || '0', notes: (d.notes as string) || '',
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function set(key: keyof FormData, value: string) { setForm((prev) => ({ ...prev, [key]: value })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setSubmitting(true);
    const payload = {
      type: form.type, clientId: form.clientId, entityId: form.supplierId,
      transporterId: form.transporterId || undefined, materialId: form.materialId,
      price: Number(form.price), impDeduction: form.impDeduction ? Number(form.impDeduction) : 0,
      agreedVolume: Number(form.agreedWeight), freights: form.freights ? Number(form.freights) : undefined,
      startDate: form.startDate, endDate: form.endDate, notes: form.notes || undefined,
    };
    try {
      if (isEdit) await api.patch(`/api/contracts/${id}`, payload);
      else await api.post('/api/contracts', payload);
      navigate('/contracts');
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="text-grey-500 text-sm">Loading...</div>;

  const inputCls = 'mt-1.5 block w-full h-10 rounded-md border border-grey-300 px-3.5 text-sm text-grey-900 focus:border-green-500 focus:ring-[3px] focus:ring-green-500/15 outline-none';
  const labelCls = 'block text-sm font-medium text-grey-700';
  const clients = entities.filter((e) => Array.isArray(e.type) && e.type.includes('client'));
  const suppliers = entities.filter((e) => Array.isArray(e.type) && e.type.includes('supplier'));
  const transporters = entities.filter((e) => Array.isArray(e.type) && e.type.includes('transporter'));

  return (
    <div className="form-page">
      <button onClick={() => navigate('/contracts')} className="inline-flex items-center gap-1.5 text-sm font-medium text-green-500 hover:text-green-700 mb-4">
        <ArrowLeft size={16} strokeWidth={1.5} /> Back to Contracts
      </button>
      <h1 className="text-2xl font-bold text-grey-900">{isEdit ? 'Edit Contract' : 'New Contract'}</h1>

      <form onSubmit={handleSubmit} className="form-card space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">{error}</div>}

        <div><label className={labelCls}>Type <span className="text-red-500">*</span></label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
            {CONTRACT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>

        <div><label className={labelCls}>Client (Opdrachtgever) <span className="text-red-500">*</span></label>
          <select required value={form.clientId} onChange={(e) => set('clientId', e.target.value)} className={inputCls}>
            <option value="">Select client (opdrachtgever)...</option>{clients.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div><label className={labelCls}>Supplier (Leverancier) <span className="text-red-500">*</span></label>
            <select required value={form.supplierId} onChange={(e) => set('supplierId', e.target.value)} className={inputCls}>
              <option value="">Select...</option>{suppliers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
          <div><label className={labelCls}>Transporter <span className="text-red-500">*</span></label>
            <select required value={form.transporterId} onChange={(e) => set('transporterId', e.target.value)} className={inputCls}>
              <option value="">Select...</option>{transporters.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
          <div><label className={labelCls}>Material <span className="text-red-500">*</span></label>
            <select required value={form.materialId} onChange={(e) => set('materialId', e.target.value)} className={inputCls}>
              <option value="">Select...</option>{materials.map((m) => <option key={m.id} value={m.id}>{m.code ? `${m.code} — ${m.name}` : m.name}</option>)}</select></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div><label className={labelCls}>Price/ton (EUR) <span className="text-red-500">*</span></label><input type="number" required step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Imp Deduction (EUR/ton)</label><input type="number" step="0.01" value={form.impDeduction} onChange={(e) => set('impDeduction', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Agreed Weight (kg) <span className="text-red-500">*</span></label><input type="number" required value={form.agreedWeight} onChange={(e) => set('agreedWeight', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Freights</label><input type="number" step="0.01" value={form.freights} onChange={(e) => set('freights', e.target.value)} className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelCls}>Start Date <span className="text-red-500">*</span></label><input type="date" required value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>End Date <span className="text-red-500">*</span></label><input type="date" required value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={inputCls} /></div>
        </div>

        <div><label className={labelCls}>Processed Weight (kg)</label>
          <input type="number" value={form.processedWeight} className={`${inputCls} bg-grey-50 text-grey-500`} disabled readOnly /></div>

        <div><label className={labelCls}>Notes</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className={`${inputCls} h-auto min-h-[80px] py-2.5`} rows={3} /></div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={() => navigate('/contracts')} className="h-9 px-4 bg-white text-grey-700 border border-grey-300 rounded-md text-sm font-semibold hover:bg-grey-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}

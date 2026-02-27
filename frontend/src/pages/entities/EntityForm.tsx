import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { ArrowLeft } from 'lucide-react';

const ENTITY_TYPES = ['client', 'supplier', 'transporter'] as const;
const ENTITY_LABELS: Record<string, string> = {
  client: 'Client (Opdrachtgever)',
  supplier: 'Supplier (Leverancier)',
  transporter: 'Transporter',
};

const formatLabel = (value: string) => ENTITY_LABELS[value] ?? (value.charAt(0).toUpperCase() + value.slice(1));

interface FormData {
  name: string; type: string[]; street: string; city: string; postalCode: string;
  country: string; vatNr: string; kvk: string; iban: string; paymentTerms: string; notes: string;
}
interface EntityApiData extends Omit<FormData, 'type'> { id: string; type: string[]; active?: boolean; }

const emptyForm: FormData = {
  name: '', type: ['client'], street: '', city: '', postalCode: '', country: '',
  vatNr: '', kvk: '', iban: '', paymentTerms: '', notes: '',
};

export default function EntityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get<{ data: EntityApiData }>(`/api/entities/${id}`)
      .then((res) => {
        const d = res.data;
        setForm({
          name: d.name || '', type: Array.isArray(d.type) && d.type.length > 0 ? d.type : ['client'],
          street: d.street || '', city: d.city || '', postalCode: d.postalCode || '', country: d.country || '',
          vatNr: d.vatNr || '', kvk: d.kvk || '', iban: d.iban || '',
          paymentTerms: d.paymentTerms?.toString() || '', notes: d.notes || '',
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function set(key: keyof FormData, value: unknown) { setForm((prev) => ({ ...prev, [key]: value })); }
  function onTypeChange(value: string[]) { set('type', value.length > 0 ? value : ['client']); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setSubmitting(true);
    const payload = { ...form, paymentTerms: form.paymentTerms ? Number(form.paymentTerms) : undefined };
    try {
      if (isEdit) await api.patch(`/api/entities/${id}`, payload);
      else await api.post('/api/entities', payload);
      navigate('/entities');
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="text-grey-500 text-sm">Loading...</div>;

  const inputCls = 'mt-1.5 block w-full h-10 rounded-md border border-grey-300 px-3.5 text-sm text-grey-900 placeholder:text-grey-400 focus:border-green-500 focus:ring-[3px] focus:ring-green-500/15 outline-none';
  const labelCls = 'block text-sm font-medium text-grey-700';

  return (
    <div className="form-page">
      <button onClick={() => navigate('/entities')} className="inline-flex items-center gap-1.5 text-sm font-medium text-green-500 hover:text-green-700 mb-4">
        <ArrowLeft size={16} strokeWidth={1.5} /> Back to Entities
      </button>
      <h1 className="text-2xl font-bold text-grey-900">{isEdit ? 'Edit Entity' : 'New Entity'}</h1>

      <form onSubmit={handleSubmit} className="form-card space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">{error}</div>}

        <div><label className={labelCls}>Name <span className="text-red-500">*</span></label>
          <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} /></div>

        <div><label className={labelCls}>Type <span className="text-red-500">*</span></label>
          <select multiple value={form.type} onChange={(e) => onTypeChange(Array.from(e.target.selectedOptions, (opt) => opt.value))}
            className="mt-1.5 block w-full rounded-md border border-grey-300 text-sm text-grey-900 focus:border-green-500 focus:ring-[3px] focus:ring-green-500/15 outline-none min-h-[112px]">
            {ENTITY_TYPES.map((t) => (<option key={t} value={t} className="px-3 py-2 hover:bg-grey-50 checked:bg-green-25 checked:text-green-700 checked:font-medium">{formatLabel(t)}</option>))}
          </select>
          <p className="mt-1 text-xs text-grey-500">Cmd/Ctrl + click for multiple</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelCls}>Street</label><input type="text" value={form.street} onChange={(e) => set('street', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>City</label><input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Postal Code</label><input type="text" value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Country</label><input type="text" value={form.country} onChange={(e) => set('country', e.target.value)} className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelCls}>VAT Nr</label><input type="text" value={form.vatNr} onChange={(e) => set('vatNr', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>KvK</label><input type="text" value={form.kvk} onChange={(e) => set('kvk', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>IBAN</label><input type="text" value={form.iban} onChange={(e) => set('iban', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Payment Terms (days)</label><input type="number" value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} className={inputCls} /></div>
        </div>

        <div><label className={labelCls}>Notes</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className={`${inputCls} h-auto min-h-[120px] py-2.5 resize-vertical`} rows={3} /></div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={() => navigate('/entities')} className="h-9 px-4 bg-white text-grey-700 border border-grey-300 rounded-md text-sm font-semibold hover:bg-grey-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}

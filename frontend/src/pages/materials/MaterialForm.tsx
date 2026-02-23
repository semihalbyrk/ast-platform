import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { ArrowLeft } from 'lucide-react';

const WEIGHT_UOM_OPTIONS = [{ value: 'ton', label: 'Ton' }, { value: 'lbs', label: 'Lbs' }, { value: 'lt', label: 'Lt' }];

interface FormData { name: string; hazardous: boolean; weightUom: string; }
const emptyForm: FormData = { name: '', hazardous: false, weightUom: 'ton' };

export default function MaterialForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get<{ data: FormData & { id: string } }>(`/api/materials/${id}`)
      .then((res) => { const d = res.data; setForm({ name: d.name || '', hazardous: d.hazardous ?? false, weightUom: d.weightUom || 'ton' }); })
      .catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  function set(key: keyof FormData, value: unknown) { setForm((prev) => ({ ...prev, [key]: value })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      if (isEdit) await api.patch(`/api/materials/${id}`, form);
      else await api.post('/api/materials', form);
      navigate('/materials');
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="text-grey-500 text-sm">Loading...</div>;
  const inputCls = 'mt-1.5 block w-full h-10 rounded-md border border-grey-300 px-3.5 text-sm text-grey-900 focus:border-green-500 focus:ring-[3px] focus:ring-green-500/15 outline-none';
  const labelCls = 'block text-sm font-medium text-grey-700';

  return (
    <div className="form-page">
      <button onClick={() => navigate('/materials')} className="inline-flex items-center gap-1.5 text-sm font-medium text-green-500 hover:text-green-700 mb-4">
        <ArrowLeft size={16} strokeWidth={1.5} /> Back to Materials
      </button>
      <h1 className="text-2xl font-bold text-grey-900">{isEdit ? 'Edit Material' : 'New Material'}</h1>

      <form onSubmit={handleSubmit} className="form-card space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelCls}>Name <span className="text-red-500">*</span></label>
            <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelCls}>Weight UOM <span className="text-red-500">*</span></label>
            <select value={form.weightUom} onChange={(e) => set('weightUom', e.target.value)} className={inputCls}>
              {WEIGHT_UOM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <label className="flex items-center gap-2 text-sm mt-8 md:mt-9 text-grey-700">
            <input type="checkbox" checked={form.hazardous} onChange={(e) => set('hazardous', e.target.checked)}
              className="w-4 h-4 rounded border-grey-300 text-green-500 focus:ring-green-500" />
            Hazardous
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={() => navigate('/materials')} className="h-9 px-4 bg-white text-grey-700 border border-grey-300 rounded-md text-sm font-semibold hover:bg-grey-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}

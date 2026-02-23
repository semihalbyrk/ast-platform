import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';

interface Option { id: string; name: string }

const VEHICLE_TYPES = ['truck', 'barge', 'other'];

interface FormData {
  licensePlate: string;
  type: string;
  transporterId: string;
  tareWeight: string;
  notes: string;
}

const emptyForm: FormData = { licensePlate: '', type: 'truck', transporterId: '', tareWeight: '', notes: '' };

export default function VehicleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormData>(emptyForm);
  const [transporters, setTransporters] = useState<Option[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ data: Option[] }>('/api/entities?type=transporter')
      .then((res) => setTransporters(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    api.get<{ data: Record<string, unknown> }>(`/api/vehicles/${id}`)
      .then((res) => {
        const d = res.data;
        setForm({
          licensePlate: (d.licensePlate as string) || '',
          type: (d.type as string) || 'truck',
          transporterId: (d.transporterId as string) || '',
          tareWeight: d.tareWeight?.toString() || '',
          notes: (d.notes as string) || '',
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      licensePlate: form.licensePlate,
      type: form.type,
      transporterId: form.transporterId || undefined,
      tareWeight: form.tareWeight ? Number(form.tareWeight) : undefined,
      notes: form.notes || undefined,
    };

    try {
      if (isEdit) {
        await api.patch(`/api/vehicles/${id}`, payload);
      } else {
        await api.post('/api/vehicles', payload);
      }
      navigate('/vehicles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-grey-500">Loading...</div>;

  const inputCls = 'mt-1 block w-full rounded border border-grey-300 px-3 py-2 text-sm focus:border-brand-navy-900 outline-none';

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-grey-900">{isEdit ? 'Edit Vehicle' : 'New Vehicle'}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 bg-white rounded-lg shadow p-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-grey-700">License Plate (Kenteken) *</label>
          <input type="text" required value={form.licensePlate} onChange={(e) => set('licensePlate', e.target.value)} className={inputCls} placeholder="AB-123-CD" />
        </div>

        <div>
          <label className="block text-sm font-medium text-grey-700">Type *</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-grey-700">Transporter</label>
          <select value={form.transporterId} onChange={(e) => set('transporterId', e.target.value)} className={inputCls}>
            <option value="">None</option>
            {transporters.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-grey-700">Tare Weight (kg)</label>
          <input type="number" value={form.tareWeight} onChange={(e) => set('tareWeight', e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-grey-700">Notes</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputCls} rows={3} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting}
            className="bg-brand-navy-900 text-white px-4 py-2 rounded text-sm hover:bg-brand-navy-800 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate('/vehicles')}
            className="px-4 py-2 rounded text-sm border hover:bg-grey-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}

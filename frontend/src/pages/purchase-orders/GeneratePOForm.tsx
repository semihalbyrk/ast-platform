import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { ArrowLeft } from 'lucide-react';

interface Option { id: string; name: string }

export default function GeneratePOForm() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Option[]>([]);
  const [clientId, setClientId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.get<{ data: Option[] }>('/api/entities?type=client').then((res) => setClients(res.data)).catch(() => {}); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const res = await api.post<{ data: { id: string } }>('/api/purchase-orders/generate', { clientId, periodStart, periodEnd, notes: notes || undefined });
      navigate(`/purchase-orders/${res.data.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Generation failed'); }
    finally { setSubmitting(false); }
  }

  const inputCls = 'mt-1.5 block w-full h-10 rounded-md border border-grey-300 px-3.5 text-sm text-grey-900 focus:border-green-500 focus:ring-[3px] focus:ring-green-500/15 outline-none';
  const labelCls = 'block text-sm font-medium text-grey-700';

  return (
    <div className="max-w-lg">
      <button onClick={() => navigate('/purchase-orders')} className="inline-flex items-center gap-1.5 text-sm font-medium text-green-500 hover:text-green-700 mb-4">
        <ArrowLeft size={16} strokeWidth={1.5} /> Back to Purchase Orders
      </button>
      <h1 className="text-2xl font-bold text-grey-900">Generate Purchase Order</h1>
      <p className="text-sm text-grey-500 mt-1">Creates a PO from completed inbounds in the selected period.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 bg-white rounded-lg border border-grey-200 shadow-sm p-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">{error}</div>}

        <div><label className={labelCls}>Client <span className="text-red-500">*</span></label>
          <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls}>
            <option value="">Select client...</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Period Start <span className="text-red-500">*</span></label><input type="date" required value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Period End <span className="text-red-500">*</span></label><input type="date" required value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={inputCls} /></div>
        </div>

        <div><label className={labelCls}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} h-auto min-h-[80px] py-2.5`} rows={3} /></div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50">{submitting ? 'Generating...' : 'Generate PO'}</button>
          <button type="button" onClick={() => navigate('/purchase-orders')} className="h-9 px-4 bg-white text-grey-700 border border-grey-300 rounded-md text-sm font-semibold hover:bg-grey-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}

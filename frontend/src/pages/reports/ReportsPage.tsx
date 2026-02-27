import { useState } from 'react';
import { getToken } from '../../api/client';
import { Download } from 'lucide-react';

function downloadReport(path: string) {
  const token = getToken();
  const url = token ? `${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : path;
  window.open(url, '_blank');
}

export default function ReportsPage() {
  const [invFormat, setInvFormat] = useState('csv');
  const [suppFormat, setSuppFormat] = useState('csv');
  const [suppStart, setSuppStart] = useState('');
  const [suppEnd, setSuppEnd] = useState('');
  const [contrFormat, setContrFormat] = useState('csv');
  const [contrStatus, setContrStatus] = useState('');

  const inputCls = 'block h-10 rounded-md border border-grey-300 px-3.5 text-sm text-grey-900 focus:border-green-500 focus:ring-[3px] focus:ring-green-500/15 outline-none';
  const labelCls = 'block text-xs font-medium text-grey-500 mb-1.5';

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-grey-900">Reports</h1>

      <div className="mt-6 bg-white rounded-lg border border-grey-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-grey-900">Inventory Report</h2>
        <p className="text-sm text-grey-500 mt-1">Export current inventory positions.</p>
        <div className="flex items-end gap-3 mt-4">
          <div><label className={labelCls}>Format</label>
            <select value={invFormat} onChange={(e) => setInvFormat(e.target.value)} className={inputCls}>
              <option value="csv">CSV</option><option value="json">JSON</option></select></div>
          <button onClick={() => downloadReport(`/api/reports/inventory?format=${invFormat}`)}
            className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 inline-flex items-center gap-2">
            <Download size={16} strokeWidth={1.5} /> Export
          </button>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-lg border border-grey-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-grey-900">Supplier (Leverancier) Summary</h2>
        <p className="text-sm text-grey-500 mt-1">Export Supplier (Leverancier) delivery summary for a period.</p>
        <div className="flex items-end gap-3 mt-4 flex-wrap">
          <div><label className={labelCls}>Start</label><input type="date" value={suppStart} onChange={(e) => setSuppStart(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>End</label><input type="date" value={suppEnd} onChange={(e) => setSuppEnd(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Format</label>
            <select value={suppFormat} onChange={(e) => setSuppFormat(e.target.value)} className={inputCls}>
              <option value="csv">CSV</option><option value="json">JSON</option></select></div>
          <button onClick={() => {
            let url = `/api/reports/suppliers?format=${suppFormat}`;
            if (suppStart) url += `&periodStart=${suppStart}`;
            if (suppEnd) url += `&periodEnd=${suppEnd}`;
            downloadReport(url);
          }} className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 inline-flex items-center gap-2">
            <Download size={16} strokeWidth={1.5} /> Export
          </button>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-lg border border-grey-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-grey-900">Contracts Report</h2>
        <p className="text-sm text-grey-500 mt-1">Export contracts overview.</p>
        <div className="flex items-end gap-3 mt-4">
          <div><label className={labelCls}>Status</label>
            <select value={contrStatus} onChange={(e) => setContrStatus(e.target.value)} className={inputCls}>
              <option value="">All</option><option value="concept">Concept</option><option value="lopend">Lopend</option><option value="gesloten">Gesloten</option></select></div>
          <div><label className={labelCls}>Format</label>
            <select value={contrFormat} onChange={(e) => setContrFormat(e.target.value)} className={inputCls}>
              <option value="csv">CSV</option><option value="json">JSON</option></select></div>
          <button onClick={() => {
            let url = `/api/reports/contracts?format=${contrFormat}`;
            if (contrStatus) url += `&status=${contrStatus}`;
            downloadReport(url);
          }} className="h-9 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-700 inline-flex items-center gap-2">
            <Download size={16} strokeWidth={1.5} /> Export
          </button>
        </div>
      </div>
    </div>
  );
}

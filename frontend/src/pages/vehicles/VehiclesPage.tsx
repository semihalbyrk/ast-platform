import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

interface Vehicle {
  id: string;
  licensePlate: string;
  type: string;
  transporter?: { name: string };
  tareWeight?: number;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ data: Vehicle[] }>('/api/vehicles')
      .then((res) => setVehicles(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-grey-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-grey-900">Vehicles</h1>
        <Link to="/vehicles/new" className="bg-brand-navy-900 text-white px-4 py-2 rounded text-sm hover:bg-brand-navy-800">
          New Vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <p className="mt-6 text-grey-500">No vehicles yet.</p>
      ) : (
        <table className="mt-4 w-full bg-white rounded-lg shadow text-sm">
          <thead>
            <tr className="border-b text-left text-grey-500">
              <th className="px-4 py-3">License Plate</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Transporter</th>
              <th className="px-4 py-3">Tare Weight</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b hover:bg-grey-50">
                <td className="px-4 py-3">
                  <Link to={`/vehicles/${v.id}`} className="text-brand-navy-900 hover:underline font-medium">{v.licensePlate}</Link>
                </td>
                <td className="px-4 py-3">{v.type}</td>
                <td className="px-4 py-3">{v.transporter?.name || '—'}</td>
                <td className="px-4 py-3">{v.tareWeight ? `${v.tareWeight.toLocaleString()} kg` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

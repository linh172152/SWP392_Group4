import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import batteryService from '../../services/battery.service';
import { toast } from 'sonner';
import type { Battery } from '../../services/battery.service';

const BatteryCoordination: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBattery, setNewBattery] = useState({ station_id: '', battery_code: '', model: '', capacity_kwh: '' });
  const [statusEdits, setStatusEdits] = useState<Record<string, { status?: string; current_charge?: number }>>({});
  const [historyById, setHistoryById] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await batteryService.getBatteries();
        if (res && res.success) setBatteries(res.data || []);
        else {
          const mock = await batteryService.getBatteriesMock();
          setBatteries(mock.data);
        }
      } catch (err: any) {
        console.error('Battery fetch failed, using mock data:', err);
        setError(err?.message || 'Không thể tải dữ liệu pin từ server, đang sử dụng dữ liệu mẫu.');
        const mock = await batteryService.getBatteriesMock();
        setBatteries(mock.data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="p-6 space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">🔋 Battery Coordination</h1>
        <p className="text-gray-500">Manage and coordinate battery transfers between stations</p>
      </header>

      <Card className="shadow-md border border-gray-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Battery Inventory</CardTitle>
          <CardDescription>View and manage battery data for each station</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-gray-600">Loading batteries...</p>}
          {error && <p className="text-yellow-600 mb-3">{error}</p>}

          {/* Add Battery Button */}
          <div className="flex justify-end mb-4">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition ${
                showAddForm
                  ? 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={() => setShowAddForm((v) => !v)}
            >
              {showAddForm ? '✖ Close' : '+ Add Battery'}
            </button>
          </div>

          {/* Add Battery Form */}
          {showAddForm && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);
                  const payload = {
                    station_id: newBattery.station_id,
                    battery_code: newBattery.battery_code,
                    model: newBattery.model,
                    capacity_kwh: Number(newBattery.capacity_kwh || 0),
                  };
                  const res = await batteryService.addBattery(payload as any);
                  if (res && res.success) {
                    setBatteries((prev) => [res.data, ...prev]);
                    toast.success('Battery added');
                    setShowAddForm(false);
                    setNewBattery({ station_id: '', battery_code: '', model: '', capacity_kwh: '' });
                  } else toast.error(res?.message || 'Failed to add battery');
                } catch (err: any) {
                  console.error('Add battery failed', err);
                  toast.error(err?.message || 'Add battery failed');
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-gray-50 p-6 border border-gray-200 rounded-xl shadow-sm mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Station ID" value={newBattery.station_id} onChange={(e) => setNewBattery((s) => ({ ...s, station_id: e.target.value }))} />
                <input className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Battery Code" value={newBattery.battery_code} onChange={(e) => setNewBattery((s) => ({ ...s, battery_code: e.target.value }))} />
                <input className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Model" value={newBattery.model} onChange={(e) => setNewBattery((s) => ({ ...s, model: e.target.value }))} />
                <input className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Capacity (kWh)" value={newBattery.capacity_kwh} onChange={(e) => setNewBattery((s) => ({ ...s, capacity_kwh: e.target.value }))} />
              </div>
              <div className="mt-4 text-right">
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">Create</button>
              </div>
            </form>
          )}

          {/* Battery List */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {batteries.map((b) => (
              <div key={b.battery_id} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {b.battery_code} — {b.model}
                    </h3>
                    <p className="text-sm text-gray-500">Station: {b.station?.name || b.station_id}</p>
                    <p className="text-sm text-gray-500">Status: <span className="font-medium text-gray-700">{b.status}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{b.current_charge ?? '-'}%</p>
                    <p className="text-xs text-gray-400">Health: {b.health_percentage ?? '-'}%</p>
                  </div>
                </div>

                {/* Status Controls */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <select
                    value={statusEdits[b.battery_id]?.status ?? b.status ?? ''}
                    onChange={(e) => setStatusEdits((s) => ({ ...s, [b.battery_id]: { ...(s[b.battery_id] || {}), status: e.target.value } }))}
                    className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Change status --</option>
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="IN_USE">IN_USE</option>
                    <option value="CHARGING">CHARGING</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="RETIRED">RETIRED</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Charge %"
                    value={statusEdits[b.battery_id]?.current_charge ?? b.current_charge ?? ''}
                    onChange={(e) => setStatusEdits((s) => ({ ...s, [b.battery_id]: { ...(s[b.battery_id] || {}), current_charge: Number(e.target.value) } }))}
                    className="p-2 w-28 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                    onClick={async () => {
                      const edit = statusEdits[b.battery_id];
                      if (!edit || (!edit.status && edit.current_charge === undefined)) {
                        toast.error('No changes to update');
                        return;
                      }
                      try {
                        setLoading(true);
                        const res = await batteryService.updateBattery(b.battery_id, edit as any);
                        if (res && res.success) {
                          setBatteries((prev) => prev.map((p) => (p.battery_id === b.battery_id ? res.data : p)));
                          toast.success('Battery updated');
                          setStatusEdits((s) => {
                            const copy = { ...s };
                            delete copy[b.battery_id];
                            return copy;
                          });
                        } else toast.error(res?.message || 'Update failed');
                      } catch (err: any) {
                        console.error('Update battery error', err);
                        toast.error(err?.message || 'Update error');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Update
                  </button>

                  <button
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const res = await batteryService.getBatteryHistory(b.battery_id);
                        if (res && res.success) setHistoryById((h) => ({ ...h, [b.battery_id]: res.data }));
                        else toast.error(res?.message || 'Failed to load history');
                      } catch (err: any) {
                        console.error('Get history error', err);
                        toast.error(err?.message || 'History error');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    History
                  </button>
                </div>

                {/* Battery History */}
                {historyById[b.battery_id] && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-1">📜 History</h4>
                    {historyById[b.battery_id].history?.length ? (
                      <ul className="list-disc pl-5 text-gray-600">
                        {historyById[b.battery_id].history.map((h: any) => (
                          <li key={h.log_id || JSON.stringify(h)}>
                            {h.transferred_at ? new Date(h.transferred_at).toLocaleString() : ''} — from{' '}
                            {h.from_station?.name || h.from_station_id} to {h.to_station?.name || h.to_station_id}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">No history entries</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatteryCoordination;

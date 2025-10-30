import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getSystemReport } from '../../services/report.service';
import type { SystemReport, ReportFilters } from '../../services/report.service';

const ReportsAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SystemReport | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters: ReportFilters = {};
        const res = await getSystemReport(filters);
        if (res && res.success) {
          setReport(res.data?.overview ? {
            total_users: res.data.overview.total_users,
            total_stations: res.data.overview.total_stations,
            total_batteries: res.data.overview.total_batteries,
            total_vehicles: 0,
            total_bookings: res.data.overview.total_bookings,
            total_revenue: res.data.overview.total_revenue,
            daily_stats: {
              total_swaps: res.data.overview.total_bookings || 0,
              total_revenue: res.data.overview.total_revenue || 0,
              active_stations: Array.isArray(res.data.breakdowns?.stations_by_status)
                ? res.data.breakdowns.stations_by_status.reduce(
                    (acc: any, b: any) => acc + (b._count?.station_id || 0),
                    0
                  )
                : 0,
              completion_rate: 0,
            },
            monthly_stats: {
              total_swaps: 0,
              total_revenue: 0,
              active_subscriptions: 0,
              new_users: 0,
            },
            station_metrics:
              res.data.recent_activity?.map((t: any) => ({
                station_id: t.station?.station_id || '',
                name: t.station?.name || '',
                total_swaps: 0,
                total_revenue: 0,
                uptime: 0,
              })) || [],
            battery_metrics: [],
            peak_hours: [],
          } as SystemReport : null);
        } else {
          throw new Error(res?.message || 'Failed to load report');
        }
      } catch (err: any) {
        console.error('Load report error:', err);
        setError(err.message || 'Lỗi khi tải báo cáo');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">📊 Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">View detailed reports and performance analytics</p>
      </div>

      {/* System Overview */}
      <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-800">System Overview</CardTitle>
          <CardDescription className="text-gray-500">
            Live data fetched from backend reports
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full"></div>
              <p className="ml-3 text-blue-600 font-medium">Loading report...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-center">
              {error}
            </div>
          )}

          {!loading && !error && report && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-3xl font-semibold text-blue-600">{report.total_users}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <p className="text-gray-500 text-sm">Total Stations</p>
                <p className="text-3xl font-semibold text-green-600">{report.total_stations}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <p className="text-gray-500 text-sm">Total Batteries</p>
                <p className="text-3xl font-semibold text-yellow-600">{report.total_batteries}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <p className="text-gray-500 text-sm">Total Bookings</p>
                <p className="text-3xl font-semibold text-purple-600">{report.total_bookings}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <p className="text-3xl font-semibold text-emerald-600">
                  ${report.total_revenue?.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {!loading && !error && !report && (
            <div className="text-center text-gray-500 py-6">No report data available.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsAnalytics;

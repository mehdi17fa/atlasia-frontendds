import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, Bar, Line } from 'recharts';
import { api } from '../api';

// Simple helpers
const formatNumber = (num) => {
  if (num === null || num === undefined || Number.isNaN(num)) return '0';
  return new Intl.NumberFormat().format(Number(num));
};

const formatCurrency = (num) => {
  if (num === null || num === undefined || Number.isNaN(num)) return '€0';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(num));
  } catch (e) {
    return `€${formatNumber(num)}`;
  }
};

// Minimal bar chart component (no external libs)
function MiniBarChart({ data = [], valueKey = 'value', labelKey = 'label', height = 120, barColor = '#16a34a' }) {
  const maxValue = useMemo(() => {
    return data.reduce((max, d) => Math.max(max, Number(d?.[valueKey] || 0)), 0) || 1;
  }, [data, valueKey]);

  return (
    <div className="w-full h-full flex items-end gap-2">
      {data.map((d, idx) => {
        const value = Number(d?.[valueKey] || 0);
        const barHeight = Math.max(4, Math.round((value / maxValue) * height));
        return (
          <div key={idx} className="flex-1 flex flex-col items-center justify-end" title={`${d?.[labelKey]}: ${value}`}>
            <div
              className="w-full rounded-t"
              style={{ height: `${barHeight}px`, backgroundColor: barColor, minWidth: 6 }}
            />
            <div className="mt-1 text-[10px] text-gray-500 truncate w-full text-center">{d?.[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [timeframe, setTimeframe] = useState('6M'); // 6M | 12M | ALL
  const [granularity, setGranularity] = useState('month'); // day | week | month
  const [showRevenue, setShowRevenue] = useState(true);
  const [showReservations, setShowReservations] = useState(true);
  const [showDataTable, setShowDataTable] = useState(false);
  const [topData, setTopData] = useState({ properties: [], owners: [], partners: [] });
  const [recentReservations, setRecentReservations] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try dedicated admin endpoints; pass timeframe and granularity; fall back safely
        const params = new URLSearchParams();
        if (timeframe && timeframe !== 'ALL') params.append('timeframe', timeframe);
        if (granularity) params.append('granularity', granularity);

        const [statsRes, docsRes, topRes, recentRes] = await Promise.allSettled([
          api.get(`/api/admin/stats${params.toString() ? `?${params.toString()}` : ''}`),
          api.get('/api/admin/documents?limit=25'),
          api.get('/api/admin/top?limit=5'),
          api.get('/api/admin/recent-reservations?limit=10')
        ]);

        let statsData = null;
        if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
          statsData = statsRes.value.data;
        } else {
          // Fallback sample to avoid a blank page if backend is not ready
          statsData = {
            totals: {
              tourists: 0,
              owners: 0,
              partners: 0,
              properties: 0,
              packages: 0,
              reservations: 0,
              revenue: 0,
            },
            timeseries: {
              revenue: [
                { label: 'Jan', value: 0 },
                { label: 'Feb', value: 0 },
                { label: 'Mar', value: 0 },
                { label: 'Apr', value: 0 },
                { label: 'May', value: 0 },
                { label: 'Jun', value: 0 },
              ],
              reservations: [
                { label: 'Jan', value: 0 },
                { label: 'Feb', value: 0 },
                { label: 'Mar', value: 0 },
                { label: 'Apr', value: 0 },
                { label: 'May', value: 0 },
                { label: 'Jun', value: 0 },
              ],
            },
          };
        }

        let docsData = [];
        if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value?.data?.documents)) {
          docsData = docsRes.value.data.documents;
        }

        let top = { properties: [], owners: [], partners: [] };
        if (topRes.status === 'fulfilled' && topRes.value?.data) {
          top = {
            properties: topRes.value.data.properties || [],
            owners: topRes.value.data.owners || [],
            partners: topRes.value.data.partners || []
          };
        }

        let recent = [];
        if (recentRes.status === 'fulfilled' && Array.isArray(recentRes.value?.data?.reservations)) {
          recent = recentRes.value.data.reservations;
        }

        if (!isMounted) return;
        setStats(statsData);
        setDocuments(docsData);
        setTopData(top);
        setRecentReservations(recent);
      } catch (e) {
        if (!isMounted) return;
        setError(e?.response?.data?.message || e.message || 'Failed to load admin data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { isMounted = false; };
  }, [timeframe, granularity]);

  const totals = stats?.totals || {};
  const revenueSeries = stats?.timeseries?.revenue || [];
  const reservationSeries = stats?.timeseries?.reservations || [];

  const filterSeriesByTimeframe = (series) => {
    if (!series || series.length === 0) return [];
    if (timeframe === 'ALL') return series;
    const windowSize = timeframe === '12M' ? 12 : 6;
    return series.slice(-windowSize);
  };

  const filteredRevenue = filterSeriesByTimeframe(revenueSeries);
  const filteredReservations = filterSeriesByTimeframe(reservationSeries);

  const exportCSV = () => {
    const alignedLength = Math.max(filteredRevenue.length, filteredReservations.length);
    const rows = [['Label', 'Revenue', 'Reservations']];
    for (let i = 0; i < alignedLength; i++) {
      const label = filteredRevenue[i]?.label || filteredReservations[i]?.label || `#${i + 1}`;
      const rev = filteredRevenue[i]?.value ?? '';
      const res = filteredReservations[i]?.value ?? '';
      rows.push([label, rev, res]);
    }
    const csv = rows.map(r => r.map(v => `${String(v).includes(',') ? '"' + String(v).replace(/"/g, '""') + '"' : v}`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admin-timeseries.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  function buildMergedData(revenue = [], reservations = []) {
    const map = new Map();
    revenue.forEach((d) => {
      const key = d?.label || '';
      if (!map.has(key)) map.set(key, { label: key, revenue: 0, reservations: 0 });
      map.get(key).revenue = Number(d?.value || 0);
    });
    reservations.forEach((d) => {
      const key = d?.label || '';
      if (!map.has(key)) map.set(key, { label: key, revenue: 0, reservations: 0 });
      map.get(key).reservations = Number(d?.value || 0);
    });
    return Array.from(map.values());
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of users, properties, reservations, and documents.</p>
      </div>

      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
          <div className="text-gray-600">Loading dashboard data…</div>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {!loading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-500 text-sm">Tourists</div>
              <div className="text-2xl font-semibold mt-1">{formatNumber(totals.tourists)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-500 text-sm">Property Owners</div>
              <div className="text-2xl font-semibold mt-1">{formatNumber(totals.owners)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-500 text-sm">Partners</div>
              <div className="text-2xl font-semibold mt-1">{formatNumber(totals.partners)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-500 text-sm">Reservations</div>
              <div className="text-2xl font-semibold mt-1">{formatNumber(totals.reservations)}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Trends</h2>
                <div className="text-sm text-gray-500">Revenue and Reservations</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-50 rounded-md p-1">
                  <button onClick={() => setShowRevenue((v) => !v)} className={`px-2 py-1 rounded text-sm ${showRevenue ? 'bg-green-100 text-green-800' : 'text-gray-600'}`}>Revenue</button>
                  <button onClick={() => setShowReservations((v) => !v)} className={`px-2 py-1 rounded text-sm ${showReservations ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`}>Reservations</button>
                </div>
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 text-sm">
                  <option value="6M">Last 6 months</option>
                  <option value="12M">Last 12 months</option>
                  <option value="ALL">All available</option>
                </select>
                <select value={granularity} onChange={(e) => setGranularity(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 text-sm">
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
                <button onClick={exportCSV} className="px-3 py-1.5 rounded-md text-sm bg-gray-800 text-white hover:bg-gray-900">Export CSV</button>
                <button onClick={() => setShowDataTable(v => !v)} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 hover:bg-gray-50">{showDataTable ? 'Hide Data' : 'View Data'}</button>
              </div>
            </div>
            <div className="w-full" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={buildMergedData(filteredRevenue, filteredReservations)} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => formatNumber(v)} />
                  <ReTooltip formatter={(value, name) => name === 'revenue' ? formatCurrency(value) : formatNumber(value)} labelFormatter={(label) => `${label}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {showReservations && (
                    <Bar dataKey="reservations" name="Reservations" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  )}
                  {showRevenue && (
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {showDataTable && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="px-2 py-1">Label</th>
                      <th className="px-2 py-1">Revenue</th>
                      <th className="px-2 py-1">Reservations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.from({ length: Math.max(filteredRevenue.length, filteredReservations.length) }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1">{filteredRevenue[i]?.label || filteredReservations[i]?.label || `#${i + 1}`}</td>
                        <td className="px-2 py-1">{formatCurrency(filteredRevenue[i]?.value ?? 0)}</td>
                        <td className="px-2 py-1">{formatNumber(filteredReservations[i]?.value ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top lists and recent reservations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4 lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Properties</h3>
              <div className="space-y-3">
                {(topData.properties || []).map((p, idx) => (
                  <div key={p?._id || idx} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-gray-900 font-medium truncate max-w-[220px]">{p?.title || p?.name || 'Property'}</div>
                      <div className="text-xs text-gray-500">{p?.location || p?.city || ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-700">{formatCurrency(p?.revenue || 0)}</div>
                      <div className="text-xs text-gray-500">{formatNumber(p?.reservations || 0)} reservations</div>
                    </div>
                  </div>
                ))}
                {(topData.properties || []).length === 0 && (
                  <div className="text-sm text-gray-500">No data</div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Partners</h3>
              <div className="space-y-3">
                {(topData.partners || []).map((u, idx) => (
                  <div key={u?._id || idx} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-gray-900 font-medium truncate max-w-[220px]">{u?.fullName || u?.name || 'Partner'}</div>
                      <div className="text-xs text-gray-500">Packages: {formatNumber(u?.packages || 0)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-700">{formatCurrency(u?.revenue || 0)}</div>
                      <div className="text-xs text-gray-500">{formatNumber(u?.reservations || 0)} reservations</div>
                    </div>
                  </div>
                ))}
                {(topData.partners || []).length === 0 && (
                  <div className="text-sm text-gray-500">No data</div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Reservations</h3>
              <div className="divide-y divide-gray-100">
                {(recentReservations || []).map((r, idx) => (
                  <div key={r?._id || idx} className="py-2 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-gray-900 font-medium truncate max-w-[220px]">{r?.property?.title || r?.package?.name || 'Reservation'}</div>
                      <div className="text-xs text-gray-500">{r?.guest?.fullName || r?.tourist?.fullName || 'Guest'} • {r?.status || 'status'} • {r?.checkIn ? new Date(r.checkIn).toLocaleDateString() : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-700">{formatCurrency(r?.totalPrice || r?.amount || 0)}</div>
                    </div>
                  </div>
                ))}
                {(recentReservations || []).length === 0 && (
                  <div className="py-3 text-sm text-gray-500">No recent reservations</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-500 text-sm">Properties</div>
              <div className="text-2xl font-semibold mt-1">{formatNumber(totals.properties)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-500 text-sm">Packages</div>
              <div className="text-2xl font-semibold mt-1">{formatNumber(totals.packages)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-500 text-sm">Generated Revenue</div>
              <div className="text-2xl font-semibold mt-1">{formatCurrency(totals.revenue)}</div>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
              <div className="text-sm text-gray-500">{documents?.length || 0} items</div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(documents || []).map((doc) => (
                    <tr key={doc?._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-900 truncate max-w-xs">{doc?.name || doc?.fileName || 'Document'}</div>
                        {doc?.property?.title && (
                          <div className="text-xs text-gray-500">{doc?.property?.title}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{doc?.type || doc?.contentType || '—'}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {doc?.owner?.fullName || doc?.user?.fullName || doc?.owner?.name || '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{doc?.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : '—'}</td>
                      <td className="px-4 py-2 text-right">
                        {doc?.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-green-700 hover:text-green-900 text-sm font-medium"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {documents?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No documents found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}



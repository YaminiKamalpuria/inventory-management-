import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { productAPI, invoiceAPI, statisticsAPI } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

const OV_ICONS = {
  sales: { bg: '#dbeafe', icon: '🛒' },
  revenue: { bg: '#dcfce7', icon: '💰' },
  profit: { bg: '#fce7f3', icon: '📈' },
  cost: { bg: '#fef3c7', icon: '🏠' },
  purchase: { bg: '#ede9fe', icon: '📦' },
  cancel: { bg: '#fee2e2', icon: '❌' },
  return: { bg: '#ffedd5', icon: '🔄' },
  inStock: { bg: '#d1fae5', icon: '📋' },
  toReceive: { bg: '#e0f2fe', icon: '👁' },
  suppliers: { bg: '#f3e8ff', icon: '📊' },
  categories: { bg: '#fef9c3', icon: '📁' },
};

function OverviewCard({ title, items }) {
  return (
    <div className="overview-section">
      <div className="overview-section-title">{title}</div>
      <div className="overview-grid">
        {items.map((item, i) => (
          <div className="overview-item" key={i}>
            <div className="overview-item-icon" style={{ background: item.bg }}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
            </div>
            <div className="overview-item-value">{item.value}</div>
            <div className="overview-item-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [overview, setOverview] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [period]);

  const fetchData = async () => {
    try {
      const { data } = await statisticsAPI.getOverview();
      setOverview(data.overview);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchGraph = async () => {
    try {
      const { data } = await statisticsAPI.getGraph(period);
      const formatted = data.labels.map((label, i) => ({
        name: label,
        Purchase: data.purchases[i],
        Sales: data.sales[i],
      }));
      setGraphData(formatted);
    } catch {}
  };

  const fmt = (n) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n || 0}`;

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <span className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
        </div>
      </main>
    </div>
  );

  const ov = overview || {};

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <span className="page-header-title">Home</span>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
        </div>

        <div className="page-body">
          <div className="home-grid">
            <div className="home-left">
              <OverviewCard title="Sales Overview" items={[
                { bg: '#dbeafe', icon: '🛒', value: ov.sales?.count || 0, label: 'Sales' },
                { bg: '#dcfce7', icon: '💰', value: fmt(ov.revenue), label: 'Revenue' },
                { bg: '#fce7f3', icon: '📈', value: fmt(ov.profit), label: 'Profit' },
                { bg: '#fef3c7', icon: '🏠', value: fmt(ov.cost), label: 'Cost' },
              ]} />

              <OverviewCard title="Purchase Overview" items={[
                { bg: '#ede9fe', icon: '📦', value: ov.purchases?.count || 0, label: 'Purchase' },
                { bg: '#fef3c7', icon: '🏠', value: fmt(ov.purchases?.total), label: 'Cost' },
                { bg: '#fee2e2', icon: '❌', value: 0, label: 'Cancel' },
                { bg: '#ffedd5', icon: '🔄', value: 0, label: 'Return' },
              ]} />

              {/* Sales & Purchase Chart */}
              <div className="chart-section">
                <div className="chart-header">
                  <span className="chart-title">Sales &amp; Purchase</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className={`period-btn ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')}>Weekly</button>
                    <button className={`period-btn ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>Monthly</button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={graphData} barSize={10} barGap={2}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '0.8rem' }}
                      formatter={(v) => [`₹${v}`, undefined]}
                    />
                    <Bar dataKey="Purchase" fill="#7c6ff7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Sales" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  <div className="legend-item"><div className="legend-dot" style={{ background: '#7c6ff7' }} /> Purchase</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: '#22c55e' }} /> Sales</div>
                </div>
              </div>
            </div>

            <div className="home-right">
              {/* Inventory Summary */}
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>Inventory Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ background: '#e0f2fe', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>📋</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{ov.inStock || 0}</div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>In Stock</div>
                  </div>
                  <div>
                    <div style={{ background: '#f3e8ff', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>👁</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{ov.toBeReceived || 0}</div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>To be received</div>
                  </div>
                </div>
              </div>

              {/* Product Summary */}
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>Product Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ background: '#fce7f3', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>👥</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{ov.suppliersCount || 0}</div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Number of Suppliers</div>
                  </div>
                  <div>
                    <div style={{ background: '#dcfce7', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>📁</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{ov.categoriesCount || 0}</div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Number of Categories</div>
                  </div>
                </div>
              </div>

              {/* Top Products */}
              <div className="card" style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>Top Products</div>
                {(ov.topProducts || []).length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No products yet</p>
                ) : (
                  (ov.topProducts || []).map((p, i) => (
                    <div key={i} className="top-product-item">
                      <div>
                        <div className="top-product-name">{p.productName}</div>
                        <div className="top-product-bar" style={{ width: `${Math.min(100, (p.salesCount / 10) * 100)}%`, minWidth: 20 }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                        {p.salesCount} sold
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

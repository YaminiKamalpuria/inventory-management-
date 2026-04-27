import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { statisticsAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const CARD_CONFIG = {
  revenue: {
    label: 'Total Revenue',
    color: '#fbbf24',
    fmt: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`,
  },
  sold: {
    label: 'Products Sold',
    color: '#2dd4bf',
    fmt: (v) => String(v || 0),
  },
  stock: {
    label: 'Products In Stock',
    color: '#f472b6',
    fmt: (v) => String(v || 0),
  },
};

function DraggableCard({ id, config, value, change, index, isDragging, onDragStart, onDragEnter, onDrop }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop()}
      style={{
        flex: 1,
        background: config.color,
        borderRadius: 14,
        padding: '20px 24px',
        cursor: 'grab',
        userSelect: 'none',
        opacity: isDragging ? 0.45 : 1,
        transform: isDragging ? 'scale(0.96)' : 'scale(1)',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        boxShadow: isDragging ? 'none' : '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {config.label}
      </div>
      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1a1d2e', lineHeight: 1.15 }}>
        {config.fmt(value)}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.45)', marginTop: 6 }}>
        {Number(change) >= 0 ? `+${change}%` : `${change}%`} from last month
      </div>
      <div style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.25)', marginTop: 4 }}>
        ⣿ drag to reorder
      </div>
    </div>
  );
}

export default function Statistics() {
  const { user, updateUser } = useAuth();
  const [cards, setCards] = useState(null);
  const [overview, setOverview] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [order, setOrder] = useState(
    Array.isArray(user?.statisticsOrder) && user.statisticsOrder.length === 3
      ? user.statisticsOrder
      : ['revenue', 'sold', 'stock']
  );
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchGraph(); }, [period]);

  const fetchAll = async () => {
    try {
      const [cardsRes, overviewRes] = await Promise.all([
        statisticsAPI.getTopCards(),
        statisticsAPI.getOverview(),
      ]);
      setCards(cardsRes.data.cards);
      setOverview(overviewRes.data.overview);
    } catch {
      toast.error('Failed to load statistics');
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

  const handleDragStart = (idx) => setDraggingIdx(idx);

  const handleDragEnter = (idx) => {
    if (draggingIdx === null || draggingIdx === idx) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(draggingIdx, 1);
    newOrder.splice(idx, 0, moved);
    setOrder(newOrder);
    setDraggingIdx(idx);
  };

  const handleDrop = async () => {
    setDraggingIdx(null);
    try {
      await authAPI.updateStatisticsOrder(order);
      updateUser({ statisticsOrder: order });
    } catch {}
  };

  const getCardValue = (id) => {
    if (!cards) return 0;
    if (id === 'revenue') return cards.totalRevenue;
    if (id === 'sold') return cards.productsSold;
    if (id === 'stock') return cards.productsInStock;
    return 0;
  };

  const getCardChange = (id) => {
    if (!cards) return 0;
    if (id === 'revenue') return cards.revenueChange;
    if (id === 'sold') return cards.soldChange;
    return 0;
  };

  const ov = overview || {};
  const fmt = (n) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n || 0}`;
  const maxSales = Math.max(...(ov.topProducts || [{ salesCount: 1 }]).map(p => p.salesCount), 1);

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

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <span className="page-header-title">Statistics</span>
          <div style={{ fontSize: '0.75rem', color: '#8892a4' }}>
            Drag cards to reorder — saved automatically
          </div>
        </div>

        <div className="page-body">
          {/* Draggable stat cards */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            {order.map((id, idx) => (
              <DraggableCard
                key={id}
                id={id}
                index={idx}
                config={CARD_CONFIG[id]}
                value={getCardValue(id)}
                change={getCardChange(id)}
                isDragging={draggingIdx === idx}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDrop={handleDrop}
              />
            ))}
          </div>

          {/* Two-column layout */}
          <div className="stats-page-grid">
            {/* Left column */}
            <div>
              {/* Bar chart */}
              <div className="chart-section">
                <div className="chart-header">
                  <span className="chart-title">Sales &amp; Purchase</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={`period-btn${period === 'weekly' ? ' active' : ''}`}
                      onClick={() => setPeriod('weekly')}
                    >Weekly</button>
                    <button
                      className={`period-btn${period === 'monthly' ? ' active' : ''}`}
                      onClick={() => setPeriod('monthly')}
                    >Monthly</button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
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
                <div className="chart-legend" style={{ marginTop: 8 }}>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#7c6ff7' }} /> Purchase
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#22c55e' }} /> Sales
                  </div>
                </div>
              </div>

              {/* Sales Overview */}
              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 16 }}>Sales Overview</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  {[
                    { bg: '#dbeafe', icon: '🛒', value: ov.sales?.count || 0, label: 'Sales' },
                    { bg: '#dcfce7', icon: '💰', value: fmt(ov.revenue), label: 'Revenue' },
                    { bg: '#fce7f3', icon: '📈', value: fmt(ov.profit), label: 'Profit' },
                    { bg: '#fef3c7', icon: '🏠', value: fmt(ov.cost), label: 'Cost' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ background: item.bg, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: '1rem' }}>
                        {item.icon}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{item.value}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Top Products */}
            <div className="card" style={{ alignSelf: 'start' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 16 }}>Top Products</div>
              {(ov.topProducts || []).length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
                  No data yet. Start selling to see top products!
                </p>
              ) : (
                (ov.topProducts || []).map((p, i) => (
                  <div key={i} className="top-product-item">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="top-product-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.productName}
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: '#fef3c7', marginTop: 4 }}>
                        <div style={{
                          height: '100%',
                          borderRadius: 2,
                          background: '#f59e0b',
                          width: `${Math.max(8, (p.salesCount / maxSales) * 100)}%`,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, marginLeft: 12, whiteSpace: 'nowrap' }}>
                      {p.salesCount} sold
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

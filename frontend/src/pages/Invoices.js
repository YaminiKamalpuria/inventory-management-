import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { invoiceAPI } from '../utils/api';
import toast from 'react-hot-toast';

function InvoiceViewModal({ invoice, onClose }) {
  const handlePrint = () => window.print();
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint} className="btn-sm btn-outline">🖨 Print</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>
        </div>

        <div className="invoice-preview">
          <div className="invoice-preview-header">
            <div>
              <div className="invoice-preview-title">INVOICE</div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>Billed to</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>StockSense</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Company address</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>City, Country - 00000</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <div style={{ color: '#6b7280' }}>Business address</div>
              <div style={{ color: '#6b7280' }}>City, State, IN - 000 000</div>
              <div style={{ color: '#6b7280' }}>TAX ID 00XXXXX1234X0XX</div>
              <div style={{ marginTop: 16 }}>
                <div style={{ color: '#6b7280' }}>Invoice date</div>
                <div style={{ fontWeight: 600 }}>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ color: '#6b7280' }}>Invoice #</div>
                <div style={{ fontWeight: 600 }}>{invoice.invoiceId}</div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ color: '#6b7280' }}>Due date</div>
                <div style={{ fontWeight: 600 }}>{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</div>
              </div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr>
                <th style={{ background: '#f4f5f7', padding: '10px 12px', textAlign: 'left', fontSize: '0.78rem', color: '#6b7280' }}>Products</th>
                <th style={{ background: '#f4f5f7', padding: '10px 12px', textAlign: 'center', fontSize: '0.78rem', color: '#6b7280' }}>Qty</th>
                <th style={{ background: '#f4f5f7', padding: '10px 12px', textAlign: 'right', fontSize: '0.78rem', color: '#6b7280' }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '10px 12px', fontSize: '0.82rem', borderBottom: '1px solid #e5e7eb' }}>{item.productName}</td>
                  <td style={{ padding: '10px 12px', fontSize: '0.82rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{item.quantity}</td>
                  <td style={{ padding: '10px 12px', fontSize: '0.82rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>₹{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 220 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.82rem' }}>
                <span style={{ color: '#6b7280' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>₹{invoice.subtotal?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.82rem' }}>
                <span style={{ color: '#6b7280' }}>Tax (10%)</span>
                <span style={{ fontWeight: 600 }}>₹{invoice.tax?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.9rem', borderTop: '2px solid #1a1d2e', marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: '#22c55e' }}>Total due</span>
                <span style={{ fontWeight: 800, color: '#22c55e' }}>₹{invoice.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, padding: '12px 16px', background: '#f9fafb', borderRadius: 8, fontSize: '0.78rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
            ℹ Please pay within 7 days of receiving this invoice.
          </div>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280' }}>
            <span>www.receiheal.inc</span>
            <span>+91 00000 00000</span>
            <span>hello@email.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreeDotMenu({ invoice, onStatusChange, onDelete, onView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <button className="three-dot-btn" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>⋮</button>
      {open && (
        <div className="dropdown-menu">
          <button className="dropdown-item" onClick={() => { onStatusChange(invoice.status === 'Paid' ? 'Unpaid' : 'Paid'); setOpen(false); }}>
            {invoice.status === 'Paid' ? '🔲 Mark Unpaid' : '✅ Mark Paid'}
          </button>
          {invoice.status === 'Paid' && (
            <button className="dropdown-item" onClick={() => { onView(); setOpen(false); }}>
              👁 View Invoice
            </button>
          )}
          <button className="dropdown-item danger" onClick={() => { onDelete(); setOpen(false); }}>
            🗑 Delete Invoice
          </button>
        </div>
      )}
    </div>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, [page, search]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await invoiceAPI.getAll({ page, limit: 10, search });
      setInvoices(data.invoices);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const { data } = await invoiceAPI.getSummary();
      setSummary(data.summary);
    } catch {}
  };

  const handleStatusChange = async (id, status) => {
    try {
      await invoiceAPI.updateStatus(id, status);
      toast.success(`Marked as ${status}`);
      fetchInvoices(); fetchSummary();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await invoiceAPI.delete(id);
      toast.success('Invoice deleted');
      fetchInvoices(); fetchSummary();
    } catch { toast.error('Failed to delete'); }
  };

  const handleViewInvoice = async (id) => {
    try {
      const { data } = await invoiceAPI.getById(id);
      setViewInvoice(data.invoice);
    } catch { toast.error('Failed to load invoice'); }
  };

  const s = summary || {};
  const fmt = (n) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n || 0}`;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <span className="page-header-title">Invoice</span>
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Search here..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="page-body">
          {/* Summary Cards */}
          <div className="card mb-4" style={{ marginBottom: 20 }}>
            <div className="overview-section-title">Overall Invoice</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              {[
                { title: 'Recent Transactions', value: s.recentTransactions || 0, sub1: 'Last 7 days', sub2: '' },
                { title: 'Total Invoices', value: s.totalInvoices || 0, sub1: 'Total Till Date', sub2: `${s.processedInvoices || 0} Processed` },
                { title: 'Paid Amount', value: fmt(s.paidAmount), sub1: 'Last 7 days', sub2: `${s.paidCustomers || 0} customers` },
                { title: 'Unpaid Amount', value: fmt(s.unpaidAmount), sub1: 'Total Pending', sub2: `${s.unpaidCustomers || 0} Customers` },
              ].map((item, i) => (
                <div key={i} style={{ padding: '0 20px', borderRight: i < 3 ? '1px solid #e5e7eb' : 'none' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1d2e', marginBottom: 8 }}>{item.value}</div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{item.sub1}</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.sub2}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="table-container">
            <div className="table-header">
              <span className="table-title">Invoices List</span>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Reference Number</th>
                    <th>Amount (₹)</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>No invoices yet. Buy products to generate invoices.</td></tr>
                  ) : invoices.map(inv => (
                    <tr key={inv._id}>
                      <td style={{ fontWeight: 500 }}>{inv.invoiceId}</td>
                      <td style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'DM Mono, monospace' }}>{inv._id}</td>
                      <td style={{ fontWeight: 600 }}>₹{inv.totalAmount?.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${inv.status === 'Paid' ? 'badge-green' : 'badge-red'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td>{new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                      <td>
                        <ThreeDotMenu
                          invoice={inv}
                          onStatusChange={(status) => handleStatusChange(inv._id, status)}
                          onDelete={() => handleDelete(inv._id)}
                          onView={() => handleViewInvoice(inv._id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="pagination">
              <span className="pagination-info">Page {page} of {totalPages} — {total} total</span>
              <div className="pagination-btns">
                <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {viewInvoice && <InvoiceViewModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />}
    </div>
  );
}

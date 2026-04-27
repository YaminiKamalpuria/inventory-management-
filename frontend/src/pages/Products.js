import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { productAPI } from '../utils/api';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

const STATUS_BADGE = {
  'In-stock': 'badge-green',
  'Low-stock': 'badge-yellow',
  'Out-of-stock': 'badge-red',
};

function AddTypeModal({ onClose, onSelect }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 320, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <button
          style={{ display: 'block', width: '100%', padding: '14px', background: '#1a1d2e', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}
          onClick={() => onSelect('individual')}
        >Individual product</button>
        <button
          style={{ display: 'block', width: '100%', padding: '14px', background: '#1a1d2e', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={() => onSelect('multiple')}
        >Multiple product</button>
      </div>
    </div>
  );
}

function AddProductModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ productName: '', productId: '', category: '', price: '', quantity: '', unit: '', expiryDate: '', thresholdValue: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (image) fd.append('image', image);
      await productAPI.create(fd);
      toast.success('Product added!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-title">New Product</div>
        <form onSubmit={handleSubmit}>
          {/* Image upload */}
          <div style={{ marginBottom: 20 }}>
            <div className="image-upload-box" onClick={() => fileRef.current.click()} style={{ width: 80, height: 80 }}>
              {preview ? <img src={preview} alt="preview" /> : (
                <>
                  <span style={{ fontSize: '1.4rem' }}>📷</span>
                  <span style={{ fontSize: '0.65rem', color: '#9ca3af', textAlign: 'center' }}>Drag Image here or Browse Image</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Product Name', key: 'productName', placeholder: 'Enter product name' },
              { label: 'Product ID', key: 'productId', placeholder: 'Enter product ID' },
              { label: 'Category', key: 'category', placeholder: 'Select product category' },
              { label: 'Price', key: 'price', placeholder: 'Enter price', type: 'number' },
              { label: 'Quantity', key: 'quantity', placeholder: 'Enter product quantity', type: 'number' },
              { label: 'Unit', key: 'unit', placeholder: 'Enter product unit' },
              { label: 'Expiry Date', key: 'expiryDate', placeholder: 'Enter expiry date', type: 'date' },
              { label: 'Threshold Value', key: 'thresholdValue', placeholder: 'Enter threshold value', type: 'number' },
            ].map(({ label, key, placeholder, type = 'text' }) => (
              <div className="form-group" key={key} style={{ marginBottom: 0 }}>
                <label className="form-label">{label}</label>
                <input
                  className="form-input" type={type} placeholder={placeholder}
                  value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  required={!['expiryDate'].includes(key)}
                />
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-sm btn-outline" onClick={onClose}>Discard</button>
            <button type="submit" className="btn-sm btn-dark" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CSVUploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState([]);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    Papa.parse(f, {
      header: true,
      complete: (results) => { setPreview(results.data.slice(0, 5)); setStep(2); }
    });
  };

  const handleUpload = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await productAPI.csvUpload(fd);
      if (data.created > 0) toast.success(`${data.created} products uploaded successfully!`);
      if (data.errors?.length) {
        data.errors.slice(0, 3).forEach(e => toast.error(e, { duration: 5000 }));
        if (data.errors.length > 3) toast.error(`...and ${data.errors.length - 3} more errors`);
      }
      if (data.created > 0) { onSuccess(); onClose(); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>CSV Upload</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 16 }}>Add your documents here</p>

        {step === 1 ? (
          <div className="upload-area" onClick={() => fileRef.current.click()}>
            <input ref={fileRef} type="file" accept=".csv" hidden onChange={handleFile} />
            <div className="upload-area-icon">📄</div>
            <p className="upload-area-text">Drag your file(s) to start uploading</p>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '8px 0' }}>OR</p>
            <span className="upload-area-link">Browse files</span>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>Preview (first 5 rows):</p>
            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{preview[0] && Object.keys(preview[0]).map(k => <th key={k} style={{ padding: '6px 8px', background: '#f4f5f7', textAlign: 'left' }}>{k}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>{Object.values(row).map((v, j) => <td key={j} style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}>{v}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button className="btn-sm btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-sm btn-dark" onClick={step === 1 ? () => fileRef.current.click() : handleUpload} disabled={loading}>
            {loading ? <span className="spinner" /> : step === 1 ? 'Next ›' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BuyModal({ product, onClose, onSuccess }) {
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    const q = parseInt(qty);
    if (!q || q <= 0) { toast.error('Enter valid quantity'); return; }
    setLoading(true);
    try {
      await productAPI.buy(product._id, q);
      toast.success(`Purchased ${q} ${product.unit} of ${product.productName}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }}>
        <div className="modal-title">Simulate Buy Product</div>
        <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 16 }}>
          <strong>{product.productName}</strong> — ₹{product.price} per {product.unit}<br />
          Available: <strong>{product.quantity} {product.unit}</strong>
        </p>
        <input
          className="form-input" type="number" placeholder="Enter quantity"
          value={qty} onChange={e => setQty(e.target.value)}
          style={{ textAlign: 'center', marginBottom: 14 }} min={1} max={product.quantity}
        />
        {qty && (
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 14 }}>
            Total: ₹{(parseFloat(qty) * product.price).toFixed(2)}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-sm btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-sm btn-dark" onClick={handleBuy} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Buy'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showAddType, setShowAddType] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [buyProduct, setBuyProduct] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getAll({ page, limit: 10, search });
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const { data } = await productAPI.getInventorySummary();
      setSummary(data.summary);
    } catch {}
  };

  const refresh = () => { fetchProducts(); fetchSummary(); };

  const s = summary || {};

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <span className="page-header-title">Product</span>
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Search here..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="page-body">
          {/* Overall Inventory */}
          <div className="card mb-4" style={{ marginBottom: 20 }}>
            <div className="overview-section-title">Overall Inventory</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              {[
                { title: 'Categories', value: s.categoriesCount || 0, sub1: 'Last 7 days', sub2: `${s.newProductsCount || 0}`, sub3: 'Revenue', sub4: `₹${s.totalRevenue || 0}` },
                { title: 'Total Products', value: s.totalProducts || 0, sub1: 'Last 7 days', sub2: `${s.newProductsCount || 0}`, sub3: 'Revenue', sub4: `₹${s.totalRevenue || 0}` },
                { title: 'Top Selling', value: s.topSellingCount || 0, sub1: 'Last 7 days', sub2: `Cost`, sub3: '', sub4: `₹${s.topSellingRevenue || 0}` },
                { title: 'Low Stocks', value: s.lowStockCount || 0, sub1: 'Ordered', sub2: `${s.lowStockCount || 0}`, sub3: 'Not in stock', sub4: `${s.outOfStockCount || 0}` },
              ].map((item, i) => (
                <div key={i} style={{ padding: '0 20px', borderRight: i < 3 ? '1px solid #e5e7eb' : 'none' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1d2e', marginBottom: 8 }}>{item.value}</div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{item.sub1}</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.sub2}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{item.sub3}</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.sub4}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Products Table */}
          <div className="table-container">
            <div className="table-header">
              <span className="table-title">Products</span>
              <button className="btn-sm btn-dark" onClick={() => setShowAddType(true)}>+ Add Product</button>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Products</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Threshold Value</th>
                    <th>Expiry Date</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>No products found. Add your first product!</td></tr>
                  ) : products.map(p => (
                    <tr key={p._id} onClick={() => setBuyProduct(p)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {p.image ? (
                            <img src={`http://localhost:5000${p.image}`} alt={p.productName} className="product-img" />
                          ) : (
                            <div className="product-img-placeholder">📦</div>
                          )}
                          <span style={{ fontWeight: 500 }}>{p.productName}</span>
                        </div>
                      </td>
                      <td>₹{p.price}</td>
                      <td>{p.quantity} {p.unit}</td>
                      <td>{p.thresholdValue}</td>
                      <td>{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[p.status] || 'badge-blue'}`}>
                          {p.status}
                        </span>
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

      {showAddType && (
        <AddTypeModal
          onClose={() => setShowAddType(false)}
          onSelect={(type) => {
            setShowAddType(false);
            if (type === 'individual') setShowAddModal(true);
            else setShowCSV(true);
          }}
        />
      )}
      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onSuccess={refresh} />}
      {showCSV && <CSVUploadModal onClose={() => setShowCSV(false)} onSuccess={refresh} />}
      {buyProduct && <BuyModal product={buyProduct} onClose={() => setBuyProduct(null)} onSuccess={refresh} />}
    </div>
  );
}

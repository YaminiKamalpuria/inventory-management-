import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    password: '',
    confirmPassword: '',
  });
  const [showP, setShowP] = useState(false);
  const [showCP, setShowCP] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const payload = { firstName: form.firstName, lastName: form.lastName };
      if (form.password) {
        payload.password = form.password;
        payload.confirmPassword = form.confirmPassword;
      }
      const { data } = await authAPI.updateProfile(payload);
      updateUser(data.user);
      toast.success('Profile updated!');
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <span className="page-header-title">Home</span>
        </div>

        <div className="page-body">
          <div className="settings-card">
            <div className="settings-tab">Edit Profile</div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">First name</label>
                <input
                  className="form-input" type="text" value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  style={{ maxWidth: 400 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last name</label>
                <input
                  className="form-input" type="text" value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                  style={{ maxWidth: 400 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input" type="email" value={user?.email || ''}
                  disabled
                  style={{ maxWidth: 400, opacity: 0.6, cursor: 'not-allowed', background: '#f4f5f7' }}
                />
                <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>Email cannot be changed</p>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper" style={{ maxWidth: 400 }}>
                  <input
                    className="form-input" type={showP ? 'text' : 'password'}
                    placeholder="Leave blank to keep current password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowP(!showP)}>
                    {showP ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper" style={{ maxWidth: 400 }}>
                  <input
                    className="form-input" type={showCP ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowCP(!showCP)}>
                    {showCP ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 700 }}>
                <button type="submit" className="btn-sm btn-dark" disabled={loading} style={{ padding: '10px 28px' }}>
                  {loading ? <span className="spinner" /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

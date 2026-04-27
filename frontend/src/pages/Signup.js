import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.signup(form);
      login(data.token, data.user);
      toast.success('Account created!');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Start inventory management.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" type="text" placeholder="Name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="example@email.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Create Password</label>
            <div className="input-wrapper">
              <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="at least 8 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <button type="button" className="input-toggle" onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <input className="form-input" type={showConfirm ? 'text' : 'password'} placeholder="at least 8 characters"
                value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
              <button type="button" className="input-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign up'}
          </button>
        </form>

        <p className="auth-link">
          Do you have an account? <Link to="/">Sign in</Link>
        </p>
      </div>

      <div className="auth-right">
        <div className="auth-right-blob" />
        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <h2 className="auth-right-title">Welcome to<br /><span>StockSense</span></h2>
          <div style={{ fontSize: '8rem', lineHeight: 1 }}>📈</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: 16 }}>
            Join thousands of businesses managing inventory smarter
          </p>
        </div>
      </div>
    </div>
  );
}

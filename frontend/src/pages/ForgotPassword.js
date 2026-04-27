import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showP1, setShowP1] = useState(false);
  const [showP2, setShowP2] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendMail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword(email);
      if (data.otp) setDevOtp(data.otp); // dev mode
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email not found');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.verifyOTP({ email, otp });
      toast.success('OTP verified');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp, ...passwords });
      toast.success('Password reset successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        {step === 1 && (
          <>
            <h1 className="auth-title">Company name</h1>
            <p className="auth-subtitle">Please enter your registered email ID to receive an OTP</p>
            <form onSubmit={handleSendMail}>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input className="form-input" type="email" placeholder="Enter your registered email"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Send Mail'}
              </button>
            </form>
            <p className="auth-link"><Link to="/">Back to Login</Link></p>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="auth-title">Enter Your OTP</h1>
            <p className="auth-subtitle">We've sent a 6-digit OTP to your registered mail.<br />Please enter it below to sign in.</p>
            {devOtp && (
              <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: '0.8rem' }}>
                Dev OTP: <strong>{devOtp}</strong>
              </div>
            )}
            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label className="form-label">OTP</label>
                <input className="form-input otp-input" type="text" placeholder="xxxxxx" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value)} required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Confirm'}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="auth-title">Create New Password</h1>
            <p className="auth-subtitle">Today is a new day. It's your day. You shape it.<br />Sign in to start managing your projects.</p>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">Enter New Password</label>
                <div className="input-wrapper">
                  <input className="form-input" type={showP1 ? 'text' : 'password'} placeholder="at least 8 characters"
                    value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} required />
                  <button type="button" className="input-toggle" onClick={() => setShowP1(!showP1)}>{showP1 ? '🙈' : '👁'}</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <input className="form-input" type={showP2 ? 'text' : 'password'} placeholder="at least 8 characters"
                    value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} required />
                  <button type="button" className="input-toggle" onClick={() => setShowP2(!showP2)}>{showP2 ? '🙈' : '👁'}</button>
                </div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>

      <div className="auth-right">
        <div className="auth-right-blob" />
        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '8rem', lineHeight: 1 }}>
            {step === 1 ? '💌' : step === 2 ? '🚀' : '🔒'}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: 16 }}>
            {step === 1 ? 'Enter your email to get started' : step === 2 ? 'Check your inbox for the OTP' : 'Almost there!'}
          </p>
        </div>
      </div>
    </div>
  );
}

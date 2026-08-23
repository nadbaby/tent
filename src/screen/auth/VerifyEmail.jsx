import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import './auth.css';

const VerifyEmail = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect to login after 10 seconds
    const timer = setTimeout(() => {
      navigate('/login');
    }, 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="auth-wrapper" style={{ justifyContent: 'center', alignItems: 'center', padding: '1.25rem' }}>
      <div className="auth-card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6'
          }}>
            <Mail size={40} />
          </div>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>
          Check Your Email
        </h2>

        <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '24px' }}>
          We've sent a verification link to your email address. Please click the link to verify your account.
        </p>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '32px',
          textAlign: 'left'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} /> Pro Tips:
          </h4>
          <ul style={{ fontSize: '13px', color: '#64748b', paddingLeft: '20px', margin: 0 }}>
            <li>Check your <b>Spam</b> or <b>Junk</b> folder if you don't see it.</li>
            <li>The link expires in 24 hours.</li>
            <li>Make sure you use the same browser to click the link.</li>
          </ul>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="btn-submit"
          style={{ width: '100%', marginBottom: '16px' }}
        >
          Go to Login
        </button>

        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Didn't receive the email? Try again
        </button>

        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '24px' }}>
          Redirecting to login page in 10 seconds...
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;

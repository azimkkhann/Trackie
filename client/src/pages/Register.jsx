import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Please fill in all required fields'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xl)', color: 'var(--color-accent)' }}>◆</span>
            <h1 style={{ fontSize: 'var(--text-xl)' }}>Create Account</h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>Start tracking your expenses</p>
        </div>

        {error && (
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-negative-bg)', border: '1px solid var(--color-negative-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-negative)' }} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Full Name" value={form.name} onChange={update('name')} placeholder="Your name" required />
          <Input label="Email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required />
          <Input label="Phone Number" type="tel" value={form.phone} onChange={update('phone')} placeholder="9876543210" />
          <Input label="Password" type="password" value={form.password} onChange={update('password')} placeholder="At least 6 characters" required hint="Minimum 6 characters" />
          <Button type="submit" variant="primary" fullWidth loading={loading}>Create Account</Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-5)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 'var(--weight-medium)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

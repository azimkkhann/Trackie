import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { toast } from '../components/ui/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
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
            <h1 style={{ fontSize: 'var(--text-xl)' }}>Expense Manager</h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-negative-bg)', border: '1px solid var(--color-negative-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-negative)' }} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="demo@example.com" required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
          <Button type="submit" variant="primary" fullWidth loading={loading}>Sign in</Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-5)' }}>
          No account? <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 'var(--weight-medium)' }}>Create one</Link>
        </p>

        <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
          Demo: demo@example.com / demo1234
        </div>
      </div>
    </div>
  );
}

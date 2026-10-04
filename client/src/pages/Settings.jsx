import { useState, useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Settings.css';

export default function Settings({ onMenuClick }) {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currency, setCurrency] = useState(user?.currency || '₹');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const data = await authAPI.updateProfile({ name, phone, currency });
      updateUser(data.user);
      toast('Profile updated', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { toast('Fill in both fields', 'error'); return; }
    if (newPassword.length < 6) { toast('New password must be at least 6 characters', 'error'); return; }
    setSavingPw(true);
    try {
      await authAPI.updateProfile({ currentPassword, newPassword });
      toast('Password changed', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="app-main">
      <TopBar title="Settings" onMenuClick={onMenuClick} />

      <div className="page-content">
        <div className="settings-layout">
          <div className="settings-section">
            <h3 className="settings-section-title">Profile</h3>
            <div className="settings-form">
              <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
              <Input label="Email" value={user?.email || ''} disabled hint="Email cannot be changed" />
              <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
              <div className="input-group">
                <label className="input-label">Currency Symbol</label>
                <select className="input-field select-field" value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="₹">₹ (INR)</option>
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                </select>
              </div>
              <Button variant="primary" onClick={handleSaveProfile} loading={saving}>Save Profile</Button>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Change Password</h3>
            <div className="settings-form">
              <Input label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} hint="Minimum 6 characters" />
              <Button variant="secondary" onClick={handleChangePassword} loading={savingPw}>Change Password</Button>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Account</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
            </p>
            <Button variant="ghost" onClick={logout} style={{ color: 'var(--color-negative)' }}>Sign Out</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

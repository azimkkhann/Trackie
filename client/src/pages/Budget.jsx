import { useState, useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from '../components/ui/Toast';
import { budgetAPI } from '../services/api';
import { formatCurrency, getCurrentMonth, getMonthOptions, getMonthLabel } from '../utils/helpers';
import './Budget.css';

export default function Budget({ onMenuClick }) {
  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const result = await budgetAPI.get(month);
      setData(result.summary);
      setBudgetInput(result.summary.budget_amount > 0 ? String(result.summary.budget_amount) : '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBudget(); }, [month]);

  const handleSave = async () => {
    const amount = parseFloat(budgetInput);
    if (!amount || amount <= 0) { toast('Enter a valid budget amount', 'error'); return; }
    setSaving(true);
    try {
      const result = await budgetAPI.set(month, amount);
      setData(result.summary);
      toast(result.message, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const pct = data?.percentage || 0;
  const status = data?.status || 'no_budget';

  return (
    <div className="app-main">
      <TopBar title="Budget" subtitle={getMonthLabel(month)} onMenuClick={onMenuClick}>
        <select className="month-select" value={month} onChange={e => setMonth(e.target.value)}>
          {getMonthOptions(12).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </TopBar>

      <div className="page-content">
        <div className="budget-layout">
          {/* Set Budget */}
          <div className="budget-set-card">
            <h3 className="chart-title">Set Monthly Budget</h3>
            <div className="budget-input-row">
              <Input type="number" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} placeholder="15000" prefix="₹" min="1" />
              <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
            </div>
          </div>

          {/* Budget Status */}
          {data && data.budget_amount > 0 && (
            <div className={`budget-status-card budget-status-${status}`}>
              <div className="budget-status-header">
                <span className="budget-status-label">
                  {status === 'healthy' && '✓ On Track'}
                  {status === 'warning' && '⚠ Approaching Limit'}
                  {status === 'exceeded' && '✕ Budget Exceeded'}
                </span>
                <span className="budget-status-pct">{pct}%</span>
              </div>

              <div className="budget-progress-track">
                <div className={`budget-progress-fill budget-fill-${status}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>

              <div className="budget-stats">
                <div className="budget-stat">
                  <span className="budget-stat-label">Budget</span>
                  <span className="budget-stat-value currency-value">{formatCurrency(data.budget_amount)}</span>
                </div>
                <div className="budget-stat">
                  <span className="budget-stat-label">Spent</span>
                  <span className="budget-stat-value currency-value">{formatCurrency(data.total_spent)}</span>
                </div>
                <div className="budget-stat">
                  <span className="budget-stat-label">{data.remaining >= 0 ? 'Remaining' : 'Over by'}</span>
                  <span className={`budget-stat-value currency-value ${data.remaining >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {formatCurrency(Math.abs(data.remaining))}
                  </span>
                </div>
              </div>

              {status === 'warning' && (
                <p className="budget-alert budget-alert-warning">You've used {pct}% of your budget. Consider slowing down your spending.</p>
              )}
              {status === 'exceeded' && (
                <p className="budget-alert budget-alert-exceeded">You've exceeded your budget by {formatCurrency(Math.abs(data.remaining))}.</p>
              )}
            </div>
          )}

          {data && data.budget_amount === 0 && !loading && (
            <div className="budget-empty">
              <p>No budget set for {getMonthLabel(month)}.</p>
              <p className="text-tertiary">Set a monthly budget above to start tracking your spending limits.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

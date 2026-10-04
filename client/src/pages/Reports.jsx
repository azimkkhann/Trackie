import { useState, useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';
import { reportAPI, categoryAPI } from '../services/api';
import { formatCurrency, getCurrentMonth, getMonthOptions, getMonthLabel } from '../utils/helpers';
import './Reports.css';

export default function Reports({ onMenuClick }) {
  const [month, setMonth] = useState(getCurrentMonth());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryAPI.list().then(d => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { month };
    if (categoryFilter) params.category_id = categoryFilter;
    reportAPI.generate(params).then(d => setReport(d.report)).catch(console.error).finally(() => setLoading(false));
  }, [month, categoryFilter]);

  const handleExport = async () => {
    try {
      await reportAPI.export(month);
      toast('Report exported', 'success');
    } catch (err) {
      toast('Export failed', 'error');
    }
  };

  return (
    <div className="app-main">
      <TopBar title="Reports" subtitle={getMonthLabel(month)} onMenuClick={onMenuClick}>
        <select className="month-select" value={month} onChange={e => setMonth(e.target.value)}>
          {getMonthOptions(12).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select className="month-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <Button variant="secondary" size="sm" onClick={handleExport}>Export CSV</Button>
      </TopBar>

      <div className="page-content">
        {loading ? (
          <div className="expenses-loading">Generating report...</div>
        ) : !report || report.transaction_count === 0 ? (
          <EmptyState title="No data for this period" description="Try selecting a different month or category." icon="▧" />
        ) : (
          <div className="report-layout">
            {/* Summary */}
            <div className="report-summary">
              <div className="report-summary-row">
                <span className="report-label">Total Spent</span>
                <span className="report-value currency-value">{formatCurrency(report.total_spent)}</span>
              </div>
              <div className="report-summary-row">
                <span className="report-label">Total Income</span>
                <span className="report-value currency-value text-positive">{formatCurrency(report.total_income)}</span>
              </div>
              <div className="report-summary-row">
                <span className="report-label">Savings</span>
                <span className={`report-value currency-value ${report.savings >= 0 ? 'text-positive' : 'text-negative'}`}>{formatCurrency(report.savings)}</span>
              </div>
              <div className="report-summary-row">
                <span className="report-label">Transactions</span>
                <span className="report-value">{report.transaction_count}</span>
              </div>
              {report.budget_amount > 0 && (
                <div className="report-summary-row">
                  <span className="report-label">Budget Status</span>
                  <span className={`report-value ${report.budget_status === 'exceeded' ? 'text-negative' : report.budget_status === 'warning' ? 'text-warning' : 'text-positive'}`}>
                    {report.budget_status === 'exceeded' ? 'Exceeded' : report.budget_status === 'warning' ? 'Near Limit' : 'On Track'}
                  </span>
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            {report.category_breakdown?.length > 0 && (
              <div className="report-section">
                <h3 className="chart-title">Category Breakdown</h3>
                <div className="report-cat-list">
                  {report.category_breakdown.map(cat => (
                    <div key={cat.name} className="report-cat-row">
                      <span className="report-cat-icon" style={{ color: cat.color }}>{cat.icon}</span>
                      <span className="report-cat-name">{cat.name}</span>
                      <div className="report-cat-bar-track">
                        <div className="report-cat-bar-fill" style={{ width: `${cat.percentage}%`, background: cat.color }} />
                      </div>
                      <span className="report-cat-pct">{cat.percentage}%</span>
                      <span className="report-cat-amt currency-value">{formatCurrency(cat.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {report.payment_methods?.length > 0 && (
              <div className="report-section">
                <h3 className="chart-title">Payment Methods</h3>
                <div className="report-cat-list">
                  {report.payment_methods.map(pm => (
                    <div key={pm.method} className="report-cat-row">
                      <span className="report-cat-name">{pm.method}</span>
                      <span className="report-cat-pct">{pm.count} txns</span>
                      <span className="report-cat-amt currency-value">{formatCurrency(pm.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

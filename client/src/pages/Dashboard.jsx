import { useState, useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ExpenseForm from '../components/ExpenseForm';
import { analyticsAPI, expenseAPI } from '../services/api';
import { formatCurrency, getCurrentMonth, getMonthLabel, getMonthOptions, formatDateShort } from '../utils/helpers';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import './Dashboard.css';

export default function Dashboard({ onMenuClick }) {
  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summary, expensesData] = await Promise.all([
        analyticsAPI.summary(month),
        expenseAPI.list({ month, limit: 5, sort: 'date_desc' }),
      ]);
      setData(summary);
      setRecentExpenses(expensesData.expenses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [month]);

  const COLORS = ['#e67e22', '#3498db', '#9b59b6', '#e74c3c', '#2ecc71', '#95a5a6', '#f39c12', '#1abc9c'];

  const budgetPercentage = data?.budget_percentage || 0;
  const budgetStatus = budgetPercentage >= 100 ? 'exceeded' : budgetPercentage >= 80 ? 'warning' : 'healthy';

  if (loading && !data) {
    return (
      <div className="app-main">
        <TopBar title="Overview" onMenuClick={onMenuClick} />
        <div className="page-content">
          <div className="dashboard-loading">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-main">
      <TopBar title="Overview" subtitle={getMonthLabel(month)} onMenuClick={onMenuClick}>
        <select className="month-select" value={month} onChange={e => setMonth(e.target.value)}>
          {getMonthOptions(6).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>+ Add Expense</Button>
      </TopBar>

      <div className="page-content">
        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Total Spent</span>
            <span className="kpi-value currency-value text-negative">{formatCurrency(data?.total_spent)}</span>
            <span className="kpi-meta">{data?.transaction_count || 0} transactions</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Total Income</span>
            <span className="kpi-value currency-value text-positive">{formatCurrency(data?.total_income)}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Balance</span>
            <span className={`kpi-value currency-value ${(data?.balance || 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(data?.balance)}
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Budget</span>
            <span className="kpi-value currency-value">{data?.budget ? formatCurrency(data.budget) : 'Not set'}</span>
            {data?.budget > 0 && (
              <div className="kpi-budget-bar">
                <div className={`kpi-budget-fill kpi-budget-${budgetStatus}`} style={{ width: `${Math.min(budgetPercentage, 100)}%` }} />
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Spending Trend */}
          <div className="chart-card">
            <h3 className="chart-title">Daily Spending</h3>
            {data?.daily_spending?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.daily_spending}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={d => formatDateShort(d)} tick={{ fontSize: 11, fill: '#8a877e' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8a877e' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} width={45} />
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Spent']} labelFormatter={d => formatDateShort(d)} contentStyle={{ fontSize: 13, borderRadius: 6, border: '1px solid #e0ddd6' }} />
                  <Area type="monotone" dataKey="total" stroke="var(--color-accent)" fill="url(#spendGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No spending data" description="Add expenses to see your spending trend" />}
          </div>

          {/* Category Distribution */}
          <div className="chart-card">
            <h3 className="chart-title">By Category</h3>
            {data?.category_breakdown?.length > 0 ? (
              <div className="category-chart-wrapper">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.category_breakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="total" nameKey="name">
                      {data.category_breakdown.map((entry, i) => <Cell key={entry.id} fill={entry.color || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: 13, borderRadius: 6, border: '1px solid #e0ddd6' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="category-legend">
                  {data.category_breakdown.map((cat, i) => (
                    <div key={cat.id} className="category-legend-item">
                      <span className="category-legend-dot" style={{ background: cat.color || COLORS[i % COLORS.length] }} />
                      <span className="category-legend-name">{cat.name}</span>
                      <span className="category-legend-pct">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <EmptyState title="No categories yet" description="Start adding expenses to see distribution" />}
          </div>
        </div>

        {/* Highest Category + Recent */}
        <div className="dashboard-grid">
          {data?.highest_category && (
            <div className="insight-card">
              <span className="insight-icon" style={{ color: data.highest_category.color }}>{data.highest_category.icon}</span>
              <div className="insight-body">
                <span className="insight-label">Highest spending category</span>
                <span className="insight-value">{data.highest_category.name} — {formatCurrency(data.highest_category.total)}</span>
                <span className="insight-detail">{data.highest_category.percentage}% of total spending this month</span>
              </div>
            </div>
          )}

          <div className="recent-card">
            <div className="recent-header">
              <h3 className="chart-title">Recent Expenses</h3>
            </div>
            {recentExpenses.length > 0 ? (
              <div className="recent-list">
                {recentExpenses.map(exp => (
                  <div key={exp.id} className="recent-item">
                    <span className="recent-icon" style={{ color: exp.category_color }}>{exp.category_icon}</span>
                    <div className="recent-info">
                      <span className="recent-desc">{exp.description}</span>
                      <span className="recent-date">{formatDateShort(exp.date)}</span>
                    </div>
                    <span className="recent-amount currency-value">{formatCurrency(exp.amount)}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No expenses yet" />}
          </div>
        </div>
      </div>

      <ExpenseForm isOpen={showForm} onClose={() => setShowForm(false)} onSaved={fetchData} />
    </div>
  );
}

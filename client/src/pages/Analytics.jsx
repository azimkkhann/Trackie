import { useState, useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import EmptyState from '../components/ui/EmptyState';
import { analyticsAPI } from '../services/api';
import { formatCurrency, getCurrentMonth, getMonthOptions, getMonthLabel } from '../utils/helpers';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import './Analytics.css';

export default function Analytics({ onMenuClick }) {
  const [month, setMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsAPI.summary(month),
      analyticsAPI.trend(6),
      analyticsAPI.comparison(month),
    ]).then(([s, t, c]) => {
      setSummary(s);
      setTrend(t.trend);
      setComparison(c);
    }).catch(console.error).finally(() => setLoading(false));
  }, [month]);

  const COLORS = ['#e67e22', '#3498db', '#9b59b6', '#e74c3c', '#2ecc71', '#95a5a6'];

  if (loading && !summary) {
    return (
      <div className="app-main">
        <TopBar title="Analytics" onMenuClick={onMenuClick} />
        <div className="page-content"><div className="expenses-loading">Loading analytics...</div></div>
      </div>
    );
  }

  const insights = [];
  if (summary?.highest_category) {
    insights.push(`${summary.highest_category.icon} ${summary.highest_category.name} accounts for ${summary.highest_category.percentage}% of your spending this month.`);
  }
  if (comparison?.change_percentage !== 0 && comparison?.previous?.spent > 0) {
    const dir = comparison.change_direction === 'increase' ? 'more' : 'less';
    insights.push(`You spent ${Math.abs(comparison.change_percentage)}% ${dir} than last month.`);
  }
  if (summary?.budget > 0) {
    const pct = summary.budget_percentage;
    if (pct >= 100) insights.push(`⚠ You've exceeded your monthly budget by ${formatCurrency(summary.total_spent - summary.budget)}.`);
    else if (pct >= 80) insights.push(`Budget is ${pct}% used — approaching the limit.`);
    else insights.push(`Budget is ${pct}% used — you're on track.`);
  }

  return (
    <div className="app-main">
      <TopBar title="Analytics" subtitle={getMonthLabel(month)} onMenuClick={onMenuClick}>
        <select className="month-select" value={month} onChange={e => setMonth(e.target.value)}>
          {getMonthOptions(12).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </TopBar>

      <div className="page-content">
        {/* Insights */}
        {insights.length > 0 && (
          <div className="analytics-insights">
            {insights.map((text, i) => <p key={i} className="analytics-insight">{text}</p>)}
          </div>
        )}

        <div className="analytics-grid">
          {/* Spending Trend (6 months) */}
          <div className="chart-card analytics-wide">
            <h3 className="chart-title">Spending Trend</h3>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0ddd6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a877e' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8a877e' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} width={50} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: 13, borderRadius: 6, border: '1px solid #e0ddd6' }} />
                  <Bar dataKey="spent" fill="var(--color-accent)" radius={[4, 4, 0, 0]} name="Spent" />
                  <Bar dataKey="income" fill="var(--color-positive)" radius={[4, 4, 0, 0]} name="Income" opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No trend data" />}
          </div>

          {/* Category Distribution */}
          <div className="chart-card">
            <h3 className="chart-title">Category Breakdown</h3>
            {summary?.category_breakdown?.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={summary.category_breakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={2} dataKey="total" nameKey="name">
                      {summary.category_breakdown.map((entry, i) => <Cell key={entry.id} fill={entry.color || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: 13, borderRadius: 6, border: '1px solid #e0ddd6' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="analytics-cat-list">
                  {summary.category_breakdown.map((cat, i) => (
                    <div key={cat.id} className="analytics-cat-row">
                      <span className="category-legend-dot" style={{ background: cat.color || COLORS[i % COLORS.length] }} />
                      <span className="analytics-cat-name">{cat.icon} {cat.name}</span>
                      <span className="analytics-cat-amt currency-value">{formatCurrency(cat.total)}</span>
                      <span className="analytics-cat-pct">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <EmptyState title="No data" />}
          </div>

          {/* Monthly Comparison */}
          <div className="chart-card">
            <h3 className="chart-title">vs Last Month</h3>
            {comparison && (
              <div className="comparison-cards">
                <div className="comparison-item">
                  <span className="comparison-label">This month</span>
                  <span className="comparison-value currency-value">{formatCurrency(comparison.current.spent)}</span>
                </div>
                <div className="comparison-item">
                  <span className="comparison-label">Last month</span>
                  <span className="comparison-value currency-value">{formatCurrency(comparison.previous.spent)}</span>
                </div>
                <div className={`comparison-change ${comparison.change_direction === 'increase' ? 'text-negative' : comparison.change_direction === 'decrease' ? 'text-positive' : ''}`}>
                  {comparison.change_direction === 'increase' ? '↑' : comparison.change_direction === 'decrease' ? '↓' : '→'} {Math.abs(comparison.change_percentage)}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

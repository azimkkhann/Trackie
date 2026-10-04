import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ExpenseForm from '../components/ExpenseForm';
import { toast } from '../components/ui/Toast';
import { expenseAPI, categoryAPI } from '../services/api';
import { formatCurrency, formatDate, getCurrentMonth, getMonthOptions, debounce } from '../utils/helpers';
import './Expenses.css';

export default function Expenses({ onMenuClick }) {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getCurrentMonth());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useCallback(debounce((val) => setSearchQuery(val), 300), []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { month, sort: 'date_desc' };
      if (categoryFilter) params.category_id = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      const data = await expenseAPI.list(params);
      setExpenses(data.expenses);
      setTotal(data.total);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoryAPI.list().then(d => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => { fetchExpenses(); }, [month, categoryFilter, searchQuery]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await expenseAPI.delete(deleteTarget.id);
      toast('Expense deleted', 'success');
      setDeleteTarget(null);
      fetchExpenses();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="app-main">
      <TopBar title="Expenses" subtitle={`${total} transactions`} onMenuClick={onMenuClick}>
        <Button variant="primary" size="sm" onClick={() => { setEditExpense(null); setShowForm(true); }}>+ Add Expense</Button>
      </TopBar>

      <div className="page-content">
        {/* Filters */}
        <div className="expenses-filters">
          <select className="month-select" value={month} onChange={e => setMonth(e.target.value)}>
            {getMonthOptions(12).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select className="month-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <input
            type="search"
            className="expense-search"
            placeholder="Search expenses..."
            value={search}
            onChange={e => { setSearch(e.target.value); debouncedSearch(e.target.value); }}
          />
          {totalAmount > 0 && (
            <div className="expenses-total">
              <span className="expenses-total-label">Total:</span>
              <span className="expenses-total-value currency-value">{formatCurrency(totalAmount)}</span>
            </div>
          )}
        </div>

        {/* Expense Table */}
        {loading ? (
          <div className="expenses-loading">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No expenses found"
            description={searchQuery ? 'Try a different search term.' : 'Add your first expense to start tracking your spending.'}
            action={!searchQuery ? 'Add Expense' : undefined}
            onAction={!searchQuery ? () => setShowForm(true) : undefined}
            icon="↗"
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="expense-table-wrap">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Payment</th>
                    <th className="text-right">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id} className="expense-row">
                      <td className="expense-date">{formatDate(exp.date)}</td>
                      <td>
                        <div className="expense-desc">{exp.description}</div>
                        {exp.notes && <div className="expense-notes">{exp.notes}</div>}
                      </td>
                      <td>
                        <span className="expense-category" style={{ color: exp.category_color }}>
                          {exp.category_icon} {exp.category_name}
                        </span>
                      </td>
                      <td className="expense-method">{exp.payment_method}</td>
                      <td className="expense-amount currency-value text-right">{formatCurrency(exp.amount)}</td>
                      <td className="expense-actions">
                        <button className="expense-action-btn" onClick={() => { setEditExpense(exp); setShowForm(true); }} title="Edit">✎</button>
                        <button className="expense-action-btn expense-action-delete" onClick={() => setDeleteTarget(exp)} title="Delete">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="expense-cards">
              {expenses.map(exp => (
                <div key={exp.id} className="expense-card-item">
                  <div className="expense-card-top">
                    <span className="expense-category" style={{ color: exp.category_color }}>{exp.category_icon} {exp.category_name}</span>
                    <span className="expense-amount currency-value">{formatCurrency(exp.amount)}</span>
                  </div>
                  <div className="expense-card-desc">{exp.description}</div>
                  <div className="expense-card-bottom">
                    <span className="expense-date">{formatDate(exp.date)} · {exp.payment_method}</span>
                    <div className="expense-card-actions">
                      <button className="expense-action-btn" onClick={() => { setEditExpense(exp); setShowForm(true); }}>✎</button>
                      <button className="expense-action-btn expense-action-delete" onClick={() => setDeleteTarget(exp)}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ExpenseForm isOpen={showForm} onClose={() => { setShowForm(false); setEditExpense(null); }} onSaved={fetchExpenses} expense={editExpense} />
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Expense" message={`Delete "${deleteTarget?.description}" (${formatCurrency(deleteTarget?.amount)})?`} loading={deleting} />
    </div>
  );
}

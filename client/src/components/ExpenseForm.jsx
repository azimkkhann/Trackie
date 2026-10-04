import { useState, useEffect } from 'react';
import Modal from '../components/ui/Modal';
import Input, { Select, Textarea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { expenseAPI, categoryAPI } from '../services/api';
import { getTodayISO } from '../utils/helpers';

export default function ExpenseForm({ isOpen, onClose, onSaved, expense = null }) {
  const isEdit = !!expense;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    category_id: '',
    description: '',
    date: getTodayISO(),
    payment_method: 'UPI',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      categoryAPI.list().then(data => setCategories(data.categories)).catch(() => {});
      if (expense) {
        setForm({
          amount: String(expense.amount),
          category_id: String(expense.category_id),
          description: expense.description,
          date: expense.date,
          payment_method: expense.payment_method || 'Cash',
          notes: expense.notes || '',
        });
      } else {
        setForm({ amount: '', category_id: '', description: '', date: getTodayISO(), payment_method: 'UPI', notes: '' });
      }
      setErrors({});
    }
  }, [isOpen, expense]);

  const update = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Amount must be greater than zero';
    if (!form.category_id) errs.category_id = 'Select a category';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.date) errs.date = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), category_id: parseInt(form.category_id) };
      if (isEdit) {
        await expenseAPI.update(expense.id, payload);
        toast('Expense updated', 'success');
      } else {
        await expenseAPI.create(payload);
        toast('Expense added', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Expense' : 'Add Expense'} size="md">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input label="Amount" type="number" value={form.amount} onChange={update('amount')} placeholder="0" prefix="₹" step="1" min="1" error={errors.amount} required />
        <Select label="Category" value={form.category_id} onChange={update('category_id')} error={errors.category_id} required>
          <option value="">Select category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </Select>
        <Input label="Description" value={form.description} onChange={update('description')} placeholder="What was this expense for?" error={errors.description} required maxLength={200} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <Input label="Date" type="date" value={form.date} onChange={update('date')} error={errors.date} required />
          <Select label="Payment Method" value={form.payment_method} onChange={update('payment_method')}>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Net Banking">Net Banking</option>
          </Select>
        </div>
        <Textarea label="Notes" value={form.notes} onChange={update('notes')} placeholder="Optional notes..." rows={2} maxLength={500} />
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Add Expense'}</Button>
        </div>
      </form>
    </Modal>
  );
}

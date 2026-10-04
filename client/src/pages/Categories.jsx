import { useState, useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { toast } from '../components/ui/Toast';
import { categoryAPI } from '../services/api';
import './Categories.css';

export default function Categories({ onMenuClick }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [deleteCat, setDeleteCat] = useState(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('📁');
  const [formColor, setFormColor] = useState('#6c757d');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.list();
      setCategories(data.categories);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openEdit = (cat) => {
    setEditCat(cat);
    setFormName(cat.name);
    setFormIcon(cat.icon || '📁');
    setFormColor(cat.color || '#6c757d');
  };

  const openAdd = () => {
    setShowAdd(true);
    setFormName('');
    setFormIcon('📁');
    setFormColor('#6c757d');
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      if (editCat) {
        await categoryAPI.update(editCat.id, { name: formName, icon: formIcon, color: formColor });
        toast('Category updated', 'success');
        setEditCat(null);
      } else {
        await categoryAPI.create({ name: formName, icon: formIcon, color: formColor });
        toast('Category created', 'success');
        setShowAdd(false);
      }
      fetchCategories();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCat) return;
    setDeleting(true);
    try {
      await categoryAPI.delete(deleteCat.id);
      toast('Category deleted', 'success');
      setDeleteCat(null);
      fetchCategories();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app-main">
      <TopBar title="Categories" subtitle={`${categories.length} categories`} onMenuClick={onMenuClick}>
        <Button variant="primary" size="sm" onClick={openAdd}>+ Add Category</Button>
      </TopBar>

      <div className="page-content">
        <div className="categories-grid">
          {categories.map(cat => (
            <div key={cat.id} className="category-card">
              <div className="category-card-icon" style={{ background: cat.color + '18', color: cat.color }}>{cat.icon}</div>
              <div className="category-card-info">
                <span className="category-card-name">{cat.name}</span>
                <span className="category-card-count">{cat.expense_count || 0} expenses</span>
              </div>
              <div className="category-card-actions">
                <button className="expense-action-btn" onClick={() => openEdit(cat)} title="Edit">✎</button>
                {!cat.is_default && (
                  <button className="expense-action-btn expense-action-delete" onClick={() => setDeleteCat(cat)} title="Delete">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showAdd || !!editCat} onClose={() => { setShowAdd(false); setEditCat(null); }} title={editCat ? 'Edit Category' : 'Add Category'} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Category name" required maxLength={50} />
          <Input label="Icon (emoji)" value={formIcon} onChange={e => setFormIcon(e.target.value)} placeholder="📁" maxLength={4} />
          <div className="input-group">
            <label className="input-label">Color</label>
            <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} style={{ width: 48, height: 36, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={() => { setShowAdd(false); setEditCat(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>{editCat ? 'Save' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteCat}
        onClose={() => setDeleteCat(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={deleteCat?.expense_count > 0
          ? `"${deleteCat?.name}" has ${deleteCat?.expense_count} expenses. You must reassign them before deleting.`
          : `Delete the "${deleteCat?.name}" category?`}
        loading={deleting}
      />
    </div>
  );
}

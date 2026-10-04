import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', variant = 'danger', loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm'} size="sm">
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </div>
    </Modal>
  );
}

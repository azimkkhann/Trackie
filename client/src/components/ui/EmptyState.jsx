import Button from './Button';
import './EmptyState.css';

export default function EmptyState({ title, description, action, onAction, icon }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && onAction && (
        <Button variant="primary" size="md" onClick={onAction} className="empty-state-action">
          {action}
        </Button>
      )}
    </div>
  );
}

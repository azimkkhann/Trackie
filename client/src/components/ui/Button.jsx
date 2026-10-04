import { classNames } from '../../utils/helpers';
import './Button.css';

export default function Button({
  children, variant = 'primary', size = 'md', type = 'button',
  disabled = false, loading = false, fullWidth = false,
  onClick, className, ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classNames(
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth && 'btn-full',
        loading && 'btn-loading',
        className
      )}
      {...props}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

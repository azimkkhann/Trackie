import { useState } from 'react';
import './Input.css';

export default function Input({
  label, type = 'text', error, hint, id,
  value, onChange, required, disabled,
  prefix, suffix, className, ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className || ''}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {prefix && <span className="input-prefix">{prefix}</span>}
        <input
          id={inputId}
          type={inputType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className="input-field"
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            className="input-toggle-password"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? '◉' : '◎'}
          </button>
        )}
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
      {error && <p id={`${inputId}-error`} className="input-message input-message-error" role="alert">{error}</p>}
      {hint && !error && <p id={`${inputId}-hint`} className="input-message">{hint}</p>}
    </div>
  );
}

export function Select({ label, error, id, value, onChange, children, required, className, ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className || ''}`}>
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <select id={selectId} value={value} onChange={onChange} className="input-field select-field" required={required} {...props}>
        {children}
      </select>
      {error && <p className="input-message input-message-error" role="alert">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, id, value, onChange, required, className, ...props }) {
  const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className || ''}`}>
      {label && (
        <label htmlFor={textareaId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <textarea id={textareaId} value={value} onChange={onChange} className="input-field textarea-field" required={required} {...props} />
      {error && <p className="input-message input-message-error" role="alert">{error}</p>}
    </div>
  );
}

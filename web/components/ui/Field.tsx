'use client';
import { useState, InputHTMLAttributes } from 'react';
import Icon from '@/components/ui/Icon';

// Pill input with a left icon (and an eye toggle for passwords) — matches the design.
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  icon: string;
  label?: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
};

export default function Field({ icon, label, error, value, onChange, hint, type = 'text', ...rest }: Props) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const id = rest.id ?? rest.name ?? label ?? icon;
  return (
    <div>
      {label && (
        <label className="bb-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--bb-cyan)', display: 'flex' }}>
          <Icon name={icon} size={19} />
        </span>
        <input
          {...rest}
          id={id}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bb-input"
          style={{ paddingLeft: 44, paddingRight: isPassword ? 44 : undefined, borderRadius: 999, borderColor: error ? 'var(--bb-error)' : undefined }}
          aria-invalid={!!error}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', display: 'flex' }}
          >
            <Icon name={show ? 'eyeOff' : 'eye'} size={19} />
          </button>
        )}
      </div>
      {hint && !error && <p className="bb-small bb-muted" style={{ margin: '0.25rem 0 0 0.6rem' }}>{hint}</p>}
      {error && <p className="bb-field-error">{error}</p>}
    </div>
  );
}

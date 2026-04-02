import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, useState } from 'react';

/* ── §11 FORM ELEMENTS ───────────────────────────────────────────────── */

const inputBase: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-base)',
  color: 'var(--text-primary)',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-dim)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  transition: 'var(--transition-fast)',
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 'var(--space-1)',
};

// ─── Text Input ──────────────────────────────────────────────────────────
interface AdminInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixIcon?: React.ReactNode;
  required?: boolean;
}

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  ({ label, error, hint, prefixIcon, required, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <div style={{ marginBottom: 'var(--space-5)' }}>
        {label && (
          <label style={labelStyle}>
            {label}
            {required && <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span>}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          {prefixIcon && (
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}>
              {prefixIcon}
            </span>
          )}
          <input
            ref={ref}
            onFocus={e => { setFocused(true); props.onFocus?.(e); }}
            onBlur={e => { setFocused(false); props.onBlur?.(e); }}
            style={{
              ...inputBase,
              height: '38px',
              padding: prefixIcon ? '0 var(--space-3) 0 36px' : '0 var(--space-3)',
              ...(focused ? { borderColor: error ? 'var(--danger)' : 'var(--border-focus)', boxShadow: error ? 'var(--shadow-danger-glow)' : 'var(--shadow-glow)' } : {}),
              ...(error ? { borderColor: 'var(--danger)' } : {}),
              ...(props.disabled ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--bg-subtle)' } : {}),
              ...style,
            }}
            {...props}
          />
        </div>
        {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: 'var(--space-1)', animation: 'admin-fade-in 0.15s ease' }}>{error}</p>}
        {hint && !error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>{hint}</p>}
      </div>
    );
  }
);
AdminInput.displayName = 'AdminInput';

// ─── Select ──────────────────────────────────────────────────────────────
interface AdminSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  required?: boolean;
}

export const AdminSelect = forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ label, error, options, required, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <div style={{ marginBottom: 'var(--space-5)' }}>
        {label && (
          <label style={labelStyle}>
            {label}
            {required && <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          onFocus={e => { setFocused(true); props.onFocus?.(e); }}
          onBlur={e => { setFocused(false); props.onBlur?.(e); }}
          style={{
            ...inputBase,
            height: '38px',
            padding: '0 var(--space-3)',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23505A6E' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '36px',
            ...(focused ? { borderColor: 'var(--border-focus)', boxShadow: 'var(--shadow-glow)' } : {}),
            ...(error ? { borderColor: 'var(--danger)' } : {}),
            ...(props.disabled ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--bg-subtle)' } : {}),
            ...style,
          }}
          {...props}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: 'var(--space-1)' }}>{error}</p>}
      </div>
    );
  }
);
AdminSelect.displayName = 'AdminSelect';

// ─── Textarea ────────────────────────────────────────────────────────────
interface AdminTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const AdminTextarea = forwardRef<HTMLTextAreaElement, AdminTextareaProps>(
  ({ label, error, required, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <div style={{ marginBottom: 'var(--space-5)' }}>
        {label && (
          <label style={labelStyle}>
            {label}
            {required && <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          onFocus={e => { setFocused(true); props.onFocus?.(e); }}
          onBlur={e => { setFocused(false); props.onBlur?.(e); }}
          style={{
            ...inputBase,
            minHeight: '96px',
            padding: 'var(--space-3)',
            resize: 'vertical',
            ...(focused ? { borderColor: 'var(--border-focus)', boxShadow: 'var(--shadow-glow)' } : {}),
            ...(error ? { borderColor: 'var(--danger)' } : {}),
            ...(props.disabled ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--bg-subtle)' } : {}),
            ...style,
          }}
          {...props}
        />
        {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: 'var(--space-1)' }}>{error}</p>}
      </div>
    );
  }
);
AdminTextarea.displayName = 'AdminTextarea';

// ─── Toggle Switch ───────────────────────────────────────────────────────
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function ToggleSwitch({ checked, onChange, disabled, label }: ToggleSwitchProps) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '44px', height: '24px',
          borderRadius: 'var(--radius-full)',
          border: checked ? 'none' : '1px solid var(--border-default)',
          background: checked ? 'var(--accent-primary)' : 'var(--bg-subtle)',
          position: 'relative',
          transition: 'var(--transition-base)',
          cursor: 'inherit',
          padding: 0,
          outline: 'none',
        }}
      >
        <span style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '23px' : '3px',
          width: '18px', height: '18px',
          borderRadius: '50%',
          background: 'white',
          boxShadow: 'var(--shadow-sm)',
          transition: 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }} />
      </button>
      {label && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{label}</span>}
    </label>
  );
}

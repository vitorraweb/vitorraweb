import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
}

const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconOnly, children, disabled, className = '', style, ...props }, ref) => {

    const heights: Record<Size, number> = { xs: 24, sm: 30, md: 36, lg: 42, xl: 48 };
    const paddings: Record<Size, string> = { xs: '0 8px', sm: '0 12px', md: '0 16px', lg: '0 20px', xl: '0 24px' };
    const fontSizes: Record<Size, string> = { xs: 'var(--text-xs)', sm: 'var(--text-xs)', md: 'var(--text-sm)', lg: 'var(--text-md)', xl: 'var(--text-lg)' };

    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      height: heights[size],
      padding: iconOnly ? '0' : paddings[size],
      width: iconOnly ? heights[size] : undefined,
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-body)',
      fontSize: fontSizes[size],
      fontWeight: 600,
      border: 'none',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'var(--transition-fast)',
      position: 'relative',
      whiteSpace: 'nowrap',
      outline: 'none',
      ...getVariantStyles(variant),
      ...(disabled ? { pointerEvents: 'none' as const } : {}),
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`ad-btn ad-btn-${variant} ${className}`}
        style={baseStyle}
        {...props}
      >
        {loading ? (
          <span className={`ad-spinner ${variant === 'secondary' || variant === 'ghost' ? 'dark' : ''}`} />
        ) : (
          <>
            {icon && <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>}
            {!iconOnly && children}
          </>
        )}
      </button>
    );
  }
);

function getVariantStyles(variant: Variant): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return { background: 'var(--accent-primary)', color: 'white' };
    case 'secondary':
      return { background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-primary)' };
    case 'ghost':
      return { background: 'transparent', color: 'var(--text-secondary)' };
    case 'danger':
      return { background: 'var(--danger)', color: 'white' };
    case 'success':
      return { background: 'var(--success)', color: 'var(--bg-canvas)' };
  }
}

AdminButton.displayName = 'AdminButton';
export default AdminButton;

/* CSS hover/active/focus states — add to admin.css or use inline */
// Hover/active/focus handled via CSS in admin.css :
// .ad-btn-primary:hover { background: var(--accent-primary-hover); transform: translateY(-1px); box-shadow: 0 4px 12px var(--accent-primary-glow); }
// etc.

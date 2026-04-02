import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/* ── §14 MODALS & DIALOGS ────────────────────────────────────────────── */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'compact' | 'default' | 'large';
  preventClose?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const widths = { compact: 400, default: 560, large: 800 };

export default function Modal({ open, onClose, title, subtitle, size = 'default', preventClose, children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventClose) onClose();
    };
    window.addEventListener('keydown', handler);
    // Focus trap — prevent scrolling behind modal
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose, preventClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current && !preventClose) onClose(); }}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0,
        zIndex: 'var(--z-modal-bg, 400)' as any,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-6)',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        animation: 'admin-fade-in 0.2s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          maxWidth: widths[size],
          width: 'calc(100vw - 48px)',
          maxHeight: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'admin-scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
      >
        {/* Header */}
        <div style={{
          padding: 'var(--space-6) var(--space-6) var(--space-4)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
            {subtitle && <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)',
            transition: 'var(--transition-fast)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '0 var(--space-6)', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: 'var(--space-4) var(--space-6) var(--space-6)',
            borderTop: '1px solid var(--border-faint)',
            display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

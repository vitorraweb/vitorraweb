import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/* ── §20 DRAWER / SIDE PANEL ─────────────────────────────────────────── */

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Drawer({ open, onClose, title, width = 480, children, footer }: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 'var(--z-modal-bg, 400)' as any,
        display: 'flex', justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(2px)',
        animation: 'admin-fade-in 0.2s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: `${width}px`,
          maxWidth: '100vw',
          height: '100%',
          background: 'var(--bg-elevated)',
          borderLeft: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'admin-slide-right 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
        }}
      >
        {/* Header (sticky) */}
        <div style={{
          padding: 'var(--space-4) var(--space-6)',
          borderBottom: '1px solid var(--border-faint)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
            borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)',
            transition: 'var(--transition-fast)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
          {children}
        </div>

        {/* Footer (sticky) */}
        {footer && (
          <div style={{
            padding: 'var(--space-4) var(--space-6)',
            borderTop: '1px solid var(--border-faint)',
            display: 'flex', gap: 'var(--space-3)',
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

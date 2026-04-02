import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ── §16 TOAST / NOTIFICATION SYSTEM ──────────────────────────────────── */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  createdAt: number;
}

interface ToastContextType {
  addToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });
export function useToast() { return useContext(ToastContext); }

const durations: Record<ToastType, number> = {
  success: 5000, warning: 7000, info: 7000, error: 15000,
};

const accentColors: Record<ToastType, string> = {
  success: 'var(--success)', warning: 'var(--warning)',
  error: 'var(--danger)', info: 'var(--info)',
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const duration = durations[type];
    setToasts(prev => [{ id, type, title, message, duration, createdAt: Date.now() }, ...prev].slice(0, 5));
    if (type !== 'error') {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* §16.1 Container: bottom-right */}
      <div style={{
        position: 'fixed',
        bottom: 'var(--space-6, 24px)',
        right: 'var(--space-6, 24px)',
        zIndex: 'var(--z-toast, 600)' as any,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3, 12px)',
        maxWidth: '420px',
        width: '100%',
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        pointerEvents: 'auto',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        minWidth: '320px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: exiting
          ? 'admin-slide-out-right 0.2s ease forwards'
          : 'admin-slide-right 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }}
    >
      {/* Left accent bar + content */}
      <div style={{ display: 'flex', borderLeft: `4px solid ${accentColors[toast.type]}` }}>
        <div style={{ padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', flex: 1, alignItems: 'flex-start' }}>
          <span style={{ color: accentColors[toast.type], flexShrink: 0, marginTop: '1px' }}>{icons[toast.type]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{toast.title}</p>
            {toast.message && <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '2px 0 0', lineHeight: 1.5 }}>{toast.message}</p>}
          </div>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
              color: 'var(--text-tertiary)', opacity: hovered ? 1 : 0,
              transition: 'var(--transition-fast)', flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      {/* §16.2 Progress drain bar */}
      {toast.type !== 'error' && (
        <div style={{
          height: '3px',
          background: accentColors[toast.type],
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
          animation: `progress-drain ${toast.duration}ms linear forwards`,
          animationPlayState: hovered ? 'paused' : 'running',
        }} />
      )}
    </div>
  );
}

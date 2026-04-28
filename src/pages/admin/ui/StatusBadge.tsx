import React from 'react';

/* ── §12 BADGE / STATUS PILL SYSTEM ──────────────────────────────────── */

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'disputed';
type SemanticStatus = 'active' | 'inactive' | 'new' | 'warning' | 'error';
type BadgeStatus = OrderStatus | SemanticStatus;

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<BadgeStatus, { color: string; bg: string; border: string }> = {
  pending:    { color: 'var(--order-pending)',    bg: 'var(--order-pending-bg)',    border: 'rgba(245,166,35,0.30)' },
  confirmed:  { color: 'var(--order-confirmed)',  bg: 'var(--order-confirmed-bg)',  border: 'rgba(74,180,255,0.30)' },
  processing: { color: 'var(--order-processing)', bg: 'var(--order-processing-bg)', border: 'rgba(167,139,250,0.30)' },
  shipped:    { color: 'var(--order-shipped)',    bg: 'var(--order-shipped-bg)',    border: 'rgba(74,143,255,0.30)' },
  delivered:  { color: 'var(--order-delivered)',  bg: 'var(--order-delivered-bg)',  border: 'rgba(46,204,138,0.30)' },
  cancelled:  { color: 'var(--order-cancelled)',  bg: 'var(--order-cancelled-bg)',  border: 'rgba(255,77,77,0.30)' },
  refunded:   { color: 'var(--order-refunded)',  bg: 'var(--order-refunded-bg)',  border: 'rgba(249,115,22,0.30)' },
  disputed:   { color: 'var(--order-disputed)',  bg: 'var(--order-disputed-bg)',  border: 'rgba(236,72,153,0.30)' },
  active:     { color: 'var(--success)',       bg: 'var(--success-muted)',    border: 'var(--success-border)' },
  inactive:   { color: 'var(--neutral)',       bg: 'var(--neutral-muted)',    border: 'var(--border-dim)' },
  new:        { color: 'var(--info)',          bg: 'var(--info-muted)',       border: 'var(--info-border)' },
  warning:    { color: 'var(--warning)',       bg: 'var(--warning-muted)',    border: 'var(--warning-border)' },
  error:      { color: 'var(--danger)',        bg: 'var(--danger-muted)',     border: 'var(--danger-border)' },
};

// Auto-pulse statuses
const autoPulse = new Set<string>(['pending', 'processing', 'shipped']);

export function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function mapPaymentStatus(status: string): BadgeStatus {
  switch (status) {
    case 'paid': return 'delivered';
    case 'partial': return 'confirmed';
    case 'proforma_sent': case 'awaiting_payment': return 'processing';
    case 'unpaid': case 'pending': case 'pending_transfer': return 'pending';
    case 'failed': case 'amount_mismatch': return 'error';
    case 'refunded': return 'refunded';
    default: return 'inactive';
  }
}

export default function StatusBadge({ status, label, pulse, size = 'sm' }: StatusBadgeProps) {
  const cfg = statusConfig[status] || statusConfig.inactive;
  const shouldPulse = pulse !== undefined ? pulse : autoPulse.has(status);
  const displayLabel = label || getStatusLabel(status);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: size === 'sm' ? '3px 8px' : '4px 10px',
        borderRadius: 'var(--radius-full)',
        fontFamily: 'var(--font-body)',
        fontSize: size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        className={`ad-badge-dot ${shouldPulse ? 'pulse' : ''}`}
        style={{ color: cfg.color }}
      />
      {displayLabel}
    </span>
  );
}

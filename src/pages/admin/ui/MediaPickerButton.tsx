import { useState } from 'react';
import { Image, Upload, X, FolderOpen } from 'lucide-react';
import MediaPickerModal from './MediaPickerModal';

interface MediaPickerButtonProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: 'image' | 'document' | 'all';
}

/**
 * Drop-in replacement for FileUpload that opens the media library picker.
 * Use like: <MediaPickerButton value={formData.imageUrl} onChange={url => setFormData({...formData, imageUrl: url})} label="Cover Image" />
 */
export default function MediaPickerButton({ value, onChange, label = 'Image', accept = 'image' }: MediaPickerButtonProps) {
  const [open, setOpen] = useState(false);

  const isImage = (url?: string) => url && (url.startsWith('data:image/') || url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || url.includes('firebasestorage'));

  return (
    <div>
      <label style={{
        display: 'block',
        fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700,
        color: 'var(--text-tertiary)', textTransform: 'uppercase',
        letterSpacing: '0.15em', marginBottom: 8,
      }}>
        {label}
      </label>

      {value ? (
        /* ── Has Value: Show preview ── */
        <div style={{
          position: 'relative',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--bg-canvas)',
        }}>
          {isImage(value) ? (
            <div style={{ width: '100%', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-canvas)' }}>
              <img src={value} alt="Selected" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-canvas)', color: 'var(--text-tertiary)' }}>
              <FolderOpen size={24} style={{ marginRight: 8 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>File selected</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{
            display: 'flex', gap: 4, padding: '8px',
            borderTop: '1px solid var(--border-faint)',
            background: 'var(--bg-surface)',
          }}>
            <button
              onClick={() => setOpen(true)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary-muted)', border: '1px solid var(--accent-primary)',
                color: 'var(--accent-primary)', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600,
              }}
            >
              <FolderOpen size={12} /> Replace
            </button>
            <button
              onClick={() => onChange('')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                background: 'var(--danger-muted)', border: '1px solid var(--danger)',
                color: 'var(--danger)', cursor: 'pointer',
              }}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        /* ── Empty: Show picker button ── */
        <button
          onClick={() => setOpen(true)}
          style={{
            width: '100%', padding: '20px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            border: '2px dashed var(--border-default)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-canvas)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            color: 'var(--text-tertiary)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.background = 'var(--accent-primary-muted)';
            e.currentTarget.style.color = 'var(--accent-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.background = 'var(--bg-canvas)';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {accept === 'image' ? <Image size={18} /> : <Upload size={18} />}
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
            Choose from Library
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', opacity: 0.6 }}>
            or upload new
          </span>
        </button>
      )}

      {/* Modal */}
      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(url) => onChange(url)}
        accept={accept}
        title={`Select ${label}`}
      />
    </div>
  );
}

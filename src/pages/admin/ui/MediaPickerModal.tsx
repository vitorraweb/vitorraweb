import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Search, Upload, Check, Image, FileText, File, Film,
  Loader2, Grid, FolderOpen,
} from 'lucide-react';
import { MediaItem, MediaFilter, uploadMedia, subscribeToMedia, formatFileSize } from '../../../services/mediaService';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, item?: MediaItem) => void;
  accept?: string; // 'image' | 'document' | 'all'
  title?: string;
}

export default function MediaPickerModal({ open, onClose, onSelect, accept, title }: MediaPickerModalProps) {
  const [tab, setTab] = useState<'library' | 'upload'>('library');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine filter based on accept prop
  const filterType: MediaFilter = accept === 'image' ? 'image' : accept === 'document' ? 'document' : 'all';

  // Subscribe to media
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedItem(null);
    const unsub = subscribeToMedia((mediaItems) => {
      setItems(mediaItems);
      setLoading(false);
    });
    return unsub;
  }, [open]);

  // Filter by type and search
  const filtered = items.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Upload
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 25 * 1024 * 1024) {
          alert(`${file.name} exceeds 25MB limit`);
          continue;
        }
        const item = await uploadMedia(file, 'general');
        // Auto-select the just-uploaded item
        setSelectedItem(item);
        setTab('library');
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  const handleConfirm = () => {
    if (selectedItem) {
      onSelect(selectedItem.url, selectedItem);
      onClose();
    }
  };

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const typeIcon = (type: MediaItem['type']) => {
    switch (type) {
      case 'image': return <Image size={20} style={{ color: 'var(--text-tertiary)' }} />;
      case 'document': return <FileText size={20} style={{ color: 'var(--text-tertiary)' }} />;
      case 'video': return <Film size={20} style={{ color: 'var(--text-tertiary)' }} />;
      default: return <File size={20} style={{ color: 'var(--text-tertiary)' }} />;
    }
  };

  const fileAccept = accept === 'image' ? 'image/*' : accept === 'document' ? '.pdf,.doc,.docx' : 'image/*,.pdf,.doc,.docx,.mp4,.webm';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

      {/* Modal */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '90vw', maxWidth: 900, height: '80vh', maxHeight: 680,
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-faint)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--border-faint)',
          background: 'var(--bg-elevated)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {title || 'Select Media'}
            </h3>
            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 2, background: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
              <button onClick={() => setTab('library')} style={{
                padding: '4px 12px', borderRadius: 3,
                background: tab === 'library' ? 'var(--accent-primary)' : 'transparent',
                color: tab === 'library' ? 'white' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600,
              }}>Media Library</button>
              <button onClick={() => setTab('upload')} style={{
                padding: '4px 12px', borderRadius: 3,
                background: tab === 'upload' ? 'var(--accent-primary)' : 'transparent',
                color: tab === 'upload' ? 'white' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600,
              }}>Upload New</button>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-tertiary)', display: 'flex', padding: 4,
          }}><X size={18} /></button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {tab === 'library' ? (
            <>
              {/* Search bar */}
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-faint)' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="Search media files..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%', padding: '7px 10px 7px 30px',
                      background: 'var(--bg-canvas)', border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Grid */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
                    <FolderOpen size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                      {search ? 'No files match your search' : 'No media uploaded yet'}
                    </p>
                    <button onClick={() => setTab('upload')} style={{
                      marginTop: 12, padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600,
                    }}>Upload Files</button>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 10,
                  }}>
                    {filtered.map(item => {
                      const isSelected = selectedItem?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          onDoubleClick={() => { onSelect(item.url, item); onClose(); }}
                          style={{
                            position: 'relative', cursor: 'pointer',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-faint)'}`,
                            background: isSelected ? 'var(--accent-primary-muted)' : 'var(--bg-canvas)',
                            overflow: 'hidden',
                            transition: 'border-color 0.1s, background 0.1s',
                          }}
                          onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
                          onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-faint)'; }}
                        >
                          {isSelected && (
                            <div style={{
                              position: 'absolute', top: 6, right: 6, zIndex: 2,
                              width: 20, height: 20, borderRadius: '50%',
                              background: 'var(--accent-primary)', color: 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Check size={12} />
                            </div>
                          )}
                          <div style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {item.type === 'image' ? (
                              <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                            ) : typeIcon(item.type)}
                          </div>
                          <div style={{ padding: '4px 6px' }}>
                            <p style={{
                              fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500,
                              color: 'var(--text-primary)', margin: 0,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{item.name}</p>
                            <p style={{
                              fontFamily: 'var(--font-mono)', fontSize: '9px',
                              color: 'var(--text-tertiary)', margin: 0,
                            }}>{formatFileSize(item.size)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Upload tab */
            <div
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div style={{
                width: '100%', maxWidth: 500, textAlign: 'center',
                border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-lg)', padding: '60px 40px',
                background: dragOver ? 'var(--accent-primary-muted)' : 'var(--bg-canvas)',
                transition: 'all 0.2s',
              }}>
                {uploading ? (
                  <>
                    <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 12px' }} />
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      Drop files here
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 16 }}>
                      or click to browse • Max 25MB per file
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '10px 24px', borderRadius: 'var(--radius-md)',
                        background: 'var(--accent-primary)', color: 'white',
                        border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600,
                      }}
                    >
                      Browse Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={fileAccept}
                      onChange={e => e.target.files && handleUpload(e.target.files)}
                      style={{ display: 'none' }}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderTop: '1px solid var(--border-faint)',
          background: 'var(--bg-elevated)',
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {selectedItem ? `Selected: ${selectedItem.name}` : `${filtered.length} files available`}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-canvas)', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 500,
            }}>Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={!selectedItem}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-md)',
                background: selectedItem ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                color: selectedItem ? 'white' : 'var(--text-tertiary)',
                border: 'none', cursor: selectedItem ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600,
                opacity: selectedItem ? 1 : 0.5,
              }}
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

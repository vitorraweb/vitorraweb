import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Image, Upload, Trash2, Search, Grid, List, File, FileText, Film,
  X, Check, Copy, Loader2, Download, Eye, ChevronDown, MoreHorizontal,
  FolderOpen, HardDrive, AlertCircle, RefreshCw,
} from 'lucide-react';
import { MediaItem, MediaFilter, uploadMedia, deleteMedia, deleteMediaBulk, subscribeToMedia, formatFileSize } from '../../../services/mediaService';

export default function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time subscription
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToMedia((mediaItems) => {
      setItems(mediaItems);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Filtered + searched items
  const filtered = items.filter(item => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: items.length,
    images: items.filter(i => i.type === 'image').length,
    documents: items.filter(i => i.type === 'document').length,
    totalSize: items.reduce((s, i) => s + i.size, 0),
  };

  // Upload handler
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    setUploadProgress(0);
    const fileArray = Array.from(files);
    let completed = 0;

    try {
      for (const file of fileArray) {
        if (file.size > 25 * 1024 * 1024) {
          alert(`${file.name} exceeds 25MB limit`);
          continue;
        }
        await uploadMedia(file, 'general');
        completed++;
        setUploadProgress(Math.round((completed / fileArray.length) * 100));
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  // Drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  // Delete
  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await deleteMedia(item);
      if (detailItem?.id === item.id) setDetailItem(null);
      setSelected(prev => { const n = new Set(prev); n.delete(item.id); return n; });
    } catch { alert('Failed to delete'); }
  };

  const handleBulkDelete = async () => {
    const toDelete = items.filter(i => selected.has(i.id));
    if (!window.confirm(`Delete ${toDelete.length} file(s)? This cannot be undone.`)) return;
    try {
      await deleteMediaBulk(toDelete);
      setSelected(new Set());
      setDetailItem(null);
    } catch { alert('Bulk delete failed'); }
  };

  // Copy URL
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(i => i.id)));
    }
  };

  const typeIcon = (type: MediaItem['type']) => {
    switch (type) {
      case 'image': return <Image size={16} />;
      case 'document': return <FileText size={16} />;
      case 'video': return <Film size={16} />;
      default: return <File size={16} />;
    }
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--space-5)', minHeight: '75vh' }}>

      {/* ═══ MAIN PANEL ═══ */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Media Library
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
              {stats.total} files • {stats.images} images • {stats.documents} documents • {formatFileSize(stats.totalSize)} total
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary)', color: 'white',
                border: 'none', cursor: uploading ? 'wait' : 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600,
                opacity: uploading ? 0.7 : 1,
              }}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? `Uploading ${uploadProgress}%` : 'Upload Files'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.mp4,.webm"
              onChange={e => e.target.files && handleUpload(e.target.files)}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Toolbar: Search + Filter + View + Bulk Actions */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)', flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search media..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px 7px 30px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 2, border: '1px solid var(--border-faint)' }}>
            {(['all', 'image', 'document'] as MediaFilter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '5px 12px', borderRadius: 'var(--radius-sm)',
                background: filter === f ? 'var(--accent-primary)' : 'transparent',
                color: filter === f ? 'white' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {f === 'all' ? 'All' : f === 'image' ? 'Images' : 'Docs'}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 2, border: '1px solid var(--border-faint)' }}>
            <button onClick={() => setViewMode('grid')} style={{
              padding: '5px 8px', borderRadius: 'var(--radius-sm)',
              background: viewMode === 'grid' ? 'var(--accent-primary-muted)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              border: 'none', cursor: 'pointer', display: 'flex',
            }}><Grid size={14} /></button>
            <button onClick={() => setViewMode('list')} style={{
              padding: '5px 8px', borderRadius: 'var(--radius-sm)',
              background: viewMode === 'list' ? 'var(--accent-primary-muted)' : 'transparent',
              color: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              border: 'none', cursor: 'pointer', display: 'flex',
            }}><List size={14} /></button>
          </div>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginLeft: 'auto' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {selected.size} selected
              </span>
              <button onClick={selectAll} style={{
                padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500,
              }}>
                {selected.size === filtered.length ? 'Deselect All' : 'Select All'}
              </button>
              <button onClick={handleBulkDelete} style={{
                padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                background: 'var(--danger-muted)', border: '1px solid var(--danger)',
                color: 'var(--danger)', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Drop zone overlay + Content */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{ position: 'relative', minHeight: 400 }}
        >
          {/* Drag overlay */}
          {dragOver && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(var(--accent-primary-rgb, 59, 130, 246), 0.08)',
              border: '2px dashed var(--accent-primary)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <Upload size={40} style={{ color: 'var(--accent-primary)', marginBottom: 8 }} />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  Drop files here to upload
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-primary)', marginBottom: 12 }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Loading media...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 80, border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-lg)',
            }}>
              <FolderOpen size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {search ? 'No files match your search' : 'No media files yet'}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 16 }}>
                Drag & drop files here or click Upload
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-primary)', color: 'white',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600,
                }}
              >
                <Upload size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Upload Files
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ═══ GRID VIEW ═══ */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 'var(--space-3)',
            }}>
              {filtered.map(item => {
                const isSelected = selected.has(item.id);
                const isActive = detailItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setDetailItem(item)}
                    style={{
                      position: 'relative', cursor: 'pointer',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${isActive ? 'var(--accent-primary)' : isSelected ? 'var(--accent-primary)' : 'var(--border-faint)'}`,
                      background: 'var(--bg-surface)',
                      overflow: 'hidden',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxShadow: isActive ? '0 0 0 3px var(--accent-primary-muted)' : 'none',
                    }}
                    onMouseEnter={e => { if (!isActive && !isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
                    onMouseLeave={e => { if (!isActive && !isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-faint)'; }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleSelect(item.id); }}
                      style={{
                        position: 'absolute', top: 6, left: 6, zIndex: 2,
                        width: 20, height: 20, borderRadius: 4,
                        background: isSelected ? 'var(--accent-primary)' : 'rgba(0,0,0,0.5)',
                        border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.3)',
                        color: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {isSelected && <Check size={12} />}
                    </button>

                    {/* Thumbnail */}
                    <div style={{ width: '100%', aspectRatio: '1', background: 'var(--bg-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          {typeIcon(item.type)}
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            {item.mimeType.split('/')[1]?.slice(0, 4) || item.type}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <div style={{ padding: '6px 8px' }}>
                      <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 500,
                        color: 'var(--text-primary)', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{item.name}</p>
                      <p style={{
                        fontFamily: 'var(--font-mono)', fontSize: '9px',
                        color: 'var(--text-tertiary)', margin: 0, marginTop: 1,
                      }}>{formatFileSize(item.size)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ═══ LIST VIEW ═══ */
            <div style={{
              background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-faint)', overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '32px 40px 1fr 100px 100px 80px',
                padding: '8px 12px', gap: 12, alignItems: 'center',
                borderBottom: '1px solid var(--border-faint)',
                background: 'var(--bg-elevated)',
              }}>
                <button onClick={selectAll} style={{
                  width: 18, height: 18, borderRadius: 3,
                  background: selected.size === filtered.length && filtered.length > 0 ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  border: '1px solid var(--border-default)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                }}>
                  {selected.size === filtered.length && filtered.length > 0 && <Check size={10} />}
                </button>
                <span />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</span>
              </div>
              {filtered.map(item => {
                const isSelected = selected.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => setDetailItem(item)}
                    style={{
                      display: 'grid', gridTemplateColumns: '32px 40px 1fr 100px 100px 80px',
                      padding: '8px 12px', gap: 12, alignItems: 'center',
                      borderBottom: '1px solid var(--border-faint)',
                      cursor: 'pointer',
                      background: detailItem?.id === item.id ? 'var(--accent-primary-muted)' : isSelected ? 'var(--bg-elevated)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (detailItem?.id !== item.id) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                    onMouseLeave={e => { if (detailItem?.id !== item.id && !isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <button onClick={e => { e.stopPropagation(); toggleSelect(item.id); }} style={{
                      width: 18, height: 18, borderRadius: 3,
                      background: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface)',
                      border: '1px solid var(--border-default)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                    }}>
                      {isSelected && <Check size={10} />}
                    </button>
                    <div style={{ width: 32, height: 32, borderRadius: 4, overflow: 'hidden', background: 'var(--bg-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.type === 'image' ? (
                        <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      ) : typeIcon(item.type)}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{item.type}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{formatFileSize(item.size)}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--text-tertiary)' }}>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ DETAIL PANEL ═══ */}
      {detailItem && (
        <div style={{
          width: 300, flexShrink: 0,
          background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
          borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
          height: 'fit-content', position: 'sticky', top: 0,
        }}>
          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              File Details
            </span>
            <button onClick={() => setDetailItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>

          {/* Preview */}
          <div style={{
            width: '100%', aspectRatio: '16/10', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-canvas)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--space-4)', border: '1px solid var(--border-faint)',
          }}>
            {detailItem.type === 'image' ? (
              <img src={detailItem.url} alt={detailItem.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                {typeIcon(detailItem.type)}
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', marginTop: 4, textTransform: 'uppercase' }}>
                  {detailItem.mimeType.split('/')[1] || detailItem.type}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h4 style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0', wordBreak: 'break-all' }}>
              {detailItem.name}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {[
                { label: 'Type', value: detailItem.mimeType },
                { label: 'Size', value: formatFileSize(detailItem.size) },
                ...(detailItem.width ? [{ label: 'Dimensions', value: `${detailItem.width} × ${detailItem.height}px` }] : []),
                { label: 'Uploaded', value: new Date(detailItem.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-tertiary)' }}>{row.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* URL */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
              File URL
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text"
                readOnly
                value={detailItem.url.startsWith('data:') ? '(Local base64)' : detailItem.url}
                style={{
                  flex: 1, padding: '6px 8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  outline: 'none', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              />
              <button onClick={() => copyUrl(detailItem.url)} style={{
                padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                background: copied ? 'var(--success-muted)' : 'var(--bg-elevated)',
                border: `1px solid ${copied ? 'var(--success)' : 'var(--border-default)'}`,
                color: copied ? 'var(--success)' : 'var(--text-secondary)',
                cursor: 'pointer', display: 'flex',
              }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {detailItem.type === 'image' && (
              <a href={detailItem.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'none',
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 500,
              }}>
                <Eye size={14} /> View Full Size
              </a>
            )}
            <button onClick={() => handleDelete(detailItem)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--danger-muted)', border: '1px solid var(--danger)',
              color: 'var(--danger)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600,
            }}>
              <Trash2 size={14} /> Delete File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

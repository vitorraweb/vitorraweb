import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, XCircle, Loader2, FileText, File as FileIcon } from 'lucide-react';
import { uploadFile } from '../../services/uploadService';

interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  currentFile?: string;
  currentImage?: string;
  accept?: string;
}

export default function FileUpload({ 
  onUploadSuccess, 
  label = "Upload Document", 
  currentFile,
  currentImage,
  accept = ".pdf,image/*,.doc,.docx"
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentFile || currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Perform the actual "upload"
      const uploadedUrl = await uploadFile(file);
      onUploadSuccess(uploadedUrl);
      setPreview(uploadedUrl);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setPreview(currentFile || null);
    } finally {
      setIsUploading(false);
    }
  };

  const isImage = (url: string) => url.startsWith('data:image/') || url.match(/\.(jpeg|jpg|gif|png)$/i);

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-vitorra-muted uppercase tracking-widest mb-3">{label}</label>
      
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
          error ? 'border-red-500/50 bg-red-500/5' : 
          preview ? 'border-vitorra-gold/50 bg-vitorra-bg/5' : 
          'border-vitorra-border bg-vitorra-bg/40 hover:border-vitorra-gold/50 hover:bg-vitorra-bg/5'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept={accept} 
          className="hidden" 
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-vitorra-gold animate-spin mb-3" />
            <p className="text-sm text-vitorra-text/80 font-medium">Processing secure upload...</p>
          </div>
        ) : preview ? (
          <div className="w-full">
            <div className="w-full h-32 rounded-xl overflow-hidden border border-vitorra-border mb-3 bg-vitorra-bg-alt flex items-center justify-center">
              {isImage(preview) ? (
                <img src={preview} alt="File Preview" className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-vitorra-muted">
                  <FileText className="w-10 h-10 text-vitorra-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Document Secured</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-vitorra-gold font-bold uppercase tracking-wider flex items-center justify-center gap-2 group-hover:text-vitorra-text transition-colors">
              <CheckCircle className="w-3 h-3" /> Link Established • Replace File
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2">
            <div className="w-12 h-12 bg-vitorra-bg/5 rounded-full flex items-center justify-center text-vitorra-muted group-hover:text-vitorra-gold group-hover:bg-vitorra-gold/10 transition-colors mb-4">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm text-vitorra-text font-bold mb-1">Click to select documents</p>
            <p className="text-[10px] text-vitorra-muted uppercase tracking-widest font-medium">PDF, JPG, PNG (Max 10MB)</p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}
      </div>
    </div>
  );
}

import { useRef, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3,
  Quote, Code, Link, Minus, Undo, Redo, Type
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    // Trigger onChange after command
    setTimeout(() => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }, 0);
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, text);
  }, []);

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const btnClass = (active?: boolean) =>
    `p-1.5 rounded-md transition-all duration-150 ${
      active
        ? 'bg-[#c68958] text-white shadow-sm'
        : 'text-[#8a8a8a] hover:text-white hover:bg-[#3a3a3a]'
    }`;

  const dividerClass = 'w-px h-6 bg-[#3a3a3a] mx-1';

  return (
    <div className="rounded-xl overflow-hidden border border-[#3a3a3a] bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-[#3a3a3a] bg-[#2a2a2a]">
        {/* Text style */}
        <button type="button" onClick={() => exec('formatBlock', '<p>')} className={btnClass()} title="Normal text">
          <Type size={15} />
        </button>
        <button type="button" onClick={() => exec('formatBlock', '<h1>')} className={btnClass()} title="Heading 1">
          <Heading1 size={15} />
        </button>
        <button type="button" onClick={() => exec('formatBlock', '<h2>')} className={btnClass()} title="Heading 2">
          <Heading2 size={15} />
        </button>
        <button type="button" onClick={() => exec('formatBlock', '<h3>')} className={btnClass()} title="Heading 3">
          <Heading3 size={15} />
        </button>

        <div className={dividerClass} />

        {/* Inline formatting */}
        <button type="button" onClick={() => exec('bold')} className={btnClass()} title="Bold">
          <Bold size={15} />
        </button>
        <button type="button" onClick={() => exec('italic')} className={btnClass()} title="Italic">
          <Italic size={15} />
        </button>
        <button type="button" onClick={() => exec('underline')} className={btnClass()} title="Underline">
          <Underline size={15} />
        </button>
        <button type="button" onClick={() => exec('strikeThrough')} className={btnClass()} title="Strikethrough">
          <Strikethrough size={15} />
        </button>

        <div className={dividerClass} />

        {/* Lists */}
        <button type="button" onClick={() => exec('insertUnorderedList')} className={btnClass()} title="Bullet list">
          <List size={15} />
        </button>
        <button type="button" onClick={() => exec('insertOrderedList')} className={btnClass()} title="Numbered list">
          <ListOrdered size={15} />
        </button>

        <div className={dividerClass} />

        {/* Alignment */}
        <button type="button" onClick={() => exec('justifyLeft')} className={btnClass()} title="Align left">
          <AlignLeft size={15} />
        </button>
        <button type="button" onClick={() => exec('justifyCenter')} className={btnClass()} title="Align center">
          <AlignCenter size={15} />
        </button>
        <button type="button" onClick={() => exec('justifyRight')} className={btnClass()} title="Align right">
          <AlignRight size={15} />
        </button>

        <div className={dividerClass} />

        {/* Block elements */}
        <button type="button" onClick={() => exec('formatBlock', '<blockquote>')} className={btnClass()} title="Block quote">
          <Quote size={15} />
        </button>
        <button type="button" onClick={() => exec('formatBlock', '<pre>')} className={btnClass()} title="Code block">
          <Code size={15} />
        </button>
        <button type="button" onClick={insertLink} className={btnClass()} title="Insert link">
          <Link size={15} />
        </button>
        <button type="button" onClick={() => exec('insertHorizontalRule')} className={btnClass()} title="Horizontal line">
          <Minus size={15} />
        </button>

        <div className={dividerClass} />

        {/* Undo/Redo */}
        <button type="button" onClick={() => exec('undo')} className={btnClass()} title="Undo">
          <Undo size={15} />
        </button>
        <button type="button" onClick={() => exec('redo')} className={btnClass()} title="Redo">
          <Redo size={15} />
        </button>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        data-placeholder={placeholder || 'Start writing your content...'}
        className="min-h-[360px] max-h-[600px] overflow-y-auto px-5 py-4 text-[#e0e0e0] text-base leading-relaxed outline-none focus:ring-0
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[#555] [&:empty]:before:pointer-events-none
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-6 [&_h1]:mb-3
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-5 [&_h2]:mb-2
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-2
          [&_p]:mb-3
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
          [&_li]:mb-1
          [&_blockquote]:border-l-4 [&_blockquote]:border-[#c68958] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#999] [&_blockquote]:my-4
          [&_pre]:bg-[#111] [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:text-[#e0e0e0] [&_pre]:my-4 [&_pre]:overflow-x-auto
          [&_a]:text-[#c68958] [&_a]:underline
          [&_hr]:border-[#3a3a3a] [&_hr]:my-6
        "
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      />
    </div>
  );
}

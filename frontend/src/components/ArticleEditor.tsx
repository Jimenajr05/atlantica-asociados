'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, Color, BackgroundColor } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, Underline,
  Strikethrough, List, ListOrdered, IndentIncrease, IndentDecrease, Quote,
  Undo2, Redo2, RemoveFormatting, Eye, Edit3, type LucideIcon,
} from 'lucide-react';
import { ArticleIndent } from '@/lib/article-indent';
import { parseAndSanitizeMarkdown } from '@/lib/markdown';

interface ArticleEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function colorInputValue(color: string, fallback: string) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  const rgb = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  return rgb ? `#${rgb.slice(1).map((channel) => Number(channel).toString(16).padStart(2, '0')).join('')}` : fallback;
}

function ToolButton({ label, icon: Icon, active, disabled, onClick }: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`rounded-md p-2 transition-colors disabled:opacity-30 ${active ? 'bg-azul-rey text-white' : 'text-slate-700 hover:bg-slate-200'}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export function ArticleEditor({ value, onChange }: ArticleEditorProps) {
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const lastValue = useRef<string | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextStyle, Color, BackgroundColor,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ArticleIndent,
      TableKit,
    ],
    editorProps: {
      attributes: {
        class: 'article-content article-editor-scroll p-4 sm:p-6 focus:outline-none',
        role: 'textbox',
        'aria-label': 'Contenido del artículo',
        'aria-multiline': 'true',
        'aria-required': 'true',
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.getText().trim() ? current.getHTML() : '';
      lastValue.current = html;
      onChange(html);
    },
  });

  // Los artículos anteriores en Markdown se cargan sin modificar su valor guardado.
  useEffect(() => {
    if (!editor || lastValue.current === value) return;
    let cancelled = false;
    setReady(false);
    setError('');
    parseAndSanitizeMarkdown(value).then((html) => {
      if (cancelled) return;
      editor.commands.setContent(html, { emitUpdate: false });
      lastValue.current = value;
      setReady(true);
    }).catch(() => {
      if (!cancelled) setError('No se pudo cargar el editor. Recarga la página para intentarlo de nuevo.');
    });
    return () => { cancelled = true; };
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => current ? {
      bold: current.isActive('bold'), italic: current.isActive('italic'),
      underline: current.isActive('underline'), strike: current.isActive('strike'),
      bulletList: current.isActive('bulletList'), orderedList: current.isActive('orderedList'),
      blockquote: current.isActive('blockquote'),
      heading: current.isActive('heading') ? String(current.getAttributes('heading').level) : 'paragraph',
      color: current.getAttributes('textStyle').color || '#1e293b',
      backgroundColor: current.getAttributes('textStyle').backgroundColor || '#fef08a',
      alignment: current.getAttributes(current.isActive('heading') ? 'heading' : 'paragraph').textAlign || 'left',
      canUndo: current.can().undo(), canRedo: current.can().redo(),
      canIndent: current.can().indent(), canOutdent: current.can().outdent(),
    } : null,
  });

  async function showPreview() {
    try {
      setPreviewHtml(await parseAndSanitizeMarkdown(value));
      setPreview(true);
      setError('');
    } catch {
      setError('No se pudo generar la vista previa. Inténtalo de nuevo.');
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 p-3">
        <span className="text-xs font-bold text-slate-700">Contenido del artículo <span className="text-red-500">*</span></span>
        <div className="flex gap-1 rounded-lg border border-slate-300 bg-white p-0.5">
          <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)} className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold ${!preview ? 'bg-azul-rey text-white' : 'text-slate-600'}`}>
            <Edit3 className="h-3 w-3" /> Editor
          </button>
          <button type="button" aria-pressed={preview} onClick={showPreview} className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold ${preview ? 'bg-azul-rey text-white' : 'text-slate-600'}`}>
            <Eye className="h-3 w-3" /> Vista previa
          </button>
        </div>
      </div>
      {error && <p role="alert" className="p-4 text-sm text-red-700">{error}</p>}
      <div hidden={preview}>
        {!ready || !editor || !state ? <p role="status" className="p-4 text-sm text-slate-500">Cargando editor…</p> : (
          <>
            <div role="group" aria-label="Formato del artículo" className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
              <select aria-label="Estilo de párrafo" value={state.heading} onChange={(event) => {
                if (event.target.value === 'paragraph') editor.chain().focus().setParagraph().run();
                else editor.chain().focus().setHeading({ level: Number(event.target.value) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
              }} className="max-w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700">
                <option value="paragraph">Texto normal</option>
                {[1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={level}>Título {level}</option>)}
              </select>
              <ToolButton label="Negrita" icon={Bold} active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()} />
              <ToolButton label="Cursiva" icon={Italic} active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()} />
              <ToolButton label="Subrayado" icon={Underline} active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()} />
              <ToolButton label="Tachado" icon={Strikethrough} active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()} />
              <label className="inline-flex items-center gap-1 rounded-md px-2 text-xs text-slate-700">
                Color
                <input type="color" aria-label="Color del texto" value={colorInputValue(state.color, '#1e293b')} onChange={(event) => editor.chain().focus().setColor(event.target.value).run()} className="h-7 w-7 cursor-pointer border-0 bg-transparent p-0" />
              </label>
              <label className="inline-flex items-center gap-1 rounded-md px-2 text-xs text-slate-700">
                Resaltar
                <input type="color" aria-label="Color de resaltado" value={colorInputValue(state.backgroundColor, '#fef08a')} onChange={(event) => editor.chain().focus().setBackgroundColor(event.target.value).run()} className="h-7 w-7 cursor-pointer border-0 bg-transparent p-0" />
              </label>
              <ToolButton label="Lista con viñetas" icon={List} active={state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()} />
              <ToolButton label="Lista numerada" icon={ListOrdered} active={state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
              <ToolButton label="Aumentar sangría" icon={IndentIncrease} disabled={!state.canIndent} onClick={() => editor.chain().focus().indent().run()} />
              <ToolButton label="Disminuir sangría" icon={IndentDecrease} disabled={!state.canOutdent} onClick={() => editor.chain().focus().outdent().run()} />
              {([
                ['left', 'Alinear a la izquierda', AlignLeft], ['center', 'Centrar', AlignCenter],
                ['right', 'Alinear a la derecha', AlignRight], ['justify', 'Justificar', AlignJustify],
              ] as const).map(([alignment, label, icon]) => (
                <ToolButton key={alignment} label={label} icon={icon} active={state.alignment === alignment} onClick={() => editor.chain().focus().setTextAlign(alignment).run()} />
              ))}
              <ToolButton label="Cita" icon={Quote} active={state.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
              <ToolButton label="Quitar formato" icon={RemoveFormatting} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().resetAttributes('paragraph', ['indent', 'textAlign']).run()} />
              <ToolButton label="Deshacer" icon={Undo2} disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()} />
              <ToolButton label="Rehacer" icon={Redo2} disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()} />
            </div>
            <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">Selecciona texto para darle formato. Para subrayar, pulsa U o Ctrl+U (⌘+U en Mac).</p>
          </>
        )}
        <div hidden={!ready}><EditorContent editor={editor} /></div>
      </div>
      {preview && <div role="region" aria-label="Vista previa del artículo" tabIndex={0} className="article-content article-editor-scroll p-4 sm:p-6" dangerouslySetInnerHTML={{ __html: previewHtml || '<p>No hay contenido para previsualizar.</p>' }} />}
    </div>
  );
}

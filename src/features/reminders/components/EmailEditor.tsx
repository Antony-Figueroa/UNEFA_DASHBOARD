/**
 * @file EmailEditor.tsx
 * @description Editor visual para correos HTML con barra de herramientas,
 * selector de variables, y modo HTML para usuarios avanzados.
 * No requiere conocimientos de HTML para usarlo.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Variables disponibles ────────────────────────────────────────────────

const AVAILABLE_VARIABLES = [
  { key: 'nombre', label: 'Nombre del destinatario', example: 'Juan Pérez' },
  { key: 'periodo', label: 'Período académico', example: '2026-I' },
  { key: 'fecha', label: 'Fecha actual', example: '08/06/2026' },
  { key: 'fecha_inicio', label: 'Fecha de inicio', example: '01/04/2026' },
  { key: 'fecha_fin', label: 'Fecha de fin', example: '30/09/2026' },
  { key: 'tutor', label: 'Nombre del tutor', example: 'Lic. María García' },
  { key: 'rol', label: 'Rol del usuario', example: 'estudiante' },
  { key: 'asunto', label: 'Asunto del correo', example: 'Notificación importante' },
  { key: 'mensaje', label: 'Mensaje personalizado', example: 'Su evaluación está pendiente.' },
  { key: 'email', label: 'Correo electrónico', example: 'usuario@correo.com' },
];

// ─── Toolbar button ──────────────────────────────────────────────────────

interface ToolbarBtnProps {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}

const ToolbarBtn = ({ onClick, title, active, children }: ToolbarBtnProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-md transition-colors text-sm leading-none ${
      active
        ? 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300'
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    {children}
  </button>
);

// ─── Divider ──────────────────────────────────────────────────────────────

const Divider = () => (
  <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />
);

// ─── Props ────────────────────────────────────────────────────────────────

interface EmailEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** Placeholder cuando está vacío (solo modo HTML) */
  placeholder?: string;
  /** Mostrar error */
  error?: string;
  /** Altura mínima del editor */
  minHeight?: string;
  /** Deshabilitado */
  disabled?: boolean;
}

// ─── Icons (inline para evitar dependencias) ─────────────────────────────

const BoldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>;
const ItalicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>;
const UnderlineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>;
const HeadingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></svg>;
const BulletListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const NumberedListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const VariableIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="16 3 21 8 8 21 3 21 3 16 16 3"/></svg>;
const RemoveFormatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10"/><path d="M19 12v8"/><line x1="15" y1="12" x2="21" y2="18"/><line x1="21" y1="12" x2="15" y2="18"/></svg>;
const ChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;

// ─── Component ──────────────────────────────────────────────────────────

export const EmailEditor = ({
  value,
  onChange,
  placeholder = 'Escribí el contenido del correo...',
  error,
  minHeight = '200px',
  disabled = false,
}: EmailEditorProps) => {
  // ── State ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const varDropdownRef = useRef<HTMLDivElement>(null);

  // ── Sync external value → editor ──────────────────────────────────

  // Solo sincronizamos si el valor externo cambió y es diferente al contenido actual
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (mode === 'visual' && editorRef.current && value !== lastValueRef.current) {
      // Si está vacío y el foco no está en el editor, restauramos
      if (!value) {
        editorRef.current.innerHTML = '';
      } else if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
      lastValueRef.current = value;
    }
  }, [value, mode]);

  // ── Internal change → parent ──────────────────────────────────────

  const notifyChange = useCallback((html: string) => {
    const clean = html === '<br>' ? '' : html;
    lastValueRef.current = clean;
    onChange(clean);
  }, [onChange]);

  // ── Toolbar commands ─────────────────────────────────────────────

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      notifyChange(editorRef.current.innerHTML);
    }
  };

  const handleBold = () => exec('bold');
  const handleItalic = () => exec('italic');
  const handleUnderline = () => exec('underline');
  const handleH2 = () => exec('formatBlock', 'h2');
  const handleH3 = () => exec('formatBlock', 'h3');
  const handleParagraph = () => exec('formatBlock', 'p');
  const handleBulletList = () => exec('insertUnorderedList');
  const handleNumberedList = () => exec('insertOrderedList');
  const handleRemoveFormat = () => exec('removeFormat');

  const handleLink = () => {
    if (showLinkInput && linkUrl) {
      exec('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkInput(false);
    } else {
      setShowLinkInput(!showLinkInput);
      setLinkUrl('');
    }
  };

  const handleInsertVariable = (variableKey: string) => {
    const variable = `{{${variableKey}}}`;
    if (mode === 'visual' && editorRef.current) {
      editorRef.current.focus();
      exec('insertText', variable);
    } else if (mode === 'html' && textareaRef.current) {
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const text = ta.value;
      const newText = text.substring(0, start) + variable + text.substring(end);
      onChange(newText);
      // Restaurar cursor después del próximo render
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + variable.length, start + variable.length);
      });
    }
    setShowVariables(false);
  };

  // ── Handle editor input ───────────────────────────────────────────

  const handleEditorInput = () => {
    if (editorRef.current) {
      notifyChange(editorRef.current.innerHTML);
    }
  };

  // ── Handle paste (limpiar formato al pegar) ──────────────────────

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    if (editorRef.current) {
      notifyChange(editorRef.current.innerHTML);
    }
  };

  // ── Cerrar dropdown de variables al hacer clic fuera ─────────────

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (varDropdownRef.current && !varDropdownRef.current.contains(e.target as Node)) {
        setShowVariables(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Inicializar editor al montar ─────────────────────────────────

  useEffect(() => {
    if (mode === 'visual' && editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [mode, value]);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {/* Formato */}
        <ToolbarBtn onClick={handleBold} title="Negrita (Ctrl+B)">
          <BoldIcon />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleItalic} title="Cursiva (Ctrl+I)">
          <ItalicIcon />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleUnderline} title="Subrayado (Ctrl+U)">
          <UnderlineIcon />
        </ToolbarBtn>

        <Divider />

        {/* Headings */}
        <ToolbarBtn onClick={handleH2} title="Título (H2)">
          <span className="text-xs font-bold">H<sub>2</sub></span>
        </ToolbarBtn>
        <ToolbarBtn onClick={handleH3} title="Subtítulo (H3)">
          <span className="text-xs font-bold">H<sub>3</sub></span>
        </ToolbarBtn>

        <Divider />

        {/* Lists */}
        <ToolbarBtn onClick={handleBulletList} title="Lista con viñetas">
          <BulletListIcon />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleNumberedList} title="Lista numerada">
          <NumberedListIcon />
        </ToolbarBtn>

        <Divider />

        {/* Link */}
        <ToolbarBtn onClick={handleLink} title="Insertar enlace">
          <LinkIcon />
        </ToolbarBtn>

        {/* Quitar formato */}
        <ToolbarBtn onClick={handleRemoveFormat} title="Quitar formato">
          <RemoveFormatIcon />
        </ToolbarBtn>

        <Divider />

        {/* Insertar variable */}
        <div className="relative" ref={varDropdownRef}>
          <button
            type="button"
            onClick={() => setShowVariables(!showVariables)}
            title="Insertar variable"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors text-xs font-medium ${
              showVariables
                ? 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300'
                : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10'
            }`}
          >
            <VariableIcon />
            <span>Variable</span>
            <ChevronDown />
          </button>

          {showVariables && (
            <div className="absolute z-50 top-full left-0 mt-1 w-72 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
              <div className="px-3 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                Variables disponibles
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {AVAILABLE_VARIABLES.map(v => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => handleInsertVariable(v.key)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-mono">
                        {'{{'}{v.key}{'}}'}
                      </code>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{v.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Modo HTML toggle */}
        <button
          type="button"
          onClick={() => setMode(mode === 'visual' ? 'html' : 'visual')}
          title={mode === 'visual' ? 'Editar HTML directamente' : 'Volver al editor visual'}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors text-xs font-medium ${
            mode === 'html'
              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <CodeIcon />
          <span>{mode === 'visual' ? 'HTML' : 'Visual'}</span>
        </button>

        {/* Vista previa */}
        {mode === 'visual' && (
          <ToolbarBtn onClick={() => setShowPreview(!showPreview)} title={showPreview ? 'Editar' : 'Vista previa'}>
            <EyeIcon />
          </ToolbarBtn>
        )}
      </div>

      {/* Link input */}
      {showLinkInput && (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://ejemplo.com"
            className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
          />
          <button
            type="button"
            onClick={handleLink}
            className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            Insertar
          </button>
        </div>
      )}

      {/* Editor */}
      {mode === 'visual' && !showPreview && (
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleEditorInput}
          onPaste={handlePaste}
          suppressContentEditableWarning
          className={`w-full rounded-lg border ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all overflow-auto resize-y leading-relaxed ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'
          }`}
          style={{ minHeight }}
          data-placeholder={placeholder}
          role="textbox"
          aria-placeholder={placeholder}
        />
      )}

      {/* Preview */}
      {mode === 'visual' && showPreview && (
        <div
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-5 text-sm overflow-auto"
          style={{ minHeight }}
        >
          {lastValueRef.current ? (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: lastValueRef.current
                  .replace(/\{\{nombre\}\}/g, '<span class="text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-1 rounded">Juan Pérez</span>')
                  .replace(/\{\{periodo\}\}/g, '<span class="text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-1 rounded">2026-I</span>')
                  .replace(/\{\{fecha\}\}/g, '<span class="text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-1 rounded">08/06/2026</span>')
                  .replace(/\{\{fecha_inicio\}\}/g, '<span class="text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-1 rounded">01/04/2026</span>')
                  .replace(/\{\{fecha_fin\}\}/g, '<span class="text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-1 rounded">30/09/2026</span>')
                  .replace(/\{\{tutor\}\}/g, '<span class="text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-1 rounded">Lic. María García</span>')
                  .replace(/\{\{asunto\}\}/g, '<span class="text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-1 rounded">Asunto del ejemplo</span>')
                  .replace(/\{\{mensaje\}\}/g, '<span class="text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-1 rounded">Mensaje de ejemplo</span>')
                  .replace(/\{\{rol\}\}/g, '<span class="text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-1 rounded">estudiante</span>')
                  .replace(/\{\{email\}\}/g, '<span class="text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-1 rounded">usuario@correo.com</span>'),
              }}
            />
          ) : (
            <p className="text-gray-400 text-sm italic">Escribí algo para ver la vista previa...</p>
          )}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-[11px] text-gray-400">
              Vista previa — las variables se muestran con valores de ejemplo
            </p>
          </div>
        </div>
      )}

      {/* HTML mode */}
      {mode === 'html' && (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full rounded-lg border ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-mono text-xs leading-relaxed focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-y ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ minHeight }}
          placeholder={placeholder}
          rows={8}
          disabled={disabled}
          spellCheck={false}
        />
      )}

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      {/* Variables helper */}
      <div className="flex flex-wrap items-center gap-1 text-[11px] text-gray-400">
        <span>Variables:</span>
        {AVAILABLE_VARIABLES.slice(0, 5).map(v => (
          <code
            key={v.key}
            className="cursor-pointer text-purple-500 hover:text-purple-700 dark:hover:text-purple-300 hover:underline"
            onClick={() => handleInsertVariable(v.key)}
          >
            {'{{'}{v.key}{'}}'}
          </code>
        ))}
        {AVAILABLE_VARIABLES.length > 5 && (
          <span className="text-gray-300 dark:text-gray-600">y {AVAILABLE_VARIABLES.length - 5} más</span>
        )}
      </div>
    </div>
  );
};

export default EmailEditor;

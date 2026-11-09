import * as React from 'react';

export function FileUpload({ label = '파일 선택', onFilesChange, onInvalidFiles, maxSizeBytes, disabled, id: providedId, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & { label?: string; onFilesChange?: (files: File[]) => void; onInvalidFiles?: (message: string) => void; maxSizeBytes?: number }) {
  const generated = React.useId();
  const id = providedId || generated;
  const input = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    let active = true;
    const reset = (event: Event) => { queueMicrotask(() => { if (active && !event.defaultPrevented) { input.current?.setCustomValidity(''); setFiles([]); setError(''); } }); };
    form.addEventListener('reset', reset);
    return () => { active = false; form.removeEventListener('reset', reset); };
  }, []);
  const validate = (next: File[]) => {
    const accept = (props.accept || '').split(',').map(token => token.trim().toLowerCase()).filter(Boolean);
    const matches = (file: File) => !accept.length || accept.some(token => token.startsWith('.') ? file.name.toLowerCase().endsWith(token) : token.endsWith('/*') ? file.type.toLowerCase().startsWith(token.slice(0, -1)) : file.type.toLowerCase() === token);
    const message = next.some(file => !matches(file)) ? '지원하지 않는 파일 형식입니다.' : maxSizeBytes != null && next.some(file => file.size > maxSizeBytes) ? '파일 크기가 허용 범위를 초과합니다.' : '';
    setError(message);
    input.current?.setCustomValidity(message);
    if (message) { if (input.current) input.current.value = ''; setFiles([]); onInvalidFiles?.(message); onFilesChange?.([]); return false; }
    setFiles(next); onFilesChange?.(next); return true;
  };
  return <div className={`upload-area${dragging ? ' is-dragging' : ''}`} onDragOver={(event) => { if (!disabled) { event.preventDefault(); setDragging(true); } }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => {
    event.preventDefault(); setDragging(false);
    if (disabled || !input.current) return;
    const dropped = Array.from(event.dataTransfer.files);
    const next = props.multiple ? dropped : dropped.slice(0, 1);
    if (!validate(next)) return;
    const transfer = new DataTransfer(); next.forEach(file => transfer.items.add(file)); input.current.files = transfer.files;
  }}><label className="button button--outline button-inline upload-button" htmlFor={id}>{label}</label><input {...props} ref={input} id={id} type="file" disabled={disabled} className="upload-input" aria-describedby={[props['aria-describedby'], error && `${id}-error`].filter(Boolean).join(' ') || undefined} aria-invalid={error ? true : props['aria-invalid']} onChange={(event) => validate(Array.from(event.currentTarget.files || []))} />
    {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    {files.length > 0 && <div className="upload-result"><div>{files.map((file, index) => <strong key={`${file.name}-${index}`}>{file.name}</strong>)}</div><button type="button" className="button button--ghost button-inline" disabled={disabled} onClick={() => { if (input.current) { input.current.value = ''; input.current.setCustomValidity(''); } setFiles([]); setError(''); onFilesChange?.([]); }}>제거</button></div>}
  </div>;
}

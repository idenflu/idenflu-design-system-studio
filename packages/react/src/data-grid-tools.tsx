import * as React from 'react';
import { Icon } from './primitives';
import { saveDataGridFile } from './data-grid-file';

export interface DataGridCsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

export interface DataGridCsvOptions<T> {
  rows: readonly T[];
  columns: readonly DataGridCsvColumn<T>[];
}

function csvCell(value: string | number | null | undefined) {
  let text = value == null ? '' : String(value);
  // Spreadsheet applications may evaluate formula-like text, even after spaces.
  // Real numbers retain their numeric value, including legitimate negatives.
  if (typeof value === 'string' && (/^[\t\r\n]/.test(text) || /^[\u0000-\u0020]*[=+\-@]/.test(text))) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Creates UTF-8 BOM CSV. The caller supplies the intended rows and columns. */
export function createDataGridCsv<T>({ rows, columns }: DataGridCsvOptions<T>) {
  const lines = [columns.map(column => csvCell(column.header)).join(',')];
  for (const row of rows) lines.push(columns.map(column => csvCell(column.accessor(row))).join(','));
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export interface DownloadDataGridCsvOptions<T> extends DataGridCsvOptions<T> {
  fileName?: string;
}

/** Prompts for a local save destination, falling back to a named browser download. */
export async function downloadDataGridCsv<T>({ fileName = 'data-grid.csv', ...options }: DownloadDataGridCsvOptions<T>) {
  return saveDataGridFile({format:'csv',fileName,createBlob:()=>new Blob([createDataGridCsv(options)],{type:'text/csv;charset=utf-8'})});
}

export interface DataGridCellEditorProps {
  value: string;
  label: string;
  type?: 'text' | 'number';
  validate?: (value: string) => string | undefined;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

/** Explicit save/cancel editor. Focus restoration and row updates belong to the grid. */
export function DataGridCellEditor({ value, label, type = 'text', validate, onCommit, onCancel }: DataGridCellEditorProps) {
  const [draft, setDraft] = React.useState(value);
  const [error, setError] = React.useState('');
  const input = React.useRef<HTMLInputElement>(null);
  const id = React.useId();
  const errorId = `data-grid-editor-${id}-error`;
  React.useEffect(() => { input.current?.focus(); input.current?.select(); }, []);
  const commit = () => {
    const numberIssue = type === 'number' && (input.current?.validity.badInput || (draft.trim() !== '' && !Number.isFinite(Number(draft))));
    const issue = numberIssue ? '올바른 숫자를 입력해주세요.' : validate?.(draft);
    if (issue) { setError(issue); input.current?.focus(); return; }
    setError('');
    onCommit(draft);
  };
  return <div className="data-grid-editor" role="group" aria-label={`${label} 편집`} onKeyDown={event => {
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCancel(); }
    else if (event.key === 'Enter' && event.target === input.current) { event.preventDefault(); event.stopPropagation(); commit(); }
  }}>
    <input ref={input} className="text-input" aria-label={label} type={type} step={type === 'number' ? 'any' : undefined}
      value={draft} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined}
      onChange={event => { setDraft(event.target.value); setError(''); }} />
    <div className="data-grid-editor-controls">
      <button type="button" className="icon-button" aria-label={`${label} 저장`} onClick={commit}><Icon name="check" /></button>
      <button type="button" className="icon-button" aria-label={`${label} 취소`} onClick={onCancel}><Icon name="close" /></button>
    </div>
    {error && <p className="data-grid-editor-error" id={errorId} role="alert">{error}</p>}
  </div>;
}

import * as React from 'react';
import { useValue } from '../../shared/use-value';
import { useFormReset } from '../../shared/use-form-reset';

export interface TreeNode { value: string; label: React.ReactNode; disabled?: boolean; children?: readonly TreeNode[] }

export interface TreeProps { items: readonly TreeNode[]; label: string; rootStyle?: 'tree' | 'category'; value?: string | null; defaultValue?: string | null; onValueChange?: (value: string) => void; expanded?: readonly string[]; defaultExpanded?: readonly string[]; onExpandedChange?: (values: string[]) => void; name?: string; className?: string }

export function Tree({items, label, rootStyle = 'tree', value, defaultValue = null, onValueChange, expanded, defaultExpanded = [], onExpandedChange, name, className}: TreeProps) {
  const [current, setCurrent, reset] = useValue<string | null>(value, defaultValue, next => { if (next !== null) onValueChange?.(next); });
  const [opened, setOpened, resetOpened] = useValue<readonly string[]>(expanded, defaultExpanded, next => onExpandedChange?.([...next]));
  const root = React.useRef<HTMLDivElement>(null);
  const id = React.useId();
  useFormReset(root, () => { reset(); resetOpened(); });
  const nodes = (entries: readonly TreeNode[], isRoot = false): React.ReactNode => entries.map((item, index) => {
    if (isRoot && rootStyle === 'category' && item.children?.length) {
      const headingId = `${id}-category-${index}`;
      return <div key={item.value} className="tree-category" role="group" aria-labelledby={headingId}><h3 id={headingId} className="tree-category-label">{item.label}</h3>{nodes(item.children)}</div>;
    }
    return item.children?.length ? <details key={item.value} open={opened.includes(item.value)}><summary aria-disabled={item.disabled || undefined} onClick={event => { event.preventDefault(); if (!item.disabled) setOpened(opened.includes(item.value) ? opened.filter(key => key !== item.value) : [...opened, item.value]); }}><span>{item.label}</span></summary><div className="tree-children">{nodes(item.children)}</div></details> : <button key={item.value} type="button" className={`tree-item${current === item.value ? ' is-selected' : ''}`} aria-current={current === item.value ? 'true' : undefined} disabled={item.disabled} onClick={() => setCurrent(item.value)}>{item.label}</button>;
  });
  return <div ref={root} className={`demo-tree${className ? ` ${className}` : ''}`} role="group" aria-label={label} data-root-style={rootStyle}>{name && <input type="hidden" name={name} value={current ?? ''} />}{nodes(items, true)}</div>;
}

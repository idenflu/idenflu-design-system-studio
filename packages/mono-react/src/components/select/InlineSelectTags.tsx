import * as React from 'react';
import { type SelectOption } from './Select';

const useClientLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
function tagLimit(value: number | 'responsive' | undefined) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : Infinity;
}

interface InlineSelectTagsProps {
  label: string;
  placeholder: string;
  options: readonly SelectOption[];
  disabled?: boolean;
  maxVisibleTags?: number | 'responsive';
  open: boolean;
  listId: string;
  onRemove: (value: string) => void;
  onOpen: () => void;
  onFocusControl: () => void;
}

export function InlineSelectTags({label, placeholder, options, disabled, maxVisibleTags, open, listId, onRemove, onOpen, onFocusControl}: InlineSelectTagsProps) {
  const host = React.useRef<HTMLDivElement>(null);
  const measure = React.useRef<HTMLDivElement>(null);
  const focusControl = React.useRef(onFocusControl);
  focusControl.current = onFocusControl;
  const limit = tagLimit(maxVisibleTags);
  const [fitted, setFitted] = React.useState(() => Math.min(options.length, limit));
  const visibleCount = Math.min(fitted, options.length, limit);
  const hiddenCount = options.length - visibleCount;

  useClientLayoutEffect(() => {
    const element = host.current, metrics = measure.current;
    const win = element?.ownerDocument.defaultView;
    if (!element || !metrics || !win) return;
    let active = true;
    const update = () => {
      if (!active) return;
      const style = win.getComputedStyle(element);
      const available = element.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
      if (available <= 0) { setFitted(previous => { const next = Math.min(options.length, limit); return previous === next ? previous : next; }); return; }
      const gap = parseFloat(style.columnGap) || 0;
      const widths = [...metrics.querySelectorAll<HTMLElement>('[data-tag-metric]')].map(node => node.getBoundingClientRect().width);
      const moreWidth = metrics.querySelector<HTMLElement>('[data-more-metric]')?.getBoundingClientRect().width || 0;
      const allWidth = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, widths.length - 1) * gap;
      let count = 0, used = 0;
      if (widths.length <= limit && allWidth <= available) count = widths.length;
      else {
        const budget = available - moreWidth - gap;
        while (count < Math.min(widths.length, limit)) {
          const next = used + (count ? gap : 0) + widths[count];
          if (next > budget) break;
          used = next;
          count++;
        }
        // Keep one recognizable label when it can be truncated beside the count.
        if (!count && limit > 0 && widths.length && budget >= Math.min(widths[0], 56)) count = 1;
      }
      const focused = element.ownerDocument.activeElement as HTMLElement | null;
      const index = focused?.getAttribute('data-selected-tag-index');
      if (element.contains(focused) && ((index != null && Number(index) >= count) || (focused?.matches('button.multi-inline-more') && count === options.length))) focusControl.current();
      element.style.setProperty('--multi-more-width', `${moreWidth}px`);
      setFitted(previous => previous === count ? previous : count);
    };
    update();
    const Observer = (win as Window & {ResizeObserver?: typeof ResizeObserver}).ResizeObserver;
    const observer = Observer ? new Observer(update) : null;
    observer?.observe(element);
    for (const node of metrics.children) observer?.observe(node);
    win.addEventListener('resize', update);
    void element.ownerDocument.fonts?.ready.then(update);
    return () => { active = false; observer?.disconnect(); win.removeEventListener('resize', update); };
  }, [options, limit]);

  const content = (option: SelectOption) => <>
    {option.icon && <span className="select-option-icon" aria-hidden="true">{option.icon}</span>}
    <span className="multi-inline-chip-label">{option.label}</span>
    <span className="ui-icon icon-close" aria-hidden="true" />
  </>;
  return <div ref={host} className={`multi-inline-tags${hiddenCount ? ' has-overflow' : ''}`} role="group" aria-label={`${label} 선택 항목`}>
    {options.length ? options.slice(0, visibleCount).map((option, index) => <button key={option.value} type="button" className="chip multi-inline-chip" data-selected-tag-index={index} aria-label={`${option.label} 제거`} disabled={disabled || option.disabled} onClick={() => onRemove(option.value)}>{content(option)}</button>) : <span className="multi-inline-placeholder">{placeholder}</span>}
    {hiddenCount > 0 && <button className="multi-inline-more" type="button" disabled={disabled} aria-label={`${label} 선택 항목 ${hiddenCount}개 더 보기`} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} onClick={onOpen}>+{hiddenCount}개</button>}
    <div ref={measure} className="multi-inline-metrics" aria-hidden="true">
      {options.map(option => <span key={option.value} className="chip multi-inline-tag-metric" data-tag-metric>{content(option)}</span>)}
      <span className="multi-inline-more" data-more-metric>+{options.length}개</span>
    </div>
  </div>;
}

import * as React from 'react';
import { useClientLayoutEffect } from '../../shared/use-client-layout-effect';

/** Tooltip content is exposed as the trigger's accessible description. */
export function Tooltip({ content, children, position: placement = 'top' }: { content: React.ReactNode; position?: 'top' | 'bottom' | 'left' | 'right'; children: React.ReactElement<{ 'aria-describedby'?: string }> }) {
  const id = React.useId();
  const [dismissed, setDismissed] = React.useState(false);
  const wrap = React.useRef<HTMLSpanElement>(null);
  const bubble = React.useRef<HTMLSpanElement>(null);
  const position = React.useCallback(() => {
    const element = bubble.current;
    if (!element?.getClientRects().length) return;
    element.style.transform = '';
    const bounds = element.getBoundingClientRect();
    const width = element.ownerDocument.documentElement.clientWidth;
    const shift = Math.max(12 - bounds.left, Math.min(0, width - 12 - bounds.right));
    element.style.transform = shift ? `translateX(${shift}px)` : '';
  }, []);
  useClientLayoutEffect(() => {
    position();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(position);
    if (wrap.current) observer?.observe(wrap.current);
    if (bubble.current) observer?.observe(bubble.current);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => { observer?.disconnect(); window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true); };
  }, [position, content]);
  React.useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || dismissed || !wrap.current || !(wrap.current.matches(':hover') || wrap.current.contains(document.activeElement))) return;
      const dialog = wrap.current.ownerDocument.querySelector('dialog[open]');
      if (dialog && !dialog.contains(wrap.current)) return;
      setDismissed(true); event.preventDefault(); event.stopPropagation();
    };
    document.addEventListener('keydown', escape, true);
    return () => document.removeEventListener('keydown', escape, true);
  }, [dismissed]);
  const existing = children.props['aria-describedby'];
  return <span ref={wrap} data-position={placement} className={`tooltip-wrap${dismissed ? ' tooltip-dismissed' : ''}`}
    onMouseEnter={() => { position(); setDismissed(false); }}
    onFocus={event => { position(); if (!event.currentTarget.contains(event.relatedTarget)) setDismissed(false); }}
    onClickCapture={() => setDismissed(true)}>
    {React.cloneElement(children, { 'aria-describedby': [existing, id].filter(Boolean).join(' ') })}
    <span ref={bubble} id={id} role="tooltip" className="tooltip-content">{content}</span>
  </span>;
}

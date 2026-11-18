import * as React from 'react';
import { clampPopupPosition, popupViewport, useAnchoredPopup } from '../../shared/popup-position';

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';
const oppositeSide: Record<TooltipSide, TooltipSide> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

/** Tooltip content is exposed as the trigger's accessible description. */
export function Tooltip({ content, children, position: placement = 'top', enterDelay = 0, leaveDelay = 0 }: { content: React.ReactNode; position?: TooltipSide; enterDelay?: number; leaveDelay?: number; children: React.ReactElement<{ 'aria-describedby'?: string }> }) {
  const id = React.useId();
  const [dismissed, setDismissed] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const hovered = React.useRef(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrap = React.useRef<HTMLSpanElement>(null);
  const bubble = React.useRef<HTMLSpanElement>(null);
  const cancelTimer = () => { clearTimeout(timer.current); timer.current = undefined; };
  const schedule = (visible: boolean, delay: number) => {
    cancelTimer();
    if (delay > 0) timer.current = setTimeout(() => setOpen(visible), delay);
    else setOpen(visible);
  };
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const position = React.useCallback((anchor: HTMLElement, element: HTMLElement, view: Window, topLayer: boolean) => {
    const viewport = popupViewport(element, view);
    if (!topLayer) {
      element.style.transform = '';
      const bounds = element.getBoundingClientRect();
      const left = clampPopupPosition(bounds.left, viewport.left, viewport.right, bounds.width);
      element.style.transform = left === bounds.left ? '' : `translateX(${left - bounds.left}px)`;
      return;
    }

    const bounds = element.getBoundingClientRect();
    const trigger = anchor.getBoundingClientRect();
    const gap = Number.parseFloat(view.getComputedStyle(element).paddingTop);
    const available = {
      top: trigger.top - viewport.top, bottom: viewport.bottom - trigger.bottom,
      left: trigger.left - viewport.left, right: viewport.right - trigger.right,
    };
    const size = placement === 'top' || placement === 'bottom' ? bounds.height : bounds.width;
    const opposite = oppositeSide[placement];
    const side = available[placement] < size + gap && available[opposite] > available[placement] ? opposite : placement;
    const icon = anchor.querySelector('.icon-button, .button--icon');
    const left = side === 'left' ? trigger.left - gap - bounds.width
      : side === 'right' ? trigger.right + gap
      : icon ? trigger.right - bounds.width : trigger.left;
    const top = side === 'top' ? trigger.top - gap - bounds.height
      : side === 'bottom' ? trigger.bottom + gap : trigger.top + (trigger.height - bounds.height) / 2;
    element.dataset.side = side;
    element.style.left = `${clampPopupPosition(left, viewport.left, viewport.right, bounds.width)}px`;
    element.style.top = `${clampPopupPosition(top, viewport.top, viewport.bottom, bounds.height)}px`;
  }, [placement]);
  useAnchoredPopup(open && !dismissed, wrap, bubble, position);
  React.useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || dismissed || !wrap.current) return;
      if (!wrap.current.matches(':hover') && !bubble.current?.matches(':hover') && !wrap.current.contains(document.activeElement)) return;
      const dialog = wrap.current.ownerDocument.querySelector('dialog[open]');
      if (dialog && !dialog.contains(wrap.current)) return;
      cancelTimer(); setOpen(false); setDismissed(true); event.preventDefault(); event.stopPropagation();
    };
    document.addEventListener('keydown', escape, true);
    return () => document.removeEventListener('keydown', escape, true);
  }, [dismissed]);
  const existing = children.props['aria-describedby'];
  return <span ref={wrap} data-position={placement} className={`tooltip-wrap${open && !dismissed ? ' tooltip-open' : ''}`}
    onMouseEnter={() => { hovered.current = true; setDismissed(false); schedule(true, enterDelay); }}
    onMouseLeave={() => { hovered.current = false; if (!wrap.current?.contains(document.activeElement)) schedule(false, leaveDelay); }}
    onFocus={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setDismissed(false); schedule(true, 0); } }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && !hovered.current) schedule(false, leaveDelay); }}
    onClickCapture={() => { cancelTimer(); setOpen(false); setDismissed(true); }}>
    {React.cloneElement(children, { 'aria-describedby': [existing, id].filter(Boolean).join(' ') })}
    <span ref={bubble} id={id} role="tooltip" className="tooltip-content">{content}</span>
  </span>;
}

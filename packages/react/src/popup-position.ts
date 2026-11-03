import * as React from 'react';

export type PopupAlign = 'start' | 'center' | 'end';

const useClientLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
const viewportPadding = 12;

/** Align against the trigger in viewport coordinates, regardless of the popup's containing block. */
export function usePopupPosition(open: boolean, align: PopupAlign, trigger: React.RefObject<HTMLElement | null>, popup: React.RefObject<HTMLElement | null>) {
  const position = React.useCallback(() => {
    const anchor = trigger.current, element = popup.current;
    if (!anchor || !element || element.hidden) return;
    const document = element.ownerDocument, view = document.defaultView;
    if (!view) return;

    // Measuring left:0 includes offset-parent borders, scrolling and fixed positioning.
    element.style.left = '0px';
    element.style.right = 'auto';
    const bounds = element.getBoundingClientRect(), anchorBounds = anchor.getBoundingClientRect();
    const rtl = view.getComputedStyle(anchor).direction === 'rtl';
    const preferredLeft = align === 'center'
      ? anchorBounds.left + (anchorBounds.width - bounds.width) / 2
      : (align === 'start') !== rtl ? anchorBounds.left : anchorBounds.right - bounds.width;
    const viewport = view.visualViewport;
    const viewportLeft = viewport?.offsetLeft ?? 0;
    const viewportWidth = Math.min(document.documentElement.clientWidth || view.innerWidth, viewport?.width ?? Infinity);
    const minLeft = viewportLeft + viewportPadding;
    const maxLeft = Math.max(minLeft, viewportLeft + viewportWidth - viewportPadding - bounds.width);
    const left = Math.max(minLeft, Math.min(preferredLeft, maxLeft));
    const scale = element.offsetWidth ? bounds.width / element.offsetWidth : 1;
    element.style.left = `${(left - bounds.left) / (scale || 1)}px`;
  }, [align, trigger, popup]);

  // A render may move the trigger or replace popup content without changing its size.
  useClientLayoutEffect(() => { if (open) position(); });
  useClientLayoutEffect(() => {
    if (!open) return;
    const element = popup.current, anchor = trigger.current, view = element?.ownerDocument.defaultView;
    if (!element || !anchor || !view) return;
    const observer = typeof view.ResizeObserver === 'undefined' ? null : new view.ResizeObserver(position);
    observer?.observe(anchor);
    observer?.observe(element);
    view.addEventListener('resize', position);
    view.addEventListener('scroll', position, true);
    view.visualViewport?.addEventListener('resize', position);
    view.visualViewport?.addEventListener('scroll', position);
    return () => {
      observer?.disconnect();
      view.removeEventListener('resize', position);
      view.removeEventListener('scroll', position, true);
      view.visualViewport?.removeEventListener('resize', position);
      view.visualViewport?.removeEventListener('scroll', position);
    };
  }, [open, position, trigger, popup]);
}

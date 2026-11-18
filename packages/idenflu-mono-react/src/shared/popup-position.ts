import * as React from 'react';
import { useClientLayoutEffect } from './use-client-layout-effect';

export type PopupAlign = 'start' | 'center' | 'end';

type PositionPopup = (anchor: HTMLElement, element: HTMLElement, view: Window, topLayer: boolean) => void;

export function useAnchoredPopup(
  open: boolean,
  trigger: React.RefObject<HTMLElement | null>,
  popup: React.RefObject<HTMLElement | null>,
  position: PositionPopup,
) {
  const update = React.useCallback(() => {
    const anchor = trigger.current, element = popup.current;
    const view = element?.ownerDocument.defaultView;
    if (!anchor || !element || !view) return;
    const supportsPopover = typeof element.showPopover === 'function';
    const rendered = open && (!supportsPopover || anchor.getClientRects().length > 0);
    if (supportsPopover) {
      const shown = element.matches(':popover-open');
      // Wait for a containing dialog or popup to render its trigger before raising this layer.
      if (rendered && !shown) {
        element.setAttribute('popover', 'manual');
        element.showPopover();
      } else if (!rendered && shown) {
        element.hidePopover();
      }
    }
    if (rendered) position(anchor, element, view, supportsPopover);
  }, [open, position, trigger, popup]);

  // A render can move the trigger without changing its size.
  useClientLayoutEffect(update);
  useClientLayoutEffect(() => {
    if (!open) return;
    const element = popup.current, anchor = trigger.current, view = element?.ownerDocument.defaultView;
    if (!element || !anchor || !view) return;
    const Observer = (view as Window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    const observer = Observer ? new Observer(update) : null;
    observer?.observe(anchor);
    observer?.observe(element);
    view.addEventListener('resize', update);
    view.addEventListener('scroll', update, true);
    view.visualViewport?.addEventListener('resize', update);
    view.visualViewport?.addEventListener('scroll', update);
    return () => {
      observer?.disconnect();
      view.removeEventListener('resize', update);
      view.removeEventListener('scroll', update, true);
      view.visualViewport?.removeEventListener('resize', update);
      view.visualViewport?.removeEventListener('scroll', update);
    };
  }, [open, popup, trigger, update]);
}

export function popupViewport(element: HTMLElement, view: Window) {
  const viewport = view.visualViewport;
  const { clientWidth, clientHeight } = element.ownerDocument.documentElement;
  const left = (viewport?.offsetLeft ?? 0) + 12;
  const top = (viewport?.offsetTop ?? 0) + 12;
  const right = left + Math.min(clientWidth || view.innerWidth, viewport?.width ?? Infinity) - 24;
  const bottom = top + Math.min(clientHeight || view.innerHeight, viewport?.height ?? Infinity) - 24;
  return { left, top, right, bottom };
}

export function clampPopupPosition(value: number, start: number, end: number, size: number) {
  return Math.max(start, Math.min(value, end - size));
}

export function usePopupPosition(open: boolean, align: PopupAlign, trigger: React.RefObject<HTMLElement | null>, popup: React.RefObject<HTMLElement | null>) {
  const position = React.useCallback<PositionPopup>((anchor, element, view, topLayer) => {
    if (!topLayer) {
      // Measuring left:0 includes offset-parent borders, scrolling and transforms.
      element.style.left = '0px';
      element.style.right = 'auto';
    }
    const bounds = element.getBoundingClientRect(), anchorBounds = anchor.getBoundingClientRect();
    const rtl = view.getComputedStyle(anchor).direction === 'rtl';
    const preferredLeft = align === 'center'
      ? anchorBounds.left + (anchorBounds.width - bounds.width) / 2
      : (align === 'start') !== rtl ? anchorBounds.left : anchorBounds.right - bounds.width;
    const viewport = popupViewport(element, view);
    const left = clampPopupPosition(preferredLeft, viewport.left, viewport.right, bounds.width);
    if (topLayer) {
      const below = anchorBounds.bottom + 6;
      const above = anchorBounds.top - 6 - bounds.height;
      element.style.left = `${left}px`;
      element.style.top = `${below + bounds.height > viewport.bottom && above >= viewport.top ? above : below}px`;
    } else {
      const scale = element.offsetWidth ? bounds.width / element.offsetWidth : 1;
      element.style.left = `${(left - bounds.left) / (scale || 1)}px`;
    }
  }, [align]);
  useAnchoredPopup(open, trigger, popup, position);
}

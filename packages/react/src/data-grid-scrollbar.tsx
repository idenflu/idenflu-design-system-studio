import * as React from 'react';

export type DataGridPrepareScrollRef = React.RefObject<((offset:number) => void) | null>;

interface Props {
  enabled: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  prepareScrollRef: DataGridPrepareScrollRef;
  controls: string;
  label: string;
}

/** A thumb gesture commits its destination rows before moving the scrollport. */
export function DataGridScrollbar({enabled, scrollRef, prepareScrollRef, controls, label}: Props) {
  const rail = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{pointer:number; grab:number} | null>(null);
  const [supported, setSupported] = React.useState(false);
  const [metrics, setMetrics] = React.useState({height:0, extent:0, offset:0});
  React.useEffect(() => {
    const element = scrollRef.current, win = element?.ownerDocument.defaultView;
    if (!element || !win || !enabled || !win.matchMedia || !win.CSS?.supports) return;
    const media = win.matchMedia('(pointer:fine)');
    const updateSupport = () => setSupported(media.matches && win.CSS.supports('selector(::-webkit-scrollbar)'));
    updateSupport(); media.addEventListener('change', updateSupport);
    return () => media.removeEventListener('change', updateSupport);
  }, [enabled, scrollRef]);

  React.useEffect(() => {
    const element = scrollRef.current, win = element?.ownerDocument.defaultView;
    if (!element || !win || !enabled || !supported) return;
    const update = () => {
      const next = {height:element.clientHeight, extent:element.scrollHeight, offset:element.scrollTop};
      setMetrics(previous => previous.height === next.height && previous.extent === next.extent && previous.offset === next.offset ? previous : next);
    };
    update(); element.addEventListener('scroll', update, {passive:true});
    const observer = new win.ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => {observer.disconnect();element.removeEventListener('scroll', update);};
  }, [enabled, supported, scrollRef]);

  const visible = enabled && supported && metrics.extent > metrics.height && metrics.height > 0;
  React.useEffect(() => {
    const element = scrollRef.current;
    element?.toggleAttribute('data-custom-scrollbar', visible);
    return () => element?.removeAttribute('data-custom-scrollbar');
  }, [visible, scrollRef]);

  const max = Math.max(0, metrics.extent - metrics.height);
  const thumbHeight = Math.min(metrics.height, Math.max(24, metrics.height * metrics.height / Math.max(1, metrics.extent)));
  const thumbOffset = max ? Math.max(0, Math.min(max, metrics.offset)) / max * (metrics.height - thumbHeight) : 0;
  const moveTo = React.useCallback((offset:number) => {
    const element = scrollRef.current;
    if (!element) return;
    const next = Math.max(0, Math.min(element.scrollHeight - element.clientHeight, offset));
    // The virtualizer's offset observer flushes the row window synchronously.
    // Native scrollbar dragging can scroll the compositor before that window
    // exists; a DOM thumb lets us prepare it before writing scrollTop.
    prepareScrollRef.current?.(next);
    element.scrollTop = next;
    setMetrics({height:element.clientHeight, extent:element.scrollHeight, offset:element.scrollTop});
  }, [scrollRef, prepareScrollRef]);
  React.useEffect(() => {
    const target = rail.current, element = scrollRef.current;
    if (!visible || !target || !element) return;
    const wheel = (event:WheelEvent) => {
      if (event.ctrlKey) return;
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1;
      const next = Math.max(0, Math.min(element.scrollHeight - element.clientHeight, element.scrollTop + event.deltaY * scale));
      if (next === element.scrollTop) return;
      event.preventDefault();moveTo(next);
    };
    target.addEventListener('wheel', wheel, {passive:false});
    return () => target.removeEventListener('wheel', wheel);
  }, [visible, scrollRef, moveTo]);
  const movePointer = (event:React.PointerEvent<HTMLDivElement>, grab:number) => {
    const element = scrollRef.current;
    if (!element) return;
    const height = element.clientHeight, extent = element.scrollHeight;
    const thumb = Math.min(height, Math.max(24, height * height / Math.max(1, extent)));
    const position = event.clientY - event.currentTarget.getBoundingClientRect().top - grab;
    moveTo(position / Math.max(1, height - thumb) * (extent - height));
  };
  const finish = (event:React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  if (!visible) return null;
  return <div ref={rail} className="data-grid-scrollbar" style={{height:metrics.height}} role="scrollbar" tabIndex={0}
    aria-label={label} aria-controls={controls} aria-orientation="vertical"
    aria-valuemin={0} aria-valuemax={Math.round(max)} aria-valuenow={Math.round(Math.max(0, Math.min(max, metrics.offset)))}
    onKeyDown={event => {
      if (event.key === 'Escape' && drag.current) {
        event.preventDefault();event.stopPropagation();
        const pointer = drag.current.pointer;drag.current = null;
        if (event.currentTarget.hasPointerCapture(pointer)) event.currentTarget.releasePointerCapture(pointer);
        return;
      }
      const element = scrollRef.current;
      if (!element || !['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const page = Math.max(40, element.clientHeight - (element.querySelector('thead')?.getBoundingClientRect().height ?? 0));
      moveTo(event.key === 'Home' ? 0 : event.key === 'End' ? element.scrollHeight - element.clientHeight : element.scrollTop + (event.key === 'ArrowUp' ? -40 : event.key === 'ArrowDown' ? 40 : event.key === 'PageUp' ? -page : page));
    }} onPointerDown={event => {
      if (event.button !== 0) return;
      event.preventDefault();event.currentTarget.focus({preventScroll:true});
      const point = event.clientY - event.currentTarget.getBoundingClientRect().top;
      const grab = point >= thumbOffset && point <= thumbOffset + thumbHeight ? point - thumbOffset : thumbHeight / 2;
      drag.current = {pointer:event.pointerId, grab};
      event.currentTarget.setPointerCapture(event.pointerId);
      movePointer(event, grab);
    }} onPointerMove={event => {
      if (drag.current?.pointer === event.pointerId) movePointer(event, drag.current.grab);
    }} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={() => {drag.current = null;}}>
    <div className="data-grid-scrollbar-thumb" style={{height:thumbHeight, transform:`translateY(${thumbOffset}px)`}} />
  </div>;
}

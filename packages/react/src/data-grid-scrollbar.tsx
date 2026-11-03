import * as React from 'react';

export type DataGridPrepareScrollRef = React.RefObject<((offset:number) => void) | null>;
interface Props {
  enabled: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  headerRef: React.RefObject<HTMLTableSectionElement | null>;
  prepareScrollRef: DataGridPrepareScrollRef;
  controls: string;
  label: string;
}

/** Native scrollbar surfaces keep compositor dragging separate from the rows. */
export function DataGridScrollbar({enabled, scrollRef, headerRef, prepareScrollRef, controls, label}: Props) {
  const vertical = React.useRef<HTMLDivElement>(null), horizontal = React.useRef<HTMLDivElement>(null);
  const [metrics,setMetrics] = React.useState({width:0,height:0,extent:0,breadth:0,top:0,left:0,header:0,size:15});
  const [extent,setExtent] = React.useState({height:0,width:0});
  const size = React.useRef(15);
  const synced = React.useRef<{top:number|null;left:number|null}>({top:null,left:null});
  const active = React.useRef({top:false,left:false});
  const dragging = React.useRef<{axis:'top'|'left';pointer:number} | null>(null);
  const settle = React.useRef<{top?:number;left?:number}>({});
  const refreshExtent = React.useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    setExtent(previous => {
      const height = active.current.top ? previous.height : element.scrollHeight;
      const width = active.current.left ? previous.width : element.scrollWidth;
      return height === previous.height && width === previous.width ? previous : {height,width};
    });
  },[scrollRef]);
  const syncControls = React.useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    if (!active.current.top && vertical.current && vertical.current.scrollTop !== element.scrollTop) {
      vertical.current.scrollTop = element.scrollTop;
      synced.current.top = vertical.current.scrollTop;
    }
    if (!active.current.left && horizontal.current && horizontal.current.scrollLeft !== element.scrollLeft) {
      horizontal.current.scrollLeft = element.scrollLeft;
      synced.current.left = horizontal.current.scrollLeft;
    }
  },[scrollRef]);
  React.useEffect(() => {
    const element = scrollRef.current, win = element?.ownerDocument.defaultView;
    if (!element || !win || !enabled || !win.ResizeObserver) return;
    const update = () => {
      if (!element.hasAttribute('data-native-scrollbars')) {
        const style = win.getComputedStyle(element);
        const gutter = Math.max(element.offsetWidth - element.clientWidth - (parseFloat(style.borderLeftWidth)||0) - (parseFloat(style.borderRightWidth)||0), element.offsetHeight - element.clientHeight - (parseFloat(style.borderTopWidth)||0) - (parseFloat(style.borderBottomWidth)||0));
        if (gutter > 0) size.current = gutter;
      }
      const next = {width:element.clientWidth,height:element.clientHeight,extent:element.scrollHeight,breadth:element.scrollWidth,top:element.scrollTop,left:element.scrollLeft,header:headerRef.current?.getBoundingClientRect().height ?? 0,size:size.current};
      refreshExtent();
      syncControls();
      setMetrics(previous => Object.keys(next).every(key => next[key as keyof typeof next] === previous[key as keyof typeof next]) ? previous : next);
    };
    update();element.addEventListener('scroll',update,{passive:true});
    const cancel = () => {
      active.current = {top:false,left:false};
      dragging.current = null;
      win.clearTimeout(settle.current.top);win.clearTimeout(settle.current.left);
      refreshExtent();
    };
    element.addEventListener('wheel',cancel,{passive:true});
    element.addEventListener('touchstart',cancel,{passive:true});
    element.addEventListener('keydown',cancel);
    const observer = new win.ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    if (headerRef.current) observer.observe(headerRef.current);
    return () => {observer.disconnect();element.removeEventListener('scroll',update);element.removeEventListener('wheel',cancel);element.removeEventListener('touchstart',cancel);element.removeEventListener('keydown',cancel);active.current = {top:false,left:false};win.clearTimeout(settle.current.top);win.clearTimeout(settle.current.left);};
  },[enabled,scrollRef,headerRef,syncControls,refreshExtent]);
  const showVertical = enabled && metrics.extent > metrics.height && metrics.height > metrics.header;
  const showHorizontal = enabled && metrics.breadth > metrics.width && metrics.width > 0;
  React.useEffect(syncControls,[extent.height,extent.width,metrics.height,metrics.width,showVertical,showHorizontal,syncControls]);
  React.useEffect(() => {
    const element = scrollRef.current;
    element?.toggleAttribute('data-native-scrollbars',showVertical || showHorizontal);
    return () => element?.removeAttribute('data-native-scrollbars');
  },[showVertical,showHorizontal,scrollRef]);
  const move = React.useCallback((axis:'top'|'left',offset:number) => {
    const element = scrollRef.current;
    if (!element) return;
    const next = Math.max(0,Math.min(axis === 'top' ? element.scrollHeight-element.clientHeight : element.scrollWidth-element.clientWidth,offset));
    if (axis === 'top' && next !== element.scrollTop) prepareScrollRef.current?.(next);
    if (axis === 'top') element.scrollTop = next;
    else element.scrollLeft = next;
    syncControls();
  },[scrollRef,prepareScrollRef,syncControls]);
  const finishAxis = React.useCallback((axis:'top'|'left') => {
    const control = axis === 'top' ? vertical.current : horizontal.current;
    const atEnd = control && (axis === 'top' ? control.scrollTop >= control.scrollHeight-control.clientHeight-1 : control.scrollLeft >= control.scrollWidth-control.clientWidth-1);
    active.current[axis] = false;refreshExtent();
    const element = scrollRef.current;
    if (atEnd && element) move(axis,axis === 'top' ? element.scrollHeight-element.clientHeight : element.scrollWidth-element.clientWidth);
    else syncControls();
  },[refreshExtent,scrollRef,move,syncControls]);
  React.useEffect(() => {
    const win = scrollRef.current?.ownerDocument.defaultView;
    if (!enabled || !win) return;
    const release = (event:PointerEvent) => {
      const gesture = dragging.current;
      if (!gesture || gesture.pointer !== event.pointerId) return;
      dragging.current = null;
      win.setTimeout(() => finishAxis(gesture.axis),0);
    };
    win.addEventListener('pointerup',release,true);win.addEventListener('pointercancel',release,true);
    return () => {win.removeEventListener('pointerup',release,true);win.removeEventListener('pointercancel',release,true);dragging.current = null;};
  },[enabled,scrollRef,finishAxis]);
  const start = (axis:'top'|'left',event:React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragging.current = {axis,pointer:event.pointerId};active.current[axis] = true;
    event.currentTarget.ownerDocument.defaultView?.clearTimeout(settle.current[axis]);
  };
  const onScroll = (axis:'top'|'left',event:React.UIEvent<HTMLDivElement>) => {
    const offset = axis === 'top' ? event.currentTarget.scrollTop : event.currentTarget.scrollLeft;
    const expected = synced.current[axis];
    synced.current[axis] = null;
    // Resizing the virtual extent can temporarily clamp a synchronized thumb.
    // Its queued scroll event must not pull the real viewport back to that
    // stale position. Only user-originated offsets drive the rows.
    if (expected !== null && Math.abs(expected-offset) < 1) return;
    // While the native thumb is moving, it owns this axis. Writing the
    // viewport's previous scroll event back into that thumb would cancel or
    // reverse the next compositor step of a fast drag.
    active.current[axis] = true;
    move(axis,offset);
    const win = event.currentTarget.ownerDocument.defaultView;
    win?.clearTimeout(settle.current[axis]);
    settle.current[axis] = win?.setTimeout(() => {if (dragging.current?.axis !== axis) finishAxis(axis);},150);
  };
  const key = (axis:'top'|'left',event:React.KeyboardEvent<HTMLDivElement>) => {
    const element=scrollRef.current;
    if (!element || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End'].includes(event.key)) return;
    event.preventDefault();
    active.current[axis] = false;
    if (dragging.current?.axis === axis) dragging.current = null;
    event.currentTarget.ownerDocument.defaultView?.clearTimeout(settle.current[axis]);
    refreshExtent();
    const current = axis === 'top' ? element.scrollTop : element.scrollLeft;
    const max = axis === 'top' ? element.scrollHeight-element.clientHeight : element.scrollWidth-element.clientWidth;
    const page = axis === 'top' ? element.clientHeight-metrics.header : element.clientWidth;
    move(axis,event.key === 'Home' ? 0 : event.key === 'End' ? max : current + (event.key === 'PageUp' ? -page : event.key === 'PageDown' ? page : ['ArrowUp','ArrowLeft'].includes(event.key) ? -40 : 40));
  };
  return <>
    {showVertical && <><div className="data-grid-scrollbar-header" aria-hidden="true" style={{width:metrics.size,height:metrics.header+1}} />
      <div ref={vertical} className="data-grid-native-vertical" role="scrollbar" tabIndex={0} aria-label={label} aria-controls={controls} aria-orientation="vertical" aria-valuemin={0} aria-valuemax={Math.max(0,metrics.extent-metrics.height)} aria-valuenow={Math.max(0,metrics.top)}
        style={{width:metrics.size,height:Math.max(0,metrics.height-metrics.header),marginTop:metrics.header+1}}
        onPointerDownCapture={event=>start('top',event)} onScroll={event=>onScroll('top',event)} onKeyDown={event=>key('top',event)}>
        <div aria-hidden="true" style={{width:1,height:Math.max(0,extent.height-metrics.header)}} />
      </div></>}
    {showHorizontal && <div ref={horizontal} className="data-grid-native-horizontal" role="scrollbar" tabIndex={0} aria-label={label.replace('세로','가로')} aria-controls={controls} aria-orientation="horizontal" aria-valuemin={0} aria-valuemax={Math.max(0,metrics.breadth-metrics.width)} aria-valuenow={Math.max(0,metrics.left)}
      style={{height:metrics.size}} onPointerDownCapture={event=>start('left',event)} onScroll={event=>onScroll('left',event)} onKeyDown={event=>key('left',event)}>
      <div aria-hidden="true" style={{height:1,width:extent.width}} />
    </div>}
    {showVertical && showHorizontal && <div aria-hidden="true" className="data-grid-scrollbar-corner" style={{width:metrics.size,height:metrics.size}} />}
  </>;
}

import * as React from 'react';
import { defaultRangeExtractor, measureElement, observeElementOffset, useVirtualizer, type Range, type Virtualizer } from '@tanstack/react-virtual';
import type { DataGridPrepareScrollRef } from './DataGridScrollbar';

export interface DataGridVirtualizationOptions {
  /** Initial estimate only. Mounted rows are measured at their actual height. */
  estimateRowHeight?: number;
  /** Extra rows before and after the viewport. Defaults to 8. */
  overscan?: number;
}

interface Options<T> {
  enabled: boolean;
  rows: readonly T[];
  getRowId: (row: T) => string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  headerRef: React.RefObject<HTMLTableSectionElement | null>;
  keepRowIds: readonly string[];
  options?: DataGridVirtualizationOptions;
  density: 'default' | 'compact';
  headerRows: number;
  maxHeight?: number | string;
  resetKey: string;
  measureKey: string;
  prepareScrollRef: DataGridPrepareScrollRef;
}

export function useDataGridVirtualization<T>({enabled, rows, getRowId, scrollRef, headerRef, keepRowIds, options, density, headerRows, maxHeight, resetKey, measureKey, prepareScrollRef}: Options<T>) {
  const defaultEstimate = density === 'compact' ? 40 : 56;
  const requestedEstimate = options?.estimateRowHeight;
  const estimate = requestedEstimate !== undefined && Number.isFinite(requestedEstimate) && requestedEstimate > 0
    ? Math.min(1000, Math.max(16, requestedEstimate)) : defaultEstimate;
  const requestedOverscan = options?.overscan;
  const overscan = requestedOverscan !== undefined && Number.isFinite(requestedOverscan) && requestedOverscan >= 0
    ? Math.min(100, Math.floor(requestedOverscan)) : 8;
  const initialHeight = typeof maxHeight === 'number' && Number.isFinite(maxHeight) && maxHeight > 0 ? maxHeight : 480;
  const initialRect = React.useMemo(() => ({width:0, height:initialHeight}), [initialHeight]);
  const [headerHeight, setHeaderHeight] = React.useState((density === 'compact' ? 40 : 48) + (headerRows > 1 ? 56 : 0));
  const rowIds = React.useMemo(() => rows.map(getRowId), [rows, getRowId]);
  const indexes = React.useMemo(() => new Map(rowIds.map((key, index) => [key, index])), [rowIds]);
  const keptIndexes = React.useMemo(() => keepRowIds.flatMap(key => {
    const index = indexes.get(key);
    // Adjacent controls let native Tab/Shift+Tab continue to the next logical
    // record even with overscan=0. They do not bridge the unrendered gap.
    return index === undefined ? [] : [index - 1, index, index + 1].filter(value => value >= 0 && value < rows.length);
  }), [keepRowIds, indexes, rows.length]);
  const getItemKey = React.useCallback((index:number) => rowIds[index], [rowIds]);
  const estimateSize = React.useCallback(() => estimate, [estimate]);
  const getScrollElement = React.useCallback(() => scrollRef.current, [scrollRef]);
  const offsetObserver = React.useRef<((offset:number, scrolling:boolean) => void) | null>(null);
  const observeOffset = React.useCallback((instance:Virtualizer<HTMLDivElement, HTMLTableRowElement>, callback:(offset:number, scrolling:boolean) => void) => {
    offsetObserver.current = callback;
    const cleanup = observeElementOffset(instance, callback);
    return () => {if (offsetObserver.current === callback) offsetObserver.current = null;cleanup?.();};
  }, []);
  const rangeExtractor = React.useMemo(() => {
    let window: {start:number; end:number; count:number} | undefined;
    let indexes: number[] = [];
    return (range:Range) => {
      const margin = Math.floor(range.overscan / 2);
      // Keep the same DOM window until the viewport approaches its buffer.
      // Recycling a row on every boundary crossing otherwise repeatedly
      // changes native table layout and triggers fresh height measurements.
      if (!window || window.count !== range.count ||
        range.startIndex < window.start + (window.start > 0 ? margin : 0) ||
        range.endIndex > window.end - (window.end < range.count - 1 ? margin : 0)) {
        const visible = defaultRangeExtractor(range);
        window = {start:visible[0], end:visible[visible.length - 1], count:range.count};
        indexes = [...new Set([...visible, ...keptIndexes])].sort((a,b) => a-b);
      }
      return indexes;
    };
  }, [keptIndexes, overscan, enabled, resetKey, measureKey]);
  const measureRow = React.useCallback((element:HTMLTableRowElement, entry:ResizeObserverEntry | undefined, instance:Virtualizer<HTMLDivElement, HTMLTableRowElement>) => {
    const measured = measureElement(element, entry, instance);
    // A hidden tab and non-layout environments can report zero. Retaining the
    // estimate keeps the range bounded until real geometry becomes available.
    return Number.isFinite(measured) && measured > 0 ? measured : estimate;
  }, [estimate]);
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: enabled ? rows.length : 0,
    enabled,
    getScrollElement,
    observeElementOffset:observeOffset,
    getItemKey,
    estimateSize,
    measureElement:measureRow,
    overscan,
    rangeExtractor,
    scrollMargin:headerHeight,
    scrollPaddingStart:headerHeight,
    initialRect,
    onChange:instance => {
      // This visual-only flag does not need to re-render the grid's toolbar,
      // header filters and pagination on every scroll event.
      scrollRef.current?.toggleAttribute('data-scrolling', enabled && instance.isScrolling);
    },
  });
  virtualizer.shouldAdjustScrollPositionOnItemSizeChange = (item, _delta, instance) => {
    const offset = instance.scrollOffset ?? 0;
    const end = Math.max(0, instance.getTotalSize() + instance.options.scrollMargin - (instance.scrollRect?.height ?? initialHeight));
    // When a newly measured tail row grows beyond its estimate, retain a
    // scrollbar already at the end. Otherwise follow the virtualizer's
    // ordinary above-viewport anchoring without pulling a backward scroll.
    if (instance.scrollDirection !== 'backward' && offset >= end - 2) return true;
    return !instance.itemSizeCache.has(item.key) ? item.start < offset : item.end <= offset && instance.scrollDirection !== 'backward';
  };

  React.useEffect(() => {
    const header = headerRef.current;
    const win = header?.ownerDocument.defaultView;
    if (!header || !win || !enabled) return;
    const update = () => {
      const height = header.getBoundingClientRect().height;
      if (height > 0) setHeaderHeight(height);
    };
    update();
    const Observer = (win as Window & {ResizeObserver?: typeof ResizeObserver}).ResizeObserver;
    const observer = Observer ? new Observer(update) : null;
    observer?.observe(header);
    win.addEventListener('resize', update);
    return () => { observer?.disconnect(); win.removeEventListener('resize', update); };
  }, [enabled, headerRef, headerRows, density]);

  const previousWindow = React.useRef({enabled, resetKey, count:rows.length});
  React.useEffect(() => {
    const previous = previousWindow.current;
    previousWindow.current = {enabled, resetKey, count:rows.length};
    if ((!enabled && !previous.enabled) || (previous.enabled === enabled && previous.resetKey === resetKey && rows.length >= previous.count)) return;
    const element = scrollRef.current;
    if (!element) return;
    // Only the vertical axis is reset; pinned columns and horizontal position
    // remain stable when filters or pages change.
    element.scrollTop = 0;
    if (enabled) virtualizer.scrollToOffset(0, {behavior:'auto'});
  }, [enabled, resetKey, rows.length, scrollRef, virtualizer]);

  React.useEffect(() => {
    if (!enabled) return;
    virtualizer.measure();
    for (const row of scrollRef.current?.querySelectorAll<HTMLTableRowElement>('tbody tr[data-index]') || []) virtualizer.measureElement(row);
  }, [enabled, measureKey, estimate, scrollRef, virtualizer]);

  React.useEffect(() => {
    const element = scrollRef.current;
    if (!enabled) element?.removeAttribute('data-scrolling');
    return () => element?.removeAttribute('data-scrolling');
  }, [enabled, scrollRef]);

  React.useEffect(() => {
    prepareScrollRef.current = enabled ? offset => offsetObserver.current?.(offset, true) : null;
    return () => {prepareScrollRef.current = null;};
  }, [enabled, prepareScrollRef]);

  return {items:virtualizer.getVirtualItems(), totalSize:virtualizer.getTotalSize(), headerHeight, measureElement:virtualizer.measureElement};
}

interface BodyProps<T> extends Options<T> {
  columnCount: number;
  emptyContent?: React.ReactNode;
  renderRow: (row:T, index:number, measure?: (element:HTMLTableRowElement | null) => void) => React.ReactNode;
  onFocusCapture: React.FocusEventHandler<HTMLTableSectionElement>;
  onBlurCapture: React.FocusEventHandler<HTMLTableSectionElement>;
}

/** Keep scroll-driven updates local to the rows, apart from the grid controls. */
export function DataGridBody<T>({columnCount, emptyContent, renderRow, onFocusCapture, onBlurCapture, ...options}: BodyProps<T>) {
  const virtual = useDataGridVirtualization(options);
  const rendered: React.ReactNode[] = [];
  const spacer = (height:number, key:string) => React.createElement('tr', {key, className:'data-grid-virtual-spacer', 'aria-hidden':true, role:'presentation'}, React.createElement('td', {colSpan:columnCount, style:{height}}));
  if (emptyContent) rendered.push(emptyContent);
  else if (options.enabled) {
    let offset = 0;
    for (const item of virtual.items) {
      const start = Math.max(0, item.start - virtual.headerHeight);
      if (start > offset) rendered.push(spacer(start - offset, `spacer-${item.index}`));
      rendered.push(renderRow(options.rows[item.index], item.index, virtual.measureElement));
      offset = Math.max(offset, item.end - virtual.headerHeight);
    }
    if (virtual.totalSize > offset) rendered.push(spacer(virtual.totalSize - offset, 'spacer-end'));
  } else options.rows.forEach((row,index) => rendered.push(renderRow(row,index)));
  return React.createElement('tbody', {onFocusCapture, onBlurCapture}, rendered);
}

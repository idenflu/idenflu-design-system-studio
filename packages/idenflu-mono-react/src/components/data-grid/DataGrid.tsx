import * as React from 'react';
import { Button } from '../button/Button';
import { IconButton } from '../icon-button/IconButton';
import { Checkbox } from '../selection/Selection';
import { Icon } from '../icon/Icon';
import { Pagination } from '../pagination/Pagination';
import { Spinner } from '../spinner/Spinner';
import { Table } from '../table/Table';
import { TextField } from '../text-field/TextField';
import { Popover } from '../popover/Popover';
import { Tooltip } from '../tooltip/Tooltip';
import { MultiSelect, Select } from '../select/Select';
import { DataGridCellEditor, downloadDataGridCsv } from './DataGridTools';
import { downloadDataGridXlsx } from './data-grid-xlsx-download';
import { dataGridFileName, type DataGridExportFormat } from './data-grid-file';
import { DataGridBody, type DataGridVirtualizationOptions } from './data-grid-virtual';
import { DataGridScrollbar } from './DataGridScrollbar';
import { getDataGridColumnWidthBounds as widthBounds, resolveDataGridColumnWidths } from './data-grid-sizing';
import { resolveDataGridToolbarOrder, type DataGridToolbarItem } from './data-grid-toolbar';
export type { DataGridVirtualizationOptions } from './data-grid-virtual';
export type { DataGridToolbarItem } from './data-grid-toolbar';
export type { DataGridExportFormat } from './data-grid-file';

const useClientLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

export interface DataGridColumn<T> {
  id: string;
  header: string;
  accessor: (row: T) => string | number | null | undefined;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: number | string;
  /** Positive weight for distributing remaining viewport width; overrides width. */
  flex?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  pinned?: 'start';
  filter?: 'text' | 'number' | 'select' | 'multi-select';
  filterOptions?: readonly {value:string; label:string}[];
  editable?: boolean | ((row: T) => boolean);
  editor?: 'text' | 'number';
  validate?: (value: string, row: T) => string | undefined;
}
export interface DataGridSort { columnId: string; direction: 'asc' | 'desc' }
export type DataGridSortModel = readonly DataGridSort[];
export type DataGridFilters = Record<string, string | string[] | {min?: string; max?: string}>;
export interface DataGridCellEdit<T> { row: T; rowId: string; columnId: string; value: string }
export interface DataGridFooterContext<T> {
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  /** Sorted matching rows across all pages; empty while loading or errored. */
  filteredRows: readonly T[];
  /** All rows on the current page, including those outside a virtual window. */
  pageRows: readonly T[];
  /** Valid selected rows from the original data, including filtered-out rows. */
  selectedRows: readonly T[];
  page: number;
  pageCount: number;
  pageSize: number;
  pagination: boolean;
  loading: boolean;
  hasError: boolean;
}
export interface DataGridProps<T> {
  label: string;
  rows: readonly T[];
  columns: readonly DataGridColumn<T>[];
  getRowId: (row: T) => string;
  getRowLabel?: (row: T) => string;
  selectable?: boolean;
  /** Clicking non-interactive row content toggles selection. Defaults to true. */
  selectOnRowClick?: boolean;
  isRowSelectable?: (row: T) => boolean;
  selectedRowIds?: readonly string[];
  defaultSelectedRowIds?: readonly string[];
  onSelectedRowIdsChange?: (ids: string[]) => void;
  /** Additional actions shown in the top toolbar while rows are selected. */
  selectionActions?: React.ReactNode;
  /** Additional top-toolbar actions shown regardless of row selection. */
  toolbarActions?: React.ReactNode;
  /** Shared size for toolbar controls and column filters. Defaults to sm; body and footer sizes are unchanged. */
  toolbarSize?: 'sm' | 'md' | 'lg';
  /** Render these toolbar groups first, then append unspecified groups in default order. */
  toolbarOrder?: readonly DataGridToolbarItem[];
  searchable?: boolean;
  searchLabel?: string;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  filters?: DataGridFilters;
  defaultFilters?: DataGridFilters;
  onFiltersChange?: (filters: DataGridFilters) => void;
  sort?: DataGridSort | null;
  defaultSort?: DataGridSort | null;
  onSortChange?: (sort: DataGridSort | null) => void;
  /** Ordered multi-column sorting. Takes precedence over the legacy sort prop. */
  sortModel?: DataGridSortModel;
  defaultSortModel?: DataGridSortModel;
  onSortModelChange?: (sortModel: DataGridSort[]) => void;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  density?: 'default' | 'compact';
  defaultDensity?: 'default' | 'compact';
  onDensityChange?: (density: 'default' | 'compact') => void;
  /** A controlled density without onDensityChange remains read-only. */
  showDensityToggle?: boolean;
  /** Show an initially off control for column filters. Turning off clears them. */
  showColumnFilterToggle?: boolean;
  showColumnVisibility?: boolean;
  defaultHiddenColumnIds?: readonly string[];
  loading?: boolean;
  error?: React.ReactNode;
  onRetry?: () => void;
  emptyMessage?: React.ReactNode;
  maxHeight?: number | string;
  /** Changing this value resets both scroll axes without changing grid state. */
  scrollResetKey?: string | number;
  className?: string;
  exportable?: boolean;
  exportFileName?: string;
  /** Available file formats. CSV remains the default for existing callers. */
  exportFormats?: readonly DataGridExportFormat[];
  onCellEdit?: (change: DataGridCellEdit<T>) => void;
  /** Render a measured window of rows instead of the complete result. */
  virtualized?: boolean | DataGridVirtualizationOptions;
  /** Defaults to false with virtualization and true for ordinary tables. */
  pagination?: boolean;
  /** Replace the complete footer. Undefined keeps the default; null/false hides it. */
  footer?: React.ReactNode | ((context: DataGridFooterContext<T>) => React.ReactNode);
}

function useGridValue<T>(controlled: T | undefined, initial: T, onChange?: (value: T) => void) {
  const [internal, setInternal] = React.useState(initial);
  const value = controlled === undefined ? internal : controlled;
  const set = (next: T) => {
    if (Object.is(next, value)) return;
    if (controlled === undefined) setInternal(next);
    onChange?.(next);
  };
  return [value, set] as const;
}
const collator = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' });
const positiveInteger = (value: number, fallback: number) => Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
const searchableText = (value: string) => value.trim().toLocaleLowerCase();
const hasFilter = (value: DataGridFilters[string]) => typeof value === 'string' ? !!value.trim() : Array.isArray(value) ? value.length > 0 : !!value && !!(value.min?.trim() || value.max?.trim());

/** A client-side data table. Selection is keyed by stable row IDs across pages. */
export function DataGrid<T>({
  label, rows, columns, getRowId, getRowLabel,
  selectable = false, selectOnRowClick = true, isRowSelectable, selectedRowIds, defaultSelectedRowIds = [], onSelectedRowIdsChange, selectionActions, toolbarActions,
  toolbarSize = 'sm', toolbarOrder,
  searchable = true, searchLabel = '검색', query: controlledQuery, defaultQuery = '', onQueryChange,
  filters: controlledFilters, defaultFilters = {}, onFiltersChange,
  sort: controlledSort, defaultSort = null, onSortChange,
  sortModel: controlledSortModel, defaultSortModel, onSortModelChange,
  page: controlledPage, defaultPage = 1, onPageChange,
  pageSize: controlledPageSize, defaultPageSize = 10, onPageSizeChange, pageSizeOptions = [5, 10, 20, 50],
  density: controlledDensity, defaultDensity = 'default', onDensityChange, showDensityToggle = true, showColumnFilterToggle = false, showColumnVisibility = true, defaultHiddenColumnIds = [],
  loading = false, error, onRetry, emptyMessage = '등록된 데이터가 없습니다.', maxHeight, scrollResetKey, className,
  exportable = false, exportFileName = 'data-grid.csv', exportFormats = ['csv'], onCellEdit,
  virtualized = false, pagination, footer,
}: DataGridProps<T>) {
  const id = React.useId();
  const [density, setDensity] = useGridValue(controlledDensity, defaultDensity, onDensityChange);
  const [query, setQuery] = useGridValue(controlledQuery, defaultQuery, onQueryChange);
  const [internalSortModel, setInternalSortModel] = React.useState<DataGridSortModel>(() => defaultSortModel ?? (defaultSort ? [defaultSort] : []));
  const requestedSortModel = React.useMemo(() => controlledSortModel ?? (controlledSort !== undefined ? controlledSort ? [controlledSort] : [] : internalSortModel), [controlledSortModel, controlledSort, internalSortModel]);
  const sorting = React.useMemo(() => {
    const seen = new Set<string>();
    return requestedSortModel.filter(item => {
      if (seen.has(item.columnId) || !['asc','desc'].includes(item.direction) || !columns.some(column => column.id === item.columnId && column.sortable !== false)) return false;
      seen.add(item.columnId);
      return true;
    });
  }, [requestedSortModel, columns]);
  const sort = sorting[0] ?? null;
  const [filters, setFilters] = useGridValue<DataGridFilters>(controlledFilters, defaultFilters, onFiltersChange);
  const [columnFiltersEnabled, setColumnFiltersEnabled] = React.useState(false);
  const filtersEnabled = !showColumnFilterToggle || columnFiltersEnabled;
  const appliedFilters = React.useMemo(()=>filtersEnabled ? filters : {},[filtersEnabled,filters]);
  const [requestedPage, setPage] = useGridValue(controlledPage, defaultPage, onPageChange);
  const [requestedPageSize, setPageSize] = useGridValue(controlledPageSize, defaultPageSize, onPageSizeChange);
  const [selected, setSelected] = useGridValue<readonly string[]>(selectedRowIds, defaultSelectedRowIds, values => onSelectedRowIdsChange?.([...values]));
  const [hidden, setHidden] = React.useState<readonly string[]>(defaultHiddenColumnIds);
  const [widths, setWidths] = React.useState<Record<string, number>>({});
  const [editing, setEditing] = React.useState<{rowId:string; columnId:string} | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState('');
  const [focusedRowId, setFocusedRowId] = React.useState<string | null>(null);
  const root = React.useRef<HTMLDivElement>(null), scroll = React.useRef<HTMLDivElement>(null);
  const header = React.useRef<HTMLTableSectionElement>(null);
  const prepareScroll = React.useRef<((offset:number) => void) | null>(null);
  const [viewportWidth, setViewportWidth] = React.useState<number>();
  const restoreEditor = React.useRef<string | null>(null);
  const drag = React.useRef<{id:string; startX:number; startWidth:number; direction:number} | null>(null);
  const virtualEnabled = virtualized !== false;
  const virtualMaxHeight = typeof maxHeight === 'number'
    ? Number.isFinite(maxHeight) && maxHeight > 0 ? maxHeight : 480
    : typeof maxHeight === 'string' && maxHeight.trim() && !/^(none|initial|inherit|unset|revert|revert-layer)$/i.test(maxHeight.trim()) ? maxHeight : 480;
  const paginated = pagination ?? !virtualEnabled;
  const size = positiveInteger(requestedPageSize, 10);
  const needle = searchable ? searchableText(query) : '';
  const criteria = JSON.stringify([needle, sorting, appliedFilters, size]);
  const previousCriteria = React.useRef(criteria);
  const eventResetCriteria = React.useRef<string | null>(null);
  const criteriaChanged = previousCriteria.current !== criteria;
  const filtered = React.useMemo(() => {
    const multiFilters = new Map<string, Set<string>>();
    for (const column of columns) {
      const values = appliedFilters[column.id];
      if (column.filter === 'multi-select' && Array.isArray(values) && values.length) multiFilters.set(column.id, new Set(values));
    }
    const matching = rows.filter(row => {
      if (needle && !columns.some(column => searchableText(String(column.accessor(row) ?? '')).includes(needle))) return false;
      return columns.every(column => {
        const filter = appliedFilters[column.id];
        if (!column.filter || !filter || !hasFilter(filter)) return true;
        const value = column.accessor(row);
        if (column.filter === 'multi-select') return multiFilters.get(column.id)?.has(String(value ?? '')) ?? true;
        if (column.filter === 'number' && typeof filter === 'object' && !Array.isArray(filter)) {
          if (value == null || String(value).trim() === '') return false;
          const number = Number(value), min = filter.min?.trim(), max = filter.max?.trim();
          return Number.isFinite(number) && (!min || !Number.isFinite(Number(min)) || number >= Number(min)) && (!max || !Number.isFinite(Number(max)) || number <= Number(max));
        }
        if (typeof filter !== 'string') return true;
        return column.filter === 'select' ? String(value ?? '') === filter : searchableText(String(value ?? '')).includes(searchableText(filter));
      });
    });
    const sortColumns = sorting.map(item => ({...item, column:columns.find(column => column.id === item.columnId)!}));
    if (!sortColumns.length) return matching;
    return matching.map((row, index) => ({row, index})).sort((a, b) => {
      for (const {column, direction} of sortColumns) {
        const left = column.accessor(a.row), right = column.accessor(b.row);
        if (left == null && right == null) continue;
        if (left == null) return 1;
        if (right == null) return -1;
        const comparison = typeof left === 'number' && typeof right === 'number' ? left - right : collator.compare(String(left), String(right));
        if (comparison) return direction === 'asc' ? comparison : -comparison;
      }
      return a.index - b.index;
    }).map(item => item.row);
  }, [rows, columns, needle, appliedFilters, sorting]);
  const pageCount = paginated ? Math.max(1, Math.ceil(filtered.length / size)) : 1;
  const page = !paginated || (criteriaChanged && controlledPage === undefined) ? 1 : Math.min(pageCount, positiveInteger(requestedPage, 1));
  const shownRows = React.useMemo(() => paginated ? filtered.slice((page - 1) * size, page * size) : filtered, [paginated, filtered, page, size]);
  const visibleColumns = React.useMemo(() => {
    const visible = columns.filter(column => !hidden.includes(column.id));
    // Keep a usable table when defaults hide every column or the column set changes.
    if (!visible.length && columns.length) visible.push(columns[0]);
    return visible.sort((a, b) => Number(b.pinned === 'start') - Number(a.pinned === 'start'));
  }, [columns, hidden]);
  const validIds = React.useMemo(() => new Set(rows.filter(row => !isRowSelectable || isRowSelectable(row)).map(getRowId)), [rows, isRowSelectable, getRowId]);
  const selectedSet = React.useMemo(() => new Set(selected.filter(value => validIds.has(value))), [selected, validIds]);
  const selectableIds = React.useMemo(() => shownRows.filter(row => !isRowSelectable || isRowSelectable(row)).map(getRowId), [shownRows, isRowSelectable, getRowId]);
  const selectedOnPage = React.useMemo(() => selectableIds.filter(value => selectedSet.has(value)).length, [selectableIds, selectedSet]);
  const allOnPage = selectableIds.length > 0 && selectedOnPage === selectableIds.length;
  const hasError = error !== undefined && error !== null && error !== false;
  const blocked = loading || hasError;
  const count = blocked ? 0 : filtered.length;
  const footerSelectedRows = React.useMemo(() => typeof footer === 'function' && selectable && selectedSet.size
    ? rows.filter(row => selectedSet.has(getRowId(row))) : [], [footer, selectable, selectedSet, rows, getRowId]);
  const sizes = [...new Set([...pageSizeOptions.filter(value => Number.isInteger(value) && value > 0), size])].sort((a, b) => a - b);
  const anyFilters = columns.some(column => column.filter);
  const activeFilters = columns.some(column => column.filter && appliedFilters[column.id] && hasFilter(appliedFilters[column.id]));
  const filterRowVisible = anyFilters && filtersEnabled;
  const headerRows = filterRowVisible ? 2 : 1;
  const keepRowIds = React.useMemo(() => [...new Set([editing?.rowId, focusedRowId].filter((value): value is string => value != null))], [editing?.rowId, focusedRowId]);
  const shownIds = React.useMemo(() => new Set(shownRows.map(getRowId)), [shownRows, getRowId]);
  const resolvedWidths = React.useMemo(() => resolveDataGridColumnWidths(visibleColumns, viewportWidth, widths, selectable ? 52 : 0), [visibleColumns, viewportWidth, widths, selectable]);
  const widthById = new Map(visibleColumns.map((column, index) => [column.id, resolvedWidths[index]]));
  const columnWidth = (column: DataGridColumn<T>) => widthById.get(column.id)!;
  const pinnedOffsets = new Map<string, number>();
  let pinnedWidth = selectable ? 52 : 0;
  for (const column of visibleColumns) if (column.pinned === 'start') { pinnedOffsets.set(column.id, pinnedWidth); pinnedWidth += columnWidth(column); }
  const cellStyle = (column: DataGridColumn<T>): React.CSSProperties => ({textAlign:column.align || 'start', ...(column.pinned === 'start' ? {insetInlineStart:pinnedOffsets.get(column.id)} : {})});
  const resize = (column: DataGridColumn<T>, value: number) => {
    const bounds = widthBounds(column);
    setWidths(previous => ({...previous, [column.id]:Math.max(bounds.min, Math.min(bounds.max, Math.round(value)))}));
  };
  const resetWidth = (column: DataGridColumn<T>) => {
    drag.current = null;
    setWidths(previous => {
      if (!Object.prototype.hasOwnProperty.call(previous, column.id)) return previous;
      const next = {...previous};
      delete next[column.id];
      return next;
    });
  };

  const measureViewport = React.useCallback(() => {
    const width = scroll.current?.clientWidth;
    if (width && width > 0) setViewportWidth(width);
  }, []);
  // Also measure React commits: a previously hidden tab can be revealed at a
  // different width before ResizeObserver delivers its next notification.
  useClientLayoutEffect(measureViewport);
  useClientLayoutEffect(() => {
    const element = scroll.current;
    const win = element?.ownerDocument.defaultView;
    if (!element || !win) return;
    const Observer = (win as Window & {ResizeObserver?: typeof ResizeObserver}).ResizeObserver;
    const observer = Observer ? new Observer(measureViewport) : null;
    observer?.observe(element);
    win.addEventListener('resize', measureViewport);
    return () => { observer?.disconnect(); win.removeEventListener('resize', measureViewport); };
  }, [measureViewport]);

  const previousScrollResetKey = React.useRef(scrollResetKey);
  React.useEffect(() => {
    if (Object.is(previousScrollResetKey.current, scrollResetKey)) return;
    previousScrollResetKey.current = scrollResetKey;
    const element = scroll.current;
    if (!element) return;
    element.scrollTop = 0;
    element.scrollLeft = 0;
  }, [scrollResetKey]);

  // Reflect page clamping in the uncontrolled state and notify controlled owners once.
  const clampRequest = React.useRef('');
  React.useEffect(() => {
    const changed = previousCriteria.current !== criteria;
    previousCriteria.current = criteria;
    if (!paginated) { eventResetCriteria.current = null; return; }
    const nextPage = changed ? 1 : page;
    const alreadyRequested = changed && eventResetCriteria.current === criteria;
    eventResetCriteria.current = null;
    if (requestedPage === nextPage) { clampRequest.current = ''; return; }
    const key = `${criteria}:${requestedPage}:${nextPage}`;
    if (clampRequest.current !== key) { clampRequest.current = key; if (!alreadyRequested) setPage(nextPage); }
  }, [requestedPage, page, criteria, paginated, setPage]);

  React.useEffect(() => {
    if (editing || !restoreEditor.current) return;
    const key = restoreEditor.current;
    restoreEditor.current = null;
    const button = [...(root.current?.querySelectorAll<HTMLButtonElement>('[data-grid-edit]') || [])].find(item => item.dataset.gridEdit === key);
    (button || scroll.current)?.focus();
  }, [editing]);
  React.useEffect(() => {
    if (editing && (!shownIds.has(editing.rowId) || !visibleColumns.some(column => column.id === editing.columnId) || blocked)) {
      const active = root.current?.ownerDocument.activeElement;
      if (!active || active.tagName === 'BODY' || active.closest('.data-grid-editor')) restoreEditor.current = JSON.stringify([editing.rowId, editing.columnId]);
      setEditing(null);
    }
  }, [editing, shownIds, visibleColumns, blocked]);
  React.useEffect(() => {
    if (!focusedRowId || (!blocked && shownIds.has(focusedRowId))) return;
    const active = root.current?.ownerDocument.activeElement;
    if (!active || active.tagName === 'BODY') scroll.current?.focus();
    setFocusedRowId(null);
  }, [focusedRowId, shownIds, blocked]);

  const resetPageFor = (nextQuery = query, nextSort = sorting, nextFilters = appliedFilters, nextSize = size) => {
    if (!paginated) return;
    eventResetCriteria.current = JSON.stringify([searchable ? searchableText(nextQuery) : '', nextSort, filtersEnabled ? nextFilters : {}, nextSize]);
    setPage(1);
  };
  const changeQuery = (next: string) => { setQuery(next); resetPageFor(next); };
  const enabledExportFormats=exportable?[...new Set(exportFormats.filter(format=>format==='csv'||format==='xlsx'))]:[];
  const exportFile = async (format:DataGridExportFormat, exportRows: readonly T[], fileName: string) => {
    setExportError('');
    setExporting(true);
    try {
      const download=format==='xlsx'?downloadDataGridXlsx:downloadDataGridCsv;
      await download({rows: exportRows, columns: visibleColumns, fileName});
    } catch {
      setExportError(`${format==='xlsx'?'Excel':'CSV'} 파일을 저장하지 못했습니다. 다시 시도해주세요.`);
    } finally {
      setExporting(false);
    }
  };
  const changeFilter = (columnId: string, next: DataGridFilters[string]) => { const nextFilters = {...filters, [columnId]:next}; setFilters(nextFilters); resetPageFor(query, sorting, nextFilters); };
  const finishEditing = (row: T, column: DataGridColumn<T>, value?: string) => {
    if (value !== undefined) onCellEdit?.({row, rowId:getRowId(row), columnId:column.id, value});
    restoreEditor.current = JSON.stringify([getRowId(row), column.id]);
    setEditing(null);
  };
  const changeSort = (columnId: string, multiple: boolean) => {
    const current = sorting.find(item => item.columnId === columnId);
    const nextDirection = !current ? 'asc' : current.direction === 'asc' ? 'desc' : null;
    const next:DataGridSort[] = multiple
      ? current ? sorting.flatMap(item => item.columnId !== columnId ? [item] : nextDirection ? [{columnId, direction:nextDirection}] : []) : [...sorting, {columnId, direction:'asc'}]
      : nextDirection ? [{columnId, direction:nextDirection}] : [];
    if (controlledSortModel === undefined && controlledSort === undefined) setInternalSortModel(next);
    onSortModelChange?.(next);
    const primary = next[0] ?? null;
    if (primary?.columnId !== sort?.columnId || primary?.direction !== sort?.direction) onSortChange?.(primary);
    resetPageFor(query, next);
  };
  const toggleRow = (rowId: string) => {
    const next = new Set(selectedSet);
    if (next.has(rowId)) next.delete(rowId); else next.add(rowId);
    setSelected([...next]);
  };
  const togglePage = () => {
    const next = new Set(selectedSet);
    for (const rowId of selectableIds) { if (allOnPage) next.delete(rowId); else next.add(rowId); }
    setSelected([...next]);
  };
  const renderRow = (row:T, rowIndex:number, measure?: (element:HTMLTableRowElement | null) => void) => {
          const rowId = getRowId(row);
          const rowClickable = selectable && selectOnRowClick && (!isRowSelectable || isRowSelectable(row));
          return <tr key={rowId} ref={measure} data-index={virtualEnabled ? rowIndex : undefined} data-grid-row-id={rowId} aria-rowindex={virtualEnabled ? (paginated ? (page - 1) * size : 0) + rowIndex + headerRows + 1 : undefined} data-selected={selectable && selectedSet.has(rowId) || undefined} data-row-selectable={rowClickable || undefined} onClick={rowClickable ? event => {
            if (event.defaultPrevented || event.button !== 0) return;
            const target = event.target as Element;
            if (target.closest('button,a[href],input,select,textarea,label,summary,[role="button"],[role="link"],[role="checkbox"],[role="combobox"],[role="switch"],[role="slider"],[role="spinbutton"],[contenteditable]:not([contenteditable="false"]),[data-grid-ignore-row-click]')) return;
            const selection = event.currentTarget.ownerDocument.defaultView?.getSelection();
            if (selection && !selection.isCollapsed && (event.currentTarget.contains(selection.anchorNode) || event.currentTarget.contains(selection.focusNode))) return;
            toggleRow(rowId);
            event.currentTarget.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus({preventScroll:true});
          } : undefined}>
            {selectable && <td className="data-grid-select-cell"><Checkbox label={<span className="sr-only">{getRowLabel ? getRowLabel(row) : rowId} 선택</span>} checked={selectedSet.has(rowId)} disabled={!!isRowSelectable && !isRowSelectable(row)} onChange={() => toggleRow(rowId)} /></td>}
            {visibleColumns.map(column => {
              const editValue = editing?.rowId === rowId && editing.columnId === column.id;
              const editable = !!onCellEdit && (typeof column.editable === 'function' ? column.editable(row) : !!column.editable);
              return <td key={column.id} className={column.pinned === 'start' ? 'data-grid-pinned' : undefined} style={cellStyle(column)}>{editValue ? <DataGridCellEditor value={String(column.accessor(row) ?? '')} label={column.header} type={column.editor} validate={column.validate ? value => column.validate!(value, row) : undefined} onCommit={value => finishEditing(row, column, value)} onCancel={() => finishEditing(row, column)} /> : <div className="data-grid-cell-content"><span>{column.cell ? column.cell(row) : column.accessor(row) ?? <span className="table-muted">—</span>}</span>{editable && <button type="button" className="icon-button data-grid-edit-button" data-grid-edit={JSON.stringify([rowId,column.id])} aria-label={`${getRowLabel ? getRowLabel(row) : rowId} ${column.header} 편집`} onClick={() => setEditing({rowId,columnId:column.id})}><Icon name="edit" /></button>}</div>}</td>;
            })}
          </tr>;

  };
  const columnCount = Math.max(1, visibleColumns.length + (selectable ? 1 : 0));
  const status = loading ? '데이터를 불러오는 중입니다.' : hasError ? '데이터를 불러오지 못했습니다.' : !rows.length ? '등록된 데이터가 없습니다.' : !count ? '검색 결과가 없습니다.' : paginated ? `${(page - 1) * size + 1}–${Math.min(page * size, count)} / ${count}개 항목` : `${count}개 항목`;
  const footerStatus = <p className={footer === undefined ? 'component-helper' : 'sr-only'} id={`${id}-status`} role="status" aria-live="polite" aria-atomic="true">{status}{selectable && selectedSet.size > 0 ? ` · ${selectedSet.size}개 선택됨` : ''}</p>;
  const footerContent = typeof footer === 'function' ? footer({
    totalCount: rows.length, filteredCount: count, selectedCount: selectable ? selectedSet.size : 0,
    filteredRows: blocked ? [] : filtered, pageRows: blocked ? [] : shownRows, selectedRows: footerSelectedRows,
    page, pageCount, pageSize: size, pagination: paginated, loading, hasError,
  }) : footer;
  const showFooter = footer === undefined || (footerContent != null && typeof footerContent !== 'boolean');

  const clearSelection = () => {
    setSelected([]);
    const target = root.current?.querySelector<HTMLElement>('thead input[type="checkbox"]:not(:disabled)')
      || root.current?.querySelector<HTMLElement>('.data-grid-search input') || root.current;
    target?.focus({preventScroll:true});
  };

  const toolbarItems: Record<DataGridToolbarItem, React.ReactNode> = {
    search: searchable && <TextField hideLabel containerClassName="data-grid-search" label={searchLabel} type="search" placeholder="검색어를 입력하세요" value={query} onChange={event => changeQuery(event.target.value)} prefix={<Icon name="search" />} prefixDecorative action={query ? <button className="input-action" type="button" aria-label="검색 초기화" onClick={() => changeQuery('')}><Icon name="x" /></button> : undefined} />,
    selection: selectable && selectedSet.size > 0 && <div className="data-grid-selection">
      <div className="data-grid-selection-actions">
        {selectionActions}
        {enabledExportFormats.map(format=><Tooltip key={format} content={`선택한 행 ${format==='xlsx'?'Excel (.xlsx)':'CSV'} 내보내기`}><Button variant="ghost" iconOnly aria-label={format==='xlsx'?'선택한 행 Excel 내보내기':'선택한 행 내보내기'} disabled={blocked || exporting} aria-busy={exporting || undefined} onClick={() => exportFile(format,rows.filter(row => selectedSet.has(getRowId(row))),dataGridFileName(exportFileName,format).replace(/\.(csv|xlsx)$/i,`-selected.${format}`))}><Icon name={format==='xlsx'?'excel':'download'} /></Button></Tooltip>)}
        <Tooltip content="선택 해제"><Button variant="ghost" iconOnly aria-label="선택 해제" onClick={clearSelection}><Icon name="x" /></Button></Tooltip>
      </div>
    </div>,
    columnFilters: showColumnFilterToggle && anyFilters && <Tooltip content={filtersEnabled ? '컬럼 필터 끄기' : '컬럼 필터 켜기'}>
      <Button variant={filtersEnabled ? 'default' : 'outline'} iconOnly aria-label="컬럼 필터" aria-pressed={filtersEnabled} aria-controls={filterRowVisible ? `${id}-filters` : undefined} disabled={blocked} onClick={() => {
        setColumnFiltersEnabled(!filtersEnabled);
        if (filtersEnabled) { setFilters({}); resetPageFor(query, sorting, {}); }
      }}><Icon name="filter" /></Button>
    </Tooltip>,
    density: showDensityToggle && (controlledDensity === undefined || !!onDensityChange) && <Tooltip content={density === 'compact' ? '기본 행 간격으로 전환' : '촘촘한 행 간격으로 전환'}>
      <Button variant={density === 'compact' ? 'default' : 'outline'} iconOnly aria-label="촘촘한 행 간격" aria-pressed={density === 'compact'} disabled={blocked} onClick={() => setDensity(density === 'compact' ? 'default' : 'compact')}>
        <svg className="data-grid-density-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false"><path d={density === 'compact' ? 'M4 8h16M4 12h16M4 16h16' : 'M4 4h16M4 12h16M4 20h16'} /></svg>
      </Button>
    </Tooltip>,
    columns: showColumnVisibility && columns.length > 1 && <Popover align="end" trigger={<IconButton variant="outline" color="primary" label="표시 열"><Icon name="grid" /></IconButton>} label={`${label} 표시 열`}>
      <div className="data-grid-column-options" data-size="md"><strong>표시할 열</strong><p>최소 한 개의 열을 표시합니다.</p>{columns.map(column => {
        const checked = visibleColumns.some(item => item.id === column.id);
        return <Checkbox key={column.id} label={column.header} checked={checked} disabled={checked && visibleColumns.length === 1} onChange={() => setHidden(checked ? [...hidden, column.id] : hidden.filter(value => value !== column.id))} />;
      })}</div>
    </Popover>,
    export: <>{enabledExportFormats.map(format=><Tooltip key={format} content={`검색 결과 전체 ${format==='xlsx'?'Excel (.xlsx)':'CSV'} 내보내기`}><Button variant="outline" iconOnly aria-label={format==='xlsx'?'Excel 내보내기':'CSV 내보내기'} disabled={blocked || !count || exporting} aria-busy={exporting || undefined} onClick={() => exportFile(format,filtered,dataGridFileName(exportFileName,format))}><Icon name={format==='xlsx'?'excel':'download'} /></Button></Tooltip>)}</>,
    resetFilters: activeFilters && <Button variant="ghost" onClick={() => { setFilters({}); resetPageFor(query, sorting, {}); }}>필터 초기화</Button>,
    actions: toolbarActions != null && <div className="data-grid-toolbar-actions">{toolbarActions}</div>,
  };

  return <div ref={root} className={`data-grid${className ? ` ${className}` : ''}`} tabIndex={-1} role="group" aria-label={label} data-density={density} data-virtualized={virtualEnabled || undefined}>
    <p className="sr-only" id={`${id}-sort-help`}>클릭하면 단일 정렬을 변경합니다. Shift 키를 누르고 클릭하면 정렬 조건을 추가하거나 변경합니다.</p>
    <p className="sr-only" id={`${id}-resize-help`}>방향키로 10px, Shift와 함께 1px 조절합니다. Home과 End로 최소·최대 너비를 선택하고 Enter 또는 더블클릭으로 원래 너비 설정을 복구합니다.</p>
    <div className="data-grid-toolbar">
      <div className="data-grid-heading"><strong>{label}</strong><span className={selectable && selectedSet.size > 0 ? 'data-grid-selection-count' : undefined}>{selectable && selectedSet.size > 0 ? `${selectedSet.size}개 선택됨` : `${rows.length}개 항목`}</span></div>
      <div className="data-grid-tools" data-size={toolbarSize}>
        {resolveDataGridToolbarOrder(toolbarOrder).map(item => <React.Fragment key={item}>{toolbarItems[item]}</React.Fragment>)}
      </div>
      {exportError && <p className="field-error data-grid-export-error" role="alert">{exportError}</p>}
    </div>

    <div className="data-grid-viewport" style={maxHeight !== undefined || virtualEnabled ? {maxHeight:virtualEnabled ? virtualMaxHeight : maxHeight} : undefined}>
    <div id={`${id}-scroll`} ref={scroll} className="data-grid-scroll" role="region" aria-label={`${label} 표`} aria-busy={loading} tabIndex={0} style={virtualEnabled ? {overflowAnchor:'none'} : undefined}>
      <Table density={density} interactive aria-rowcount={virtualEnabled ? headerRows + (blocked || !count ? 1 : filtered.length) : undefined} aria-colcount={virtualEnabled ? columnCount : undefined} className="data-grid-table" style={{width:visibleColumns.reduce((sum, column) => sum + columnWidth(column), selectable ? 52 : 0)}}>
        <caption className="sr-only">{label}</caption>
        <colgroup>{selectable && <col className="data-grid-select-column" />}{visibleColumns.map(column => <col key={column.id} style={{width:columnWidth(column)}} />)}</colgroup>
        <thead ref={header}><tr aria-rowindex={virtualEnabled ? 1 : undefined}>
          {selectable && <th scope="col" className="data-grid-select-cell"><Checkbox label={<span className="sr-only">{paginated ? '현재 페이지 전체 선택' : '검색 결과 전체 선택'}</span>} checked={allOnPage} indeterminate={selectedOnPage > 0 && !allOnPage} disabled={blocked || !selectableIds.length} onChange={togglePage} /></th>}
          {visibleColumns.map((column, columnIndex) => {
            const sortIndex = sorting.findIndex(item => item.columnId === column.id);
            const currentSort = sorting[sortIndex];
            return <th key={column.id} scope="col" className={column.pinned === 'start' ? 'data-grid-pinned' : undefined} style={cellStyle(column)} aria-sort={column.sortable === false || sortIndex > 0 ? undefined : currentSort ? currentSort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
            {column.sortable === false ? column.header : <><button className="data-grid-sort" type="button" disabled={blocked} aria-describedby={`${id}-sort-help ${id}-sort-${columnIndex}`} onClick={event => changeSort(column.id, event.shiftKey)}><span>{column.header}</span>{currentSort && <span className="data-grid-sort-icon is-active" aria-hidden="true"><Icon name={currentSort.direction === 'asc' ? 'arrow-up' : 'arrow-down'} />{sorting.length > 1 && <span className="data-grid-sort-priority">{sortIndex + 1}</span>}</span>}</button><span className="sr-only" id={`${id}-sort-${columnIndex}`}>{currentSort ? `${sortIndex + 1}순위 ${currentSort.direction === 'asc' ? '오름차순' : '내림차순'}` : '정렬 안 함'}</span></>}
            {column.resizable !== false && <span className="data-grid-resize" role="separator" aria-label={`${column.header} 열 너비`} aria-orientation="vertical" aria-valuenow={columnWidth(column)} aria-valuemin={widthBounds(column).min} aria-valuemax={widthBounds(column).max} aria-describedby={`${id}-resize-help`} title="드래그·방향키로 조절 · 더블클릭·Enter로 원래 너비 복구" tabIndex={0} onDoubleClick={() => resetWidth(column)} onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault(); event.stopPropagation(); resetWidth(column); return;
              }
              const step = event.shiftKey ? 1 : 10;
              if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
                event.preventDefault(); event.stopPropagation();
                resize(column, event.key === 'Home' ? widthBounds(column).min : event.key === 'End' ? widthBounds(column).max : columnWidth(column) + (event.key === 'ArrowLeft' ? -step : step));
              }
            }} onPointerDown={event => {
              if (event.button !== 0) return;
              event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture?.(event.pointerId);
              drag.current = {id:column.id, startX:event.clientX, startWidth:columnWidth(column), direction:event.currentTarget.ownerDocument.defaultView?.getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1};
            }} onPointerMove={event => { if (drag.current?.id === column.id) resize(column, drag.current.startWidth + (event.clientX - drag.current.startX) * drag.current.direction); }} onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }} />}
          </th>; })}
        </tr>{filterRowVisible && <tr id={`${id}-filters`} className="data-grid-filter-row" data-size={toolbarSize} aria-rowindex={virtualEnabled ? 2 : undefined}>{selectable && <td className="data-grid-select-cell" />}{visibleColumns.map(column => {
          const filter = filters[column.id];
          const numericFilter = typeof filter === 'object' && filter !== null && !Array.isArray(filter) ? filter : undefined;
          return <td key={column.id} className={column.pinned === 'start' ? 'data-grid-pinned' : undefined} style={cellStyle(column)}>{column.filter === 'text' ? <input className="text-input" aria-label={`${column.header} 필터`} placeholder="포함하는 값" value={typeof filter === 'string' ? filter : ''} onChange={event => changeFilter(column.id, event.target.value)} /> : column.filter === 'select' ? <Select hideLabel label={`${column.header} 필터`} placeholder="전체" popupStrategy="fixed" value={typeof filter === 'string' && filter ? `option:${filter}` : 'all'} onValueChange={value => changeFilter(column.id, value === 'all' ? '' : value.slice(7))} options={[{value:'all',label:'전체'}, ...(column.filterOptions || []).map(option => ({...option,value:`option:${option.value}`}))]} /> : column.filter === 'multi-select' ? <MultiSelect hideLabel searchable maxVisibleLabels={1} label={`${column.header} 필터`} placeholder="전체" popupStrategy="fixed" value={Array.isArray(filter) ? filter.map(value => `option:${value}`) : []} onValueChange={values => changeFilter(column.id, values.map(value => value.slice(7)))} options={(column.filterOptions || []).map(option => ({...option,value:`option:${option.value}`}))} /> : column.filter === 'number' ? <div className="data-grid-number-filter"><input className="text-input" type="number" step="any" aria-label={`${column.header} 최솟값`} placeholder="최소" value={numericFilter?.min ?? ''} onChange={event => changeFilter(column.id, {...numericFilter, min:event.target.value})} /><span aria-hidden="true">–</span><input className="text-input" type="number" step="any" aria-label={`${column.header} 최댓값`} placeholder="최대" value={numericFilter?.max ?? ''} onChange={event => changeFilter(column.id, {...numericFilter, max:event.target.value})} /></div> : null}</td>;
        })}</tr>}</thead>
        <DataGridBody enabled={virtualEnabled && !blocked && count > 0}
          rows={shownRows} getRowId={getRowId} scrollRef={scroll} headerRef={header} prepareScrollRef={prepareScroll}
          keepRowIds={keepRowIds} options={typeof virtualized === 'object' ? virtualized : undefined}
          density={density} headerRows={headerRows} maxHeight={virtualMaxHeight}
          resetKey={JSON.stringify([criteria, paginated ? page : 'all', blocked, headerRows, scrollResetKey])}
          measureKey={JSON.stringify([density, resolvedWidths, visibleColumns.map(column => column.id), headerRows])}
          columnCount={columnCount} renderRow={renderRow} onFocusCapture={event => {
          const row = (event.target as HTMLElement).closest<HTMLTableRowElement>('tr[data-grid-row-id]');
          if (row?.dataset.gridRowId) setFocusedRowId(row.dataset.gridRowId);
        }} onBlurCapture={event => {
          if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) setFocusedRowId(null);
        }} emptyContent={blocked || !count ? <tr key="state" aria-rowindex={virtualEnabled ? headerRows + 1 : undefined}><td className="data-grid-state-cell" colSpan={Math.max(1, visibleColumns.length + (selectable ? 1 : 0))}>
          <div className="data-grid-state" style={{width:viewportWidth ?? '100%'}}>{loading ? <><Spinner aria-hidden="true" /><p>데이터를 불러오는 중입니다.</p></> : hasError ? <><p>{error}</p>{onRetry && <Button variant="outline" onClick={onRetry}>다시 시도</Button>}</> : rows.length && (needle || activeFilters) ? <><Icon name="search" /><strong>검색 결과가 없습니다.</strong><p>검색어나 필터를 바꾸거나 초기화해주세요.</p><Button variant="outline" onClick={() => { setQuery(''); setFilters({}); resetPageFor('', sorting, {}); }}>조건 초기화</Button></> : <><Icon name="grid" /><p>{emptyMessage}</p></>}</div>
        </td></tr> : undefined} />
      </Table>
    </div>
    <DataGridScrollbar enabled={!blocked && count > 0} headerRef={header} scrollRef={scroll} prepareScrollRef={prepareScroll} viewportWidth={viewportWidth} controls={`${id}-scroll`} label={`${label} 세로 스크롤`} />
    </div>
    {footer !== undefined && footerStatus}
    {showFooter && <div className={`data-grid-footer${footer === undefined ? '' : ' data-grid-footer--custom'}`}>
      {footer === undefined ? <>{footerStatus}
      {paginated && <div className="data-grid-page-tools"><div className="data-grid-page-size"><Select label="페이지당 행 수" value={String(size)} disabled={blocked} popupStrategy="fixed" onValueChange={value => { setPageSize(Number(value)); resetPageFor(query, sorting, filters, Number(value)); }} options={sizes.map(value => ({value:String(value),label:`${value}개`}))} /></div>
        {!blocked && <Pagination page={page} pageCount={pageCount} onPageChange={setPage} aria-label={`${label} 페이지 탐색`} />}
      </div>}</> : footerContent}
    </div>}
  </div>;
}

import * as React from 'react';
import { Button, Checkbox, Icon, Pagination, Spinner, Table, TextField } from './primitives';
import { Popover } from './interactive';
import { Select } from './navigation';
import { DataGridCellEditor, downloadDataGridCsv } from './data-grid-tools';

export interface DataGridColumn<T> {
  id: string;
  header: string;
  accessor: (row: T) => string | number | null | undefined;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  pinned?: 'start';
  filter?: 'text' | 'number' | 'select';
  filterOptions?: readonly {value:string; label:string}[];
  editable?: boolean | ((row: T) => boolean);
  editor?: 'text' | 'number';
  validate?: (value: string, row: T) => string | undefined;
}
export interface DataGridSort { columnId: string; direction: 'asc' | 'desc' }
export type DataGridFilters = Record<string, string | {min?: string; max?: string}>;
export interface DataGridCellEdit<T> { row: T; rowId: string; columnId: string; value: string }
export interface DataGridProps<T> {
  label: string;
  rows: readonly T[];
  columns: readonly DataGridColumn<T>[];
  getRowId: (row: T) => string;
  getRowLabel?: (row: T) => string;
  selectable?: boolean;
  isRowSelectable?: (row: T) => boolean;
  selectedRowIds?: readonly string[];
  defaultSelectedRowIds?: readonly string[];
  onSelectedRowIdsChange?: (ids: string[]) => void;
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
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  density?: 'default' | 'compact';
  showColumnVisibility?: boolean;
  defaultHiddenColumnIds?: readonly string[];
  loading?: boolean;
  error?: React.ReactNode;
  onRetry?: () => void;
  emptyMessage?: React.ReactNode;
  maxHeight?: number | string;
  className?: string;
  exportable?: boolean;
  exportFileName?: string;
  onCellEdit?: (change: DataGridCellEdit<T>) => void;
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
const widthBounds = <T,>(column: DataGridColumn<T>) => {
  const min = positiveInteger(column.minWidth ?? 96, 96);
  return {min, max: Math.max(min, positiveInteger(column.maxWidth ?? 600, 600))};
};
const hasFilter = (value: DataGridFilters[string]) => typeof value === 'string' ? !!value.trim() : !!value && !!(value.min?.trim() || value.max?.trim());

/** A client-side data table. Selection is keyed by stable row IDs across pages. */
export function DataGrid<T>({
  label, rows, columns, getRowId, getRowLabel,
  selectable = false, isRowSelectable, selectedRowIds, defaultSelectedRowIds = [], onSelectedRowIdsChange,
  searchable = true, searchLabel = '검색', query: controlledQuery, defaultQuery = '', onQueryChange,
  filters: controlledFilters, defaultFilters = {}, onFiltersChange,
  sort: controlledSort, defaultSort = null, onSortChange,
  page: controlledPage, defaultPage = 1, onPageChange,
  pageSize: controlledPageSize, defaultPageSize = 10, onPageSizeChange, pageSizeOptions = [5, 10, 20, 50],
  density = 'default', showColumnVisibility = true, defaultHiddenColumnIds = [],
  loading = false, error, onRetry, emptyMessage = '등록된 데이터가 없습니다.', maxHeight, className,
  exportable = false, exportFileName = 'data-grid.csv', onCellEdit,
}: DataGridProps<T>) {
  const id = React.useId();
  const [query, setQuery] = useGridValue(controlledQuery, defaultQuery, onQueryChange);
  const [sort, setSort] = useGridValue<DataGridSort | null>(controlledSort, defaultSort, onSortChange);
  const [filters, setFilters] = useGridValue<DataGridFilters>(controlledFilters, defaultFilters, onFiltersChange);
  const [requestedPage, setPage] = useGridValue(controlledPage, defaultPage, onPageChange);
  const [requestedPageSize, setPageSize] = useGridValue(controlledPageSize, defaultPageSize, onPageSizeChange);
  const [selected, setSelected] = useGridValue<readonly string[]>(selectedRowIds, defaultSelectedRowIds, values => onSelectedRowIdsChange?.([...values]));
  const [hidden, setHidden] = React.useState<readonly string[]>(defaultHiddenColumnIds);
  const [widths, setWidths] = React.useState<Record<string, number>>({});
  const [editing, setEditing] = React.useState<{rowId:string; columnId:string} | null>(null);
  const root = React.useRef<HTMLDivElement>(null), scroll = React.useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = React.useState<number>();
  const restoreEditor = React.useRef<string | null>(null);
  const drag = React.useRef<{id:string; startX:number; startWidth:number; direction:number} | null>(null);
  const size = positiveInteger(requestedPageSize, 10);
  const needle = searchable ? searchableText(query) : '';
  const criteria = JSON.stringify([needle, sort, filters, size]);
  const previousCriteria = React.useRef(criteria);
  const eventResetCriteria = React.useRef<string | null>(null);
  const criteriaChanged = previousCriteria.current !== criteria;
  const filtered = React.useMemo(() => {
    const matching = rows.filter(row => {
      if (needle && !columns.some(column => searchableText(String(column.accessor(row) ?? '')).includes(needle))) return false;
      return columns.every(column => {
        const filter = filters[column.id];
        if (!column.filter || !filter || !hasFilter(filter)) return true;
        const value = column.accessor(row);
        if (column.filter === 'number' && typeof filter === 'object') {
          if (value == null || String(value).trim() === '') return false;
          const number = Number(value), min = filter.min?.trim(), max = filter.max?.trim();
          return Number.isFinite(number) && (!min || !Number.isFinite(Number(min)) || number >= Number(min)) && (!max || !Number.isFinite(Number(max)) || number <= Number(max));
        }
        if (typeof filter !== 'string') return true;
        return column.filter === 'select' ? String(value ?? '') === filter : searchableText(String(value ?? '')).includes(searchableText(filter));
      });
    });
    const column = sort && columns.find(item => item.id === sort.columnId && item.sortable !== false);
    if (!column || !sort) return matching;
    return matching.map((row, index) => ({row, index})).sort((a, b) => {
      const left = column.accessor(a.row), right = column.accessor(b.row);
      if (left == null && right == null) return a.index - b.index;
      if (left == null) return 1;
      if (right == null) return -1;
      const comparison = typeof left === 'number' && typeof right === 'number' ? left - right : collator.compare(String(left), String(right));
      return (sort.direction === 'asc' ? comparison : -comparison) || a.index - b.index;
    }).map(item => item.row);
  }, [rows, columns, needle, filters, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  const page = criteriaChanged && controlledPage === undefined ? 1 : Math.min(pageCount, positiveInteger(requestedPage, 1));
  const shownRows = filtered.slice((page - 1) * size, page * size);
  const visibleColumns = columns.filter(column => !hidden.includes(column.id));
  // Keep a usable table when defaults hide every column or the column set changes.
  if (!visibleColumns.length && columns.length) visibleColumns.push(columns[0]);
  visibleColumns.sort((a, b) => Number(b.pinned === 'start') - Number(a.pinned === 'start'));
  const validIds = new Set(rows.filter(row => !isRowSelectable || isRowSelectable(row)).map(getRowId));
  const selectedSet = new Set(selected.filter(value => validIds.has(value)));
  const selectableIds = shownRows.filter(row => !isRowSelectable || isRowSelectable(row)).map(getRowId);
  const selectedOnPage = selectableIds.filter(value => selectedSet.has(value)).length;
  const allOnPage = selectableIds.length > 0 && selectedOnPage === selectableIds.length;
  const hasError = error !== undefined && error !== null && error !== false;
  const blocked = loading || hasError;
  const count = blocked ? 0 : filtered.length;
  const sizes = [...new Set([...pageSizeOptions.filter(value => Number.isInteger(value) && value > 0), size])].sort((a, b) => a - b);
  const anyFilters = columns.some(column => column.filter);
  const activeFilters = columns.some(column => column.filter && filters[column.id] && hasFilter(filters[column.id]));
  const columnWidth = (column: DataGridColumn<T>) => {
    const bounds = widthBounds(column);
    const initial = typeof column.width === 'number' ? column.width : typeof column.width === 'string' && /^\d+(\.\d+)?(px)?$/.test(column.width) ? Number.parseFloat(column.width) : 160;
    return Math.max(bounds.min, Math.min(bounds.max, widths[column.id] ?? initial));
  };
  const pinnedOffsets = new Map<string, number>();
  let pinnedWidth = selectable ? 52 : 0;
  for (const column of visibleColumns) if (column.pinned === 'start') { pinnedOffsets.set(column.id, pinnedWidth); pinnedWidth += columnWidth(column); }
  const cellStyle = (column: DataGridColumn<T>): React.CSSProperties => ({textAlign:column.align || 'start', ...(column.pinned === 'start' ? {insetInlineStart:pinnedOffsets.get(column.id)} : {})});
  const resize = (column: DataGridColumn<T>, value: number) => {
    const bounds = widthBounds(column);
    setWidths(previous => ({...previous, [column.id]:Math.max(bounds.min, Math.min(bounds.max, Math.round(value)))}));
  };

  React.useEffect(() => {
    const element = scroll.current;
    const win = element?.ownerDocument.defaultView;
    if (!element || !win) return;
    const measure = () => setViewportWidth(element.clientWidth || undefined);
    measure();
    const Observer = (win as Window & {ResizeObserver?: typeof ResizeObserver}).ResizeObserver;
    const observer = Observer ? new Observer(measure) : null;
    observer?.observe(element);
    win.addEventListener('resize', measure);
    return () => { observer?.disconnect(); win.removeEventListener('resize', measure); };
  }, []);

  // Reflect page clamping in the uncontrolled state and notify controlled owners once.
  const clampRequest = React.useRef('');
  React.useEffect(() => {
    const changed = previousCriteria.current !== criteria;
    previousCriteria.current = criteria;
    const nextPage = changed ? 1 : page;
    const alreadyRequested = changed && eventResetCriteria.current === criteria;
    eventResetCriteria.current = null;
    if (requestedPage === nextPage) { clampRequest.current = ''; return; }
    const key = `${criteria}:${requestedPage}:${nextPage}`;
    if (clampRequest.current !== key) { clampRequest.current = key; if (!alreadyRequested) setPage(nextPage); }
  }, [requestedPage, page, criteria, setPage]);

  React.useEffect(() => {
    if (editing || !restoreEditor.current) return;
    const key = restoreEditor.current;
    restoreEditor.current = null;
    const button = [...(root.current?.querySelectorAll<HTMLButtonElement>('[data-grid-edit]') || [])].find(item => item.dataset.gridEdit === key);
    (button || scroll.current)?.focus();
  }, [editing]);
  React.useEffect(() => {
    if (editing && (!shownRows.some(row => getRowId(row) === editing.rowId) || !visibleColumns.some(column => column.id === editing.columnId) || blocked)) {
      const active = root.current?.ownerDocument.activeElement;
      if (!active || active.tagName === 'BODY' || active.closest('.data-grid-editor')) restoreEditor.current = JSON.stringify([editing.rowId, editing.columnId]);
      setEditing(null);
    }
  }, [editing, shownRows, visibleColumns, getRowId, blocked]);

  const resetPageFor = (nextQuery = query, nextSort = sort, nextFilters = filters, nextSize = size) => {
    eventResetCriteria.current = JSON.stringify([searchable ? searchableText(nextQuery) : '', nextSort, nextFilters, nextSize]);
    setPage(1);
  };
  const changeQuery = (next: string) => { setQuery(next); resetPageFor(next); };
  const changeFilter = (columnId: string, next: DataGridFilters[string]) => { const nextFilters = {...filters, [columnId]:next}; setFilters(nextFilters); resetPageFor(query, sort, nextFilters); };
  const finishEditing = (row: T, column: DataGridColumn<T>, value?: string) => {
    if (value !== undefined) onCellEdit?.({row, rowId:getRowId(row), columnId:column.id, value});
    restoreEditor.current = JSON.stringify([getRowId(row), column.id]);
    setEditing(null);
  };
  const changeSort = (columnId: string) => {
    const next: DataGridSort | null = !sort || sort.columnId !== columnId ? {columnId, direction:'asc'} : sort.direction === 'asc' ? {columnId, direction:'desc'} : null;
    setSort(next); resetPageFor(query, next);
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
  const status = loading ? '데이터를 불러오는 중입니다.' : hasError ? '데이터를 불러오지 못했습니다.' : !rows.length ? '등록된 데이터가 없습니다.' : !count ? '검색 결과가 없습니다.' : `${(page - 1) * size + 1}–${Math.min(page * size, count)} / ${count}개 항목`;

  return <div ref={root} className={`data-grid${className ? ` ${className}` : ''}`} role="group" aria-label={label} data-density={density}>
    <div className="data-grid-toolbar">
      <div className="data-grid-heading"><strong>{label}</strong><span>{rows.length}개 항목</span></div>
      <div className="data-grid-tools">
        {searchable && <TextField containerClassName="data-grid-search" label={searchLabel} type="search" placeholder="검색어를 입력하세요" value={query} onChange={event => changeQuery(event.target.value)} prefix={<Icon name="search" />} prefixDecorative action={query ? <button className="icon-button" type="button" aria-label="검색 초기화" onClick={() => changeQuery('')}><Icon name="close" /></button> : undefined} />}
        {showColumnVisibility && columns.length > 1 && <Popover trigger={<><Icon name="grid" />표시 열</>} label={`${label} 표시 열`}>
          <div className="data-grid-column-options"><strong>표시할 열</strong><p>최소 한 개의 열을 표시합니다.</p>{columns.map(column => {
            const checked = visibleColumns.some(item => item.id === column.id);
            return <Checkbox key={column.id} label={column.header} checked={checked} disabled={checked && visibleColumns.length === 1} onChange={() => setHidden(checked ? [...hidden, column.id] : hidden.filter(value => value !== column.id))} />;
          })}</div>
        </Popover>}
        {exportable && <Button variant="outline" title="현재 검색·필터·정렬 결과의 모든 페이지와 표시 중인 열을 내보냅니다." disabled={blocked || !count} onClick={() => downloadDataGridCsv({rows:filtered, columns:visibleColumns, fileName:exportFileName})}><Icon name="download" />CSV 내보내기</Button>}
        {activeFilters && <Button variant="ghost" onClick={() => { setFilters({}); resetPageFor(query, sort, {}); }}>필터 초기화</Button>}
      </div>
    </div>
    {selectable && selectedSet.size > 0 && <div className="data-grid-selection"><span>{selectedSet.size}개 선택됨</span><div className="data-grid-selection-actions">{exportable && <Button variant="ghost" size="sm" title="검색·필터와 관계없이 전체 데이터에서 선택한 행과 표시 중인 열을 내보냅니다." disabled={blocked} onClick={() => downloadDataGridCsv({rows:rows.filter(row => selectedSet.has(getRowId(row))), columns:visibleColumns, fileName:exportFileName.replace(/(\.csv)?$/i, '-selected.csv')})}>선택한 행 내보내기</Button>}<Button variant="ghost" size="sm" onClick={() => setSelected([])}>선택 해제</Button></div></div>}
    <div ref={scroll} className="data-grid-scroll" role="region" aria-label={`${label} 표`} aria-busy={loading} tabIndex={0} style={maxHeight !== undefined ? {maxHeight} : undefined}>
      <Table density={density} interactive className="data-grid-table" style={{width:visibleColumns.reduce((sum, column) => sum + columnWidth(column), selectable ? 52 : 0)}}>
        <caption className="sr-only">{label}</caption>
        <colgroup>{selectable && <col className="data-grid-select-column" />}{visibleColumns.map(column => <col key={column.id} style={{width:columnWidth(column)}} />)}</colgroup>
        <thead><tr>
          {selectable && <th scope="col" className="data-grid-select-cell"><Checkbox label={<span className="sr-only">현재 페이지 전체 선택</span>} checked={allOnPage} indeterminate={selectedOnPage > 0 && !allOnPage} disabled={blocked || !selectableIds.length} onChange={togglePage} /></th>}
          {visibleColumns.map(column => <th key={column.id} scope="col" className={column.pinned === 'start' ? 'data-grid-pinned' : undefined} style={cellStyle(column)} aria-sort={column.sortable === false ? undefined : sort?.columnId === column.id ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
            {column.sortable === false ? column.header : <button className="data-grid-sort" type="button" disabled={blocked} onClick={() => changeSort(column.id)}><span>{column.header}</span><span className={`data-grid-sort-icon${sort?.columnId === column.id ? ' is-active' : ''}`} aria-hidden="true">{sort?.columnId === column.id ? <Icon name={sort.direction === 'asc' ? 'arrow-up' : 'arrow-down'} /> : <span>↕</span>}</span></button>}
            {column.resizable !== false && <span className="data-grid-resize" role="separator" aria-label={`${column.header} 열 너비`} aria-orientation="vertical" aria-valuenow={columnWidth(column)} aria-valuemin={widthBounds(column).min} aria-valuemax={widthBounds(column).max} tabIndex={0} onKeyDown={event => {
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
          </th>)}
        </tr>{anyFilters && <tr className="data-grid-filter-row">{selectable && <td className="data-grid-select-cell" />}{visibleColumns.map(column => {
          const filter = filters[column.id];
          return <td key={column.id} className={column.pinned === 'start' ? 'data-grid-pinned' : undefined} style={cellStyle(column)}>{column.filter === 'text' ? <input className="text-input" aria-label={`${column.header} 필터`} placeholder="포함하는 값" value={typeof filter === 'string' ? filter : ''} onChange={event => changeFilter(column.id, event.target.value)} /> : column.filter === 'select' ? <Select label={`${column.header} 필터`} placeholder="전체" popupStrategy="fixed" value={typeof filter === 'string' && filter ? `option:${filter}` : 'all'} onValueChange={value => changeFilter(column.id, value === 'all' ? '' : value.slice(7))} options={[{value:'all',label:'전체'}, ...(column.filterOptions || []).map(option => ({...option,value:`option:${option.value}`}))]} /> : column.filter === 'number' ? <div className="data-grid-number-filter"><input className="text-input" type="number" step="any" aria-label={`${column.header} 최솟값`} placeholder="최소" value={typeof filter === 'object' ? filter.min || '' : ''} onChange={event => changeFilter(column.id, {...(typeof filter === 'object' ? filter : {}), min:event.target.value})} /><span aria-hidden="true">–</span><input className="text-input" type="number" step="any" aria-label={`${column.header} 최댓값`} placeholder="최대" value={typeof filter === 'object' ? filter.max || '' : ''} onChange={event => changeFilter(column.id, {...(typeof filter === 'object' ? filter : {}), max:event.target.value})} /></div> : null}</td>;
        })}</tr>}</thead>
        <tbody>{blocked || !count ? <tr><td className="data-grid-state-cell" colSpan={Math.max(1, visibleColumns.length + (selectable ? 1 : 0))}>
          <div className="data-grid-state" style={{width:viewportWidth ?? '100%'}}>{loading ? <><Spinner aria-hidden="true" /><p>데이터를 불러오는 중입니다.</p></> : hasError ? <><p>{error}</p>{onRetry && <Button variant="outline" onClick={onRetry}>다시 시도</Button>}</> : rows.length && (needle || activeFilters) ? <><Icon name="search" /><strong>검색 결과가 없습니다.</strong><p>검색어나 필터를 바꾸거나 초기화해주세요.</p><Button variant="outline" onClick={() => { setQuery(''); setFilters({}); resetPageFor('', sort, {}); }}>조건 초기화</Button></> : <><Icon name="grid" /><p>{emptyMessage}</p></>}</div>
        </td></tr> : shownRows.map(row => {
          const rowId = getRowId(row);
          return <tr key={rowId} data-selected={selectable && selectedSet.has(rowId) || undefined}>
            {selectable && <td className="data-grid-select-cell"><Checkbox label={<span className="sr-only">{getRowLabel ? getRowLabel(row) : rowId} 선택</span>} checked={selectedSet.has(rowId)} disabled={!!isRowSelectable && !isRowSelectable(row)} onChange={() => toggleRow(rowId)} /></td>}
            {visibleColumns.map(column => {
              const editValue = editing?.rowId === rowId && editing.columnId === column.id;
              const editable = !!onCellEdit && (typeof column.editable === 'function' ? column.editable(row) : !!column.editable);
              return <td key={column.id} className={column.pinned === 'start' ? 'data-grid-pinned' : undefined} style={cellStyle(column)}>{editValue ? <DataGridCellEditor value={String(column.accessor(row) ?? '')} label={column.header} type={column.editor} validate={column.validate ? value => column.validate!(value, row) : undefined} onCommit={value => finishEditing(row, column, value)} onCancel={() => finishEditing(row, column)} /> : <div className="data-grid-cell-content"><span>{column.cell ? column.cell(row) : column.accessor(row) ?? <span className="table-muted">—</span>}</span>{editable && <button type="button" className="icon-button data-grid-edit-button" data-grid-edit={JSON.stringify([rowId,column.id])} aria-label={`${getRowLabel ? getRowLabel(row) : rowId} ${column.header} 편집`} onClick={() => setEditing({rowId,columnId:column.id})}><Icon name="edit" /></button>}</div>}</td>;
            })}
          </tr>;
        })}</tbody>
      </Table>
    </div>
    <div className="data-grid-footer">
      <p className="component-helper" id={`${id}-status`} role="status" aria-live="polite" aria-atomic="true">{status}{selectable && selectedSet.size > 0 ? ` · ${selectedSet.size}개 선택됨` : ''}</p>
      <div className="data-grid-page-tools"><div className="data-grid-page-size"><Select label="페이지당 행 수" value={String(size)} disabled={blocked} onValueChange={value => { setPageSize(Number(value)); resetPageFor(query, sort, filters, Number(value)); }} options={sizes.map(value => ({value:String(value),label:`${value}개`}))} /></div>
        {!blocked && <Pagination page={page} pageCount={pageCount} onPageChange={setPage} aria-label={`${label} 페이지 탐색`} />}
      </div>
    </div>
  </div>;
}

import * as React from 'react';

export type DataStatus = 'loading' | 'error' | 'empty' | 'no-results' | 'success';
export interface DataStateOptions<T> {
  load: (signal: AbortSignal) => Promise<readonly T[]>;
  matches: (item: T, query: string) => boolean;
  initialItems?: readonly T[];
}

/** Coordinates requests, retry and filtering without retaining obsolete results. */
export function useDataState<T>({ load, matches, initialItems = [] }: DataStateOptions<T>) {
  const [items, setItems] = React.useState<readonly T[]>(initialItems);
  const [query, setQuery] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);
  const request = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => request.current?.abort(), []);
  const reload = React.useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setPending(true); setError(null);
    try {
      const next = await load(controller.signal);
      if (!controller.signal.aborted) setItems([...next]);
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason ?? new Error('목록을 불러오지 못했습니다.'));
    } finally {
      if (!controller.signal.aborted) { setPending(false); request.current = null; }
    }
  }, [load]);
  const visible = React.useMemo(() => items.filter(item => !query.trim() || matches(item, query.trim())), [items, query, matches]);
  const status: DataStatus = pending ? 'loading' : error !== null ? 'error' : !items.length ? 'empty' : !visible.length ? 'no-results' : 'success';
  return { status, items, visibleItems: visible, query, setQuery, error, reload };
}

export interface DataStateProps<T> extends DataStateOptions<T> {
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T, index: number) => React.Key;
  searchLabel?: string;
}
export function DataState<T>({ load, matches, initialItems, renderItem, getKey, searchLabel = '검색' }: DataStateProps<T>) {
  const state = useDataState({ load, matches, initialItems });
  return <section className="data-state" data-state={state.status} aria-busy={state.status === 'loading'}>
    <label className="field-label">{searchLabel}<input className="text-input" type="search" value={state.query} onChange={event => state.setQuery(event.target.value)} /></label>
    <p role="status" className="component-helper">{state.status === 'loading' ? '목록을 불러오는 중입니다.' : state.status === 'error' ? '목록을 불러오지 못했습니다.' : state.status === 'empty' ? '등록된 항목이 없습니다.' : state.status === 'no-results' ? '검색 결과가 없습니다.' : `${state.visibleItems.length}개 항목을 표시합니다.`}</p>
    {state.status === 'error' && <button type="button" className="button button--outline button-inline" onClick={() => void state.reload()}>다시 시도</button>}
    {state.status === 'empty' && <button type="button" className="button button--outline button-inline" onClick={() => void state.reload()}>목록 불러오기</button>}
    {state.status === 'no-results' && <button type="button" className="button button--ghost button-inline" onClick={() => state.setQuery('')}>검색 초기화</button>}
    {state.status === 'success' && <button type="button" className="button button--outline button-inline" onClick={() => void state.reload()}>새로고침</button>}
    {state.status === 'success' && <ul className="simple-list">{state.visibleItems.map((item, index) => <li key={getKey(item, index)}>{renderItem(item, index)}</li>)}</ul>}
  </section>;
}

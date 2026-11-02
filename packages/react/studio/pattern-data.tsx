import * as React from 'react';
import { Badge, Button, Icon, Spinner, Table, TableContainer, TextField, useDataState } from '../src';
import { Section } from './demo-layout';

const projects = [{id:'system',name:'디자인 시스템',team:'디자인',status:'진행 중'},{id:'brand',name:'브랜드 가이드',team:'디자인',status:'검토 중'},{id:'website',name:'웹사이트 개선',team:'개발',status:'준비 중'}];
export function DataStatesPattern() {
  const outcome = React.useRef<'success' | 'error' | 'empty'>('success');
  const load = React.useCallback(async (signal:AbortSignal) => {
    const next = outcome.current;
    await new Promise<void>((resolve,reject) => {
      if (signal.aborted) { reject(new Error('조회 취소')); return; }
      const cancel = () => { clearTimeout(timer); reject(new Error('조회 취소')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort',cancel); resolve(); },350);
      signal.addEventListener('abort',cancel,{once:true});
    });
    if (next === 'error') throw new Error('일시적인 오류로 프로젝트를 불러오지 못했습니다.');
    return next === 'empty' ? [] : projects;
  },[]);
  const state = useDataState({load, initialItems:projects, matches:(item,query) => `${item.name} ${item.team}`.includes(query)});
  const run = (next:'success' | 'error' | 'empty') => { outcome.current = next; void state.reload(); };
  const statusText = {loading:'프로젝트를 불러오는 중입니다.',error:'프로젝트를 조회하지 못했습니다.',empty:'등록된 프로젝트가 없습니다.','no-results':'검색 결과가 없습니다.',success:`${state.visibleItems.length}개 프로젝트를 표시합니다.`}[state.status];
  return <>
    <Section title="목록의 전체 상태" description="정상 조회·실패·빈 목록을 직접 전환합니다. 예제 데이터는 이 화면에서만 처리됩니다.">
      <div className="react-studio-row"><Button onClick={() => run('success')}>정상 조회</Button><Button variant="outline" onClick={() => run('error')}>조회 실패</Button><Button variant="outline" onClick={() => run('empty')}>빈 목록</Button></div>
      <div className="react-pattern-state" aria-busy={state.status === 'loading'} data-state={state.status}>
        <TextField label="프로젝트 검색" type="search" prefix={<Icon name="search" />} prefixDecorative placeholder="프로젝트 또는 팀 검색" value={state.query} onChange={event => state.setQuery(event.target.value)} />
        <p className="component-helper" role="status">{statusText}</p>
        {state.status === 'loading' && <div className="data-state-panel react-pattern-state"><Spinner label="프로젝트 조회 중" /></div>}
        {state.status === 'error' && <div className="data-state-panel react-pattern-state" role="alert"><h3 className="react-studio-example-title">조회하지 못했습니다</h3><p>일시적인 오류가 발생했습니다. 다시 시도해주세요.</p><div><Button onClick={() => run('success')}>다시 시도</Button></div></div>}
        {state.status === 'empty' && <div className="data-state-panel react-pattern-state"><h3 className="react-studio-example-title">등록된 프로젝트가 없습니다</h3><p>첫 프로젝트를 등록하면 여기에 표시됩니다.</p><div><Button variant="outline" onClick={() => run('success')}>예제 데이터 불러오기</Button></div></div>}
        {state.status === 'no-results' && <div className="data-state-panel react-pattern-state"><h3 className="react-studio-example-title">검색 결과가 없습니다</h3><p>검색어를 바꾸거나 초기화하세요.</p><div><Button variant="outline" onClick={() => state.setQuery('')}>검색 초기화</Button></div></div>}
        {state.status === 'success' && <TableContainer label="프로젝트 조회 결과"><Table><caption className="sr-only">프로젝트 조회 결과</caption><thead><tr><th scope="col">프로젝트</th><th scope="col">담당 팀</th><th scope="col">상태</th></tr></thead><tbody>{state.visibleItems.map(item => <tr key={item.id}><td>{item.name}</td><td>{item.team}</td><td><Badge variant={item.status === '진행 중' ? 'primary' : item.status === '검토 중' ? 'warning' : 'neutral'}>{item.status}</Badge></td></tr>)}</tbody></Table></TableContainer>}
      </div>
    </Section>
    <Section title="적용 기준" description="최초 데이터 없음에는 등록 행동을, 검색 결과 없음에는 검색 초기화를 제공합니다."><p>오류를 빈 목록과 구분하고 재시도할 수 있게 안내합니다. 조회 중에는 상태 문구와 aria-busy를 함께 갱신하고, 새 요청이 시작되면 이전 요청을 취소합니다.</p></Section>
  </>;
}

export function EmptyStatePattern() {
  const [query,setQuery] = React.useState('모바일 앱');
  const visible = projects.filter(item => item.name.includes(query.trim()));
  return <>
    <Section title="데이터 없음" description="처음 방문한 화면에서는 아직 데이터가 없는 이유와 다음 행동을 함께 안내합니다.">
      <div className="empty-example react-pattern-empty"><Icon name="grid" className="empty-icon" /><h3>아직 프로젝트가 없어요</h3><p>첫 프로젝트를 만들고 작업을 시작해보세요.</p><a className="button button-inline" href="#/patterns/form/project"><Icon name="plus" />프로젝트 만들기</a></div>
    </Section>
    <Section title="검색 결과 없음" description="검색어를 바꾸거나 초기화하면 목록을 다시 표시합니다.">
      <TextField label="프로젝트 검색" type="search" value={query} onChange={event => setQuery(event.target.value)} prefix={<Icon name="search" />} prefixDecorative />
      <p role="status" className="component-helper">{visible.length ? `${visible.length}개 프로젝트` : '검색 결과가 없습니다.'}</p>
      {!visible.length ? <div className="empty-example react-pattern-empty"><Icon name="search" className="empty-icon" /><h3>검색 결과가 없습니다</h3><p>검색어를 바꾸거나 필터를 확인해주세요.</p><div><Button variant="outline" onClick={() => setQuery('')}>검색 초기화</Button></div></div> : <ul className="simple-list">{visible.map(item => <li key={item.id}>{item.name}</li>)}</ul>}
    </Section>
  </>;
}

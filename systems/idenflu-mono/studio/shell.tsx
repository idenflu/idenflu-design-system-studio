import * as React from 'react';
import { Icon } from '@idenflu/mono-react';
import { StudioSettings, ThemeControl, usePreferences } from './controls';
import routes from './dist/routes.json';
import navigation from './dist/navigation.json';
import {documentHref, groupDocumentSections, parseDocumentHash, type DocumentSection} from './document-routes';

export type DocumentRoute = typeof routes[number] & {section?:string};
const menuRoutes = navigation.map(path => routes.find(item => item.route === path)!).filter(item => item && !/^patterns\/(layout|page)\//.test(item.route));
const groups = [...new Set(menuRoutes.filter(item => item.route !== 'overview').map(item => item.group.split(' / ')[0]))];
const currentGroups = (group:string) => ({[group.split(' / ')[0]]:true, [group]:true});
const normalize = (text: string) => text.toLocaleLowerCase().replace(/[\s_-]+/g, '');
const aliases: Record<string, string> = {foundations:'foundations/colors', states:'foundations/states', components:'components/buttons', patterns:'patterns/form/basic', 'components/empty-state':'patterns/empty-state', 'patterns/profile':'patterns/form/profile'};
// An unknown hash renders a not-found document at the requested address instead of silently jumping to Overview.
export const notFoundRouteId = 'not-found';
const notFoundRoute = (requested:string):DocumentRoute => ({route:notFoundRouteId, title:'문서를 찾을 수 없습니다', group:'Not found', description:`#/${requested} 주소에 해당하는 문서가 없습니다. 주소를 확인하거나 아래에서 이동하세요.`, searchTerms:''});
function resolveRoute() {
  const {path, section} = parseDocumentHash(location.hash);
  const route = routes.find(item => item.route === (aliases[path] || path));
  return route ? {...route, section} : notFoundRoute(location.hash.replace(/^#\/?/, ''));
}
const syncHash = (current:DocumentRoute) => {
  if (current.route === notFoundRouteId) return;
  const canonical = documentHref(current.route, current.section);
  if (location.hash !== canonical) history.replaceState(history.state, '', canonical);
};
export function useDocumentRoute() {
  const [current, setCurrent] = React.useState(resolveRoute);
  React.useEffect(() => {
    const change = () => {
      const next = resolveRoute();
      syncHash(next);
      setCurrent(next);
    };
    change();
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  React.useEffect(() => {
    syncHash(current);
    document.title = `${current.title} — idenflu mono`;
  }, [current]);
  return current;
}

function useMobile() {
  const [mobile, setMobile] = React.useState(() => matchMedia('(max-width: 900px)').matches);
  React.useEffect(() => {
    const media = matchMedia('(max-width: 900px)');
    const sync = () => setMobile(media.matches);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  return mobile;
}

export function DocumentShell({current, children}: {current:DocumentRoute; children:React.ReactNode}) {
  const values = usePreferences();
  const spacing = Number((8 * values.spacing / 100).toFixed(1));
  const mobile = useMobile();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(currentGroups(current.group));
  const [toc, setToc] = React.useState<DocumentSection[]>([]);
  const [tocOpen, setTocOpen] = React.useState(false);
  const sidebar = React.useRef<HTMLElement>(null), surface = React.useRef<HTMLDivElement>(null), search = React.useRef<HTMLInputElement>(null), menuButton = React.useRef<HTMLButtonElement>(null), body = React.useRef<HTMLDivElement>(null), nav = React.useRef<HTMLElement>(null);
  const restoreFocus = React.useRef(true), wasOpen = React.useRef(false), initialRoute = React.useRef(true);
  const needle = normalize(query.trim());
  const shown = menuRoutes.filter(item => normalize(`${item.title} ${item.description} ${item.searchTerms} ${item.route}`).includes(needle));
  const clearSearch = () => {
    setQuery('');
    setExpanded(previous => ({...previous, ...currentGroups(current.group)}));
    search.current?.focus();
  };
  const closeMenu = (restore = true) => { restoreFocus.current = restore; setMenuOpen(false); };
  const focusHeading = () => { const heading = surface.current?.querySelector<HTMLElement>('h1'); heading?.focus({preventScroll:true}); window.scrollTo(0, 0); };
  const focusSection = (id:string) => {
    const target = document.getElementById(id);
    if (!target || !body.current?.contains(target)) { focusHeading(); return; }
    const heading = target.matches('h2') ? target : target.querySelector<HTMLElement>('h2');
    const focusTarget = heading || target;
    focusTarget.tabIndex = -1;
    focusTarget.focus({preventScroll:true});
    focusTarget.scrollIntoView({block:'start'});
  };
  const isStandardClick = (event:React.MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  const navigate = (path:string, event?:React.MouseEvent) => {
    if (event && !isStandardClick(event)) return;
    closeMenu(false);
    if (path === current.route && !current.section) requestAnimationFrame(focusHeading);
  };

  React.useLayoutEffect(() => {
    const open = mobile && menuOpen;
    if (sidebar.current) sidebar.current.inert = mobile && !open;
    if (surface.current) surface.current.inert = open;
    document.body.classList.toggle('sidebar-open', open);
    if (open) search.current?.focus();
    else if (wasOpen.current && mobile && restoreFocus.current) menuButton.current?.focus();
    wasOpen.current = open;
    if (!mobile && menuOpen) setMenuOpen(false);
    return () => { document.body.classList.remove('sidebar-open'); };
  }, [mobile, menuOpen]);

  React.useEffect(() => {
    const keyboard = (event:KeyboardEvent) => {
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !(event.target as Element).closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) {
        event.preventDefault();
        if (mobile && !menuOpen) setMenuOpen(true);
        else search.current?.focus();
      }
      if (!mobile || !menuOpen) return;
      if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
      if (event.key === 'Tab') {
        const focusable = [...(sidebar.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),summary') || [])].filter(element => {
          if (!element.getClientRects().length) return false;
          for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
            if (ancestor instanceof HTMLDetailsElement && !ancestor.open && ancestor.querySelector(':scope > summary') !== element) return false;
          }
          return true;
        });
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !sidebar.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !sidebar.current?.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => document.removeEventListener('keydown', keyboard);
  }, [mobile, menuOpen]);

  React.useLayoutEffect(() => {
    setExpanded(previous => ({...previous, ...currentGroups(current.group)}));
    restoreFocus.current = false;
    setMenuOpen(false);
    const headings = [...(body.current?.querySelectorAll('h2') || [])].filter(heading => !heading.closest('dialog'));
    setToc(headings.map((heading, index) => { heading.id ||= `doc-${current.route.replace(/\//g, '-')}-section-${index + 1}`; return {id:heading.id, title:heading.textContent || ''}; }));
    const moveFocus = !initialRoute.current;
    initialRoute.current = false;
    const frame = requestAnimationFrame(() => {
      const active = nav.current?.querySelector<HTMLElement>('[aria-current="page"]');
      if (active && nav.current) {
        const bounds = active.getBoundingClientRect(), viewport = nav.current.getBoundingClientRect();
        if (bounds.bottom > viewport.bottom) nav.current.scrollTop += bounds.bottom - viewport.bottom;
        else if (bounds.top < viewport.top) nav.current.scrollTop -= viewport.top - bounds.top;
      }
      if (current.section) focusSection(current.section);
      else if (moveFocus) focusHeading();
    });
    return () => cancelAnimationFrame(frame);
  }, [current.route, current.section]);

  React.useEffect(() => { setTocOpen(false); }, [current.route]);

  const groupItems = (group:string) => menuRoutes.filter(item => item.group === group || item.group.startsWith(`${group} / `));
  const subgroups = (group:string) => [...new Set(groupItems(group).filter(item => item.group !== group).map(item => item.group))];
  const paginationRoutes = [menuRoutes[0], ...groups.flatMap(group => [
    ...subgroups(group).flatMap(subgroup => menuRoutes.filter(item => item.group === subgroup)),
    ...menuRoutes.filter(item => item.group === group),
  ])];
  const index = paginationRoutes.findIndex(item => item.route === current.route);
  const previous = index > 0 ? paginationRoutes[index - 1] : null, next = index >= 0 ? paginationRoutes[index + 1] : null;
  const docLink = (item:DocumentRoute, className?:string) => <a className={className} key={item.route} href={documentHref(item.route)} aria-current={item.route === current.route ? 'page' : undefined} hidden={!shown.includes(item)} onClick={event => navigate(item.route, event)}>{item.title}</a>;
  const tocLink = (item:DocumentSection) => <a key={item.id} href={documentHref(current.route, item.id)} aria-current={current.section === item.id ? 'location' : undefined} onClick={event => {
    if (!isStandardClick(event)) return;
    if (mobile) setTocOpen(false);
    if (current.section === item.id) { event.preventDefault(); requestAnimationFrame(() => focusSection(item.id)); }
  }}>{item.title}</a>;
  const groupOpen = (group:string) => needle ? shown.some(item => groupItems(group).includes(item)) : !!expanded[group];
  const groupSummary = (group:string) => <summary onClick={event => { event.preventDefault(); if (!needle) setExpanded(previous => ({...previous, [group]:!previous[group]})); }}>{group.split(' / ').pop()}<Icon name="keyboard-arrow-down" /></summary>;
  return <div className="docs-layout react-studio">
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); surface.current?.querySelector<HTMLElement>('main')?.focus(); }}>본문 바로가기</a>
    <aside className="sidebar" id="sidebar" ref={sidebar} aria-label="문서 메뉴" role={mobile && menuOpen ? 'dialog' : undefined} aria-modal={mobile && menuOpen ? true : undefined} aria-hidden={mobile && !menuOpen ? true : undefined}>
      <div className="sidebar-brand"><a className="wordmark" href="#/overview" aria-label="idenflu mono 홈" onClick={event => navigate('overview', event)}>idenflu mono</a><button className="icon-button sidebar-close" type="button" aria-label="메뉴 닫기" onClick={() => closeMenu()}><Icon name="x" /></button><p>Design system</p></div>
      <div className="docs-search"><label className="sr-only" htmlFor="docs-search">문서 검색</label><div className="docs-search-control"><input ref={search} className="text-input" id="docs-search" type="search" placeholder="문서 검색 · /" autoComplete="off" aria-describedby="docs-search-status" value={query} onChange={event => { setQuery(event.target.value); if (!normalize(event.target.value)) setExpanded(previous => ({...previous, ...currentGroups(current.group)})); }} onKeyDown={event => {
        if (event.key === 'Escape' && query) { event.preventDefault(); event.stopPropagation(); clearSearch(); }
        else if (event.key === 'Enter' && shown.length) { event.preventDefault(); location.hash = documentHref(shown[0].route); navigate(shown[0].route); }
      }} />{query && <button className="icon-button docs-search-clear" type="button" aria-label="검색어 지우기" onClick={clearSearch}><Icon name="x" /></button>}</div><p id="docs-search-status" role="status" aria-live="polite">{shown.length ? `${shown.length}개 문서` : '검색 결과가 없습니다.'}</p></div>
      <nav className="docs-navigation" id="react-studio-nav" ref={nav} aria-label="문서 탐색">
        {!shown.length && <div className="docs-search-empty"><p>문서 이름이나 다른 키워드로 검색해보세요.</p><button className="button button--outline button-inline" type="button" onClick={clearSearch}>전체 문서 보기</button></div>}
        {docLink(menuRoutes[0], 'nav-overview')}
        {groups.map(group => <details className="nav-group" key={group} hidden={!!needle && !shown.some(item => groupItems(group).includes(item))} open={groupOpen(group)}>
          {groupSummary(group)}<div className="nav-children">
            {subgroups(group).map(subgroup => <details className="nav-subgroup" key={subgroup} hidden={!!needle && !shown.some(item => item.group === subgroup)} open={groupOpen(subgroup)}>{groupSummary(subgroup)}<div className="nav-children">{menuRoutes.filter(item => item.group === subgroup).map(item => docLink(item))}</div></details>)}
            {menuRoutes.filter(item => item.group === group).map(item => docLink(item))}
          </div>
        </details>)}
      </nav>
      <div className="sidebar-footer"><p>{values.fontSize}px type · {values.controlHeight}px controls</p><p>{values.radius}px radius · {spacing}px spacing</p></div>
    </aside>
    <button className="sidebar-backdrop" type="button" aria-label="메뉴 닫기" tabIndex={-1} hidden={!mobile || !menuOpen} onClick={() => closeMenu()} />
    <div className="docs-main" id="docs-main" ref={surface}>
      <header className="docs-topbar"><div className="mobile-brand"><a href="#/overview" onClick={event => navigate('overview', event)}>idenflu mono</a></div><nav className="breadcrumb" aria-label="현재 위치"><span>{current.group}</span><span aria-hidden="true">/</span><span id="breadcrumb-title" aria-current="page">{current.title}</span></nav><div className="docs-topbar-tools"><a className="button button--secondary button-inline topbar-gallery" href="../../index.html#/gallery" aria-label="디자인 시스템 갤러리"><span className="gallery-label">갤러리</span><span aria-hidden="true">↗</span></a><StudioSettings /><ThemeControl /><button ref={menuButton} className="button button--outline button-inline react-studio-menu-button" type="button" aria-controls="sidebar" aria-expanded={mobile && menuOpen} onClick={() => setMenuOpen(true)}>메뉴</button></div></header>
      <main className="docs-content react-studio-content" id="main" tabIndex={-1}>
        {current.route !== 'overview' && <header className="doc-heading"><p className="doc-kicker">{current.group}</p><h1 id="doc-title" tabIndex={-1}>{current.title}</h1><p className="doc-description">{current.description}</p></header>}
        {current.route !== 'overview' && toc.length > 1 && <details className="docs-toc" open={!mobile || tocOpen} onToggle={event => { if (mobile) setTocOpen(event.currentTarget.open); }}>
          <summary>이 페이지 목차 <Icon name="keyboard-arrow-down" /></summary>
          <nav aria-label="이 페이지 목차">{toc.length > 8 ? groupDocumentSections(toc).map(group => <div className="docs-toc-group" key={group.title}><span>{group.title}</span><div>{group.sections.map(tocLink)}</div></div>) : <div className="docs-toc-links">{toc.map(tocLink)}</div>}</nav>
        </details>}
        <div className={`route-view route-${current.route.split('/').pop()}`} ref={body} data-route={current.route}>{children}</div>
        <nav className="page-pagination" aria-label="이전 다음 문서">{previous && <a id="previous-doc" href={documentHref(previous.route)} onClick={event => navigate(previous.route, event)}><span>이전</span><strong>{previous.title}</strong></a>}{next && <a id="next-doc" href={documentHref(next.route)} onClick={event => navigate(next.route, event)}><span>다음</span><strong>{next.title}</strong></a>}</nav>
      </main>
      <footer className="docs-footer"><span>idenflu mono</span><span>{values.controlHeight}px height / {values.radius}px radius / {spacing}px spacing</span></footer>
    </div>
  </div>;
}

export function Overview() {
  const values = usePreferences();
  const [primary, setPrimary] = React.useState('');
  React.useEffect(() => {
    const root = document.documentElement;
    const update = () => setPrimary(getComputedStyle(root).getPropertyValue('--primary').trim().toUpperCase());
    const observer = new MutationObserver(update);
    observer.observe(root, {attributes:true, attributeFilter:['data-theme','style']}); update();
    return () => observer.disconnect();
  }, []);
  return <><section className="hero" aria-labelledby="page-title"><p className="eyebrow">DESIGN SYSTEM</p><h1 id="page-title" tabIndex={-1}>Form follows<br />function.</h1><p className="hero-description">A precise foundation for everyday interfaces.</p></section>
    <dl className="overview-facts"><div><dt>Primary</dt><dd><span className="inline-color" aria-hidden="true" />{primary}</dd></div><div><dt>Typography</dt><dd>{values.fontSize}px / {values.lineHeight}px</dd></div><div><dt>Control height</dt><dd>{values.controlHeight}px</dd></div><div><dt>Corner radius</dt><dd>{values.radius}px</dd></div></dl>
    <section className="overview-start"><h2>하나의 기준으로, 일관되게.</h2><p>기초 스타일부터 컴포넌트와 폼 패턴까지 찾아보세요.</p><div className="overview-links"><a href="#/foundations/colors"><span>01 / Foundations</span><h3>기초 스타일</h3><p>색상, 타이포그래피와 인터랙션의 기본 규칙.</p></a><a href="#/components/buttons"><span>02 / Components</span><h3>컴포넌트</h3><p>버튼부터 테이블까지, 직접 사용해보는 기본 요소.</p></a><a href="#/patterns/form/basic"><span>03 / Patterns</span><h3>패턴</h3><p>입력 폼과 데이터 상태를 조합한 화면 예시.</p></a></div></section></>;
}

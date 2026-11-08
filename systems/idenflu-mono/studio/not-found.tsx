import * as React from 'react';

// Rendered inside the document shell when the hash names no document; the shell heading carries the title.
export function DocumentNotFound() {
  const requested = location.hash || '#/';
  return <section className="studio-not-found" aria-label="찾을 수 없는 문서 주소">
    <p>요청한 주소</p><code>{requested}</code>
    <ul>
      <li>주소에 오타나 빠진 부분이 없는지 확인해주세요.</li>
      <li>왼쪽 메뉴나 문서 검색(<kbd>/</kbd>)으로 문서를 찾을 수 있습니다.</li>
    </ul>
    <div className="studio-not-found-links">
      <a className="button button-inline" href="#/overview">Overview</a>
      <a className="button button--outline button-inline" href="#/components/buttons">컴포넌트</a>
      <a className="button button--outline button-inline" href="#/patterns/form/basic">패턴</a>
    </div>
  </section>;
}

const layouts = [{value:'sidebar', title:'사이드바형 업무 화면', description:'트리 메뉴와 작업 탭이 있는 관리자 화면 샘플'}];

// Rendered on its own when the layout query names no sample; no document shell applies here.
export function LayoutNotFound({layout}: {layout:string}) {
  React.useEffect(() => { document.title = '레이아웃을 찾을 수 없습니다 — idenflu mono'; }, []);
  return <main className="studio-not-found-page" aria-labelledby="layout-not-found-title">
    <section className="studio-not-found">
      <p className="doc-kicker">NOT FOUND</p>
      <h1 id="layout-not-found-title">레이아웃을 찾을 수 없습니다</h1>
      <p>요청한 값</p><code>?layout={layout}</code>
      <p className="studio-not-found-lead"><code>layout</code> 값으로 열 수 있는 샘플 화면은 다음과 같습니다.</p>
      <ul className="studio-not-found-options">
        {layouts.map(item => <li key={item.value}><a href={`?layout=${item.value}`}><strong>{item.value}</strong><span>{item.title} · {item.description}</span></a></li>)}
      </ul>
      <div className="studio-not-found-links">
        <a className="button button--outline button-inline" href="./index.html#/overview">문서로 이동</a>
        <a className="button button--outline button-inline" href="./index.html#/patterns/layout">Layout 패턴 문서</a>
      </div>
    </section>
  </main>;
}

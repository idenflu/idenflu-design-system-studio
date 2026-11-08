export type DocumentAddress = {path:string; section?:string};

/** The hash owns the document route; its query keeps a shareable section target. */
export function parseDocumentHash(hash:string):DocumentAddress {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?', 2);
  const section = new URLSearchParams(query).get('section') || undefined;
  return {path:path.replace(/\/+$/, '') || 'overview', ...(section ? {section} : {})};
}

export function documentHref(path:string, section?:string) {
  const query = section ? `?${new URLSearchParams({section})}` : '';
  return `#/${path}${query}`;
}

export type DocumentSection = {id:string; title:string};
export function groupDocumentSections(sections:DocumentSection[]) {
  const groups = [
    {title:'예제', sections:[] as DocumentSection[]},
    {title:'API', sections:[] as DocumentSection[]},
    {title:'사용 기준', sections:[] as DocumentSection[]},
    {title:'코드', sections:[] as DocumentSection[]},
  ];
  for (const section of sections) {
    const title = section.title;
    const index = /React 사용 예시/.test(title) ? 3
      : /속성|타입|이벤트|API/.test(title) || section.id === 'data-grid-toolbar-title' ? 1
      : /사용 기준|키보드|스타일|동작[· ]|접근성|재사용 후보/.test(title) ? 2 : 0;
    groups[index].sections.push(section);
  }
  return groups.filter(group => group.sections.length);
}

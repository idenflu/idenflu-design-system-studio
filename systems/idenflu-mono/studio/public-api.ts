import metadata from './public-api.generated.json';

export type APIContract = keyof typeof metadata.contracts;
export type APIContracts = APIContract | readonly APIContract[];
export type APIPropertyRow = readonly [name: string, initial: string, description: string];

/** Types are generated from the package declarations; defaults and prose are editorial. */
export function publicAPIType(contracts: APIContracts, names: string): string {
  const contractNames = typeof contracts === 'string' ? [contracts] : contracts;
  const propertyNames = names.split('/').map(name => name.trim());
  const groups = new Map<string, {contract: string; property: string}[]>();
  for (const property of propertyNames) {
    let found = false;
    for (const contract of contractNames) {
      const properties = metadata.contracts[contract] as Record<string, {type: string; optional: boolean}>;
      const entry = properties[property];
      if (!entry) continue;
      found = true;
      if (!groups.has(entry.type)) groups.set(entry.type, []);
      groups.get(entry.type)!.push({contract, property});
    }
    if (!found) throw new Error(`Unknown public API property: ${contractNames.join(' / ')}.${property}`);
  }
  if (groups.size === 1) return groups.keys().next().value!;
  return [...groups].map(([type, matches]) => {
    const properties = [...new Set(matches.map(match => match.property))];
    const components = [...new Set(matches.map(match => match.contract))];
    const labels = [
      components.length < contractNames.length ? components.join(' / ') : '',
      properties.length < propertyNames.length ? properties.join(' / ') : '',
    ].filter(Boolean);
    return `${labels.join('.')}: ${type}`;
  }).join('; ');
}

export const publicAPINote = '타입은 패키지의 공개 선언에서 생성합니다. undefined를 포함한 선택 속성은 생략할 수 있습니다. 기본값과 동작 설명은 문서에서 관리합니다.';

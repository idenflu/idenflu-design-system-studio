import * as React from 'react';
import { Grid, Badge, Table, TableContainer } from '../src';
import { Section } from './demo-layout';
import { StatusBadge } from './status-definitions';

const sizes = [
  { size: 'sm', height: 20, font: 12, line: 16, icon: 12, padding: 6 },
  { size: 'md', height: 24, font: 13, line: 18, icon: 14, padding: 8 },
  { size: 'lg', height: 28, font: 14, line: 20, icon: 16, padding: 10 },
] as const;

const props = [
  ['size', '"sm" | "md" | "lg" · 선택', '명시한 크기를 적용합니다. 생략하면 상위 data-size를 따르고, 상위 크기가 없으면 md를 사용합니다.'],
  ['variant', '"neutral" | "primary" | "success" | "warning" | "danger" · 기본: neutral', '상태의 의미에 맞는 색상입니다. 색상과 함께 짧은 문구를 표시하세요.'],
  ['appearance', '"default" | "solid" · 기본: default', 'default는 연한 배경, solid는 상태색 배경과 반전 텍스트를 사용합니다.'],
  ['children', 'ReactNode', '표시할 상태 문구와 선택적인 장식 아이콘입니다.'],
  ['className', 'string · 선택', '배지 span에 추가할 CSS 클래스입니다.'],
  ['일반 HTML 속성', 'HTMLAttributes<HTMLSpanElement>', 'id, title, aria-*, data-* 및 이벤트 등 span의 일반 속성을 전달합니다.'],
] as const;

export function BadgeSizeDemos() {
  return <>
    <Section id="badge-sizes" title="배지 사이즈" description="SM·MD·LG에 같은 상태색과 표현을 적용합니다. 주변 글자와 정보 밀도에 맞춰 크기를 선택하세요.">
      <Grid columns={{base:1,sm:3}} gap={6} alignItems="start" className="react-studio-size-grid">{sizes.map(({size}) => <div key={size} className="react-studio-stack" role="group" aria-label={`${size.toUpperCase()} 배지`}>
        <h3 className="react-studio-example-title">{size.toUpperCase()}{size === 'md' ? ' · 기본' : ''}</h3>
        <div className="react-studio-row"><Badge size={size} variant="success">완료</Badge><StatusBadge size={size} status="success" /><StatusBadge size={size} status="success" appearance="solid" /></div>
      </div>)}</Grid>
      <TableContainer label="Badge 기본 크기">
        <Table>
          <caption className="sr-only">기본 설정에서의 배지 크기, 단위 px</caption>
          <thead><tr><th scope="col">크기</th><th scope="col">높이</th><th scope="col">글자</th><th scope="col">행간</th><th scope="col">아이콘</th><th scope="col">좌우 여백</th></tr></thead>
          <tbody>{sizes.map(({size,height,font,line,icon,padding}) => <tr key={size}><th scope="row"><code>{size}</code></th><td>{height}px</td><td>{font}px</td><td>{line}px</td><td>{icon}px</td><td>{padding}px</td></tr>)}</tbody>
        </Table>
      </TableContainer>
      <p className="react-studio-caption">표는 기본 설정 기준입니다. 문서와 설치한 패키지는 같은 크기 규칙을 사용합니다. 사용자 글자 크기·행간 설정에 따라 글자와 높이가 커져도 내용이 잘리지 않도록 여유를 유지합니다.</p>
    </Section>
    <Section id="badge-size-inheritance" title="배지 크기 상속" description="size를 생략한 배지는 상위 data-size를 따릅니다. 밀도가 높은 표에서는 SM을 사용하고, size를 지정하면 해당 배지만 다른 크기로 표시합니다.">
      <div className="react-studio-row" role="group" aria-label="SM 상위 크기와 명시한 배지 크기" data-size="sm"><StatusBadge status="success">SM 상속</StatusBadge><StatusBadge status="success" size="md">MD 지정</StatusBadge><StatusBadge status="success" size="lg">LG 지정</StatusBadge></div>
      <TableContainer label="Compact 표의 배지 크기">
        <Table density="compact">
          <caption className="sr-only">Compact 표에서 기본 SM과 명시한 MD·LG 배지 비교</caption>
          <thead><tr><th scope="col">크기 생략</th><th scope="col">size="md"</th><th scope="col">size="lg"</th></tr></thead>
          <tbody><tr><td><StatusBadge status="success">SM 상속</StatusBadge></td><td><StatusBadge status="success" size="md">MD 지정</StatusBadge></td><td><StatusBadge status="success" size="lg">LG 지정</StatusBadge></td></tr></tbody>
        </Table>
      </TableContainer>
    </Section>
    <Section id="badge-api" title="Badge 속성" description="Badge는 상태를 표시하는 span입니다. 클릭하거나 선택하는 분류에는 Chip을 사용하세요.">
      <TableContainer label="Badge 속성">
        <Table>
          <caption className="sr-only">Badge 속성, 타입과 기본값</caption>
          <thead><tr><th scope="col">속성</th><th scope="col">타입 · 기본값</th><th scope="col">설명</th></tr></thead>
          <tbody>{props.map(([name,type,description]) => <tr key={name}><th scope="row"><code>{name}</code></th><td><code>{type}</code></td><td>{description}</td></tr>)}</tbody>
        </Table>
      </TableContainer>
      <p className="react-studio-caption">크기는 <code>size</code>로 선택하고, 세부 조정은 <code>className</code> 범위에서 CSS 변수를 재정의합니다. <code>--badge-font-size</code>는 글자, <code>--badge-line-height</code>는 행간, <code>--badge-height</code>는 높이, <code>--badge-icon-size</code>는 아이콘, <code>--badge-padding-inline</code>은 좌우 여백, <code>--badge-gap</code>은 아이콘과 문구 사이 간격입니다. 글자나 행간을 바꾸면 높이도 함께 조정하세요.</p>
    </Section>
  </>;
}

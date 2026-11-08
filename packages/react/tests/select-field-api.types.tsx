import * as React from 'react';
import { Select, SearchSelect, MultiSelect } from '../dist/index.js';

const options = [{value:'design',label:'디자인'}];
const button = React.createRef<HTMLButtonElement>();
const input = React.createRef<HTMLInputElement>();

<Select label="팀" options={options} ref={button} helperText="팀을 선택하세요." error="접근 권한을 확인하세요." />;
<SearchSelect label="팀 검색" options={options} ref={input} helperText={<span>이름으로 검색하세요.</span>} />;
<MultiSelect label="참여 팀" options={options} ref={button} presentation="inline" />;

// @ts-expect-error Select exposes a button, not the hidden native select or a text input.
<Select label="팀" options={options} ref={input} />;
// @ts-expect-error SearchSelect exposes the visible search input.
<SearchSelect label="팀 검색" options={options} ref={button} />;
// @ts-expect-error MultiSelect exposes its trigger, including searchable/inline variants.
<MultiSelect label="참여 팀" options={options} searchable ref={input} />;

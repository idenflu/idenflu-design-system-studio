const React = require('../../packages/idenflu-mono-react/node_modules/react');
const { renderToStaticMarkup } = require('../../packages/idenflu-mono-react/node_modules/react-dom/server');
const C = require('../../packages/idenflu-mono-react/dist/index.cjs');
const h = React.createElement;
const noop = () => {};
const options = [{value:'one',label:'디자인'}, {value:'two',label:'개발'}];

function createCases() {
  return [
    ['button', '.button', h(C.Button, null, '저장')],
    ['icon-button', '.button--icon', h(C.IconButton, {label:'추가'}, h(C.Icon, {name:'plus'}))],
    ['text-field', '.text-input', h(C.TextField, {label:'이름', defaultValue:'프로젝트'})],
    ['input-group', '.input-group', h(C.TextField, {label:'주소', prefix:'https://', defaultValue:'idenflu.io'})],
    ['text-area', '.text-area', h(C.TextArea, {label:'설명', defaultValue:'상세 설명'})],
    ['select', '.custom-select', h(C.Select, {label:'팀', options, defaultValue:'one'})],
    ['search-select', '.custom-select', h(C.SearchSelect, {label:'팀 검색', options, defaultValue:'one'})],
    ['multi-select', '.custom-select', h(C.MultiSelect, {label:'참여 팀', options, defaultValue:['one']})],
    ['inline-select', '.custom-select', h(C.MultiSelect, {label:'태그 선택', options, presentation:'inline', defaultValue:['one']})],
    ['checkbox', '.choice', h(C.Checkbox, {label:'동의', defaultChecked:true})],
    ['radio', '.choice', h(C.Radio, {label:'선택', defaultChecked:true})],
    ['switch', '.switch-setting', h(C.Switch, {label:'알림', defaultChecked:true})],
    ['badge', '.badge', h(C.Badge, {variant:'success'}, '완료')],
    ['alert', '.inline-alert', h(C.Alert, {variant:'warning'}, '입력 내용을 확인해주세요.')],
    ['progress', '.progress-bar', h(C.Progress, {value:60,max:100,'aria-label':'처리 진행률'})],
    ['circle-progress', '.progress-circle', h(C.CircleProgress, {value:60,label:'전체 진행률'})],
    ['segmented-progress', '.progress-segments', h(C.SegmentedProgress, {value:2,total:4,label:'등록 단계'})],
    ['spinner', '.spinner', h(C.Spinner, {label:'로딩'})],
    ['nova-spinner', '.nova-spinner', h(C.NovaSpinner, {size:32,label:'처리 중'})],
    ['skeleton', '.skeleton', h(C.Skeleton, {style:{width:120,height:16}})],
    ['avatar', '.avatar', h(C.Avatar, null, '김')],
    ['card', '.demo-card', h(C.Card, null, h('h3',null,'프로젝트'), h('p',null,'작업 설명'))],
    ['table', '.table-scroll', h(C.TableContainer, {label:'작업 목록'}, h(C.Table,null,h('thead',null,h('tr',null,h('th',null,'이름'))),h('tbody',null,h('tr',null,h('td',null,'디자인 시스템')))))],
    ['accordion', '.accordion', h(C.Accordion,null,h(C.AccordionItem,{title:'공유 범위',open:true},h('p',null,'팀원에게만 공유됩니다.')))],
    ['list', '.simple-list', h(C.List,null,h(C.ListItem,null,'디자인 시스템'))],
    ['selectable-list', '.selectable-list', h(C.SelectableList,{'aria-label':'프로젝트'},h(C.SelectableListItem,{'aria-pressed':true},'디자인 시스템'))],
    ['pagination', '.pagination', h(C.Pagination,{page:1,pageCount:2,onPageChange:noop})],
    ['stepper', '.stepper', h(C.Stepper,{steps:['기본 정보','검토'],currentStep:0})],
    ['tooltip', '.tooltip-wrap', h(C.Tooltip,{content:'안내'},h(C.Button,null,'안내'))],
    ['popover', '.popover-wrap', h(C.Popover,{trigger:'상세',label:'상세 정보',defaultOpen:true},h('p',null,'프로젝트 정보'))],
    ['dropdown-menu', '.action-menu', h(C.DropdownMenu,{trigger:h('button',{className:'button button--outline button-inline'},'작업'),onSelect:noop},options.map(item => h(C.DropdownMenuItem,{key:item.value,value:item.value,disabled:item.disabled},item.label)))],
    ['slider', '.range-input', h(C.Slider,{'aria-label':'진행률',defaultValue:50})],
    ['file-upload', '.upload-area', h(C.FileUpload,{label:'첨부 파일'})],
    ['toast', '.toast', h(C.Toast,{onDismiss:noop},'변경사항을 저장했습니다.')],
    ['slides', '.slide-example', h(C.Slides,{slides:[h('p',null,'첫 번째 내용'),h('p',null,'두 번째 내용')]})],
    ['tabs', '.tabs', h(C.Tabs,{label:'상세 탭',items:[{value:'one',label:'기본',content:'기본 정보'},{value:'two',label:'기록',content:'변경 기록'}]})],
    ['segmented', '.segmented-control', h(C.Segmented,{label:'보기',options,defaultValue:'one'})],
    ['tree', '.demo-tree', h(C.Tree,{label:'프로젝트 트리',items:[{value:'root',label:'프로젝트',children:options}],defaultExpanded:['root']})],
    ['number-field', '.number-field', h(C.NumberField,{label:'금액',defaultValue:'1000',grouping:true,helperText:'원 단위로 입력하세요.',error:'금액을 확인해주세요.'})],
    ['date-picker', '.date-picker', h(C.DatePicker,{label:'일자',defaultValue:'2026-11-12'})],
    ['date-range-picker', '.date-picker', h(C.DateRangePicker,{label:'기간',defaultValue:['2026-11-12','2026-11-14']})],
    ['datetime-picker', '.date-picker', h(C.DateTimePicker,{label:'시작 일시'})],
    ['datetime-range-picker', '.date-picker', h(C.DateTimeRangePicker,{label:'예약 기간'})],
    ['time-picker', '.date-picker', h(C.TimePicker,{label:'시작 시간',defaultValue:'09:00'})],
    ['data-state', '.data-state', h(C.DataState,{load:async()=>[],matches:()=>true,initialItems:['프로젝트'],getKey:value=>value,renderItem:value=>value})],
    ['divider', '.divider', h(C.Divider,null,'상세 정보')],
    ['data-grid', '.data-grid', h(C.DataGrid,{label:'프로젝트',columns:[{id:'name',header:'이름',accessor:row=>row.name}],rows:[{id:'one',name:'디자인 시스템'}],getRowId:row=>row.id})],
  ];
}

function renderCases() {
  const cases = createCases();
  return {
    cases: cases.map(([name,selector]) => ({name,selector})),
    markup: renderToStaticMarkup(h(React.Fragment,null,...cases.map(([name,,content])=>h('section',{'data-case':name,key:name},content)))),
  };
}

module.exports = { React, C, h, renderToStaticMarkup, renderCases };

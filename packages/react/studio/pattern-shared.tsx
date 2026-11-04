import * as React from 'react';
import { Button } from '../src';

export type FormIssues = Record<string, string>;
export const fieldLabel = (label:string, required = false) => <>{label} <span className={required ? 'form-pattern-required' : 'form-pattern-optional'}>{required ? '필수' : '선택'}</span></>;
export const textValue = (data:FormData, key:string) => String(data.get(key) ?? '').trim();
export function previewFormData(data:FormData) {
  const values:Record<string,unknown>={};
  for(const key of new Set(data.keys())) {
    const entries=data.getAll(key).map(value=>{
      // 미리보기에는 비밀번호나 파일 내용을 넣지 않습니다.
      if(['current','password','confirm'].includes(key)) return '[표시하지 않음]';
      return typeof value==='string' ? value : value.name ? {name:value.name,size:value.size,type:value.type} : null;
    });
    values[key]=entries.length>1 || ['channels','teams'].includes(key) ? entries : entries[0];
  }
  return values;
}
export function integerIssue(value:string, min:bigint, max:bigint, required = false) {
  if (!value) return required ? '값을 입력해주세요.' : '';
  if (!/^\d+$/.test(value)) return '소수·지수 표기 없이 10진 정수로 입력해주세요.';
  const number = BigInt(value);
  return number < min || number > max ? `${min.toLocaleString()}~${max.toLocaleString()} 사이로 입력해주세요.` : '';
}
export function usePatternForm(validate:(data:FormData) => FormIssues, success:string) {
  const ref = React.useRef<HTMLFormElement>(null);
  const [errors, setErrors] = React.useState<FormIssues>({});
  const [result, setResult] = React.useState('');
  const [values,setValues]=React.useState<Record<string,unknown>|null>(null);
  const [revision, setRevision] = React.useState(0);
  const attempted = React.useRef(false), focusKey = React.useRef('');
  React.useLayoutEffect(() => {
    if (!focusKey.current || !ref.current) return;
    const control = Array.from(ref.current.elements).find(element => element.getAttribute('name') === focusKey.current) as HTMLElement | undefined;
    control?.focus(); focusKey.current = '';
  }, [errors]);
  const clearResult = () => {setResult('');setValues(null);};
  const edited = () => { clearResult(); if (attempted.current && ref.current) setErrors(validate(new FormData(ref.current))); };
  const afterChange = () => { clearResult(); requestAnimationFrame(() => { if (attempted.current && ref.current) setErrors(validate(new FormData(ref.current))); }); };
  const props = {
    ref, noValidate:true, className:'react-pattern-form',
    onSubmit:(event:React.FormEvent<HTMLFormElement>) => {
      event.preventDefault(); attempted.current = true;
      const data=new FormData(event.currentTarget);
      const next = validate(data);
      focusKey.current = Object.keys(next).find(key => next[key]) || '';
      setErrors(next); setResult(focusKey.current ? '' : success);
      setValues(focusKey.current ? null : previewFormData(data));
    },
    onInput:edited, onChange:edited,
    onReset:() => { attempted.current = false; focusKey.current = ''; setErrors({}); clearResult(); setRevision(value => value + 1); },
  };
  return {props, errors, result, values, revision, clearResult, afterChange};
}
export function FormActions({submit = '입력 확인'}:{submit?:string}) {
  return <div className="form-pattern-actions"><Button type="submit">{submit}</Button><Button type="reset" variant="outline">초기화</Button></div>;
}
export function FormResult({children,values}:{children:string;values?:Record<string,unknown>|null}) { return <><p className="form-pattern-result" role="status">{children}</p>{values && <div className="form-pattern-preview"><strong>폼 제출값</strong><pre role="region" aria-label="폼 제출값" tabIndex={0}>{JSON.stringify(values,null,2)}</pre><p className="react-studio-caption">FormData를 읽은 미리보기입니다. 실제 서버 요청은 제출 처리에서 연결하세요.</p></div>}</>; }
export function GroupError({id, children}:{id:string; children?:string}) { return <p id={id} className="field-error" hidden={!children}>{children}</p>; }

import * as React from 'react';
import { Grid, GridItem, Button, Checkbox, DatePicker, FileUpload, Icon, MultiSelect, NumberField, Radio, Select, Slider, Switch, TextArea, TextField } from '../src';
import { Section } from './demo-layout';
import { fieldLabel, FormActions, FormResult, GroupError, integerIssue, textValue, usePatternForm } from './pattern-shared';

function emailValid(text:string) { const input = document.createElement('input'); input.type = 'email'; input.value = text; return input.validity.valid; }
function ContactForm({profile = false}:{profile?:boolean}) {
  const form = usePatternForm(data => ({
    name:textValue(data,'name') ? '' : '이름을 입력해주세요.',
    email:!textValue(data,'email') ? '이메일을 입력해주세요.' : emailValid(textValue(data,'email')) ? '' : '올바른 이메일 주소를 입력해주세요.',
  }), profile ? '변경사항을 저장했습니다.' : '기본 정보를 확인했습니다.');
  return <form {...form.props}>
    <Grid columns={{base:1,sm:2}} gap={5} columnGap={6} className="form-pattern-grid">
      <TextField label={fieldLabel('이름',true)} name="name" required autoComplete="name" maxLength={60} defaultValue={profile ? '김민수' : ''} placeholder="이름을 입력해주세요" prefix={<Icon name="person" />} prefixDecorative error={form.errors.name || undefined} />
      <TextField label={fieldLabel('이메일',true)} name="email" required type="email" autoComplete="email" defaultValue={profile ? 'minsu@example.com' : ''} placeholder="name@example.com" prefix={<Icon name="email" />} prefixDecorative error={form.errors.email || undefined} />
      {profile ? <GridItem colSpan="full" className="form-pattern-field--wide"><Switch label="제품 소식 받기" name="updates" defaultChecked aria-describedby="profile-updates-help" /><p id="profile-updates-help" className="react-studio-caption">새로운 기능과 소식을 이메일로 받아요.</p></GridItem> : <>
        <TextField label={fieldLabel('회사명')} name="company" autoComplete="organization" placeholder="회사명을 입력해주세요" />
        <TextField label={fieldLabel('연락처')} name="phone" type="tel" autoComplete="tel-national" prefix="+82" placeholder="10-1234-5678" />
        <GridItem colSpan="full" className="form-pattern-field--wide"><TextField label={fieldLabel('웹사이트')} name="website" inputMode="url" prefix="https://" placeholder="example.com" /></GridItem>
      </>}
    </Grid>
    <FormActions submit={profile ? '변경사항 저장' : '확인'} /><FormResult values={form.values}>{form.result}</FormResult>
  </form>;
}
export function BasicFormPattern() { return <Section title="기본 정보 입력" description="필수 정보를 입력한 후 확인을 눌러보세요."><ContactForm /></Section>; }
export function ProfilePattern() { return <Section title="프로필 수정" description="이름, 이메일과 제품 소식 수신 여부를 수정합니다."><ContactForm profile /></Section>; }

export function PreferencesPattern() {
  const form = usePatternForm(data => ({channels:data.getAll('channels').length ? '' : '알림 채널을 하나 이상 선택해주세요.', contact:data.get('contact') ? '' : '연락 방법을 선택해주세요.'}), '선택한 설정을 확인했습니다.');
  return <Section title="알림 설정" description="알림을 받을 채널과 선호하는 연락 방법을 선택하세요."><form {...form.props}>
    <Grid columns={{base:1,sm:2}} gap={5} columnGap={6} className="form-pattern-grid">
      <fieldset className="form-pattern-choices"><legend>{fieldLabel('알림 채널',true)}</legend>{[['email','이메일'],['push','푸시 알림'],['sms','문자 메시지']].map(([value,label]) => <Checkbox key={value} label={label} name="channels" value={value} aria-invalid={!!form.errors.channels || undefined} aria-describedby={form.errors.channels ? 'channels-error' : undefined} />)}<GroupError id="channels-error">{form.errors.channels}</GroupError></fieldset>
      <fieldset className="form-pattern-choices"><legend>{fieldLabel('선호 연락 방법',true)}</legend>{[['email','이메일'],['phone','전화']].map(([value,label]) => <Radio key={value} label={label} name="contact" value={value} required aria-invalid={!!form.errors.contact || undefined} aria-describedby={form.errors.contact ? 'contact-error' : undefined} />)}<GroupError id="contact-error">{form.errors.contact}</GroupError></fieldset>
      <GridItem colSpan="full" className="form-pattern-field--wide"><Select label="시간대" name="timezone" defaultValue="seoul" options={[{value:'seoul',label:'서울 (UTC+09:00)'},{value:'london',label:'런던'},{value:'new-york',label:'뉴욕'}]} onValueChange={form.clearResult} /></GridItem>
      <GridItem colSpan="full" className="form-pattern-field--wide"><Switch label="주간 요약 받기" name="weekly" defaultChecked aria-describedby="weekly-help" /><p id="weekly-help" className="react-studio-caption">한 주의 활동을 요약해 이메일로 받습니다.</p></GridItem>
    </Grid><FormActions submit="설정 확인" /><FormResult values={form.values}>{form.result}</FormResult>
  </form></Section>;
}

function PasswordField({label,name,error,helperText}:{label:string; name:string; error?:string; helperText?:string}) {
  const [visible,setVisible] = React.useState(false); const id = React.useId();
  return <TextField id={id} label={fieldLabel(label,true)} name={name} required type={visible ? 'text' : 'password'} autoComplete={name === 'current' ? 'current-password' : 'new-password'} prefix={<Icon name="lock" />} prefixDecorative error={error || undefined} helperText={helperText} action={<button className="input-action" type="button" aria-controls={id} aria-label={`${label} ${visible ? '숨기기' : '표시'}`} aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon name={visible ? 'eye-slash' : 'eye'} /></button>} />;
}
export function PasswordPattern() {
  const form = usePatternForm(data => {
    const current = String(data.get('current') || ''), password = String(data.get('password') || ''), confirm = String(data.get('confirm') || '');
    return {current:current ? '' : '현재 비밀번호를 입력해주세요.', password:!password ? '새 비밀번호를 입력해주세요.' : password.length < 8 ? '새 비밀번호는 8자 이상이어야 합니다.' : '', confirm:!confirm ? '새 비밀번호를 다시 입력해주세요.' : password !== confirm ? '새 비밀번호가 일치하지 않습니다.' : ''};
  }, '비밀번호 입력을 확인했습니다.');
  return <Section title="비밀번호 변경" description="새 비밀번호는 8자 이상으로 입력해주세요."><form {...form.props}><Grid columns={{base:1,sm:2}} gap={5} columnGap={6} className="form-pattern-grid">
    <GridItem colSpan="full" className="form-pattern-field--wide"><PasswordField key={`current-${form.revision}`} label="현재 비밀번호" name="current" error={form.errors.current} /></GridItem>
    <PasswordField key={`password-${form.revision}`} label="새 비밀번호" name="password" error={form.errors.password} helperText="8자 이상 입력해주세요." />
    <PasswordField key={`confirm-${form.revision}`} label="새 비밀번호 확인" name="confirm" error={form.errors.confirm} />
  </Grid><FormActions /><FormResult values={form.values}>{form.result}</FormResult><p className="react-studio-caption">입력 확인용 예시이며 계정 비밀번호는 변경되지 않습니다.</p></form></Section>;
}

export function InquiryPattern() {
  const [count,setCount] = React.useState(0);
  const form = usePatternForm(data => { const message = textValue(data,'message'); return {message:!message ? '문의 내용을 입력해주세요.' : message.length < 10 ? '문의 내용은 10자 이상 입력해주세요.' : message.length > 500 ? '문의 내용은 500자 이하로 입력해주세요.' : ''}; }, '문의 내용을 확인했습니다.');
  return <Section title="문의 내용" description="상세 내용을 작성하고 필요한 파일을 선택하세요."><form {...form.props} onReset={() => {form.props.onReset(); setCount(0);}}><Grid columns={{base:1,sm:2}} gap={5} columnGap={6} className="form-pattern-grid">
    <Select label="문의 유형" name="type" defaultValue="general" options={[{value:'general',label:'일반 문의'},{value:'feature',label:'기능 제안'},{value:'issue',label:'문제 신고'}]} onValueChange={form.clearResult} />
    <TextField label={fieldLabel('제목')} name="subject" maxLength={80} placeholder="문의 제목" />
    <GridItem colSpan="full" className="form-pattern-field--wide"><TextArea label={fieldLabel('문의 내용',true)} name="message" required rows={5} minLength={10} maxLength={500} placeholder="문의 내용을 입력해주세요" onChange={event => setCount(event.target.value.length)} error={form.errors.message || undefined} helperText={<span className="react-studio-field-meta"><span>10자 이상 입력해주세요.</span><span>{count} / 500자</span></span>} /></GridItem>
    <GridItem colSpan="full" className="form-pattern-field--wide react-pattern-stack"><span className="field-label">{fieldLabel('첨부 파일')}</span><FileUpload name="attachment" label="파일 선택" onFilesChange={form.clearResult} /><p className="react-studio-caption">예제에서 선택한 파일은 전송되지 않습니다.</p></GridItem>
  </Grid><FormActions submit="내용 확인" /><FormResult values={form.values}>{form.result}</FormResult></form></Section>;
}

export function ProjectPattern() {
  const [count,setCount] = React.useState(0), [progress,setProgress] = React.useState(35);
  const form = usePatternForm(data => ({name:textValue(data,'name') ? '' : '프로젝트 이름을 입력해주세요.', slug:!textValue(data,'slug') ? '프로젝트 주소를 입력해주세요.' : /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(textValue(data,'slug')) ? '' : '영문 소문자, 숫자와 하이픈으로 입력해주세요.', budget:integerIssue(textValue(data,'budget'),0n,9007199254740991n)}), '입력 내용을 확인했습니다.');
  return <Section title="새 프로젝트" description="프로젝트 정보와 함께 작업할 팀을 설정하세요."><form {...form.props} onReset={() => {form.props.onReset(); setCount(0); setProgress(35);}}>
    <fieldset className="form-example-group"><legend>기본 정보</legend><Grid columns={{base:1,sm:2}} gap={5} columnGap={6} className="form-pattern-grid">
      <TextField label={fieldLabel('프로젝트명',true)} name="name" required maxLength={60} placeholder="프로젝트 이름" prefix={<Icon name="grid" />} prefixDecorative error={form.errors.name || undefined} />
      <Select label="상태" name="status" defaultValue="planned" options={[{value:'planned',label:'준비 중'},{value:'progress',label:'진행 중'},{value:'done',label:'완료'}]} onValueChange={form.clearResult} />
      <GridItem colSpan="full" className="form-pattern-field--wide"><TextField label={fieldLabel('프로젝트 주소',true)} name="slug" required prefix="idenflu.app /" placeholder="design-system" helperText="영문 소문자, 숫자와 하이픈을 사용하세요." error={form.errors.slug || undefined} /></GridItem>
      <GridItem colSpan="full" className="form-pattern-field--wide"><TextArea label={fieldLabel('설명')} name="description" rows={3} maxLength={300} onChange={event => setCount(event.target.value.length)} helperText={<span className="react-studio-field-meta"><span>최대 300자</span><span>{count} / 300자</span></span>} /></GridItem>
    </Grid></fieldset>
    <fieldset className="form-example-group"><legend>팀과 진행 정보</legend><Grid columns={{base:1,sm:2}} gap={5} columnGap={6} className="form-pattern-grid">
      <GridItem colSpan="full" className="form-pattern-field--wide"><MultiSelect label="참여 팀 · 선택" name="teams" defaultValue={['design']} options={[{value:'design',label:'디자인'},{value:'engineering',label:'개발'},{value:'research',label:'리서치'}]} presentation="inline" searchable clearable onValueChange={form.clearResult} /></GridItem>
      <NumberField className="form-pattern-budget" label={fieldLabel('예산')} name="budget" min="0" max="9007199254740991" unit="만원" helperText="0~9,007,199,254,740,991의 10진 정수로 입력하세요." error={form.errors.budget || undefined} onValueChange={form.afterChange} />
      <div className="react-pattern-stack"><label className="field-label" htmlFor="project-progress">진행률 <output htmlFor="project-progress">{progress}%</output></label><Slider id="project-progress" name="progress" value={progress} step={5} onValueChange={value => {setProgress(value); form.clearResult();}} /><p className="react-studio-caption">5% 단위로 조정합니다.</p></div>
    </Grid></fieldset><FormActions /><FormResult values={form.values}>{form.result}</FormResult><p className="react-studio-caption">입력 확인용 예시이며 프로젝트는 생성되지 않습니다.</p></form></Section>;
}

function validDate(text:string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text); if (!match) return false;
  const [year,month,day] = match.slice(1).map(Number), date = new Date(0); date.setFullYear(year,month - 1,day);
  return year > 0 && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
export function BookingPattern() {
  const form = usePatternForm(data => ({date:!textValue(data,'date') ? '예약 날짜를 입력해주세요.' : validDate(textValue(data,'date')) ? '' : '올바른 날짜를 입력해주세요.', attendees:integerIssue(textValue(data,'attendees'),1n,20n,true), format:data.get('format') ? '' : '참석 방식을 선택해주세요.'}), '입력 내용을 확인했습니다.');
  return <Section title="미팅 예약" description="날짜와 참석 정보를 선택하세요."><form {...form.props}>
    <fieldset className="form-example-group"><legend>일정</legend><Grid columns={{base:1,sm:2}} gap={5} columnGap={6} className="form-pattern-grid">
      <DatePicker label={fieldLabel('날짜',true)} name="date" required helperText="YYYY-MM-DD 또는 숫자 8자리로 입력해주세요." error={form.errors.date || undefined} onValueChange={form.afterChange} />
      <Select label="시작 시간" name="time" defaultValue="1000" options={[{value:'0900',label:'오전 9:00'},{value:'1000',label:'오전 10:00'},{value:'1400',label:'오후 2:00'},{value:'1600',label:'오후 4:00'}]} onValueChange={form.clearResult} />
      <Select label="미팅 길이" name="duration" defaultValue="60" options={[{value:'30',label:'30분'},{value:'60',label:'1시간'},{value:'90',label:'1시간 30분'}]} onValueChange={form.clearResult} />
      <NumberField label={fieldLabel('참석 인원',true)} name="attendees" required defaultValue="1" min="1" max="20" unit="명" error={form.errors.attendees || undefined} onValueChange={form.afterChange} />
    </Grid></fieldset>
    <fieldset className="form-pattern-choices"><legend>{fieldLabel('참석 방식',true)}</legend><Radio label="온라인 · 화상 회의로 참여합니다." name="format" value="online" required aria-invalid={!!form.errors.format || undefined} aria-describedby={form.errors.format ? 'booking-format-error' : undefined} /><Radio label="오프라인 · 회의실에 직접 방문합니다." name="format" value="offline" required aria-invalid={!!form.errors.format || undefined} aria-describedby={form.errors.format ? 'booking-format-error' : undefined} /><GroupError id="booking-format-error">{form.errors.format}</GroupError></fieldset>
    <Switch label="시작 전 알림" name="reminder" defaultChecked /><p className="react-studio-caption">시작 10분 전에 알림을 받습니다.</p>
    <FormActions /><FormResult values={form.values}>{form.result}</FormResult><p className="react-studio-caption">입력 확인용 예시이며 일정이 실제로 예약되지는 않습니다.</p>
  </form></Section>;
}

export function FormStatesPattern() {
  const form=usePatternForm(()=>({}),'읽기 전용 값은 포함하고 비활성 값은 제외했습니다.');
  return <Section title="입력 상태" description="읽기 전용 정보는 선택하거나 복사할 수 있고, 비활성 항목은 입력과 제출에서 제외됩니다."><form {...form.props}><Grid columns={{base:1,sm:2}} gap={5} columnGap={6} className="form-pattern-grid react-pattern-form-states">
    <TextField label="계정 ID · 읽기 전용" name="accountId" readOnly defaultValue="idenflu-user" helperText="계정 ID는 변경할 수 없습니다." />
    <TextField label="팀 · 비활성" name="team" disabled defaultValue="지정되지 않음" helperText="팀에 가입하면 변경할 수 있습니다." />
    <Select label="프로젝트 · 비활성" name="project" disabled options={[]} placeholder="선택할 수 없습니다" /><Switch label="알림 · 비활성" name="notifications" disabled defaultChecked />
    <GridItem colSpan="full" className="form-pattern-field--wide"><TextArea label="설명 · 읽기 전용" name="description" readOnly rows={3} defaultValue="관리자가 설정한 프로젝트 설명입니다. 내용을 선택하거나 복사할 수 있습니다." /></GridItem>
    <div><Button disabled>저장</Button></div>
  </Grid><FormActions submit="제출값 확인" /><FormResult values={form.values}>{form.result}</FormResult></form></Section>;
}

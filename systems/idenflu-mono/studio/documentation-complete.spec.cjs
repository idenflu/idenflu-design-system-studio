const {test,expect}=require('@playwright/test');
const base='/systems/idenflu-mono/index.html#/';

test('complete examples cover PageHeader, Table, Chips, eight forms and three field bindings with public imports',{tag:['@mobile','@theme']},async({page})=>{
  for(const route of ['components/page-header','components/table','components/chips','patterns/form/basic','patterns/form/preferences','patterns/form/password','patterns/form/inquiry','patterns/form/project','patterns/form/booking','patterns/form/states','patterns/form/profile','components/select','components/number-fields','components/date-picker']) {
    await page.goto(base+route);
    const code=await page.getByRole('region',{name:'React 사용 예시 코드',exact:true}).textContent();
    expect(code).toContain("import '@idenflu/mono-react/styles.css'");
    expect(code).toMatch(/export function \w+Example\(/);
    expect(code).toContain('const exampleStyles');
    expect(code).not.toMatch(/from ['"]\.\.?\//);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  }
});

test('copying a complete example includes its state, handlers and local styles',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto(base+'components/table');
  const code=await page.getByRole('region',{name:'React 사용 예시 코드',exact:true}).textContent();
  await page.getByRole('button',{name:'코드 복사',exact:true}).click();
  await expect(page.getByText('코드를 복사했습니다.',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(code);
  expect(code).toContain('toggleFile');expect(code).toContain('selectedFiles');
});

test('field API sections are linked in the contents and Number fields can be found by its Korean feature name',{tag:'@mobile'},async({page,isMobile})=>{
  for(const [route,props,events] of [
    ['components/select','속성 · Select / SearchSelect / MultiSelect','이벤트와 폼 연결'],
    ['components/number-fields','속성 · NumberField','이벤트와 값 확정'],
    ['components/date-picker','속성 · DatePicker / DateRangePicker','이벤트와 날짜 처리'],
  ]) {
    await page.goto(base+route);
    await expect(page.getByRole('heading',{name:props,exact:true})).toBeVisible();
    if(isMobile) await page.locator('.docs-toc > summary').click();
    await page.getByRole('navigation',{name:'이 페이지 목차'}).getByRole('link',{name:events,exact:true}).click();
    await expect(page.getByRole('heading',{name:events,exact:true})).toBeFocused();
    await expect(page).toHaveURL(new RegExp(route+'\\?section='));
  }
  if(isMobile) await page.getByRole('button',{name:'메뉴',exact:true}).click();
  const search=page.getByRole('searchbox',{name:'문서 검색',exact:true});
  await search.fill('천 단위');
  await expect(page.locator('#docs-search-status')).toHaveText('1개 문서');
  await search.press('Enter');
  await expect(page).toHaveURL(/components\/number-fields$/);
});

test('NumberField binding compares grouped FormData with the exact committed value and resets a pending edit',{tag:['@mobile','@theme']},async({page,isMobile})=>{
  await page.goto(base+'components/number-fields');
  const form=page.locator('#number-binding form');
  const amount=form.getByRole('spinbutton',{name:'바인딩 금액',exact:true});
  await amount.fill('30000.50');await amount.press('Enter');
  await expect(amount).toHaveValue('30,000.5');
  await form.getByRole('button',{name:'금액값 확인',exact:true}).click();
  expect(JSON.parse(await form.getByRole('region',{name:'금액 제출 데이터'}).textContent())).toEqual({formValue:'30,000.5',request:{amount:'30000.5'}});
  await amount.fill('invalid');
  const reset=form.getByRole('button',{name:'금액 초기화',exact:true});
  if(isMobile) await reset.tap(); else await reset.click();
  await expect(form.getByRole('spinbutton',{name:'바인딩 금액',exact:true})).toHaveValue('12,500.5');
  await expect(form.getByRole('region',{name:'금액 제출 데이터'})).toContainText('금액값 확인을 누르면');
});

test('Select and date binding demonstrate repeated names, range suffixes and controlled resets',{tag:'@mobile'},async({page,isMobile})=>{
  await page.goto(base+'components/select');
  const form=page.locator('#select-binding form');
  await form.getByRole('combobox',{name:/^바인딩 참여 팀:/}).click();
  await form.getByRole('option',{name:'개발',exact:true}).click();
  await page.keyboard.press('Escape');
  await form.getByRole('button',{name:'선택값 확인',exact:true}).click();
  expect(JSON.parse(await form.getByRole('region',{name:'선택 제출 데이터'}).textContent()).teams).toEqual(['design','development']);
  await form.getByRole('button',{name:'초기값 복원',exact:true}).click();
  await expect(form.getByRole('combobox',{name:/^바인딩 참여 팀:/})).toHaveAttribute('aria-label','바인딩 참여 팀: 디자인');
  await page.goto(base+'components/date-picker');
  const dateForm=page.locator('#date-binding form');
  await dateForm.getByRole('textbox',{name:'바인딩 시작일',exact:true}).fill('20261104');
  await dateForm.getByRole('textbox',{name:'바인딩 시작일',exact:true}).press('Enter');
  await dateForm.getByRole('button',{name:'날짜값 확인',exact:true}).click();
  const value=JSON.parse(await dateForm.getByRole('region',{name:'날짜 제출 데이터'}).textContent());
  expect(value.request.startsOn).toBe('2026-11-04');expect(value.formValues.start).toBe('2026-11-04');
  await dateForm.getByRole('textbox',{name:'바인딩 날짜',exact:true}).fill('invalid');
  const resetDate=dateForm.getByRole('button',{name:'날짜 초기화',exact:true});
  if(isMobile) await resetDate.tap(); else await resetDate.click();
  await expect(dateForm.getByRole('textbox',{name:'바인딩 날짜',exact:true})).toHaveValue('2026-11-12');
});

test('form previews preserve values, redact passwords and show readonly submission behavior',async({page})=>{
  await page.goto(base+'patterns/form/password');
  for(const name of ['현재 비밀번호 필수','새 비밀번호 필수','새 비밀번호 확인 필수']) await page.getByLabel(name,{exact:true}).fill('private-demo-password');
  await page.getByRole('button',{name:'입력 확인',exact:true}).click();
  const preview=page.getByRole('region',{name:'폼 제출값',exact:true});
  await expect(preview).toContainText('표시하지 않음');
  await expect(preview).not.toContainText('private-demo-password');
  await page.getByRole('button',{name:'초기화',exact:true}).click();
  await expect(preview).toHaveCount(0);
  await page.goto(base+'patterns/form/states');
  await page.getByRole('button',{name:'제출값 확인',exact:true}).click();
  const values=JSON.parse(await page.getByRole('region',{name:'폼 제출값',exact:true}).textContent());
  expect(values.accountId).toBe('idenflu-user');expect(values).not.toHaveProperty('team');expect(values).not.toHaveProperty('notifications');
});

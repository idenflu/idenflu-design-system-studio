const {test,expect}=require('@playwright/test');

const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const calendarURL=`${sample}#/equipment/inspections`;
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
const calendar=page=>panel(page).getByRole('region',{name:'점검 캘린더',exact:true});
const agenda=page=>panel(page).getByRole('complementary',{name:'선택한 날짜의 점검',exact:true});
const editor=page=>page.getByRole('dialog',{name:/^점검 일정 (등록|수정)$/});
const detail=page=>page.getByRole('dialog',{name:'점검 일정 상세',exact:true});
const day=(page,key)=>panel(page).locator(`button[data-date="${key}"][aria-pressed]`);
const events=page=>panel(page).locator('button[data-inspection-id]:visible');
const calendarEvents=page=>calendar(page).locator('button.inspection-event[data-inspection-id]:visible');
const idsFor=async(page,title)=>new Set(await events(page).filter({hasText:title}).evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-inspection-id'))));

test.use({timezoneId:'Asia/Seoul'});
test.beforeEach(async({page})=>{await page.clock.setFixedTime(new Date('2026-11-08T12:00:00+09:00'));});

async function choose(page,scope,label,option) {
  await scope.getByRole('combobox',{name:new RegExp(`^${label}:`)}).click();
  await page.getByRole('listbox',{name:label,exact:true}).getByRole('option',{name:option,exact:typeof option==='string'}).click();
}

async function fillSchedule(page,{title='출고 라인 안전 점검',date='2026-11-25',time='22:00',conveyor=/CV-006/,status}={}) {
  const form=editor(page);
  await form.getByRole('textbox',{name:'점검 이름',exact:true}).fill(title);
  await choose(page,form,'대상 설비',conveyor);
  await choose(page,form,'담당자','박지훈');
  const dateInput=form.getByRole('textbox',{name:'점검일',exact:true});
  await dateInput.fill(date);
  await dateInput.press('Tab');
  const timeInput=form.getByRole('textbox',{name:'시작 시간',exact:true});
  await timeInput.fill(time);
  await timeInput.press('Tab');
  if(status)await choose(page,form,'진행 상태',status);
}

async function createSchedule(page,options={}) {
  await panel(page).getByRole('button',{name:'점검 일정 등록',exact:true}).click();
  await fillSchedule(page,options);
  await editor(page).getByRole('button',{name:'일정 등록',exact:true}).click();
  await expect(detail(page)).toBeVisible();
}

async function closeDetail(page) {
  await page.keyboard.press('Escape');
  await expect(detail(page)).toBeHidden();
}

test('equipment navigation opens the calendar and its month and week views follow the selected date',{tag:'@mobile'},async({page,isMobile})=>{
  await page.goto(`${sample}#/projects`);
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:'점검 일정',exact:true}).click();
  await expect(page).toHaveURL(/#\/equipment\/inspections$/);
  await expect(panel(page).getByRole('heading',{level:1,name:'점검 일정',exact:true})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'현재 위치',exact:true})).toContainText('설비 관리');
  await expect(calendar(page)).toBeVisible();
  const views=panel(page).getByRole('group',{name:'캘린더 보기',exact:true});
  await expect(views.getByRole('button',{name:'월',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(day(page,'2026-11-08')).toHaveAttribute('aria-pressed','true');
  await day(page,'2026-11-20').click();
  await panel(page).getByRole('button',{name:'다음 기간',exact:true}).click();
  await expect(day(page,'2026-12-20')).toHaveAttribute('aria-pressed','true');
  await panel(page).getByRole('button',{name:'오늘',exact:true}).click();
  await expect(day(page,'2026-11-08')).toHaveAttribute('aria-pressed','true');
  await views.getByRole('button',{name:'주',exact:true}).click();
  await expect(day(page,'2026-11-02')).toBeVisible();
  await expect(day(page,'2026-11-08')).toBeVisible();
  await panel(page).getByRole('button',{name:'다음 기간',exact:true}).click();
  await expect(day(page,'2026-11-09')).toBeVisible();
  await panel(page).getByRole('button',{name:'오늘',exact:true}).click();
  await expect(day(page,'2026-11-08')).toHaveAttribute('aria-pressed','true');
  await day(page,'2026-11-08').focus();
  await page.keyboard.press('ArrowRight');
  await expect(day(page,'2026-11-09')).toBeFocused();
  await expect(day(page,'2026-11-09')).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Home');
  await expect(day(page,'2026-11-09')).toBeFocused();
  await page.keyboard.press('PageDown');
  await expect(day(page,'2026-12-09')).toBeFocused();
  await panel(page).getByRole('button',{name:'오늘',exact:true}).click();
  await expect(day(page,'2026-11-08')).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});

test('conveyor and status filters narrow calendar events and an empty period remains usable',async({page})=>{
  await page.goto(calendarURL);
  await choose(page,panel(page),'대상 설비 필터',/CV-001/);
  await expect(calendarEvents(page).first()).toBeVisible();
  for(const event of await calendarEvents(page).all())await expect(event).toHaveAttribute('aria-label',/입고 메인 컨베이어/);
  await choose(page,panel(page),'진행 상태 필터','예정');
  await expect(calendarEvents(page).first()).toBeVisible();
  for(const event of await calendarEvents(page).all())await expect(event).toHaveAttribute('aria-label',/예정/);
  await panel(page).getByRole('button',{name:'다음 기간',exact:true}).click();
  await panel(page).getByRole('button',{name:'다음 기간',exact:true}).click();
  await expect(events(page)).toHaveCount(0);
  const registerOnDate=agenda(page).getByRole('button',{name:'이 날짜에 등록',exact:true});
  await expect(registerOnDate).toBeEnabled();
  await registerOnDate.click();
  await expect(editor(page)).toBeVisible();
  await expect(editor(page).getByRole('textbox',{name:'점검일',exact:true})).toHaveValue(/^2027-01-/);
  await editor(page).getByRole('button',{name:'취소',exact:true}).click();
  await expect(editor(page)).toBeHidden();
  await expect(registerOnDate).toBeFocused();
});

test('schedule registration focuses missing information and refuses an invalid pending time',{tag:'@mobile'},async({page})=>{
  await page.goto(calendarURL);
  await panel(page).getByRole('button',{name:'점검 일정 등록',exact:true}).click();
  await editor(page).getByRole('button',{name:'일정 등록',exact:true}).click();
  const title=editor(page).getByRole('textbox',{name:'점검 이름',exact:true});
  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute('aria-invalid','true');
  await fillSchedule(page,{title:'회귀 검증 신규 점검'});
  const time=editor(page).getByRole('textbox',{name:'시작 시간',exact:true});
  await time.fill('25:10');
  await time.press('Tab');
  await editor(page).getByRole('button',{name:'일정 등록',exact:true}).click();
  await expect(editor(page)).toBeVisible();
  await expect(time).toHaveAttribute('aria-invalid','true');
  await expect(time).toBeFocused();
  await time.fill('22:00');
  await time.press('Tab');
  await editor(page).getByRole('button',{name:'일정 등록',exact:true}).click();
  await expect(detail(page)).toBeVisible();
  await expect(detail(page)).toContainText('회귀 검증 신규 점검');
  await expect(detail(page)).toContainText('22:00');
  await closeDetail(page);
  await expect(day(page,'2026-11-25')).toHaveAttribute('aria-pressed','true');
  await expect(events(page).filter({hasText:'회귀 검증 신규 점검'}).first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});

test('the time picker stays above the scrolling editor and Escape dismisses only the active layer',{tag:'@mobile'},async({page})=>{
  await page.goto(calendarURL);
  await panel(page).getByRole('button',{name:'점검 일정 등록',exact:true}).click();
  const title=editor(page).getByRole('textbox',{name:'점검 이름',exact:true});
  const time=editor(page).getByRole('textbox',{name:'시작 시간',exact:true});
  const trigger=editor(page).getByRole('button',{name:'시작 시간 선택 열기',exact:true});
  await title.fill('시간 선택기 레이어 검증');
  await trigger.click();
  const picker=page.getByRole('dialog',{name:'시작 시간 선택',exact:true});
  const confirm=picker.getByRole('button',{name:'확인',exact:true});
  await expect(picker).toBeVisible();
  // Visibility alone does not detect a popup clipped by a scrolling dialog body.
  await expect.poll(()=>confirm.evaluate(button=>{
    const rect=button.getBoundingClientRect();
    const points=[[rect.left+2,rect.top+2],[rect.right-2,rect.top+2],[rect.left+2,rect.bottom-2],[rect.right-2,rect.bottom-2],[rect.left+rect.width/2,rect.top+rect.height/2]];
    return {
      inViewport:rect.width>0&&rect.height>0&&rect.left>=0&&rect.top>=0&&rect.right<=innerWidth&&rect.bottom<=innerHeight,
      uncovered:points.every(([x,y])=>button.contains(document.elementFromPoint(x,y))),
    };
  })).toEqual({inViewport:true,uncovered:true});
  await picker.getByRole('listbox',{name:'시',exact:true}).getByRole('option',{name:'12',exact:true}).click();
  await picker.getByRole('listbox',{name:'분',exact:true}).getByRole('option',{name:'30',exact:true}).click();
  await confirm.click();
  await expect(picker).toBeHidden();
  await expect(editor(page)).toBeVisible();
  await expect(time).toHaveValue('12:30');
  await expect(title).toHaveValue('시간 선택기 레이어 검증');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await picker.getByRole('listbox',{name:'시',exact:true}).getByRole('option',{name:'13',exact:true}).click();
  await page.keyboard.press('Escape');
  await expect(picker).toBeHidden();
  await expect(editor(page)).toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(time).toHaveValue('12:30');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});

test('editing a scheduled inspection updates the same event and its selected date',async({page})=>{
  await page.goto(calendarURL);
  await createSchedule(page,{title:'수정 전 점검 이름'});
  await closeDetail(page);
  const original=await idsFor(page,'수정 전 점검 이름');
  expect(original.size).toBe(1);
  await events(page).filter({hasText:'수정 전 점검 이름'}).first().click();
  await detail(page).getByRole('button',{name:'일정 수정',exact:true}).click();
  await expect(editor(page)).toBeVisible();
  await expect(detail(page)).toBeHidden();
  await fillSchedule(page,{title:'출고 구역 정기 점검 변경',date:'2026-11-26',time:'21:30'});
  await editor(page).getByRole('button',{name:'변경사항 저장',exact:true}).click();
  await expect(detail(page)).toBeVisible();
  await expect(detail(page)).toContainText('출고 구역 정기 점검 변경');
  await expect(detail(page)).toContainText('21:30');
  await closeDetail(page);
  await expect(day(page,'2026-11-26')).toHaveAttribute('aria-pressed','true');
  await expect(events(page).filter({hasText:'수정 전 점검 이름'})).toHaveCount(0);
  expect(await idsFor(page,'출고 구역 정기 점검 변경')).toEqual(original);
});

test('overlapping appointments are blocked while a cancelled appointment releases the time slot',async({page})=>{
  await page.goto(calendarURL);
  await createSchedule(page,{title:'시간 충돌 기준 점검'});
  await closeDetail(page);
  await panel(page).getByRole('button',{name:'점검 일정 등록',exact:true}).click();
  await fillSchedule(page,{title:'시간 충돌 확인 점검'});
  await editor(page).getByRole('button',{name:'일정 등록',exact:true}).click();
  await expect(editor(page)).toBeVisible();
  await expect(editor(page).locator('[aria-invalid="true"]').first()).toBeVisible();
  await choose(page,editor(page),'진행 상태','취소');
  await editor(page).getByRole('button',{name:'일정 등록',exact:true}).click();
  await expect(detail(page)).toBeVisible();
  await expect(detail(page)).toContainText('시간 충돌 확인 점검');
  await expect(detail(page)).toContainText('취소');
});

test('completing an inspection requires a result and links the updated inspection date to its equipment',{tag:'@mobile'},async({page})=>{
  await page.goto(calendarURL);
  await panel(page).getByRole('button',{name:'점검 일정 등록',exact:true}).click();
  await fillSchedule(page,{title:'검수 보조 라인 점검 완료',date:'2026-11-08',status:'완료'});
  await editor(page).getByRole('button',{name:'일정 등록',exact:true}).click();
  const result=editor(page).getByRole('textbox',{name:'점검 결과',exact:true});
  await expect(result).toBeFocused();
  await expect(result).toHaveAttribute('aria-invalid','true');
  await result.fill('구동부와 비상 정지 장치의 동작을 확인했습니다. 이상 없습니다.');
  await editor(page).getByRole('button',{name:'일정 등록',exact:true}).click();
  await expect(detail(page)).toBeVisible();
  await expect(detail(page)).toContainText('구동부와 비상 정지 장치의 동작을 확인했습니다. 이상 없습니다.');
  await detail(page).getByRole('button',{name:'설비 상세 보기',exact:true}).click();
  await expect(page).toHaveURL(/#\/equipment\/conveyors$/);
  const conveyor=page.getByRole('dialog',{name:'컨베이어 상세',exact:true});
  await expect(conveyor).toBeVisible();
  await expect(conveyor).toContainText('출고 검수 보조 라인');
  await expect(conveyor.locator('dl > div').filter({has:page.getByText('최근 점검',{exact:true})})).toContainText('2026.11.08');
  await expect(detail(page)).toBeHidden();
});

test('history navigation closes an inspection overlay before another workspace page becomes active',{tag:'@mobile'},async({page,isMobile})=>{
  await page.goto(`${sample}#/projects`);
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:'점검 일정',exact:true}).click();
  await panel(page).getByRole('button',{name:'점검 일정 등록',exact:true}).click();
  await editor(page).getByRole('textbox',{name:'점검 이름',exact:true}).fill('저장하지 않은 점검');
  await page.goBack();
  await expect(page).toHaveURL(/#\/projects$/);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await panel(page).getByRole('searchbox',{name:'프로젝트명 / ID',exact:true}).fill('디자인 시스템');
  await expect(panel(page).getByRole('searchbox',{name:'프로젝트명 / ID',exact:true})).toHaveValue('디자인 시스템');
  await page.goForward();
  await expect(page).toHaveURL(/#\/equipment\/inspections$/);
  await expect(editor(page)).toBeHidden();
  await expect(events(page).filter({hasText:'저장하지 않은 점검'})).toHaveCount(0);
});

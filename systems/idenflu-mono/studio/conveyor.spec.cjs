const {test,expect}=require('@playwright/test');

const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const catalogURL=`${sample}#/equipment/conveyors`;
const registrationURL=`${sample}#/equipment/conveyors/new`;
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
const cards=page=>panel(page).locator('.cv-catalog-card');

async function choose(page,label,option) {
  await panel(page).getByRole('combobox',{name:new RegExp(`^${label}:`)}).click();
  await page.getByRole('listbox',{name:label,exact:true}).getByRole('option',{name:option,exact:true}).click();
}

async function fillBasicInformation(page,{code='CV-TEST-101',name='회귀 검증 컨베이어'}={}) {
  await panel(page).getByRole('textbox',{name:'설비 코드',exact:true}).fill(code);
  await panel(page).getByRole('textbox',{name:'설비 이름',exact:true}).fill(name);
  await choose(page,'설치 위치','물류 1동 · 입고 구역');
  await choose(page,'담당자','박지훈');
  const installed=panel(page).getByRole('textbox',{name:'설치일',exact:true});
  await installed.fill('2026-11-08');
  await installed.press('Tab');
}

const currentStep=page=>panel(page).locator('.stepper [aria-current="step"]');

test('equipment menu and direct addresses open the conveyor catalog and registration',{tag:'@mobile'},async({page,isMobile})=>{
  await page.goto(sample);
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:'컨베이어',exact:true}).click();
  await expect(page).toHaveURL(/#\/equipment\/conveyors$/);
  await expect(panel(page).getByRole('heading',{level:1,name:'컨베이어',exact:true})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'현재 위치',exact:true})).toContainText('설비 관리');
  await expect(cards(page)).toHaveCount(6);
  await expect(panel(page).locator('.data-grid')).toHaveCount(0);
  await panel(page).getByRole('button',{name:'새 컨베이어',exact:true}).click();
  await expect(page).toHaveURL(/#\/equipment\/conveyors\/new$/);
  await expect(panel(page).getByRole('heading',{level:1,name:'컨베이어 등록',exact:true})).toBeVisible();
  await page.reload();
  await expect(panel(page).getByRole('heading',{level:1,name:'컨베이어 등록',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});

test('conveyor cards combine search and status filtering and recover from empty results',async({page})=>{
  await page.goto(catalogURL);
  await expect(cards(page)).toHaveCount(6);
  const name=await cards(page).first().getByRole('heading').first().innerText();
  const search=panel(page).getByRole('searchbox',{name:'컨베이어 검색',exact:true});
  await search.fill(name);
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText(name);
  await search.fill('존재하지 않는 설비 999');
  await expect(cards(page)).toHaveCount(0);
  await panel(page).getByRole('button',{name:'검색 초기화',exact:true}).click();
  await expect(search).toHaveValue('');
  await expect(cards(page)).toHaveCount(6);
  await panel(page).getByRole('combobox',{name:/^가동 상태:/}).click();
  await page.getByRole('option',{name:'점검 중',exact:true}).click();
  await expect(cards(page)).not.toHaveCount(0);
  for(const card of await cards(page).all())await expect(card).toContainText('점검 중');
  await search.fill('없는 위치');
  await expect(cards(page)).toHaveCount(0);
  await panel(page).getByRole('button',{name:'검색 초기화',exact:true}).click();
  await expect(cards(page)).toHaveCount(6);
});

test('conveyor details expose base information and units and restore keyboard focus',{tag:'@mobile'},async({page})=>{
  await page.goto(catalogURL);
  const card=cards(page).first();
  const name=await card.getByRole('heading').first().innerText();
  const opening=card.getByRole('button',{name:`${name} 상세 보기`,exact:true});
  await opening.focus();
  await opening.press('Enter');
  const detail=page.getByRole('dialog',{name:'컨베이어 상세',exact:true});
  await expect(detail).toBeVisible();
  await expect(detail).toContainText(name);
  await expect(detail.getByRole('heading',{name:'기본 정보',exact:true})).toBeVisible();
  await expect(detail.getByRole('heading',{name:/하위 유닛/})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.keyboard.press('Escape');
  await expect(detail).toBeHidden();
  await expect(opening).toBeFocused();
});

test('browser history closes a conveyor drawer before returning to another workspace screen',{tag:'@mobile'},async({page,isMobile})=>{
  await page.goto(`${sample}#/projects`);
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:'컨베이어',exact:true}).click();
  await expect(page).toHaveURL(/#\/equipment\/conveyors$/);
  await cards(page).first().getByRole('button',{name:/상세 보기$/}).click();
  await expect(page.getByRole('dialog',{name:'컨베이어 상세',exact:true})).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#\/projects$/);
  await expect(panel(page).locator('.page-header-title')).toHaveText('전체 프로젝트');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  const keyword=panel(page).getByRole('searchbox',{name:'프로젝트명 / ID',exact:true});
  await keyword.fill('디자인 시스템');
  await expect(keyword).toHaveValue('디자인 시스템');
});

test('history navigation dismisses registration confirmation while preserving its draft',{tag:'@mobile'},async({page,isMobile})=>{
  await page.goto(`${sample}#/projects`);
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:'컨베이어',exact:true}).click();
  await panel(page).getByRole('button',{name:'새 컨베이어',exact:true}).click();
  await panel(page).getByRole('textbox',{name:'설비 이름',exact:true}).fill('히스토리 이동 후 보존할 초안');
  await panel(page).getByRole('button',{name:'등록 취소',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'등록을 취소할까요?',exact:true})).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#\/equipment\/conveyors$/);
  await expect(panel(page).locator('.page-header-title')).toHaveText('컨베이어');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  const search=panel(page).getByRole('searchbox',{name:'컨베이어 검색',exact:true});
  await search.fill('입고');
  await expect(search).toHaveValue('입고');
  await page.goForward();
  await expect(page).toHaveURL(/#\/equipment\/conveyors\/new$/);
  await expect(panel(page).getByRole('textbox',{name:'설비 이름',exact:true})).toHaveValue('히스토리 이동 후 보존할 초안');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('conveyor registration blocks missing fields and a duplicate equipment code',async({page})=>{
  await page.goto(registrationURL);
  const code=panel(page).getByRole('textbox',{name:'설비 코드',exact:true});
  await panel(page).getByRole('button',{name:'다음 단계',exact:true}).click();
  await expect(currentStep(page)).toContainText('기본정보');
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute('aria-invalid','true');
  await fillBasicInformation(page,{code:'CV-001'});
  await panel(page).getByRole('button',{name:'다음 단계',exact:true}).click();
  await expect(currentStep(page)).toContainText('기본정보');
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute('aria-invalid','true');
  await code.fill('CV-TEST-102');
  await panel(page).getByRole('button',{name:'다음 단계',exact:true}).click();
  await expect(currentStep(page)).toContainText('하위 유닛');
});

test('registration preserves previous steps and validates editable unit cards',{tag:'@mobile'},async({page})=>{
  await page.goto(registrationURL);
  await fillBasicInformation(page,{code:'CV-TEST-103',name:'입고 구역 신규 컨베이어'});
  await panel(page).getByRole('button',{name:'다음 단계',exact:true}).click();
  await expect(currentStep(page)).toContainText('하위 유닛');
  const first=panel(page).getByRole('group',{name:'유닛 1',exact:true});
  await expect(first.getByRole('button',{name:'유닛 1 삭제',exact:true})).toBeDisabled();
  await panel(page).getByRole('button',{name:'유닛 추가',exact:true}).click();
  const second=panel(page).getByRole('group',{name:'유닛 2',exact:true});
  await second.getByRole('textbox',{name:'유닛 이름',exact:true}).fill('출구 직선 유닛');
  await panel(page).getByRole('button',{name:'이전 단계',exact:true}).click();
  await expect(panel(page).getByRole('textbox',{name:'설비 코드',exact:true})).toHaveValue('CV-TEST-103');
  await expect(panel(page).getByRole('textbox',{name:'설비 이름',exact:true})).toHaveValue('입고 구역 신규 컨베이어');
  await panel(page).getByRole('button',{name:'다음 단계',exact:true}).click();
  await expect(second.getByRole('textbox',{name:'유닛 이름',exact:true})).toHaveValue('출구 직선 유닛');
  const length=second.getByRole('spinbutton',{name:'길이',exact:true});
  await length.fill('0');
  await length.press('Tab');
  await panel(page).getByRole('button',{name:'다음 단계',exact:true}).click();
  await expect(currentStep(page)).toContainText('하위 유닛');
  await expect(length).toHaveAttribute('aria-invalid','true');
  await expect(length).toBeFocused();
  await length.fill('2400');
  await length.press('Tab');
  await second.getByRole('button',{name:'유닛 2 삭제',exact:true}).click();
  await expect(second).toHaveCount(0);
  await expect(first.getByRole('button',{name:'유닛 1 삭제',exact:true})).toBeDisabled();
  await panel(page).getByRole('button',{name:'다음 단계',exact:true}).click();
  await expect(currentStep(page)).toContainText('최종 검토');
  await expect(panel(page)).toContainText('입고 구역 신규 컨베이어');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});

test('registered conveyors appear in cleared catalog filters and open their own detail drawer',{tag:'@mobile'},async({page})=>{
  await page.goto(catalogURL);
  await panel(page).getByRole('searchbox',{name:'컨베이어 검색',exact:true}).fill('없는 검색 조건');
  await expect(cards(page)).toHaveCount(0);
  await panel(page).getByRole('button',{name:'새 컨베이어',exact:true}).click();
  await fillBasicInformation(page,{code:'CV-TEST-104',name:'출고 확장 컨베이어'});
  await panel(page).getByRole('button',{name:'다음 단계',exact:true}).click();
  await panel(page).getByRole('button',{name:'다음 단계',exact:true}).click();
  await expect(currentStep(page)).toContainText('최종 검토');
  await panel(page).getByRole('button',{name:'컨베이어 등록',exact:true}).click();
  await expect(page).toHaveURL(/#\/equipment\/conveyors$/);
  const detail=page.getByRole('dialog',{name:'컨베이어 상세',exact:true});
  await expect(detail).toBeVisible();
  await expect(detail).toContainText('CV-TEST-104');
  await expect(detail).toContainText('출고 확장 컨베이어');
  await detail.getByRole('button',{name:'닫기',exact:true}).click();
  await expect(detail).toBeHidden();
  await expect(panel(page).getByRole('searchbox',{name:'컨베이어 검색',exact:true})).toHaveValue('');
  await expect(cards(page)).toHaveCount(7);
  const created=cards(page).filter({hasText:'CV-TEST-104'});
  await expect(created).toHaveCount(1);
  await expect(created).toContainText('정지');
  await expect(created.getByRole('button',{name:'출고 확장 컨베이어 상세 보기',exact:true})).toBeFocused();
  await expect(page.getByRole('tab',{name:'컨베이어 등록',exact:true})).toHaveCount(0);
});

test('dirty registration cancellation can keep the draft or discard it explicitly',async({page})=>{
  await page.goto(registrationURL);
  await panel(page).getByRole('textbox',{name:'설비 이름',exact:true}).fill('계속 작성할 설비');
  await panel(page).getByRole('button',{name:'등록 취소',exact:true}).click();
  const confirmation=page.getByRole('dialog',{name:'등록을 취소할까요?',exact:true});
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button',{name:'계속 작성',exact:true}).click();
  await expect(confirmation).toBeHidden();
  await expect(panel(page).getByRole('textbox',{name:'설비 이름',exact:true})).toHaveValue('계속 작성할 설비');
  await panel(page).getByRole('button',{name:'등록 취소',exact:true}).click();
  await confirmation.getByRole('button',{name:'등록 취소',exact:true}).click();
  await expect(page).toHaveURL(/#\/equipment\/conveyors$/);
  await expect(cards(page)).toHaveCount(6);
  await panel(page).getByRole('button',{name:'새 컨베이어',exact:true}).click();
  await expect(panel(page).getByRole('textbox',{name:'설비 이름',exact:true})).toHaveValue('');
});

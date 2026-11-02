const { test, expect } = require('@playwright/test');

test('Patterns restores the nested Form menu and omits Layout and Page', async ({page,isMobile}) => {
  await page.goto('/packages/react/studio/index.html#/patterns/form/basic');
  if (isMobile) await page.getByRole('button',{name:'메뉴',exact:true}).click();
  const nav = page.locator('#react-studio-nav');
  const patterns = nav.locator('.nav-group').filter({has:page.locator('summary', {hasText:/^Patterns$/})});
  await expect(patterns).toHaveAttribute('open','');
  const form = patterns.locator('.nav-subgroup');
  await expect(form).toHaveAttribute('open','');
  await expect(form.getByRole('link')).toHaveCount(8);
  await expect(nav.locator('a[href*="patterns/layout/"]')).toHaveCount(0);
  await expect(nav.locator('a[href*="patterns/page/"]')).toHaveCount(0);
  await form.getByRole('link',{name:'비밀번호 변경',exact:true}).click();
  await expect(page).toHaveURL(/patterns\/form\/password$/);
  await expect(page.getByRole('heading',{level:1})).toBeFocused();
});

test('notification preferences validate groups and reset choices and Select state', async ({page}) => {
  await page.goto('/packages/react/studio/index.html#/patterns/form/preferences');
  await page.getByRole('button',{name:'설정 확인',exact:true}).click();
  const channel = page.getByRole('group',{name:'알림 채널 필수',exact:true});
  const contact = page.getByRole('group',{name:'선호 연락 방법 필수',exact:true});
  await expect(channel.getByRole('checkbox',{name:'이메일',exact:true})).toBeFocused();
  await channel.getByRole('checkbox',{name:'이메일',exact:true}).check();
  await contact.getByRole('radio',{name:'이메일',exact:true}).check();
  const timezone = page.getByRole('combobox',{name:/^시간대:/});
  await timezone.click(); await page.getByRole('option',{name:'런던',exact:true}).click();
  await page.getByRole('switch',{name:'주간 요약 받기',exact:true}).uncheck();
  await page.getByRole('button',{name:'설정 확인',exact:true}).click();
  await expect(page.locator('form').getByRole('status')).toHaveText('선택한 설정을 확인했습니다.');
  await page.getByRole('button',{name:'초기화',exact:true}).click();
  await expect(channel.getByRole('checkbox',{name:'이메일',exact:true})).not.toBeChecked();
  await expect(contact.getByRole('radio',{name:'이메일',exact:true})).not.toBeChecked();
  await expect(timezone).toContainText('서울');
  await expect(page.getByRole('switch',{name:'주간 요약 받기',exact:true})).toBeChecked();
});

test('password form checks length, confirmation and reset visibility', async ({page}) => {
  await page.goto('/packages/react/studio/index.html#/patterns/form/password');
  const current = page.getByLabel('현재 비밀번호 필수',{exact:true});
  const password = page.getByLabel('새 비밀번호 필수',{exact:true});
  const confirm = page.getByLabel('새 비밀번호 확인 필수',{exact:true});
  await page.getByRole('button',{name:'입력 확인',exact:true}).click();
  await expect(current).toBeFocused();
  await current.fill('current-password'); await password.fill('short'); await confirm.fill('different');
  await page.getByRole('button',{name:'입력 확인',exact:true}).click();
  await expect(page.getByText('새 비밀번호는 8자 이상이어야 합니다.',{exact:true})).toBeVisible();
  await password.fill('new-password'); await confirm.fill('new-password');
  await page.getByRole('button',{name:'새 비밀번호 표시',exact:true}).click();
  await expect(password).toHaveAttribute('type','text');
  await page.getByRole('button',{name:'입력 확인',exact:true}).click();
  await expect(page.locator('form').getByRole('status')).toHaveText('비밀번호 입력을 확인했습니다.');
  await password.fill('changed-password');
  await expect(confirm).toHaveAttribute('aria-invalid','true');
  await page.getByRole('button',{name:'초기화',exact:true}).click();
  await expect(password).toHaveValue(''); await expect(password).toHaveAttribute('type','password');
  await expect(confirm).not.toHaveAttribute('aria-invalid','true');
});

test('inquiry form validates content and resets its count and attachment', async ({page}) => {
  await page.goto('/packages/react/studio/index.html#/patterns/form/inquiry');
  const message = page.getByRole('textbox',{name:'문의 내용 필수',exact:true});
  await message.fill('짧은 문의');
  await page.getByRole('button',{name:'내용 확인',exact:true}).click();
  await expect(message).toBeFocused();
  await expect(page.getByText('문의 내용은 10자 이상 입력해주세요.',{exact:true})).toBeVisible();
  await message.fill('검색 필터의 동작에 대해 문의드립니다.');
  await page.locator('input[type="file"]').setInputFiles({name:'guide.txt',mimeType:'text/plain',buffer:Buffer.from('example')});
  await page.getByRole('button',{name:'내용 확인',exact:true}).click();
  await expect(page.locator('form').getByRole('status')).toContainText('문의 내용을 확인했습니다.');
  await page.getByRole('button',{name:'초기화',exact:true}).click();
  await expect(message).toHaveValue('');
  await expect(page.getByText('0 / 500자',{exact:true})).toBeVisible();
  await expect(page.locator('.upload-result')).toHaveCount(0);
});

test('project form validates slug and exact budget and resets selected teams and progress', async ({page}) => {
  await page.goto('/packages/react/studio/index.html#/patterns/form/project');
  await page.getByRole('textbox',{name:'프로젝트명 필수',exact:true}).fill('프로젝트');
  const slug = page.getByRole('textbox',{name:'프로젝트 주소 필수',exact:true});
  await slug.fill('Wrong Address');
  const budget = page.getByRole('spinbutton',{name:'예산 선택',exact:true});
  await budget.fill('1e3');
  await page.getByRole('button',{name:'입력 확인',exact:true}).click();
  await expect(slug).toBeFocused();
  await expect(budget).toHaveAttribute('aria-invalid','true');
  await slug.fill('design-system'); await budget.fill('9007199254740992');
  await page.getByRole('button',{name:'입력 확인',exact:true}).click();
  await expect(budget).toBeFocused();
  await budget.fill('12500');
  await page.getByRole('button',{name:'디자인 제거',exact:true}).click();
  await page.getByRole('slider',{name:'진행률'}).fill('50');
  await page.getByRole('button',{name:'입력 확인',exact:true}).click();
  await expect(page.locator('form > .form-pattern-result')).toHaveText('입력 내용을 확인했습니다.');
  await page.getByRole('button',{name:'초기화',exact:true}).click();
  await expect(slug).toHaveValue(''); await expect(budget).toHaveValue('');
  await expect(page.getByRole('button',{name:'디자인 제거',exact:true})).toBeVisible();
  await expect(page.getByRole('slider',{name:'진행률'})).toHaveValue('35');
});

test('booking form validates dates, attendee bounds and attendance format', async ({page}) => {
  await page.goto('/packages/react/studio/index.html#/patterns/form/booking');
  const date = page.getByRole('textbox',{name:'날짜 필수',exact:true});
  await page.getByRole('button',{name:'입력 확인',exact:true}).click();
  await expect(date).toBeFocused(); await expect(date).toHaveAttribute('aria-invalid','true');
  await date.fill('2026-02-30'); await date.blur();
  await expect(date).toHaveAttribute('aria-invalid','true');
  await date.fill('20261102'); await date.blur();
  await expect(date).toHaveValue('2026-11-02');
  const attendees = page.getByRole('spinbutton',{name:'참석 인원 필수',exact:true});
  await attendees.fill('0');
  await page.getByRole('button',{name:'입력 확인',exact:true}).click();
  await expect(attendees).toBeFocused();
  await attendees.fill('3');
  await page.getByRole('radio',{name:/^온라인/}).check();
  await page.getByRole('button',{name:'입력 확인',exact:true}).click();
  await expect(page.locator('form > .form-pattern-result')).toHaveText('입력 내용을 확인했습니다.');
  await page.getByRole('button',{name:'초기화',exact:true}).click();
  await expect(date).toHaveValue(''); await expect(attendees).toHaveValue('1');
  await expect(page.getByRole('radio',{name:/^온라인/})).not.toBeChecked();
});

test('profile saves edited data and readonly patterns expose their original states', async ({page}) => {
  await page.goto('/packages/react/studio/index.html#/patterns/form/profile');
  const name = page.getByRole('textbox',{name:'이름 필수',exact:true});
  await expect(name).toHaveValue('김민수'); await name.fill('');
  await page.getByRole('button',{name:'변경사항 저장',exact:true}).click(); await expect(name).toBeFocused();
  await name.fill('김다인'); await page.getByRole('button',{name:'변경사항 저장',exact:true}).click();
  await expect(page.locator('form').getByRole('status')).toHaveText('변경사항을 저장했습니다.');
  await page.getByRole('switch',{name:'제품 소식 받기',exact:true}).uncheck();
  await expect(page.locator('form .form-pattern-result')).toBeEmpty();
  await page.goto('/packages/react/studio/index.html#/patterns/form/states');
  await expect(page.getByRole('textbox',{name:'계정 ID · 읽기 전용',exact:true})).toHaveAttribute('readonly','');
  await expect(page.getByRole('textbox',{name:'팀 · 비활성',exact:true})).toBeDisabled();
  await expect(page.getByRole('switch',{name:'알림 · 비활성',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'저장',exact:true})).toBeDisabled();
});

test('data patterns distinguish loading, error, empty and filtered results and ignore obsolete requests', async ({page}) => {
  await page.goto('/packages/react/studio/index.html#/patterns/data-states');
  const region = page.locator('[data-state]');
  await page.getByRole('button',{name:'조회 실패',exact:true}).click();
  await expect(region).toHaveAttribute('aria-busy','true');
  await expect(region).toHaveAttribute('data-state','error');
  await page.getByRole('button',{name:'다시 시도',exact:true}).click();
  await expect(region).toHaveAttribute('data-state','success');
  const search = page.getByRole('searchbox',{name:'프로젝트 검색',exact:true});
  await search.fill('없는 프로젝트'); await expect(region).toHaveAttribute('data-state','no-results');
  await page.getByRole('button',{name:'검색 초기화',exact:true}).click(); await expect(search).toHaveValue('');
  await page.getByRole('button',{name:'빈 목록',exact:true}).click(); await expect(region).toHaveAttribute('data-state','empty');
  await page.getByRole('button',{name:'예제 데이터 불러오기',exact:true}).click(); await expect(region).toHaveAttribute('data-state','success');
  await page.getByRole('button',{name:'조회 실패',exact:true}).click();
  await page.getByRole('button',{name:'정상 조회',exact:true}).click();
  await expect(region).toHaveAttribute('data-state','success'); await expect(page.getByRole('alert')).toHaveCount(0);
});

test('empty patterns offer working search reset and project registration navigation', async ({page}) => {
  await page.goto('/packages/react/studio/index.html#/patterns/empty-state');
  await expect(page.getByRole('heading',{name:'검색 결과가 없습니다',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'검색 초기화',exact:true}).click();
  await expect(page.getByRole('searchbox',{name:'프로젝트 검색',exact:true})).toHaveValue('');
  await expect(page.locator('.simple-list li')).toHaveCount(3);
  await page.getByRole('link',{name:'프로젝트 만들기',exact:true}).click();
  await expect(page).toHaveURL(/patterns\/form\/project$/);
});

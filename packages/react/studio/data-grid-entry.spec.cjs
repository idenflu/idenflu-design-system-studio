const {test,expect}=require('@playwright/test');

test.use({launchOptions:{
  ...(process.env.IDENFLU_TEST_CHROMIUM ? {executablePath:process.env.IDENFLU_TEST_CHROMIUM} : {}),
  ignoreDefaultArgs:['--hide-scrollbars'],
}});

async function recordEntry(page,title,control){
  await page.evaluate(title=>{
    window.__gridEntryFrames=[];
    document.addEventListener('click',()=>{
      let attempts=0;
      const sample=()=>{
        const panel=document.querySelector('.layout-workspace-tabs > .tab-panel:not([hidden])');
        const grid=panel?.querySelector('.data-grid');
        const scroll=grid?.querySelector('.data-grid-scroll');
        if(scroll&&panel.querySelector('h1')?.textContent===title){
          window.__gridEntryFrames.push({
            width:scroll.clientWidth,height:scroll.clientHeight,
            table:Math.round(grid.querySelector('table').getBoundingClientRect().width),
            native:scroll.hasAttribute('data-native-scrollbars'),
            vertical:!!grid.querySelector('.data-grid-native-vertical'),
            horizontal:!!grid.querySelector('.data-grid-native-horizontal'),
          });
        }
        if(window.__gridEntryFrames.length<12&&++attempts<60)requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    },{capture:true,once:true});
  },title);
  await control.click();
  await page.waitForFunction(()=>window.__gridEntryFrames.length===12);
  const frames=await page.evaluate(()=>window.__gridEntryFrames);
  expect(frames.every(frame=>JSON.stringify(frame)===JSON.stringify(frames.at(-1))),JSON.stringify(frames)).toBe(true);
}

for(const nativeGutter of [true,false])test.describe(nativeGutter?'native scrollbar gutters':'hidden native gutters',()=>{
  for(const height of [900,1419]){
  test(`project grids settle before their first painted frame at ${height}px`,{tag:'@theme'},async({page,isMobile})=>{
    test.skip(isMobile);
    await page.setViewportSize({width:1498,height});
    await page.goto('/systems/idenflu-mono/index.html?layout=sidebar');
    // Match overlay scrollbars, whose native viewport does not reserve space.
    if(!nativeGutter)await page.addStyleTag({content:'.data-grid-scroll { scrollbar-width:none; } .data-grid-scroll::-webkit-scrollbar { display:none; }'});
    for(const title of ['검토 요청','완료된 프로젝트']){
      await recordEntry(page,title,page.locator('.layout-tree-navigation:visible').getByRole('button',{name:title,exact:true}));
    }
    // Hidden tabs retain their data and geometry when another page is active.
    for(const title of ['검토 요청','완료된 프로젝트']){
      await recordEntry(page,title,page.getByRole('tab',{name:title,exact:true}));
    }
    await page.getByRole('tab',{name:'대시보드 (고정)',exact:true}).click();
    await page.setViewportSize({width:1280,height});
    for(const title of ['검토 요청','완료된 프로젝트']){
      await recordEntry(page,title,page.getByRole('tab',{name:title,exact:true}));
    }
  });
  }
});

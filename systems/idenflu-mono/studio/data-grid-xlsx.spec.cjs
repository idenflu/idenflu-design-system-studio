const {test,expect}=require('@playwright/test');
const {readFile}=require('node:fs/promises');
const {inflateRawSync}=require('node:zlib');

const route='/systems/idenflu-mono/index.html#/components/data-grid';
const grid=page=>page.getByRole('group',{name:'프로젝트 데이터그리드',exact:true});
const mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function workbookParts(bytes){
  expect(bytes.subarray(0,4)).toEqual(Buffer.from([0x50,0x4b,0x03,0x04]));
  let end=bytes.length-22;
  while(end>=0&&bytes.readUInt32LE(end)!==0x06054b50)end--;
  expect(end).toBeGreaterThanOrEqual(0);
  const files={};
  let offset=bytes.readUInt32LE(end+16);
  for(let index=0;index<bytes.readUInt16LE(end+10);index++){
    expect(bytes.readUInt32LE(offset)).toBe(0x02014b50);
    const method=bytes.readUInt16LE(offset+10),size=bytes.readUInt32LE(offset+20);
    const nameLength=bytes.readUInt16LE(offset+28),extraLength=bytes.readUInt16LE(offset+30),commentLength=bytes.readUInt16LE(offset+32);
    const name=bytes.toString('utf8',offset+46,offset+46+nameLength),local=bytes.readUInt32LE(offset+42);
    const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28),member=bytes.subarray(start,start+size);
    expect([0,8]).toContain(method);
    files[name]=(method===8?inflateRawSync(member):member).toString('utf8');
    offset+=46+nameLength+extraLength+commentLength;
  }
  expect(Object.keys(files)).toEqual(expect.arrayContaining(['[Content_Types].xml','xl/workbook.xml','xl/worksheets/sheet1.xml']));
  return files;
}

async function workbookRows(page,bytes){
  const files=workbookParts(bytes);
  return page.evaluate(({sheet,shared})=>{
    const parse=value=>new DOMParser().parseFromString(value,'application/xml');
    const xml=parse(sheet);
    if(xml.querySelector('parsererror'))throw new Error('Generated worksheet XML is invalid');
    const strings=shared?[...parse(shared).getElementsByTagName('si')].map(item=>item.textContent):[];
    const rows=[...xml.getElementsByTagName('row')].map(row=>{
      const values=[];
      for(const cell of row.getElementsByTagName('c')){
        let column=0;
        for(const letter of cell.getAttribute('r').match(/^[A-Z]+/)[0])column=column*26+letter.charCodeAt(0)-64;
        const type=cell.getAttribute('t'),value=cell.getElementsByTagName('v')[0]?.textContent;
        values[column-1]=type==='s'?strings[Number(value)]:type==='inlineStr'?[...cell.getElementsByTagName('t')].map(item=>item.textContent).join(''):value==null?'':type==='str'?value:Number(value);
      }
      return values;
    });
    const width=rows[0]?.length??0;
    return rows.map(row=>Array.from({length:width},(_,index)=>row[index]??''));
  },{sheet:files['xl/worksheets/sheet1.xml'],shared:files['xl/sharedStrings.xml']});
}

test('Excel fallback downloads actual filtered sorted XLSX rows across pages using visible columns',async({page},testInfo)=>{
  await page.goto(route);
  await page.evaluate(()=>{window.showSaveFilePicker=undefined;});
  const projectGrid=grid(page),excel=projectGrid.getByRole('button',{name:'Excel 내보내기',exact:true});
  await expect(excel.locator('.icon-excel')).toHaveCount(1);
  await expect(projectGrid.getByRole('button',{name:'CSV 내보내기',exact:true})).toBeVisible();
  await projectGrid.getByRole('searchbox',{name:'프로젝트 검색',exact:true}).fill('디자인');
  await projectGrid.getByRole('combobox',{name:'상태 필터: 전체',exact:true}).click();
  await page.getByRole('option',{name:'완료',exact:true}).click();
  await projectGrid.getByRole('button',{name:'예산',exact:true}).click();
  await projectGrid.getByRole('button',{name:'예산',exact:true}).click();
  await projectGrid.getByRole('button',{name:'표시 열',exact:true}).click();
  await page.getByRole('checkbox',{name:'마감일',exact:true}).uncheck();
  await page.keyboard.press('Escape');
  const visibleCount=await projectGrid.locator('tbody tr[data-grid-row-id]').count();
  const downloading=page.waitForEvent('download');
  page.once('dialog',dialog=>dialog.accept());
  await excel.click();
  const file=await downloading;
  expect(file.suggestedFilename()).toBe('idenflu-projects.xlsx');
  const bytes=await readFile(await file.path());
  const [headers,...rows]=await workbookRows(page,bytes);
  expect(headers).toEqual(['프로젝트','담당 팀','담당자','상태','진행률','예산']);
  expect(rows.length).toBeGreaterThan(visibleCount);
  expect(rows.every(row=>row[3]==='완료'&&row.some(value=>String(value).includes('디자인')))).toBe(true);
  const budgets=rows.map(row=>row[5]);
  expect(budgets.every(value=>typeof value==='number')).toBe(true);
  expect(budgets).toEqual([...budgets].sort((left,right)=>right-left));
  await testInfo.attach('filtered-projects.xlsx',{body:bytes,contentType:mime});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});

test('selected Excel export includes chosen records outside current results and confirms a new filename',async({page})=>{
  await page.goto(route);
  await page.evaluate(()=>{window.showSaveFilePicker=undefined;});
  const projectGrid=grid(page);
  const selected=await projectGrid.locator('tbody tr[data-grid-row-id] .studio-grid-project strong').allTextContents();
  expect(selected).toHaveLength(5);
  await projectGrid.getByRole('checkbox',{name:'현재 페이지 전체 선택',exact:true}).check();
  const selectedExcel=projectGrid.getByRole('button',{name:'선택한 행 Excel 내보내기',exact:true});
  await expect(selectedExcel.locator('.icon-excel')).toHaveCount(1);
  await projectGrid.getByRole('searchbox',{name:'프로젝트 검색',exact:true}).fill('없는프로젝트XYZ');
  await expect(projectGrid.getByRole('button',{name:'Excel 내보내기',exact:true})).toBeDisabled();
  await expect(selectedExcel).toBeEnabled();
  const downloading=page.waitForEvent('download');
  page.once('dialog',dialog=>{
    expect(dialog.type()).toBe('prompt');
    expect(dialog.defaultValue()).toBe('idenflu-projects-selected.xlsx');
    return dialog.accept('선택한 프로젝트');
  });
  await selectedExcel.click();
  const file=await downloading;
  expect(file.suggestedFilename()).toBe('선택한 프로젝트.xlsx');
  const bytes=await readFile(await file.path());
  const [headers,...rows]=await workbookRows(page,bytes);
  expect(headers).toEqual(['프로젝트','담당 팀','담당자','상태','진행률','예산','마감일']);
  expect(rows).toHaveLength(selected.length);
  expect(rows.map(row=>row[0]).sort()).toEqual([...selected].sort());
});

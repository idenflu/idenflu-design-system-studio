export type DataGridExportFormat = 'csv' | 'xlsx';

export function dataGridFileName(fileName:string, format:DataGridExportFormat) {
  const clean=fileName.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_') || `data-grid.${format}`;
  return `${clean.replace(/\.(csv|xlsx)$/i,'')}.${format}`;
}

type SaveWindow = Window & {
  showSaveFilePicker?: (options:{id:string;suggestedName:string;types:{description:string;accept:Record<string,string[]>}[]})=>Promise<FileSystemFileHandle>;
};

/** Ask for the destination before building the file to preserve user activation. */
export async function saveDataGridFile({format,fileName,createBlob}:{format:DataGridExportFormat;fileName:string;createBlob:()=>Blob}) {
  const label=format==='csv'?'CSV':'Excel';
  if(typeof document==='undefined'||typeof Blob==='undefined')throw new Error(`${label} 파일 다운로드는 브라우저에서만 사용할 수 있습니다. 서버에서는 ${format==='csv'?'createDataGridCsv':'createDataGridXlsx'}를 사용해주세요.`);
  const suggestedName=dataGridFileName(fileName,format);
  const view=document.defaultView as SaveWindow|null;
  const mime=format==='csv'?'text/csv':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if(typeof view?.showSaveFilePicker==='function') {
    let handle:FileSystemFileHandle;
    try {
      handle=await view.showSaveFilePicker({id:`idenflu-data-grid-${format}`,suggestedName,types:[{description:`${label} 파일`,accept:{[mime]:[`.${format}`]}}]});
    } catch(error) {
      if(error&&typeof error==='object'&&'name'in error&&error.name==='AbortError')return;
      throw error;
    }
    const blob=createBlob();
    const writable=await handle.createWritable();
    try {await writable.write(blob);await writable.close();}
    catch(error) {await writable.abort().catch(()=>{});throw error;}
    return;
  }
  const name=view?.prompt(`${label} 파일명을 입력해주세요.\n저장 위치는 브라우저의 다운로드 설정을 따릅니다.`,suggestedName);
  if(name==null)return;
  if(typeof URL==='undefined'||typeof URL.createObjectURL!=='function')throw new Error(`이 브라우저에서는 ${label} 파일을 다운로드할 수 없습니다.`);
  const url=URL.createObjectURL(createBlob());
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=dataGridFileName(name.trim()||suggestedName,format);
  anchor.hidden=true;
  try {(document.body||document.documentElement).appendChild(anchor);anchor.click();}
  finally {anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}

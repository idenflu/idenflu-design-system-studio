import { saveDataGridFile } from './data-grid-file';
import { createDataGridXlsx, type DataGridXlsxOptions } from './data-grid-xlsx';

export interface DownloadDataGridXlsxOptions<T> extends DataGridXlsxOptions<T> { fileName?:string }

/** Saves a real XLSX workbook to the chosen destination or browser downloads. */
export async function downloadDataGridXlsx<T>({fileName='data-grid.xlsx',...options}:DownloadDataGridXlsxOptions<T>) {
  return saveDataGridFile({format:'xlsx',fileName,createBlob:()=>new Blob([new Uint8Array(createDataGridXlsx(options)).buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})});
}

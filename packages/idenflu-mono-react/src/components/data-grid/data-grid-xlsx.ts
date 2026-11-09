export interface DataGridXlsxColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

export interface DataGridXlsxOptions<T> {
  rows: readonly T[];
  columns: readonly DataGridXlsxColumn<T>[];
  sheetName?: string;
}

const spreadsheetNamespace = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const relationshipNamespace = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const maxRows = 1_048_576;
const maxColumns = 16_384;
const maxTextLength = 32_767;

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** Encode characters XML cannot carry, while preserving literal OOXML escape sequences. */
function spreadsheetText(value: string) {
  if (value.length > maxTextLength) throw new RangeError('Excel 셀의 텍스트는 32,767자를 넘을 수 없습니다.');
  let encoded = value.replace(/_x[0-9a-f]{4}_/gi, match => `_x005F_${match.slice(1)}`);
  encoded = encoded.replace(/[\u0000-\u0008\u000b-\u001f\ufffe\uffff]|[\ud800-\udfff]/g, (character, offset: number, source: string) => {
    const code = character.charCodeAt(0);
    // XML accepts valid UTF-16 surrogate pairs as a single supplementary character.
    if (code >= 0xd800 && code <= 0xdbff && /[\udc00-\udfff]/.test(source[offset + 1] ?? '')) return character;
    if (code >= 0xdc00 && code <= 0xdfff && /[\ud800-\udbff]/.test(source[offset - 1] ?? '')) return character;
    return `_x${code.toString(16).toUpperCase().padStart(4, '0')}_`;
  });
  return escapeXml(encoded);
}

function columnName(index: number) {
  let name = '';
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) name = String.fromCharCode(65 + (value - 1) % 26) + name;
  return name;
}

function hasUnpairedSurrogate(value: string) {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++index);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
    } else if (code >= 0xdc00 && code <= 0xdfff) return true;
  }
  return false;
}

function cellXml(reference: string, value: string | number | null | undefined, header = false) {
  const style = header ? ' s="1"' : '';
  if (value == null) return `<c r="${reference}"${style}/>`;
  if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${reference}"${style} t="n"><v>${value}</v></c>`;
  // Explicit inline strings never become formulas, hyperlinks, or executable content.
  return `<c r="${reference}"${style} t="inlineStr"><is><t xml:space="preserve">${spreadsheetText(String(value))}</t></is></c>`;
}

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** ZIP method 0 needs no compression library and is supported by Excel/OOXML. */
function zipStore(files: readonly [string, string][]): Uint8Array {
  const encoder = new TextEncoder();
  const entries = files.map(([name, content]) => ({name: encoder.encode(name), content: encoder.encode(content)}));
  const localSize = entries.reduce((sum, entry) => sum + 30 + entry.name.length + entry.content.length, 0);
  const centralSize = entries.reduce((sum, entry) => sum + 46 + entry.name.length, 0);
  const size = localSize + centralSize + 22;
  if (size > 0xffffffff) throw new RangeError('Excel 파일이 ZIP의 최대 지원 크기를 넘었습니다.');
  const result = new Uint8Array(size);
  const view = new DataView(result.buffer);
  const short = (offset: number, value: number) => view.setUint16(offset, value, true);
  const long = (offset: number, value: number) => view.setUint32(offset, value, true);
  let localOffset = 0, centralOffset = localSize;
  for (const entry of entries) {
    const checksum = crc32(entry.content);
    long(localOffset, 0x04034b50);
    short(localOffset + 4, 20);
    short(localOffset + 6, 0x0800); // UTF-8 filenames.
    short(localOffset + 8, 0); // Stored, without compression.
    short(localOffset + 12, 33); // 1980-01-01; no host timezone dependency.
    long(localOffset + 14, checksum);
    long(localOffset + 18, entry.content.length);
    long(localOffset + 22, entry.content.length);
    short(localOffset + 26, entry.name.length);
    result.set(entry.name, localOffset + 30);
    result.set(entry.content, localOffset + 30 + entry.name.length);

    long(centralOffset, 0x02014b50);
    short(centralOffset + 4, 20);
    short(centralOffset + 6, 20);
    short(centralOffset + 8, 0x0800);
    short(centralOffset + 10, 0);
    short(centralOffset + 14, 33);
    long(centralOffset + 16, checksum);
    long(centralOffset + 20, entry.content.length);
    long(centralOffset + 24, entry.content.length);
    short(centralOffset + 28, entry.name.length);
    long(centralOffset + 42, localOffset);
    result.set(entry.name, centralOffset + 46);
    localOffset += 30 + entry.name.length + entry.content.length;
    centralOffset += 46 + entry.name.length;
  }
  long(centralOffset, 0x06054b50);
  short(centralOffset + 8, entries.length);
  short(centralOffset + 10, entries.length);
  long(centralOffset + 12, centralSize);
  long(centralOffset + 16, localSize);
  return result;
}

/** Creates an actual .xlsx workbook, without browser globals or formula inference. */
export function createDataGridXlsx<T>({rows, columns, sheetName = '데이터'}: DataGridXlsxOptions<T>): Uint8Array {
  if (!sheetName.trim() || sheetName.length > 31 || /[\\/*?:\[\]\u0000-\u001f\ufffe\uffff]/.test(sheetName) || /^'|'$/.test(sheetName) || hasUnpairedSurrogate(sheetName)) {
    throw new RangeError('Excel 시트명은 1~31자이며 \\ / * ? : [ ] 또는 제어 문자를 포함하거나 작은따옴표로 시작·끝날 수 없습니다.');
  }
  if (columns.length > maxColumns) throw new RangeError('Excel은 최대 16,384개의 열을 지원합니다.');
  if (rows.length + 1 > maxRows) throw new RangeError('Excel은 헤더를 포함해 최대 1,048,576개의 행을 지원합니다.');
  const names = columns.map((_, index) => columnName(index));
  const rowXml = [`<row r="1">${columns.map((column, index) => cellXml(`${names[index]}1`, column.header, true)).join('')}</row>`];
  for (let index = 0; index < rows.length; index++) {
    const rowNumber = index + 2;
    rowXml.push(`<row r="${rowNumber}">${columns.map((column, columnIndex) => cellXml(`${names[columnIndex]}${rowNumber}`, column.accessor(rows[index]))).join('')}</row>`);
  }
  const dimension = columns.length ? `A1:${names[names.length - 1]}${rows.length + 1}` : 'A1';
  const worksheet = `${xmlDeclaration}<worksheet xmlns="${spreadsheetNamespace}"><dimension ref="${dimension}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>${columns.length ? `<cols><col min="1" max="${columns.length}" width="18" customWidth="1"/></cols>` : ''}<sheetData>${rowXml.join('')}</sheetData></worksheet>`;
  const styles = `${xmlDeclaration}<styleSheet xmlns="${spreadsheetNamespace}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  return zipStore([
    ['[Content_Types].xml', `${xmlDeclaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
    ['_rels/.rels', `${xmlDeclaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationshipNamespace}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `${xmlDeclaration}<workbook xmlns="${spreadsheetNamespace}" xmlns:r="${relationshipNamespace}"><sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `${xmlDeclaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationshipNamespace}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${relationshipNamespace}/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', styles],
    ['xl/worksheets/sheet1.xml', worksheet],
  ]);
}

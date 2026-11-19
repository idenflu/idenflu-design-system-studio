function formatJson(code: string, indentSize: number) {
  // Validate without reserializing numbers, escape sequences, or duplicate keys.
  JSON.parse(code);
  const tokens = code.match(/"(?:\\.|[^"\\])*"|[^\s"{}\[\],:]+|[{}\[\],:]/g) ?? [];
  let output = '';
  let depth = 0;
  const nextLine = () => `\n${' '.repeat(depth * indentSize)}`;

  for (const [index, token] of tokens.entries()) {
    if (token === '{' || token === '[') {
      depth += 1;
      output += token;
      if (tokens[index + 1] !== (token === '{' ? '}' : ']')) output += nextLine();
    } else if (token === '}' || token === ']') {
      depth -= 1;
      if (tokens[index - 1] !== (token === '}' ? '{' : '[')) output += nextLine();
      output += token;
    } else if (token === ',') {
      output += token + nextLine();
    } else {
      output += token === ':' ? ': ' : token;
    }
  }

  return output;
}

function indentXml(element: Element, depth: number, indentSize: number) {
  const children = Array.from(element.childNodes);
  const hasMixedText = children.some(child =>
    child.nodeType === 4 || (child.nodeType === 3 && /[^\t\r\n ]/.test(child.textContent ?? '')),
  );
  if (!element.children.length || hasMixedText || element.getAttribute('xml:space') === 'preserve') return;

  const document = element.ownerDocument;
  const childIndent = `\n${' '.repeat((depth + 1) * indentSize)}`;
  for (const child of children) {
    if (child.nodeType === 3) {
      element.removeChild(child);
    } else {
      element.insertBefore(document.createTextNode(childIndent), child);
      if (child.nodeType === 1) indentXml(child as Element, depth + 1, indentSize);
    }
  }
  element.appendChild(document.createTextNode(`\n${' '.repeat(depth * indentSize)}`));
}

function formatXml(code: string, indentSize: number) {
  if (typeof DOMParser === 'undefined' || /<!DOCTYPE/i.test(code)) return code;

  const document = new DOMParser().parseFromString(code, 'application/xml');
  if (document.getElementsByTagNameNS('http://www.mozilla.org/newlayout/xml/parsererror.xml', 'parsererror').length) return code;

  indentXml(document.documentElement, 0, indentSize);
  const formatted = new XMLSerializer().serializeToString(document);
  const declaration = code.match(/^\uFEFF?(<\?xml\s[\s\S]*?\?>)/)?.[1];
  return declaration ? `${declaration}\n${formatted}` : formatted;
}

export function formatCode(code: string, language: string, indentSize: number) {
  try {
    if (language === 'json') return formatJson(code, indentSize);
    if (language === 'xml') return formatXml(code, indentSize);
  } catch {
    // Keep invalid source visible for inspection.
  }
  return code;
}

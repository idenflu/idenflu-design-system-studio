import * as React from 'react';
import { formatCode } from './format-code';

export interface CodeBlockProps {
  code: string;
  language: string;
  format?: 'none' | 'pretty';
  indentSize?: number;
  wrap?: boolean;
  maxHeight?: number | string;
  className?: string;
  'aria-label'?: string;
}

export function CodeBlock({
  code, language, format = 'none', indentSize = 2, wrap = false, maxHeight, className,
  'aria-label': ariaLabel,
}: CodeBlockProps) {
  const normalizedLanguage = language.trim().toLowerCase();
  const isJson = format === 'pretty' && normalizedLanguage === 'json';
  const isXml = format === 'pretty' && normalizedLanguage === 'xml';
  const label = normalizedLanguage === 'json' || normalizedLanguage === 'xml' ? normalizedLanguage.toUpperCase() : language;
  const indent = Number.isSafeInteger(indentSize) && indentSize >= 0 ? indentSize : 2;
  const json = React.useMemo(() => isJson ? formatCode(code, 'json', indent) : code, [code, indent, isJson]);
  const [xml, setXml] = React.useState<{ source: string; indent: number; text: string }>();

  // Use the same initial XML text on the server and during hydration.
  React.useEffect(() => {
    if (isXml) setXml({ source: code, indent, text: formatCode(code, 'xml', indent) });
  }, [code, indent, isXml]);

  const text = isXml && xml?.source === code && xml.indent === indent ? xml.text : json;
  return <div className={className ? `code-block ${className}` : 'code-block'}>
    <div className="code-block__language">{label}</div>
    <pre className={`code-block__body${wrap ? ' code-block__body--wrap' : ''}`} style={{ maxHeight }}
      role="region" aria-label={ariaLabel ?? `${label} 코드`} tabIndex={0}>
      <code>{text}</code>
    </pre>
  </div>;
}

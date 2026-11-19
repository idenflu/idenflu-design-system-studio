import { CodeBlock } from '@idenflu/mono-react';
import { Section } from './demo-layout';

const payload = '{"targets":{"audit.history.cleanup":{"contextPath":"platform.audit","retentionDays":1,"description":"Remove audit history entries after the configured retention period."}},"id":9007199254740993}';
const settings = '<settings><audit><retentionDays>1</retentionDays></audit></settings>';

export const codeBlockUsage = `import { CodeBlock } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function CodeBlockExample() {
  return <CodeBlock
    code={${JSON.stringify(payload)}}
    language="json"
    format="pretty"
    indentSize={4}
    maxHeight={160}
    aria-label="스케줄 Payload JSON"
  />;
}`;

export function CodeBlockDemos() {
  return <>
    <Section title="JSON 포맷팅" description="공백 4칸으로 들여씁니다. 본문 높이가 160px을 넘으면 본문 안에서 스크롤합니다.">
      <CodeBlock code={payload} language="json" format="pretty" indentSize={4} maxHeight={160} aria-label="스케줄 Payload JSON" />
    </Section>
    <Section title="XML 포맷팅" description="기본 들여쓰기는 공백 2칸입니다. wrap을 켜면 긴 줄을 본문 너비에 맞춰 표시합니다.">
      <CodeBlock code={settings} language="xml" format="pretty" wrap />
    </Section>
    <Section title="포맷팅 동작">
      <ul>
        <li><code>format="none"</code>이 기본값이며 원문을 표시합니다.</li>
        <li><code>format="pretty"</code>는 JSON과 XML을 정리합니다. 지원하지 않는 언어, 잘못된 입력, DOCTYPE이 있는 XML은 원문으로 표시합니다.</li>
        <li><code>indentSize={'{0}'}</code>은 줄바꿈만 적용합니다.</li>
      </ul>
    </Section>
  </>;
}

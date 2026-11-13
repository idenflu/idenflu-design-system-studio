import * as React from "react";
import { Button, type ButtonVariant } from "@idenflu/mono-react";
import { Section } from "../demo-layout";
import { CodeExample } from "../convenience-api-reference";

export function ButtonBasicDemos() {
  const [feedback, setFeedback] = React.useState("");
  return (
    <Section
      title="기본 버튼"
      description="동작의 강도에 따라 스타일을 선택합니다."
    >
      <div className="react-studio-row">
        {(["default", "outline", "ghost"] as ButtonVariant[]).map((variant) => (
          <Button
            key={variant}
            variant={variant}
            onClick={() => setFeedback(`${variant} 버튼을 눌렀습니다.`)}
          >
            {variant}
          </Button>
        ))}
      </div>
      <CodeExample title="기본 버튼 사용 예시">
        {`<Button variant="default">default</Button>
<Button variant="outline">outline</Button>
<Button variant="ghost">ghost</Button>`}
      </CodeExample>
      <p role="status" className="component-helper">
        {feedback}
      </p>
    </Section>
  );
}

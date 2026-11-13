import * as React from "react";
import { Button } from "@idenflu/mono-react";
import { Section } from "../demo-layout";
import { CodeExample } from "../convenience-api-reference";

export function ButtonColorDemos() {
  const [feedback, setFeedback] = React.useState("");
  return (
    <Section
      title="색상"
      description="강조, 보조, 위험 동작을 위해 의미에 맞는 색을 적용합니다."
    >
      <div className="react-studio-row">
        <Button
          variant="ghost"
          color="primary"
          onClick={() => setFeedback(`primary 버튼을 눌렀습니다.`)}
        >
          primary
        </Button>
        <Button
          variant="default"
          color="secondary"
          onClick={() => setFeedback(`secondary 버튼을 눌렀습니다.`)}
        >
          secondary
        </Button>
        <Button
          variant="outline"
          color="danger"
          onClick={() => setFeedback(`danger 버튼을 눌렀습니다.`)}
        >
          danger
        </Button>
      </div>
      <CodeExample title="색상 사용 예시">{`<Button variant="ghost" color="primary">primary</Button>
<Button variant="default" color="secondary">secondary</Button>
<Button variant="outline" color="danger">danger</Button>`}</CodeExample>
      <p role="status" className="component-helper">
        {feedback}
      </p>
    </Section>
  );
}

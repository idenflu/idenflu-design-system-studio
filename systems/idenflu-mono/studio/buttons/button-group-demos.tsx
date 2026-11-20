import * as React from "react";
import { Button, ButtonGroup, Icon } from "@idenflu/mono-react";
import { Section } from "../demo-layout";

const sizes = ["sm", "md", "lg"] as const;

export const buttonGroupUsage = `import { Button, ButtonGroup, Icon } from '@idenflu/mono-react';

<ButtonGroup aria-label="파일 작업" size="md">
  <Button><Icon name="copy" />복사</Button>
  <Button color="secondary"><Icon name="download" />내보내기</Button>
  <Button color="danger"><Icon name="trash" />삭제</Button>
  <Button color="danger" disabled><Icon name="undo" />복원</Button>
</ButtonGroup>`;

export function ButtonGroupDemos() {
  const [feedback, setFeedback] = React.useState("");

  return (
    <>
      <Section
        title="색상과 상태"
        description="각 버튼의 color는 텍스트와 아이콘에 함께 적용됩니다. 테두리와 구분선, hover·pressed·focus 스타일은 그룹에서 공통으로 사용합니다."
      >
        <ButtonGroup aria-label="파일 작업">
          <Button onClick={() => setFeedback("복사를 선택했습니다.")}>
            <Icon name="copy" />
            복사
          </Button>
          <Button
            color="secondary"
            onClick={() => setFeedback("내보내기를 선택했습니다.")}
          >
            <Icon name="download" />
            내보내기
          </Button>
          <Button color="danger" onClick={() => setFeedback("삭제를 선택했습니다.")}>
            <Icon name="trash" />
            삭제
          </Button>
          <Button color="danger" disabled>
            <Icon name="undo" />
            복원
          </Button>
        </ButtonGroup>
        <p role="status" className="component-helper">{feedback}</p>
      </Section>
      <Section
        title="크기"
        description="ButtonGroup의 size로 버튼 높이, 좌우 여백, 아이콘 크기를 함께 조정합니다. 그룹에 지정한 크기가 개별 버튼의 size보다 우선합니다."
      >
        <div className="react-studio-row">
          {sizes.map((size) => (
            <div className="react-studio-stack" key={size}>
              <span className="react-studio-caption">{size}</span>
              <ButtonGroup aria-label={`${size} 파일 작업`} size={size}>
                <Button onClick={() => setFeedback("복사를 선택했습니다.")}>
                  <Icon name="copy" />
                  복사
                </Button>
                <Button
                  color="secondary"
                  onClick={() => setFeedback("내보내기를 선택했습니다.")}
                >
                  <Icon name="download" />
                  내보내기
                </Button>
              </ButtonGroup>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

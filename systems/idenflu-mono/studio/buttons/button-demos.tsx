import * as React from "react";
import { Button, Icon, Segmented } from "@idenflu/mono-react";
import { Section } from "../demo-layout";
import { ButtonBasicDemos } from "./button-basic-demos";
import { ButtonColorDemos } from "./button-color-demos";
import { ButtonDisabledDemos } from "./button-disabled-demos";
import { IconButtonDemos } from "./icon-button-demos";

const sizes = ["sm", "md", "lg"] as const;

export function ButtonDemos() {
  const [feedback, setFeedback] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const viewOptions = [
    {
      value: "list",
      label: (
        <>
          <Icon name="list" />
          목록
        </>
      ),
    },
    {
      value: "grid",
      label: (
        <>
          <Icon name="grid" />
          격자
        </>
      ),
    },
    {
      value: "calendar",
      label: (
        <>
          <Icon name="calendar" />
          캘린더
        </>
      ),
    },
  ];
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const save = () => {
    setLoading(true);
    setFeedback("변경사항을 저장하는 중입니다.");
    timer.current = setTimeout(() => {
      setLoading(false);
      setFeedback("변경사항을 저장했습니다.");
    }, 1000);
  };
  return (
    <>
      <ButtonBasicDemos />
      <ButtonColorDemos />
      <ButtonDisabledDemos />
      <Section
        title="아이콘과 버튼"
        description="아이콘은 문구의 의미를 보조하며, 아이콘만 사용할 때도 접근 가능한 이름을 제공합니다."
      >
        <div className="react-studio-row">
          <Button onClick={() => setFeedback("새로 만들기를 선택했습니다.")}>
            <Icon name="plus" />
            새로 만들기
          </Button>
          <Button
            variant="outline"
            onClick={() => setFeedback("다운로드를 선택했습니다.")}
          >
            <Icon name="download" />
            다운로드
          </Button>
        </div>
        <div className="react-studio-row">
          <Button
            iconOnly
            aria-label="추가"
            onClick={() => setFeedback("추가를 선택했습니다.")}
          >
            <Icon name="plus" />
          </Button>
          <Button
            variant="outline"
            iconOnly
            aria-label="다운로드"
            onClick={() => setFeedback("다운로드를 선택했습니다.")}
          >
            <Icon name="download" />
          </Button>
          <Button
            color="secondary"
            iconOnly
            aria-label="복사"
            onClick={() => setFeedback("복사를 선택했습니다.")}
          >
            <Icon name="copy" />
          </Button>
          <Button
            variant="ghost"
            iconOnly
            aria-label="설정 열기"
            onClick={() => setFeedback("설정을 선택했습니다.")}
          >
            <Icon name="settings" />
          </Button>
          <Button
            color="danger"
            iconOnly
            aria-label="삭제"
            onClick={() => setFeedback("삭제를 선택했습니다.")}
          >
            <Icon name="trash" />
          </Button>
        </div>
      </Section>
      <Section
        title="사이즈"
        description="같은 화면의 버튼과 입력 컨트롤에는 일관된 크기를 사용합니다."
      >
        <div className="react-studio-row">
          {sizes.map((size) => (
            <Button
              size={size}
              key={size}
              onClick={() =>
                setFeedback(`${size.toUpperCase()} 버튼을 눌렀습니다.`)
              }
            >
              <Icon name="plus" />
              {size.toUpperCase()} 버튼
            </Button>
          ))}
        </div>
      </Section>
      <Section
        title="처리 중 상태"
        description="저장 동작을 실행하면 완료될 때까지 중복 클릭을 막고 진행 상태를 표시합니다."
      >
        <div className="react-studio-row">
          <Button loading={loading} onClick={save}>
            저장하기
          </Button>
        </div>
      </Section>
      <Section
        title="버튼 그룹"
        description="선택형 그룹은 같은 너비의 항목 중 하나를 선택합니다. 선택된 항목은 옅은 프라이머리 배경으로 구분합니다."
      >
        <div className="react-studio-row">
          <Segmented
            label="보기 방식"
            options={viewOptions}
            onValueChange={(value) =>
              setFeedback(
                `${
                  (
                    {
                      list: "목록",
                      grid: "격자",
                      calendar: "캘린더",
                    } as Record<string, string>
                  )[value]
                } 보기를 선택했습니다.`
              )
            }
          />
        </div>
        <div className="react-studio-row">
          <Segmented
            label="조회 기간"
            options={[
              { value: "day", label: "일간" },
              { value: "week", label: "주간" },
              { value: "month", label: "월간" },
            ]}
            defaultValue="week"
          />
          <Segmented label="비활성 보기 방식" options={viewOptions} disabled />
        </div>
      </Section>
      <Section
        title="버튼 그룹 사이즈"
        description="버튼과 같은 sm 30px·md 36px·lg 42px 높이를 사용하며, 아이콘과 간격도 함께 조정됩니다."
      >
        <div className="react-studio-stack">
          {sizes.map((size) => (
            <div key={size} className="react-studio-stack">
              <span className="react-studio-caption">
                {size.toUpperCase()}
                {size === "md" ? " · 기본" : ""}
              </span>
              <Segmented
                label={`${size.toUpperCase()} 보기 방식`}
                size={size}
                options={viewOptions}
              />
            </div>
          ))}
        </div>
      </Section>
      <Section
        title="동작형 버튼 그룹"
        description="복사·내보내기처럼 각각 실행하는 관련 행동은 구분선으로 묶습니다."
      >
        <div className="react-studio-row">
          <div className="button-group" role="group" aria-label="파일 작업">
            <Button
              variant="outline"
              onClick={() => setFeedback("복사를 선택했습니다.")}
            >
              <Icon name="copy" />
              복사
            </Button>
            <Button
              variant="outline"
              onClick={() => setFeedback("내보내기를 선택했습니다.")}
            >
              <Icon name="download" />
              내보내기
            </Button>
          </div>
        </div>
      </Section>
      <p role="status" className="component-helper">
        {feedback}
      </p>
      <IconButtonDemos />
    </>
  );
}

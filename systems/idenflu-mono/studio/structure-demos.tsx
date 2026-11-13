import { PopupAlignDemos } from "./convenience-api-demos";
import * as React from "react";
import {
  Grid,
  Badge,
  Button,
  Checkbox,
  Chip,
  DropdownMenu,
  DropdownMenuItem,
  Icon,
  Popover,
  Radio,
  SelectableList,
  SelectableListItem,
  Stepper,
  Switch,
  TextArea,
  TextField,
  Tree,
} from "@idenflu/mono-react";
import { Section } from "./demo-layout";
export { TableDemos } from "./table-demos";

const sizes = ["sm", "md", "lg"] as const;

export function SelectionDemos() {
  const [selected, setSelected] = React.useState(["email"]);
  const choices = [
    { value: "email", label: "이메일 알림" },
    { value: "push", label: "푸시 알림" },
  ];
  return (
    <>
      <Section
        title="선택 컨트롤"
        description="복수 선택은 체크박스, 하나의 선택은 라디오, 즉시 반영되는 설정은 스위치로 표현합니다."
      >
        <Grid
          columns={{ base: 1, sm: 3 }}
          gap={6}
          alignItems="start"
          className="react-studio-size-grid"
        >
          <fieldset className="choice-group react-studio-example react-studio-stack">
            <legend>체크박스</legend>
            <Checkbox
              label="전체 선택"
              checked={selected.length === choices.length}
              indeterminate={
                selected.length > 0 && selected.length < choices.length
              }
              onChange={(event) =>
                setSelected(
                  event.target.checked ? choices.map((item) => item.value) : []
                )
              }
            />
            {choices.map((item) => (
              <Checkbox
                key={item.value}
                label={item.label}
                checked={selected.includes(item.value)}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setSelected((current) =>
                    checked
                      ? [...current, item.value]
                      : current.filter((value) => value !== item.value)
                  );
                }}
              />
            ))}
            <Checkbox label="비활성 옵션" disabled />
          </fieldset>
          <fieldset className="choice-group react-studio-example react-studio-stack">
            <legend>라디오</legend>
            <Radio label="개인" name="plan" defaultChecked />
            <Radio label="팀" name="plan" />
            <Radio label="조직" name="plan" />
            <Radio label="비활성" name="plan" disabled />
          </fieldset>
          <fieldset className="choice-group react-studio-example react-studio-stack">
            <legend>스위치</legend>
            <Switch label="알림" defaultChecked />
            <Switch label="자동 저장" />
            <Switch label="비활성 스위치" disabled />
            <Switch label="켜진 비활성 스위치" disabled defaultChecked />
          </fieldset>
        </Grid>
      </Section>
      <Section
        title="스위치 사이즈"
        description="기본 크기는 md입니다. 트랙은 작고 가볍게, 클릭 영역은 같은 사이즈의 입력 컨트롤 높이로 유지합니다. 라벨을 누르거나 Tab·Space로 조작해보세요."
      >
        <Grid
          columns={{ base: 1, sm: 3 }}
          gap={6}
          alignItems="start"
          className="react-studio-size-grid"
        >
          {(
            [
              { size: "sm", track: "28 × 16", thumb: 12, target: 32 },
              { size: "md", track: "36 × 20", thumb: 16, target: 38 },
              { size: "lg", track: "44 × 24", thumb: 20, target: 44 },
            ] as const
          ).map((item) => (
            <fieldset
              key={item.size}
              className="choice-group react-studio-example react-studio-stack"
              aria-label={`${item.size.toUpperCase()} 스위치 예시`}
            >
              <legend>
                {item.size.toUpperCase()}
                {item.size === "md" ? " · 기본" : ""}
              </legend>
              <div>
                <p className="react-studio-caption">
                  트랙 {item.track}px · 핸들 {item.thumb}px
                </p>
                <p className="react-studio-caption">
                  클릭 영역 높이 {item.target}px
                </p>
              </div>
              <Switch size={item.size} label="이메일 알림" defaultChecked />
              <Switch size={item.size} label="자동 저장" />
              <Switch size={item.size} label="비활성 · 꺼짐" disabled />
              <Switch
                size={item.size}
                label="비활성 · 켜짐"
                disabled
                defaultChecked
              />
            </fieldset>
          ))}
        </Grid>
      </Section>
      <Section title="선택 예시" description="알림 수신 여부를 선택합니다.">
        <div className="react-studio-row">
          <Checkbox label="메일로 받기" />
          <Switch label="일정 알림" />
        </div>
      </Section>
    </>
  );
}

const treeLabels: Record<string, string> = {
  system: "디자인 시스템",
  brand: "브랜드 가이드",
  components: "컴포넌트",
  docs: "문서",
  about: "프로젝트 소개",
};
export function TreeDemos() {
  const [value, setValue] = React.useState("디자인 시스템");
  return (
    <>
      <Section
        title="계층 탐색"
        description="그룹은 접고 펼치며, 하위 항목을 선택해 현재 위치를 표시합니다."
      >
        <div className="react-studio-tree-sample">
          <Tree
            label="프로젝트 파일"
            defaultExpanded={["project", "design"]}
            defaultValue="system"
            onValueChange={(value) => setValue(treeLabels[value] || value)}
            items={[
              {
                value: "project",
                label: "프로젝트",
                children: [
                  {
                    value: "design",
                    label: "디자인",
                    children: [
                      { value: "system", label: "디자인 시스템" },
                      { value: "brand", label: "브랜드 가이드" },
                    ],
                  },
                  {
                    value: "development",
                    label: "개발",
                    children: [
                      { value: "components", label: "컴포넌트" },
                      { value: "docs", label: "문서" },
                    ],
                  },
                  { value: "about", label: "프로젝트 소개" },
                  { value: "archived", label: "보관된 파일", disabled: true },
                ],
              },
            ]}
          />
        </div>
        <p role="status" className="component-helper">
          선택: {value}
        </p>
      </Section>
      <Section
        title="루트 카테고리"
        description={
          'variant="category"는 자식이 있는 루트를 고정 제목으로 표시하고, 자식이 없는 루트는 선택 가능한 항목으로 표시합니다. 기본값은 "tree"입니다.'
        }
      >
        <div className="react-studio-tree-sample">
          <Tree
            label="카테고리 메뉴"
            variant="category"
            defaultExpanded={["category-design"]}
            defaultValue="category-system"
            items={[
              {
                value: "category-work",
                label: "업무 공간",
                children: [
                  {
                    value: "category-design",
                    label: "디자인",
                    children: [
                      { value: "category-system", label: "디자인 시스템" },
                      { value: "category-brand", label: "브랜드 가이드" },
                    ],
                  },
                ],
              },
              {
                value: "category-settings",
                label: "환경 설정",
                children: [
                  { value: "category-profile", label: "프로필" },
                  { value: "category-notifications", label: "알림 설정" },
                ],
              },
              { value: "category-help", label: "도움말" },
            ]}
          />
        </div>
      </Section>
      <Section
        title="아이콘이 있는 트리"
        description="각 항목의 종류를 아이콘으로 보조합니다."
      >
        <div className="react-studio-tree-sample">
          <Tree
            label="아이콘 프로젝트 메뉴"
            defaultExpanded={["workspace"]}
            defaultValue="list"
            items={[
              {
                value: "workspace",
                label: (
                  <span className="react-studio-icon-label">
                    <Icon name="grid" />
                    워크스페이스
                  </span>
                ),
                children: [
                  {
                    value: "list",
                    label: (
                      <span className="react-studio-icon-label">
                        <Icon name="list" />
                        프로젝트 목록
                      </span>
                    ),
                  },
                  {
                    value: "schedule",
                    label: (
                      <span className="react-studio-icon-label">
                        <Icon name="calendar" />
                        프로젝트 일정
                      </span>
                    ),
                  },
                ],
              },
            ]}
          />
        </div>
      </Section>
    </>
  );
}

const chipColors = [
  { variant: "neutral", label: "기본", example: "문서" },
  { variant: "primary", label: "강조", example: "진행 중" },
  { variant: "secondary", label: "보조", example: "참고" },
  { variant: "success", label: "성공", example: "완료" },
  { variant: "warning", label: "주의", example: "검토 중" },
  { variant: "danger", label: "위험", example: "오류" },
] as const;
export function ChipDemos() {
  const [selected, setSelected] = React.useState<string[]>(["디자인"]);
  const [removable, setRemovable] = React.useState([
    "프로젝트",
    "브랜드",
    "문서",
  ]);
  const [iconSelected, setIconSelected] = React.useState(false);
  const [componentSelected, setComponentSelected] = React.useState(false);
  const [roundSelected, setRoundSelected] = React.useState(false);
  const [selectedColors, setSelectedColors] = React.useState<string[]>(
    chipColors.map((item) => item.variant)
  );
  return (
    <>
      <Section
        title="표시용 칩"
        description="분류와 속성을 텍스트로 표시합니다. 클릭·키보드 선택·호버 효과가 없으며 Tab 이동 대상에 포함되지 않습니다."
      >
        <div className="react-studio-row">
          <Chip interactive={false}>프로젝트</Chip>
          <Chip interactive={false}>디자인 시스템</Chip>
          <Chip interactive={false}>
            <Icon name="calendar" />
            주간 일정
          </Chip>
        </div>
      </Section>
      <Section
        title="선택 칩"
        description="각 칩을 눌러 필터를 선택하거나 해제할 수 있습니다. Enter와 Space로도 동작합니다."
      >
        <div className="react-studio-row">
          {["디자인", "개발", "마케팅"].map((name) => (
            <Chip
              key={name}
              aria-pressed={selected.includes(name)}
              onClick={() =>
                setSelected((current) =>
                  current.includes(name)
                    ? current.filter((item) => item !== name)
                    : [...current, name]
                )
              }
            >
              {name}
            </Chip>
          ))}
          <Chip disabled>비활성</Chip>
        </div>
        <p role="status" className="component-helper">
          {selected.length
            ? `선택: ${selected.join(", ")}`
            : "선택한 항목이 없습니다."}
        </p>
      </Section>
      <Section
        title="모서리 스타일"
        description="기본 모서리와 알약 형태의 라운드를 비교합니다. 표시용·선택형 모두 같은 모양을 사용할 수 있습니다."
      >
        <Grid
          columns={{ base: 1, sm: 2 }}
          rowGap={6}
          columnGap={8}
          alignItems="start"
          className="react-studio-field-grid"
        >
          <div className="react-studio-example">
            <h3 className="react-studio-example-title">기본</h3>
            <div className="react-studio-row">
              <Chip interactive={false}>기본 표시</Chip>
              <Chip interactive={false} variant="primary">
                강조 표시
              </Chip>
            </div>
          </div>
          <div className="react-studio-example">
            <h3 className="react-studio-example-title">라운드</h3>
            <div className="react-studio-row">
              <Chip interactive={false} rounded>
                라운드 표시
              </Chip>
              <Chip
                rounded
                variant="primary"
                aria-pressed={roundSelected}
                onClick={() => setRoundSelected(!roundSelected)}
              >
                라운드 선택
              </Chip>
            </div>
          </div>
        </Grid>
      </Section>
      <Section
        title="색상"
        description="각 색상의 기본 표시·라운드 표시·선택 상태를 비교합니다. 선택형을 누르면 상태가 바뀝니다. 색상과 함께 텍스트로 의미를 전달합니다."
      >
        <Grid
          columns={{ base: 1, sm: 3 }}
          gap={6}
          alignItems="start"
          className="react-studio-size-grid react-studio-chip-palette"
        >
          {chipColors.map(({ variant, label, example }) => (
            <div
              className="react-studio-example react-studio-stack"
              key={variant}
            >
              <h3 className="react-studio-example-title">
                {label}
                <span className="react-studio-caption">{variant}</span>
              </h3>
              <div className="react-studio-row">
                <Chip interactive={false} variant={variant}>
                  {example}
                </Chip>
              </div>
              <div className="react-studio-row">
                <Chip interactive={false} variant={variant} rounded>
                  {example}
                </Chip>
              </div>
              <div className="react-studio-row">
                <Chip
                  variant={variant}
                  aria-label={`${label} 색상 선택`}
                  aria-pressed={selectedColors.includes(variant)}
                  onClick={() =>
                    setSelectedColors((current) =>
                      current.includes(variant)
                        ? current.filter((item) => item !== variant)
                        : [...current, variant]
                    )
                  }
                >
                  선택
                </Chip>
              </div>
            </div>
          ))}
        </Grid>
      </Section>
      <Section
        title="사이즈"
        description="표시용·라운드 칩도 SM·MD·LG 높이와 글자 크기 설정을 따릅니다."
      >
        <Grid
          columns={{ base: 1, sm: 3 }}
          gap={6}
          alignItems="start"
          className="react-studio-size-grid"
        >
          {sizes.map((size) => (
            <div className="react-studio-example" key={size}>
              <h3 className="react-studio-example-title">
                {size.toUpperCase()}
              </h3>
              <div className="react-studio-row">
                <Chip interactive={false} size={size}>
                  기본 표시
                </Chip>
                <Chip interactive={false} rounded variant="primary" size={size}>
                  라운드
                </Chip>
                <Chip size={size}>선택</Chip>
                <Chip interactive={false} density="comfortable" size={size}>
                  여유 있는 표시
                </Chip>
              </div>
            </div>
          ))}
        </Grid>
      </Section>
      <Section
        title="Comfortable 표시용 칩"
        description={
          '표시용 칩에 density="comfortable"을 지정하면 기본 크기보다 여유 있는 컨트롤 높이를 사용합니다.'
        }
      >
        <Grid
          columns={{ base: 1, sm: 3 }}
          gap={6}
          alignItems="start"
          className="react-studio-size-grid"
        >
          {sizes.map((size) => (
            <div className="react-studio-example" key={size}>
              <h3 className="react-studio-example-title">
                {size.toUpperCase()}
              </h3>
              <div className="react-studio-row">
                <Chip interactive={false} density="comfortable" size={size}>
                  문서
                </Chip>
                <Chip
                  interactive={false}
                  density="comfortable"
                  rounded
                  variant="success"
                  size={size}
                >
                  완료
                </Chip>
                <Chip
                  interactive={false}
                  density="comfortable"
                  variant="secondary"
                  size={size}
                >
                  <Icon name="calendar" />
                  일정
                </Chip>
              </div>
            </div>
          ))}
        </Grid>
      </Section>
      <Section
        title="삭제 가능한 칩"
        description="선택된 값을 제거하고, 초기화로 다시 표시할 수 있습니다."
      >
        <div className="react-studio-row">
          {removable.map((name) => (
            <Chip
              key={name}
              rounded
              aria-label={`${name} 제거`}
              onClick={() =>
                setRemovable((current) =>
                  current.filter((item) => item !== name)
                )
              }
            >
              {name}
              <Icon name="close" />
            </Chip>
          ))}
          {!removable.length && (
            <p className="react-studio-caption" role="status">
              모든 칩을 제거했습니다.
            </p>
          )}
        </div>
        <div className="react-studio-row">
          <Button
            variant="outline"
            onClick={() => setRemovable(["프로젝트", "브랜드", "문서"])}
          >
            초기화
          </Button>
        </div>
      </Section>
      <Section
        title="아이콘이 있는 칩"
        description="아이콘은 분류의 의미를 보조하며 칩은 선택 상태를 유지합니다."
      >
        <div className="react-studio-row">
          <Chip
            aria-pressed={iconSelected}
            onClick={() => setIconSelected(!iconSelected)}
          >
            <Icon name="calendar" />
            일정 필터
          </Chip>
          <Chip
            aria-pressed={componentSelected}
            onClick={() => setComponentSelected(!componentSelected)}
          >
            <Icon name="grid" />
            컴포넌트
          </Chip>
        </div>
      </Section>
    </>
  );
}

export function ListDemos() {
  const [selected, setSelected] = React.useState("디자인 시스템");
  const items = [
    {
      name: "디자인 시스템",
      description: "공통 컴포넌트와 사용 기준",
      state: "진행 중",
    },
    {
      name: "브랜드 가이드",
      description: "시각 언어와 브랜드 원칙",
      state: "검토 중",
    },
    {
      name: "웹사이트 개선",
      description: "웹사이트 사용 경험 개선",
      state: "대기",
    },
    {
      name: "보관된 프로젝트",
      description: "현재 선택할 수 없는 프로젝트",
      state: "보관",
      disabled: true,
    },
  ];
  return (
    <>
      <Section
        title="기본 목록"
        description="정보의 제목과 보조 상태를 함께 읽을 수 있도록 배치합니다."
      >
        <ul className="simple-list">
          {items.slice(0, 3).map((item) => (
            <li key={item.name}>
              <span>{item.name}</span>
              <span className="list-state">{item.state}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section
        title="선택 목록"
        description="항목을 선택하면 현재 선택을 표시합니다. 사용할 수 없는 항목은 비활성으로 구분합니다."
      >
        <SelectableList aria-label="프로젝트 선택">
          {items.map((item) => (
            <SelectableListItem
              key={item.name}
              disabled={item.disabled}
              aria-pressed={selected === item.name}
              onClick={() => setSelected(item.name)}
            >
              <span>
                <strong>{item.name}</strong>
                <small>{item.description}</small>
              </span>
              <span className="list-state">{item.state}</span>
            </SelectableListItem>
          ))}
        </SelectableList>
        <p role="status" className="component-helper">
          선택: {selected}
        </p>
      </Section>
      <Section
        title="아이콘이 있는 목록"
        description="각 항목의 종류를 텍스트와 아이콘으로 함께 표시합니다."
      >
        <ul className="simple-list">
          <li>
            <span className="react-studio-icon-label">
              <Icon name="grid" />
              컴포넌트
            </span>
            <span>24개</span>
          </li>
          <li>
            <span className="react-studio-icon-label">
              <Icon name="calendar" />
              프로젝트 일정
            </span>
            <span>3개</span>
          </li>
        </ul>
      </Section>
    </>
  );
}

export function StepperDemos() {
  const [current, setCurrent] = React.useState(0);
  const steps = ["기본 정보", "팀원 초대", "확인"];
  return (
    <>
      <Section
        title="단계 진행"
        description="이전·다음 버튼으로 단계를 이동하며 현재 단계와 완료된 단계를 구분합니다."
      >
        <Stepper
          aria-label="프로젝트 생성 단계"
          steps={steps}
          currentStep={current}
        />
        <div className="step-panel">
          <strong>{steps[current]}</strong>
          <p>
            {current === 0
              ? "프로젝트 정보를 입력합니다."
              : current === 1
              ? "함께 작업할 팀원을 초대합니다."
              : "입력한 내용을 확인합니다."}
          </p>
        </div>
        <div className="react-studio-row">
          <Button
            variant="outline"
            disabled={current === 0}
            onClick={() => setCurrent(current - 1)}
          >
            이전
          </Button>
          <Button
            disabled={current === steps.length - 1}
            onClick={() => setCurrent(current + 1)}
          >
            다음
          </Button>
        </div>
      </Section>
      <Section
        title="아이콘이 있는 단계"
        description="단계 이름과 함께 아이콘을 표시합니다."
      >
        <Stepper
          aria-label="프로젝트 작업 단계"
          steps={[
            <span className="react-studio-icon-label">
              <Icon name="grid" />
              구성
            </span>,
            <span className="react-studio-icon-label">
              <Icon name="calendar" />
              일정
            </span>,
            <span className="react-studio-icon-label">
              <Icon name="check" />
              확인
            </span>,
          ]}
          currentStep={1}
        />
      </Section>
    </>
  );
}

export function MenuDemos() {
  const [feedback, setFeedback] = React.useState("");
  return (
    <>
      <Section
        title="작업 메뉴"
        description="관련 동작을 아이콘과 함께 메뉴에 묶습니다. 방향키로 이동하고 Enter로 선택하거나 Escape로 닫을 수 있습니다."
      >
        <div className="react-studio-row">
          <DropdownMenu
            trigger={<Button>더보기</Button>}
            label="작업 메뉴"
            onSelect={(value) => setFeedback(`${value} 동작을 선택했습니다.`)}
          >
            <DropdownMenuItem value="수정" icon={<Icon name="settings" />}>수정</DropdownMenuItem>
            <DropdownMenuItem value="복사" icon={<Icon name="copy" />}>복사</DropdownMenuItem>
            <DropdownMenuItem value="공유" disabled icon={<Icon name="link" />}>공유</DropdownMenuItem>
            <DropdownMenuItem value="삭제" icon={<Icon name="trash" />}>삭제</DropdownMenuItem>
          </DropdownMenu>
        </div>
        <p role="status" className="component-helper">
          {feedback}
        </p>
      </Section>
      <PopupAlignDemos kind="menu" />
    </>
  );
}

export function PopoverDemos() {
  const [open, setOpen] = React.useState(false),
    [description, setDescription] = React.useState(true),
    [status, setStatus] = React.useState(true),
    [message, setMessage] = React.useState("설명과 상태 표시 중");
  return (
    <>
      <Section
        title="설정 팝오버"
        description="현재 화면에서 간단한 설정을 바꾸고 적용 결과를 확인합니다."
      >
        <div className="react-studio-row">
          <Popover
            trigger={
              <Button variant="outline"><span className="react-studio-icon-label">
                <Icon name="settings" />
                표시 설정
              </span></Button>
            }
            label="표시 설정"
            open={open}
            onOpenChange={setOpen}
          >
            <div className="react-studio-popover-body">
              <div className="react-studio-popover-heading">
                <strong>표시 설정</strong>
                <p>목록에서 볼 정보를 선택하세요.</p>
              </div>
              <div className="react-studio-popover-options">
                <Checkbox
                  label="설명"
                  checked={description}
                  onChange={(event) => setDescription(event.target.checked)}
                />
                <Checkbox
                  label="상태"
                  checked={status}
                  onChange={(event) => setStatus(event.target.checked)}
                />
              </div>
              <Button
                onClick={() => {
                  const labels = [
                    description && "설명",
                    status && "상태",
                  ].filter(Boolean);
                  setMessage(
                    labels.length
                      ? `${labels.join("과 ")} 표시 중`
                      : "표시할 추가 정보가 없습니다."
                  );
                  setOpen(false);
                }}
              >
                적용
              </Button>
            </div>
          </Popover>
        </div>
        <p role="status" className="component-helper">
          {message}
        </p>
      </Section>
      <PopupAlignDemos />
    </>
  );
}

export { DrawerDemos } from "./drawer-demos";

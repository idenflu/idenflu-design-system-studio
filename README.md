# SWISS / MONO

선택한 디자인 시안을 구현한 HTML·CSS·JavaScript 프로토타입입니다.

`index.html`을 브라우저로 열거나, 프로젝트 폴더에서 다음 명령으로 실행하세요.

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

미리보기: http://127.0.0.1:4173

- 본문 Pretendard 14px / 행간 22px
- Primary `#4263CC`, 기본 보더는 중성 회색 `#C6C6CC`
- 버튼·입력창·색상칩 radius 0px
- 토글은 둥근 트랙과 원형 손잡이 유지
- 포커스는 밝은 안쪽 2px 테두리
- 프로필 입력·검증·저장 피드백 및 토글 동작
- 모바일·태블릿 반응형 지원

서버나 외부 서비스로 데이터를 보내지 않으며 새로고침하면 폼이 초기화됩니다.
폰트는 로컬 파일로 포함되어 있습니다. 라이선스: `assets/fonts/LICENSE.txt`.

# 시각 비교 기준

- 최초 검토 환경: macOS 27.0.1, Apple Silicon, Playwright 1.64.1
- 브라우저: Playwright Chromium revision 1248, headless, DPR 1
- 화면: 1080 × 1000, 라이트·다크, 저장소의 Pretendard WOFF2
- 대상: 기본·위험 아웃라인·비활성 버튼, 반전 배지, 도움말·오류 입력,
  선택·숫자·날짜·시간 입력, 데이터그리드

패키지와 Studio를 빌드한 뒤 저장소 루트에서 `npm run test:visual`을
실행합니다. `baselines/darwin/`의 2개 이미지는 위 환경에서 직접 검토한
기준입니다. Linux 기준과 CI 이미지 비교는 아직 추가하지 않았습니다.

의도한 변경은 `npm run test:visual -- --update-snapshots`로 생성하고,
이미지를 열어 라이트·다크를 모두 확인한 후 변경 사유와 함께 검토합니다.
다른 OS·브라우저 버전의 차이를 기존 기준에 자동으로 반영하지 않습니다.

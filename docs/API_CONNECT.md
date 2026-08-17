# Job Signal — Live API 연결 가이드

Job Signal의 공개 UI와 자동 동기화 파이프라인은 이미 연결 준비가 되어 있습니다. 실제 API 키가 들어오면 GitHub Actions가 30분마다 최신 활성 공고를 갱신하고 `data/history.json`에 시장 스냅샷을 누적합니다.

## 1. 사람인 — 1순위 LIVE 소스

공식 채용정보 API를 사용합니다.

- 공식 API: `https://oapi.saramin.co.kr/job-search`
- 이용신청/승인 후 access-key 발급 필요
- 현재 공식 안내 기준 1일 최대 500회 호출
- 한 요청당 `count` 최대 110
- Job Signal은 디자인 / PM·기획 / 마케팅 / 데이터 / 백엔드 5개 시장을 30분 주기로 조회하도록 설계
- 키는 브라우저 코드에 넣지 않고 GitHub Actions Secret `SARAMIN_ACCESS_KEY`로만 저장
- 사람인 제공 정보임을 서비스에 명확히 표기해야 함

### 키 발급 후 연결

GitHub repository → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

- Name: `SARAMIN_ACCESS_KEY`
- Secret: 발급받은 access-key

저장 후 `Actions` → `Live Job Market Sync` → `Run workflow`를 한 번 실행합니다. 정상 동작하면 이후 30분마다 자동 실행됩니다.

## 2. 잡코리아

공식 사이트에서 Open API 메뉴가 확인되지만, Job Signal 용도로 채용 데이터 자동 집계·분석이 허용되는 범위와 신청 조건을 별도 확인한 뒤 연결합니다. 승인되지 않은 상세 페이지 크롤링을 실시간 데이터 전략으로 사용하지 않습니다.

## 3. 원티드

원티드의 현재 개인정보 처리방침에 Open API 신청 절차가 존재함이 확인됩니다. 공개 채용공고에는 재전재·재배포·재가공 제한이 있을 수 있으므로, 승인된 Open API 계약 범위가 확인된 뒤 LIVE 소스로 연결합니다.

## 4. 리멤버 / 직행

현재 공개적으로 확인된 공식 채용 데이터 API가 없거나 Job Signal 용도의 이용 조건이 명확하지 않은 상태에서는 자동 크롤링을 사용하지 않습니다. 그 전까지는 원문 링크가 살아 있는 직접 검증 공고만 보강 데이터로 사용하고, UI에서 LIVE라고 표시하지 않습니다.

## 데이터 상태 원칙

- `LIVE`: 공식 API/허용된 자동 데이터 경로에서 최근 동기화된 데이터
- `VERIFIED`: 사람이 원문 공고를 직접 확인한 보강 데이터
- API 실패 시: 직전 정상 데이터(last-known-good)를 유지하고 0건으로 덮어쓰지 않음
- 마감일이 명시된 종료 공고는 활성 시장 집계에서 제외
- 동일 기업·동일 포지션은 중복 제거
- 실제 7일치 히스토리가 쌓이기 전에는 전주 대비 수치를 만들어내지 않음

## 자동화 파일

- `.github/workflows/live-sync.yml` — 30분 주기 동기화
- `scripts/sync-live.js` — 소스 조회, 중복 제거, 활성 공고 갱신, 히스토리 저장
- `data/jobs.json` — 현재 시장 데이터
- `data/history.json` — 시간축 시장 스냅샷
- `.github/workflows/qa.yml` — 배포 전 데이터/JS/API 구조 검증

## 공개 전 체크

1. API 이용약관 및 출처표기 준수
2. Secret이 저장소 파일/브라우저 번들에 노출되지 않았는지 확인
3. Live Sync 수동 실행 성공 확인
4. `data/jobs.json`의 `generated_at`, `live_sources`, `source_totals` 확인
5. 사이트에서 `LIVE INDEX`와 갱신 시각 확인
6. 원문 공고 링크 샘플 점검
7. 7일 후 Market Momentum 실제 변화값 확인

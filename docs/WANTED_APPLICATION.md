# 원티드 OpenAPI 신청 메모

공식 신청 페이지: https://openapi.wanted.jobs/apply/

## 신청 시 필요한 정보

- 이름
- 이메일
- 전화번호
- 사업자등록번호
- 회사명
- 서비스 URL
- 추천인(선택)

## Job Signal에서 우선 신청할 권한

- Jobs
- Search
- Stat

Companies / Tags는 실제 명세 확인 후 필요 시 추가합니다.

## 서비스 URL

https://seulkidesign-app.github.io/job-signal/

## 서비스 설명 초안

Job Signal은 국내 여러 채용 플랫폼에 흩어진 공개 채용공고를 직무별로 정리하고, 현재 채용량·요구 경력·채용 기업·시장 변화 추이를 보여주는 무료 채용시장 분석 서비스입니다. 개별 공고를 재판매하지 않고 원문 링크와 출처를 명확히 표시하며, 승인된 OpenAPI 범위 내에서만 데이터를 수집·표시합니다.

## 승인 후 연결

발급받은 값은 코드에 넣지 않고 아래 secret으로 저장합니다.

- WANTED_CLIENT_ID
- WANTED_CLIENT_SECRET

API 명세와 인증 방식은 승인 후 제공되는 공식 자료를 기준으로 구현합니다. 공개되지 않은 endpoint를 추측하거나 비공식 크롤링으로 대체하지 않습니다.

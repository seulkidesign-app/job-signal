const originalFetch = global.fetch;

function fakeJob(id, title, company, minExp) {
  return {
    id,
    active: 1,
    url: `https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=${id}`,
    company: { detail: { name: company } },
    position: {
      title,
      'job-mid-code': { name: '테스트 직군' },
      location: { name: '서울 > 강남구' },
      'experience-level': { min: minExp, max: null },
      'job-type': { name: '정규직' }
    },
    keyword: '테스트,QA',
    'posting-date': '2026-08-17',
    'expiration-date': '2026-12-31',
    'close-type': { code: '1', name: '접수마감일' }
  };
}

global.fetch = async function mockFetch(url, options) {
  const parsed = new URL(url);
  const q = parsed.searchParams.get('keywords');
  if (q === '데이터 분석') {
    throw new Error('simulated partial source failure');
  }
  const idMap = {
    '프로덕트 디자이너': '900001',
    '프로덕트 매니저': '900002',
    '마케팅': '900003',
    '백엔드 개발자': '900005'
  };
  const id = idMap[q] || '900099';
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        jobs: {
          total: 12,
          job: [fakeJob(id, `${q} QA 공고`, `QA ${q} 기업`, q === '마케팅' ? 5 : 1)]
        }
      };
    }
  };
};

process.on('exit', () => { global.fetch = originalFetch; });

const fs = require('fs');
const { spawnSync } = require('child_process');

const files = ['data/jobs.json', 'data/history.json', 'data/sources.json'];
const backups = Object.fromEntries(files.map(file => [file, fs.readFileSync(file, 'utf8')]));

try {
  const fixture = {
    generated_at: '2026-08-17T00:00:00.000Z',
    source_totals: { design: 10, pm: 11, marketing: 12, data: 77, backend: 13 },
    jobs: [
      {
        id: 'saramin-last-good-data',
        market_key: 'data',
        market_label: '데이터',
        title: '데이터 분석가',
        company: '직전정상기업',
        category: '데이터',
        location: '서울',
        exp_min: 3,
        exp_max: null,
        employment: '정규직',
        source: '사람인',
        url: 'https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=899999',
        posted_at: '2026-08-16',
        deadline: '2026-12-31',
        skills: ['SQL'],
        verified_at: '2026-08-17'
      }
    ]
  };
  fs.writeFileSync('data/jobs.json', JSON.stringify(fixture, null, 2));

  const result = spawnSync(process.execPath, ['-r', './scripts/mock-saramin-fetch.js', './scripts/sync-live.js'], {
    env: { ...process.env, SARAMIN_ACCESS_KEY: 'qa-test-key' },
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`sync test exited ${result.status}`);
  }

  const next = JSON.parse(fs.readFileSync('data/jobs.json', 'utf8'));
  if (next.partial_failures !== 1) throw new Error(`expected 1 partial failure, got ${next.partial_failures}`);
  if (!next.jobs.some(job => job.id === 'saramin-last-good-data')) {
    throw new Error('last-known-good failed-market job was not preserved');
  }
  if (Number(next.source_totals?.data) !== 77) {
    throw new Error('failed-market source total was not preserved');
  }
  if (!next.jobs.some(job => job.id === 'saramin-900001')) {
    throw new Error('successful market was not refreshed');
  }

  const sources = JSON.parse(fs.readFileSync('data/sources.json', 'utf8'));
  const saramin = sources.sources?.find(source => source.name === '사람인');
  if (!saramin) throw new Error('Saramin source state is missing');
  if (saramin.status !== 'live') throw new Error(`expected Saramin source to become live, got ${saramin.status}`);
  if (saramin.mode !== 'official_api') throw new Error(`expected official_api mode, got ${saramin.mode}`);
  if (!saramin.last_success_at) throw new Error('Saramin live state missing last_success_at');

  console.log('partial failure fallback and automatic LIVE transition verified');
} finally {
  for (const [file, content] of Object.entries(backups)) fs.writeFileSync(file, content);
}

const fs = require('fs');
const path = require('path');

function loadSnapshot() {
  const file = path.join(process.cwd(), 'data', 'jobs.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function text(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  return v.name || v.value || '';
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function cleanLocation(v) {
  return text(v).replace(/\s*>\s*/g, ' ').replace(/,/g, ' · ').trim();
}

function closeLabel(closeType, expirationDate) {
  const code = String(closeType?.code || '');
  if (code === '2') return '채용 시 마감';
  if (code === '3') return '상시채용';
  if (code === '4') return '수시채용';
  if (expirationDate) return String(expirationDate).slice(0, 10);
  return text(closeType) || '공고 확인';
}

function mapSaramin(job) {
  const pos = job.position || {};
  const exp = pos['experience-level'] || {};
  const keyword = typeof job.keyword === 'string' ? job.keyword.split(',').map(s => s.trim()).filter(Boolean).slice(0, 10) : [];
  return {
    id: `saramin-${job.id}`,
    title: text(pos.title),
    company: text(job.company?.detail?.name || job.company?.name) || '기업명 미표기',
    category: text(pos['job-mid-code']) || '기타',
    location: cleanLocation(pos.location) || '근무지 확인',
    exp_min: toNumber(exp.min),
    exp_max: toNumber(exp.max),
    employment: text(pos['job-type']) || '고용형태 확인',
    source: '사람인',
    url: job.url,
    posted_at: job['posting-date'] ? String(job['posting-date']).slice(0, 10) : null,
    deadline: closeLabel(job['close-type'], job['expiration-date']),
    skills: keyword,
    salary: text(job.salary) || null,
    verified_at: new Date().toISOString().slice(0, 10)
  };
}

function keyOf(j) {
  return `${j.company}|${j.title}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

function dedupe(jobs) {
  const seen = new Set();
  return jobs.filter(j => {
    const key = keyOf(j);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchSaramin(query) {
  const key = process.env.SARAMIN_ACCESS_KEY;
  if (!key) return { enabled: false, jobs: [], error: null };

  const params = new URLSearchParams({
    'access-key': key,
    keywords: query,
    count: '110',
    start: '0',
    sort: 'ud',
    fields: 'posting-date,expiration-date'
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://oapi.saramin.co.kr/job-search?${params}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Saramin HTTP ${response.status}`);
    const data = await response.json();
    if (data.result?.code) throw new Error(data.result.message || `Saramin error ${data.result.code}`);
    const list = data.jobs?.job;
    const jobs = Array.isArray(list) ? list : (list ? [list] : []);
    return { enabled: true, jobs: jobs.filter(j => Number(j.active) === 1).map(mapSaramin), error: null };
  } catch (error) {
    return { enabled: true, jobs: [], error: error.message || '사람인 API 오류' };
  } finally {
    clearTimeout(timer);
  }
}

function filterSnapshot(jobs, query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return jobs;
  const aliases = {
    '디자인': ['디자인','designer','ux','ui','figma'],
    '프로덕트 디자이너': ['프로덕트 디자이너','product designer','디자인'],
    'pm': ['pm','프로덕트 매니저','product manager','기획'],
    '프로덕트': ['프로덕트','product','pm','기획'],
    '기획': ['기획','pm','product manager'],
    '마케팅': ['마케팅','marketing','브랜드','growth','ua'],
    '데이터': ['데이터','data','analyst','analytics','engineer'],
    '백엔드': ['백엔드','backend','server','api'],
    '개발': ['백엔드','backend','개발','engineer']
  };
  const terms = aliases[q] || [q];
  return jobs.filter(j => {
    const hay = `${j.title} ${j.company} ${j.category} ${j.location} ${(j.skills || []).join(' ')}`.toLowerCase();
    return terms.some(t => hay.includes(t));
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const query = String(req.query?.q || '디자인').trim().slice(0, 80);
  const snapshot = loadSnapshot();
  const snapshotMatches = filterSnapshot(snapshot.jobs, query);
  const saramin = await fetchSaramin(query);
  const jobs = dedupe([...saramin.jobs, ...snapshotMatches]);

  res.status(200).json({
    query,
    mode: saramin.enabled && saramin.jobs.length ? 'live+snapshot' : 'snapshot',
    generated_at: new Date().toISOString(),
    snapshot_generated_at: snapshot.generated_at,
    coverage: snapshot.coverage,
    jobs,
    source_status: {
      saramin: saramin.enabled ? (saramin.error ? 'error' : 'live') : 'needs_key',
      snapshot: 'live'
    },
    warning: saramin.error || null
  });
};

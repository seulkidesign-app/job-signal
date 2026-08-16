const snapshot = require('../data/jobs.json');

const LIVE_QUERY_MAP = {
  '디자인': '프로덕트 디자이너',
  '프로덕트 디자이너': '프로덕트 디자이너',
  'product designer': '프로덕트 디자이너',
  'pm': '프로덕트 매니저',
  'pm·기획': '프로덕트 매니저',
  '기획': '프로덕트 매니저',
  '프로덕트': '프로덕트 매니저',
  '프로덕트 매니저': '프로덕트 매니저',
  'product manager': '프로덕트 매니저',
  '마케팅': '마케팅',
  'marketing': '마케팅',
  '데이터': '데이터 분석',
  '데이터 분석': '데이터 분석',
  'data': '데이터 분석',
  '백엔드': '백엔드 개발자',
  '백엔드 개발자': '백엔드 개발자',
  'backend': '백엔드 개발자',
  '개발': '백엔드 개발자'
};

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
  const keyword = typeof job.keyword === 'string'
    ? job.keyword.split(',').map(s => s.trim()).filter(Boolean).slice(0, 10)
    : [];

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
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function canonicalLiveQuery(query) {
  const q = String(query || '').toLowerCase().trim();
  if (LIVE_QUERY_MAP[q]) return LIVE_QUERY_MAP[q];
  if (/디자이|designer|\bux\b|\bui\b/.test(q)) return '프로덕트 디자이너';
  if (/프로덕트|product manager|\bpm\b|기획/.test(q)) return '프로덕트 매니저';
  if (/마케팅|marketing|growth|crm/.test(q)) return '마케팅';
  if (/데이터|data|analyst|analytics/.test(q)) return '데이터 분석';
  if (/백엔드|backend|server|spring/.test(q)) return '백엔드 개발자';
  return null;
}

async function fetchSaramin(query) {
  const key = process.env.SARAMIN_ACCESS_KEY;
  const liveQuery = canonicalLiveQuery(query);
  if (!key) return { enabled: false, jobs: [], total: null, error: null, query: liveQuery };
  if (!liveQuery) return { enabled: true, jobs: [], total: null, error: null, query: null };

  const params = new URLSearchParams({
    'access-key': key,
    keywords: liveQuery,
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
    const rows = Array.isArray(list) ? list : (list ? [list] : []);
    const jobs = rows.filter(j => Number(j.active) === 1).map(mapSaramin);
    const total = Number(data.jobs?.total);

    return {
      enabled: true,
      jobs,
      total: Number.isFinite(total) ? total : null,
      error: null,
      query: liveQuery
    };
  } catch (error) {
    return {
      enabled: true,
      jobs: [],
      total: null,
      error: error.message || '사람인 API 오류',
      query: liveQuery
    };
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
    'pm·기획': ['pm','프로덕트 매니저','product manager','기획'],
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
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const query = String(req.query?.q || '디자인').trim().slice(0, 80);
  const snapshotMatches = filterSnapshot(snapshot.jobs, query);
  const saramin = await fetchSaramin(query);
  const jobs = dedupe([...saramin.jobs, ...snapshotMatches]);

  res.status(200).json({
    query,
    mode: saramin.jobs.length ? 'live+snapshot' : 'snapshot',
    generated_at: new Date().toISOString(),
    snapshot_generated_at: snapshot.generated_at,
    coverage: snapshot.coverage,
    jobs,
    live_meta: {
      saramin_query: saramin.query,
      saramin_total: saramin.total,
      saramin_loaded: saramin.jobs.length,
      sample_cap: 110
    },
    source_status: {
      saramin: saramin.enabled ? (saramin.error ? 'error' : (saramin.query ? 'live' : 'unsupported_query')) : 'needs_key',
      snapshot: 'live'
    },
    warning: saramin.error || null
  });
};

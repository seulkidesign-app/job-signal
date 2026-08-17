const snapshot = require('../data/jobs.json');
const supplement = require('../data/verified-supplement.json');

const QUERY_ALIASES = {
  '디자인': ['디자인','designer','ux','ui','figma','product designer'],
  '프로덕트 디자이너': ['프로덕트 디자이너','product designer','디자인','ux','ui'],
  'pm': ['pm','프로덕트 매니저','product manager','기획'],
  'pm·기획': ['pm','프로덕트 매니저','product manager','기획'],
  '프로덕트': ['프로덕트','product','pm','기획','product manager'],
  '기획': ['기획','pm','product manager','프로덕트'],
  '마케팅': ['마케팅','marketing','브랜드','growth','ua','crm'],
  '데이터': ['데이터','data','analyst','analytics','data engineer'],
  '백엔드': ['백엔드','backend','server','api','spring','django'],
  '개발': ['개발','backend','백엔드','engineer'],
  'ai': ['ai','llm','rag','머신러닝']
};

function normalize(value = '') {
  return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function cleanTitle(title = '', company = '') {
  let value = String(title).trim();
  const c = String(company).trim();
  if (!c) return value;
  const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value.replace(new RegExp(`^\\[?${escaped}\\]?\\s*[-–—:]?\\s*`, 'i'), '').trim();
}

function dedupe(jobs) {
  const seen = new Set();
  return jobs.filter(job => {
    const key = normalize(`${job.company}|${cleanTitle(job.title, job.company)}`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseDay(value) {
  const match = String(value || '').match(/^\d{4}-\d{2}-\d{2}/);
  if (!match) return null;
  const date = new Date(`${match[0]}T23:59:59+09:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isExpired(job) {
  const deadline = parseDay(job.deadline);
  return deadline ? deadline.getTime() < Date.now() : false;
}

function marketKeyForQuery(query = '') {
  const q = normalize(query);
  if (/디자이|designer|\bux\b|\bui\b/.test(q)) return 'design';
  if (/프로덕트|product manager|\bpm\b|기획/.test(q)) return 'pm';
  if (/마케팅|marketing|growth|crm/.test(q)) return 'marketing';
  if (/데이터|data|analyst|analytics/.test(q)) return 'data';
  if (/백엔드|backend|server|spring|개발/.test(q)) return 'backend';
  return null;
}

function filterJobs(jobs, query) {
  const q = normalize(query);
  if (!q) return jobs;
  const terms = QUERY_ALIASES[q] || [q];
  return jobs.filter(job => {
    const hay = normalize(`${job.title} ${job.company} ${job.category} ${job.location} ${(job.skills || []).join(' ')}`);
    return terms.some(term => hay.includes(normalize(term)));
  });
}

module.exports = async function handler(req, res) {
  // The upstream recruiting APIs are intentionally NOT called here.
  // Live sources are ingested on a fixed schedule by GitHub Actions so public traffic
  // cannot exhaust provider quotas or make site reliability depend on an upstream request.
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const query = String(req.query?.q || '디자인').trim().slice(0, 80);
  const pool = dedupe([
    ...(snapshot.jobs || []),
    ...(supplement.jobs || [])
  ].filter(job => !isExpired(job)));
  const jobs = filterJobs(pool, query);
  const marketKey = marketKeyForQuery(query);
  const liveSources = Array.isArray(snapshot.live_sources) ? snapshot.live_sources : [];
  const hasSaraminLive = liveSources.includes('사람인');
  const saraminLoaded = jobs.filter(job => job.source === '사람인').length;
  const saraminTotal = marketKey && Number.isFinite(Number(snapshot.source_totals?.[marketKey]))
    ? Number(snapshot.source_totals[marketKey])
    : null;

  res.status(200).json({
    query,
    mode: liveSources.length ? 'scheduled-live' : 'snapshot',
    generated_at: snapshot.generated_at || supplement.generated_at || null,
    snapshot_generated_at: supplement.generated_at || snapshot.generated_at || null,
    snapshot_total: pool.length,
    coverage: snapshot.coverage || '검증된 공개 채용공고',
    jobs,
    live_sources: liveSources,
    sync_interval_minutes: Number(snapshot.sync_interval_minutes || 0) || null,
    source_totals: snapshot.source_totals || {},
    live_meta: {
      saramin_total: saraminTotal,
      saramin_loaded: saraminLoaded,
      sample_cap: 110
    },
    source_status: {
      saramin: hasSaraminLive ? 'scheduled_live' : 'needs_key',
      verified_snapshot: 'live'
    },
    warning: Number(snapshot.partial_failures || 0) > 0
      ? `${Number(snapshot.partial_failures)}개 직군에서 직전 정상 데이터를 유지 중입니다.`
      : null
  });
};

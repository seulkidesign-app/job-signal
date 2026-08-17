const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const JOBS_PATH = path.join(ROOT, 'data', 'jobs.json');
const SUPPLEMENT_PATH = path.join(ROOT, 'data', 'verified-supplement.json');
const HISTORY_PATH = path.join(ROOT, 'data', 'history.json');
const SOURCES_PATH = path.join(ROOT, 'data', 'sources.json');

const SEARCHES = [
  { key: 'design', label: '디자인', keywords: '프로덕트 디자이너' },
  { key: 'pm', label: 'PM·기획', keywords: '프로덕트 매니저' },
  { key: 'marketing', label: '마케팅', keywords: '마케팅' },
  { key: 'data', label: '데이터', keywords: '데이터 분석' },
  { key: 'backend', label: '백엔드', keywords: '백엔드 개발자' }
];

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
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

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[\[\](){}]/g, ' ')
    .replace(/[^0-9a-z가-힣+.#]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(title = '', company = '') {
  let value = String(title).trim();
  const c = String(company).trim();
  if (!c) return value;
  const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  value = value.replace(new RegExp(`^\\[?${escaped}\\]?\\s*[-–—:]?\\s*`, 'i'), '');
  return value.trim();
}

function dedupeKey(job) {
  return `${normalize(job.company)}|${normalize(cleanTitle(job.title, job.company))}`;
}

function dedupe(jobs) {
  const map = new Map();
  for (const job of jobs) {
    const key = dedupeKey(job);
    if (!key || key === '|') continue;
    const current = map.get(key);
    if (!current) {
      map.set(key, job);
      continue;
    }
    if (job.source === '사람인' && current.source !== '사람인') map.set(key, job);
  }
  return [...map.values()];
}

function parseDay(value) {
  const match = String(value || '').match(/^\d{4}-\d{2}-\d{2}/);
  if (!match) return null;
  const date = new Date(`${match[0]}T23:59:59+09:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isExpired(job) {
  const d = parseDay(job.deadline);
  return d ? d.getTime() < Date.now() : false;
}

function recentVerifiedSupplement(maxAgeHours = 72) {
  const supplement = readJson(SUPPLEMENT_PATH, { jobs: [] });
  const maxAge = maxAgeHours * 60 * 60 * 1000;
  return (supplement.jobs || []).filter(job => {
    if (isExpired(job)) return false;
    const verified = parseDay(job.verified_at);
    if (!verified) return false;
    return Date.now() - verified.getTime() <= maxAge;
  });
}

function closeLabel(closeType, expirationDate) {
  const code = String(closeType?.code || '');
  if (code === '2') return '채용 시 마감';
  if (code === '3') return '상시채용';
  if (code === '4') return '수시채용';
  if (expirationDate) return String(expirationDate).slice(0, 10);
  return text(closeType) || '공고 확인';
}

function mapSaramin(job, search) {
  const pos = job.position || {};
  const exp = pos['experience-level'] || {};
  const keywords = typeof job.keyword === 'string'
    ? job.keyword.split(',').map(s => s.trim()).filter(Boolean).slice(0, 16)
    : [];

  return {
    id: `saramin-${job.id}`,
    market_key: search.key,
    market_label: search.label,
    title: text(pos.title),
    company: text(job.company?.detail?.name || job.company?.name) || '기업명 미표기',
    category: search.label,
    location: text(pos.location).replace(/\s*>\s*/g, ' ').replace(/,/g, ' · ').trim() || '근무지 확인',
    exp_min: toNumber(exp.min),
    exp_max: toNumber(exp.max),
    employment: text(pos['job-type']) || '고용형태 확인',
    source: '사람인',
    url: job.url,
    posted_at: job['posting-date'] ? String(job['posting-date']).slice(0, 10) : null,
    deadline: closeLabel(job['close-type'], job['expiration-date']),
    skills: keywords,
    salary: text(job.salary) || null,
    read_count: toNumber(job['read-cnt']),
    apply_count: toNumber(job['apply-cnt']),
    verified_at: new Date().toISOString().slice(0, 10)
  };
}

async function fetchSaramin(search, accessKey) {
  const params = new URLSearchParams({
    'access-key': accessKey,
    keywords: search.keywords,
    count: '110',
    start: '0',
    sort: 'ud',
    fields: 'posting-date,expiration-date,count'
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`https://oapi.saramin.co.kr/job-search?${params}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Saramin HTTP ${response.status}`);
    const body = await response.json();
    if (body.result?.code) throw new Error(body.result.message || `Saramin error ${body.result.code}`);
    const rows = body.jobs?.job;
    const list = Array.isArray(rows) ? rows : (rows ? [rows] : []);
    const jobs = list.filter(job => Number(job.active) === 1).map(job => mapSaramin(job, search));
    return {
      search,
      total: Number.isFinite(Number(body.jobs?.total)) ? Number(body.jobs.total) : null,
      jobs
    };
  } finally {
    clearTimeout(timeout);
  }
}

function pct(n, d) {
  return d ? Math.round((n / d) * 1000) / 10 : 0;
}

function summarize(jobs, sourceTotals = {}) {
  const result = {};
  for (const search of SEARCHES) {
    const rows = jobs.filter(job => job.market_key === search.key || job.category === search.label);
    const junior = rows.filter(job => job.exp_min != null && Number(job.exp_min) <= 1).length;
    const senior = rows.filter(job => job.exp_min != null && Number(job.exp_min) >= 5).length;
    result[search.key] = {
      label: search.label,
      count: rows.length,
      total_found: Number.isFinite(Number(sourceTotals[search.key])) ? Number(sourceTotals[search.key]) : null,
      junior_share: pct(junior, rows.length),
      senior5_share: pct(senior, rows.length)
    };
  }
  return result;
}

function appendHistory(jobs, sourceTotals) {
  const history = readJson(HISTORY_PATH, { snapshots: [] });
  const snapshots = Array.isArray(history.snapshots) ? history.snapshots : [];
  const now = new Date().toISOString();
  snapshots.push({
    at: now,
    active_jobs: jobs.length,
    markets: summarize(jobs, sourceTotals),
    source_totals: sourceTotals
  });

  history.snapshots = snapshots.slice(-3000);
  history.updated_at = now;
  writeJson(HISTORY_PATH, history);
}

function markSaraminLive(now) {
  const data = readJson(SOURCES_PATH, { sources: [] });
  if (!Array.isArray(data.sources)) data.sources = [];
  const existing = data.sources.find(source => source.name === '사람인');
  const next = {
    name: '사람인',
    mode: 'official_api',
    automation: '30min',
    status: 'live',
    note: '공식 채용정보 API를 30분 간격으로 자동 동기화',
    last_success_at: now
  };
  if (existing) Object.assign(existing, next);
  else data.sources.unshift(next);
  data.updated_at = now;
  writeJson(SOURCES_PATH, data);
}

function previousMarketJobs(previous, search) {
  const jobs = Array.isArray(previous?.jobs) ? previous.jobs : [];
  return jobs.filter(job => {
    if (job.source !== '사람인') return false;
    if (job.market_key) return job.market_key === search.key;
    return job.category === search.label;
  }).filter(job => !isExpired(job));
}

async function main() {
  const accessKey = process.env.SARAMIN_ACCESS_KEY;
  if (!accessKey) {
    console.log('SARAMIN_ACCESS_KEY is not configured. Live sync skipped safely.');
    return;
  }

  const previous = readJson(JOBS_PATH, { jobs: [], source_totals: {} });
  const settled = await Promise.allSettled(SEARCHES.map(search => fetchSaramin(search, accessKey)));
  const failed = settled.filter(item => item.status === 'rejected');
  if (failed.length === settled.length) throw new Error('All live source queries failed. Existing dataset left untouched.');

  const liveResults = [];
  const preservedJobs = [];
  const sourceTotals = { ...(previous.source_totals || {}) };

  settled.forEach((item, index) => {
    const search = SEARCHES[index];
    if (item.status === 'fulfilled') {
      liveResults.push(item.value);
      sourceTotals[search.key] = item.value.total;
      return;
    }
    const fallback = previousMarketJobs(previous, search);
    preservedJobs.push(...fallback);
    console.warn(`${search.label} live query failed; preserving ${fallback.length} last-known-good jobs.`);
  });

  const liveJobs = liveResults.flatMap(result => result.jobs);
  const supplement = recentVerifiedSupplement(72).map(job => ({ ...job, market_key: job.market_key || null }));
  const jobs = dedupe([...liveJobs, ...preservedJobs, ...supplement]).filter(job => !isExpired(job));

  if (!jobs.length) throw new Error('Live sync produced zero active jobs. Existing dataset left untouched.');

  const now = new Date().toISOString();
  const payload = {
    generated_at: now,
    coverage: '사람인 실시간 API + 최근 72시간 내 직접 검증한 타 플랫폼 공개 공고',
    live_sources: ['사람인'],
    verified_sources: ['잡코리아', '원티드', '리멤버', '직행'],
    sync_interval_minutes: 30,
    source_totals: sourceTotals,
    partial_failures: failed.length,
    jobs
  };

  writeJson(JOBS_PATH, payload);
  appendHistory(jobs, sourceTotals);
  markSaraminLive(now);
  console.log(`Synced ${jobs.length} active jobs at ${now}`);
  if (failed.length) console.warn(`${failed.length} of ${settled.length} market queries failed; last-known-good data was preserved for failed markets.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
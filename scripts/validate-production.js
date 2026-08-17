const fs = require('fs');

const jobsData = JSON.parse(fs.readFileSync('data/jobs.json', 'utf8'));
const sourcesData = JSON.parse(fs.readFileSync('data/sources.json', 'utf8'));
const historyData = JSON.parse(fs.readFileSync('data/history.json', 'utf8'));

const REQUIRED_MARKETS = ['design', 'pm', 'marketing', 'data', 'backend'];
const LIVE_STALE_MS = 90 * 60 * 1000;

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
  return value.replace(new RegExp(`^\\[?${escaped}\\]?\\s*[-–—:]?\\s*`, 'i'), '').trim();
}

function dedupeKey(job) {
  return `${normalize(job.company)}|${normalize(cleanTitle(job.title, job.company))}`;
}

function strictDeadline(value) {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T23:59:59+09:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const jobs = Array.isArray(jobsData.jobs) ? jobsData.jobs : [];
assert(jobs.length > 0, 'data/jobs.json has no jobs');
assert(jobsData.generated_at, 'data/jobs.json missing generated_at');
assert(!Number.isNaN(new Date(jobsData.generated_at).getTime()), 'generated_at is invalid');

const ids = new Set();
const dedupeKeys = new Set();
for (const job of jobs) {
  assert(job.id && job.title && job.company && job.source && job.url, `invalid job: ${job.id || 'unknown'}`);
  assert(!ids.has(job.id), `duplicate job id: ${job.id}`);
  ids.add(job.id);

  const key = dedupeKey(job);
  assert(key !== '|', `empty dedupe key: ${job.id}`);
  assert(!dedupeKeys.has(key), `duplicate company/title pair: ${key}`);
  dedupeKeys.add(key);

  const deadline = strictDeadline(job.deadline);
  if (deadline) assert(deadline.getTime() >= Date.now(), `expired active job: ${job.id} (${job.deadline})`);

  let url;
  try { url = new URL(job.url); } catch { throw new Error(`invalid URL: ${job.id}`); }
  assert(['http:', 'https:'].includes(url.protocol), `unsafe URL protocol: ${job.id}`);
}

const liveSources = Array.isArray(jobsData.live_sources) ? jobsData.live_sources : [];
if (liveSources.length) {
  const age = Date.now() - new Date(jobsData.generated_at).getTime();
  assert(age <= LIVE_STALE_MS, `LIVE dataset is stale by ${Math.round(age / 60000)} minutes`);

  for (const market of REQUIRED_MARKETS) {
    const total = Number(jobsData.source_totals?.[market]);
    assert(Number.isFinite(total) && total >= 0, `LIVE market total missing/invalid: ${market}`);
  }

  if (liveSources.includes('사람인')) {
    assert(jobs.some(job => job.source === '사람인'), '사람인 marked LIVE but no 사람인 jobs exist');
    const source = (sourcesData.sources || []).find(item => item.name === '사람인');
    assert(source?.status === 'live', 'sources.json does not mark 사람인 live');
  }
}

assert(Array.isArray(historyData.snapshots), 'history.snapshots must be an array');
if (historyData.snapshots.length) {
  const latest = historyData.snapshots[historyData.snapshots.length - 1];
  assert(latest.at && latest.markets, 'latest history point is invalid');
}

console.log(`production data valid: ${jobs.length} active jobs, live sources: ${liveSources.join(', ') || 'none'}`);

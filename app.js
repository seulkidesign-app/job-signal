let allJobs = [];
let currentMatches = [];
let dataMode = 'snapshot';
let generatedAt = null;
let snapshotGeneratedAt = null;
let snapshotTotal = 0;
let liveMeta = {};

const QUERY_ALIASES = {
  '프로덕트': ['프로덕트','product','pm','기획','product manager'],
  '디자인': ['디자인','designer','ux','ui','figma','product designer'],
  '프로덕트 디자이너': ['프로덕트 디자이너','product designer','디자인','ux','ui'],
  'pm': ['pm','프로덕트 매니저','product manager','기획'],
  'pm·기획': ['pm','프로덕트 매니저','product manager','기획'],
  '기획': ['기획','pm','product manager','프로덕트'],
  '마케팅': ['마케팅','marketing','브랜드','growth','ua','crm'],
  '데이터': ['데이터','data','analyst','analytics','data engineer'],
  '백엔드': ['백엔드','backend','server','api','spring','django'],
  '개발': ['개발','backend','백엔드','engineer'],
  'ai': ['ai','llm','rag','머신러닝']
};

const els = Object.fromEntries([
  'searchForm','queryInput','dashboard','emptyState','loadingState','resultTitle','updatedAt','sourceCount',
  'matchCount','matchContext','remoteShare','seniorShare','freshShare','skillsList','locationsList','companiesList',
  'takeaway','copyInsight','jobsList','showingCount','toast','liveBadge','shareTop','coverageNote'
].map(id => [id, document.getElementById(id)]));

function normalize(v='') {
  return String(v).toLowerCase().replace(/\s+/g, ' ').trim();
}

function setState(name) {
  els.dashboard.classList.toggle('hidden', name !== 'dashboard');
  els.emptyState.classList.toggle('hidden', name !== 'empty');
  els.loadingState.classList.toggle('hidden', name !== 'loading');
}

function withTimeout(promise, ms = 8500) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

function parseStrictDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const date = new Date(`${value}T23:59:59+09:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isExpired(job) {
  const deadline = parseStrictDate(job.deadline);
  return deadline ? deadline.getTime() < Date.now() : false;
}

function dedupe(jobs) {
  const seen = new Set();
  return jobs.filter(job => {
    const key = normalize(`${job.company}|${job.title}`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchData(query) {
  try {
    const response = await withTimeout(fetch(`/api/jobs?q=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json' }
    }));
    if (!response.ok) throw new Error(`API ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.jobs)) throw new Error('invalid payload');

    dataMode = payload.mode || 'snapshot';
    generatedAt = payload.generated_at || null;
    snapshotGeneratedAt = payload.snapshot_generated_at || null;
    snapshotTotal = Number(payload.snapshot_total || 0);
    liveMeta = payload.live_meta || {};

    return dedupe(payload.jobs.filter(job => !isExpired(job)));
  } catch (apiError) {
    const response = await fetch('data/jobs.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('데이터를 불러오지 못했습니다.');
    const payload = await response.json();

    dataMode = 'snapshot';
    generatedAt = payload.generated_at || null;
    snapshotGeneratedAt = payload.generated_at || null;
    snapshotTotal = Array.isArray(payload.jobs) ? payload.jobs.length : 0;
    liveMeta = {};

    return dedupe(filterLocal((payload.jobs || []).filter(job => !isExpired(job)), query));
  }
}

function filterLocal(jobs, query) {
  const q = normalize(query);
  if (!q) return jobs;
  const terms = QUERY_ALIASES[q] || [q];
  return jobs.filter(job => {
    const hay = normalize(`${job.title} ${job.company} ${job.category} ${job.location} ${(job.skills || []).join(' ')}`);
    return terms.some(term => hay.includes(normalize(term)));
  });
}

async function analyze(rawQuery, { scroll = true } = {}) {
  const query = String(rawQuery || '').trim();
  if (!query) return;

  setState('loading');
  els.queryInput.value = query;

  const url = new URL(location.href);
  url.searchParams.set('q', query);
  history.replaceState({}, '', url);

  try {
    const jobs = await fetchData(query);
    allJobs = jobs;
    currentMatches = jobs;

    updateCoverageNote();
    updateBadge();

    if (!currentMatches.length) {
      setState('empty');
      return;
    }

    setState('dashboard');
    render(query, currentMatches);
    if (scroll) window.setTimeout(() => els.dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  } catch (error) {
    setState('empty');
    els.emptyState.querySelector('h2').textContent = '데이터를 불러오지 못했어요.';
    els.emptyState.querySelector('p').textContent = '잠시 후 다시 시도해 주세요. 검색 결과를 임의의 숫자로 대체하지 않습니다.';
    els.liveBadge.innerHTML = '<span class="pulse offline"></span>DATA ERROR';
  }
}

function updateBadge() {
  if (dataMode === 'live+snapshot') {
    els.liveBadge.innerHTML = '<span class="pulse"></span>LIVE + VERIFIED';
    return;
  }
  const date = snapshotGeneratedAt ? new Date(snapshotGeneratedAt) : null;
  const label = date && !Number.isNaN(date.getTime())
    ? `${date.getMonth() + 1}.${date.getDate()} VERIFIED`
    : 'VERIFIED BETA';
  els.liveBadge.innerHTML = `<span class="pulse"></span>${label}`;
}

function updateCoverageNote() {
  if (!els.coverageNote) return;
  const base = snapshotTotal ? `검증 스냅샷 ${snapshotTotal.toLocaleString('ko-KR')}개` : '검증 스냅샷';
  if (dataMode === 'live+snapshot' && liveMeta.saramin_loaded) {
    const totalText = Number.isFinite(Number(liveMeta.saramin_total))
      ? `사람인 검색결과 ${Number(liveMeta.saramin_total).toLocaleString('ko-KR')}건 중 최대 ${Number(liveMeta.sample_cap || 110)}건 표본`
      : `사람인 실시간 표본 ${Number(liveMeta.saramin_loaded).toLocaleString('ko-KR')}건`;
    els.coverageNote.textContent = `${base} + ${totalText}. 수치는 현재 불러온 표본 범위에서 계산합니다.`;
  } else {
    els.coverageNote.textContent = `${base}을 원문 링크와 함께 제공합니다. 수치는 현재 베타 인덱스 범위에서만 계산합니다.`;
  }
}

function percent(n, d) {
  return d ? Math.round((n / d) * 100) : 0;
}

function isJunior(job) {
  if (job.exp_min == null) return false;
  return Number(job.exp_min) <= 1;
}

function isExperienced(job) {
  return job.exp_min != null && Number(job.exp_min) >= 5;
}

function expLabel(job) {
  const min = job.exp_min;
  const max = job.exp_max;
  if (min == null && max == null) return '경력 정보 확인';
  if (Number(min) === 0 && max != null && Number(max) <= 1) return '신입';
  if (Number(min) === 0 && max == null) return '경력무관';
  if (min != null && max != null) return `경력 ${min}~${max}년`;
  if (min != null) return `경력 ${min}년+`;
  return `경력 ${max}년 이하`;
}

function deadlineLabel(job) {
  const d = parseStrictDate(job.deadline);
  if (d) return `마감 ${d.getMonth() + 1}.${d.getDate()}`;
  return job.deadline || '마감일 확인';
}

function verificationPlatform(job) {
  try {
    const host = new URL(job.url).hostname;
    if (host.includes('zighang.com')) return '직행';
    if (host.includes('wanted.co.kr')) return '원티드';
    if (host.includes('rememberapp.co.kr')) return '리멤버';
    if (host.includes('jobkorea.co.kr')) return '잡코리아';
    if (host.includes('saramin.co.kr')) return '사람인';
    return null;
  } catch {
    return null;
  }
}

function countBy(arr, fn) {
  const map = new Map();
  arr.forEach(item => {
    const key = fn(item);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function experienceBuckets(jobs) {
  const buckets = [
    ['신입·1년 이하', 0],
    ['2~4년', 0],
    ['5년 이상', 0],
    ['경력무관·기타', 0]
  ];

  jobs.forEach(job => {
    const min = job.exp_min;
    if (min == null) buckets[3][1]++;
    else if (Number(min) <= 1) buckets[0][1]++;
    else if (Number(min) <= 4) buckets[1][1]++;
    else buckets[2][1]++;
  });

  return buckets;
}

function render(query, jobs) {
  const total = jobs.length;
  const junior = jobs.filter(isJunior).length;
  const experienced = jobs.filter(isExperienced).length;
  const seoul = jobs.filter(j => normalize(j.location).includes('서울')).length;
  const sources = countBy(jobs, j => j.source).slice(0, 6);
  const companies = countBy(jobs, j => j.company).slice(0, 6);
  const exp = experienceBuckets(jobs);

  els.resultTitle.textContent = query;
  const stamp = generatedAt ? new Date(generatedAt) : new Date();
  els.updatedAt.textContent = `확인 ${stamp.toLocaleDateString('ko-KR', { month:'numeric', day:'numeric' })}`;

  if (dataMode === 'live+snapshot' && Number.isFinite(Number(liveMeta.saramin_total))) {
    els.sourceCount.textContent = `${total.toLocaleString('ko-KR')}개 분석 표본 · 사람인 ${Number(liveMeta.saramin_total).toLocaleString('ko-KR')}건 검색`;
  } else {
    els.sourceCount.textContent = `${total.toLocaleString('ko-KR')}개 검증 공고`;
  }

  els.matchCount.textContent = total.toLocaleString('ko-KR');
  els.matchContext.textContent = dataMode === 'live+snapshot' ? '실시간 + 검증 공고 표본' : '검증 스냅샷 기준';
  els.remoteShare.textContent = `${percent(junior, total)}%`;
  els.seniorShare.textContent = `${percent(experienced, total)}%`;
  els.freshShare.textContent = `${percent(seoul, total)}%`;

  els.skillsList.innerHTML = exp.map(([label, count]) => `
    <div class="bar-row">
      <span class="bar-label">${escapeHtml(label)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, percent(count, total))}%"></div></div>
      <span class="bar-value">${count}</span>
    </div>`).join('');

  els.locationsList.innerHTML = rankedRows(sources);
  els.companiesList.innerHTML = rankedRows(companies);
  els.takeaway.innerHTML = buildTakeaway(query, { total, junior, experienced, seoul, sources });

  const sorted = [...jobs].sort((a, b) => {
    const ad = a.posted_at ? new Date(a.posted_at).getTime() : 0;
    const bd = b.posted_at ? new Date(b.posted_at).getTime() : 0;
    return bd - ad;
  });

  els.showingCount.textContent = `${sorted.length}개 표시`;
  els.jobsList.innerHTML = sorted.map(job => {
    const via = verificationPlatform(job);
    const sourceTag = `<span class="tag">출처 ${escapeHtml(job.source || '공개공고')}</span>`;
    const viaTag = via && via !== job.source ? `<span class="tag tag-muted">확인 ${escapeHtml(via)}</span>` : '';
    return `
      <a class="job-row" href="${safeUrl(job.url)}" target="_blank" rel="noreferrer">
        <div class="job-title">${escapeHtml(job.title)}<span class="open-arrow">↗</span></div>
        <div class="job-company">${escapeHtml(job.company)}</div>
        <div class="job-location">${escapeHtml(job.location)}</div>
        <div class="job-tags">
          ${sourceTag}
          ${viaTag}
          <span class="tag">${escapeHtml(expLabel(job))}</span>
          <span class="tag">${escapeHtml(deadlineLabel(job))}</span>
        </div>
      </a>`;
  }).join('');
}

function buildTakeaway(query, s) {
  const juniorPct = percent(s.junior, s.total);
  const expPct = percent(s.experienced, s.total);
  const seoulPct = percent(s.seoul, s.total);
  const topSource = s.sources[0]?.[0];

  const bits = [];
  bits.push(`<strong>${escapeHtml(query)}</strong> 관련 공고 <strong>${s.total}개</strong>를 현재 분석 표본에서 확인했어요.`);
  if (s.junior > 0) bits.push(`신입·1년 이하 진입 가능 공고는 <strong>${juniorPct}%</strong>입니다.`);
  else bits.push('현재 표본에서는 신입·1년 이하 공고가 보이지 않습니다.');
  bits.push(`최소 5년 이상을 요구하는 공고는 <strong>${expPct}%</strong>, 서울 근무 공고는 <strong>${seoulPct}%</strong>입니다.`);
  if (topSource) bits.push(`가장 많이 확인된 원천은 <strong>${escapeHtml(topSource)}</strong>입니다.`);
  return bits.join(' ');
}

function rankedRows(items) {
  if (!items.length) return '<li><span class="rank-no">—</span><span>표시할 데이터 없음</span><span></span></li>';
  return items.map(([label, count], i) => `
    <li>
      <span class="rank-no">${String(i + 1).padStart(2, '0')}</span>
      <span>${escapeHtml(label)}</span>
      <span class="rank-count">${count}</span>
    </li>`).join('');
}

function linkedinText() {
  const q = els.resultTitle.textContent;
  const total = currentMatches.length;
  const junior = currentMatches.filter(isJunior).length;
  const experienced = currentMatches.filter(isExperienced).length;
  const topSources = countBy(currentMatches, j => j.source).slice(0, 3).map(([s]) => s);

  return `국내 “${q}” 채용공고를 한 번에 비교해봤습니다.\n\n현재 Job Signal 분석 표본 ${total}개\n• 신입·1년 이하 진입 가능 ${percent(junior, total)}%\n• 최소 5년 이상 요구 ${percent(experienced, total)}%\n• 확인된 원천: ${topSources.join(', ')}\n\n플랫폼마다 흩어진 채용공고를 ‘목록’이 아니라 시장 신호로 읽어보는 Job Signal을 만들고 있습니다.\n\n※ 현재는 테크·디지털 5직군 중심 베타이며, 연결된 데이터 범위 안에서 계산한 수치입니다.\n\n${location.href}\n\n#채용 #커리어 #취업 #데이터 #JobSignal`;
}

function escapeHtml(value='') {
  return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
}

function safeUrl(value='') {
  try {
    const url = new URL(value, location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
  } catch {
    return '#';
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('복사했어요');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('복사했어요');
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  window.setTimeout(() => els.toast.classList.remove('show'), 1800);
}

els.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  analyze(els.queryInput.value);
});

document.querySelectorAll('[data-query]').forEach(btn => {
  btn.addEventListener('click', () => analyze(btn.dataset.query));
});

els.copyInsight.addEventListener('click', () => copyText(linkedinText()));

els.shareTop.addEventListener('click', async () => {
  const shareData = {
    title: 'Job Signal — 국내 채용시장 베타 인덱스',
    text: '플랫폼마다 흩어진 국내 채용공고를 시장 신호로 비교해보세요.',
    url: location.href
  };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch {}
  } else {
    await copyText(location.href);
  }
});

const initialQuery = new URLSearchParams(location.search).get('q') || '디자인';
analyze(initialQuery, { scroll: false });

// Job Signal — Korea market prototype
// 현재는 UX 검증용 샘플 데이터입니다. 실제 서비스에서는 공식 API/허용된 데이터 소스로 교체합니다.

const PROTOTYPE_JOBS = [
  { title:'시니어 프로덕트 디자이너', company_name:'샘플테크', location:'서울 강남구', remote:true, tags:['Figma','UX','프로덕트','리서치'], created_at:'2026-08-16', url:'#', description:'프로덕트 디자인, 사용자 리서치, 프로토타이핑, 디자인 시스템, 데이터 기반 개선' },
  { title:'프로덕트 디자이너', company_name:'샘플커머스', location:'서울 성동구', remote:false, tags:['Figma','UX','UI','데이터'], created_at:'2026-08-15', url:'#', description:'커머스 UX/UI 디자인, Figma, 사용자 데이터 분석, A/B 테스트, 디자인 시스템' },
  { title:'주니어 UX/UI 디자이너', company_name:'샘플핀테크', location:'서울 영등포구', remote:true, tags:['Figma','UX','UI','프로토타이핑'], created_at:'2026-08-14', url:'#', description:'UX/UI 디자인, 프로토타이핑, 사용자 리서치, Figma' },
  { title:'Product Manager', company_name:'샘플AI', location:'서울 서초구', remote:true, tags:['Product','AI','데이터','전략'], created_at:'2026-08-16', url:'#', description:'AI 제품 전략, 로드맵, 사용자 리서치, 데이터 분석, GTM' },
  { title:'서비스 기획자', company_name:'샘플플랫폼', location:'경기 성남시', remote:false, tags:['프로덕트','기획','데이터','리서치'], created_at:'2026-08-13', url:'#', description:'서비스 기획, 데이터 분석, 사용자 리서치, 정책 설계, 프로젝트 관리' },
  { title:'그로스 마케팅 매니저', company_name:'샘플브랜드', location:'서울 마포구', remote:true, tags:['마케팅','Growth','Analytics','CRM'], created_at:'2026-08-15', url:'#', description:'그로스 마케팅, CRM, 퍼포먼스 마케팅, 데이터 분석, 실험 설계' },
  { title:'콘텐츠 마케터', company_name:'샘플콘텐츠', location:'서울 용산구', remote:false, tags:['마케팅','Content','SEO','AI'], created_at:'2026-08-11', url:'#', description:'콘텐츠 마케팅, SEO, 소셜 콘텐츠, 생성형 AI 활용, 성과 분석' },
  { title:'데이터 분석가', company_name:'샘플리테일', location:'서울 중구', remote:false, tags:['SQL','Python','Tableau','데이터'], created_at:'2026-08-16', url:'#', description:'SQL, Python, Tableau를 활용한 비즈니스 데이터 분석과 대시보드 구축' },
  { title:'데이터 사이언티스트', company_name:'샘플모빌리티', location:'경기 성남시', remote:true, tags:['Python','SQL','ML','AI'], created_at:'2026-08-12', url:'#', description:'Python, SQL, 머신러닝, 추천 시스템, 데이터 파이프라인' },
  { title:'백엔드 개발자', company_name:'샘플SaaS', location:'서울 강남구', remote:true, tags:['Java','Spring','AWS','SQL'], created_at:'2026-08-16', url:'#', description:'Java, Spring Boot, AWS, SQL, API 개발, 클라우드 서비스 운영' },
  { title:'프론트엔드 개발자', company_name:'샘플커머스', location:'서울 성동구', remote:false, tags:['React','TypeScript','JavaScript'], created_at:'2026-08-15', url:'#', description:'React, TypeScript, JavaScript 기반 웹 서비스 개발 및 디자인 시스템 협업' },
  { title:'AI 엔지니어', company_name:'샘플AI', location:'서울 서초구', remote:true, tags:['AI','LLM','Python','RAG'], created_at:'2026-08-14', url:'#', description:'LLM, RAG, Python, 모델 평가, AI 서비스 개발' },
  { title:'B2B 세일즈 매니저', company_name:'샘플SaaS', location:'서울 강남구', remote:false, tags:['Sales','B2B','CRM','SaaS'], created_at:'2026-08-10', url:'#', description:'B2B 세일즈, SaaS, CRM, 파이프라인 관리, 엔터프라이즈 영업' },
  { title:'브랜드 디자이너', company_name:'샘플브랜드', location:'서울 마포구', remote:false, tags:['Brand','Figma','Adobe','디자인'], created_at:'2026-08-09', url:'#', description:'브랜드 디자인, 캠페인, Figma, Adobe, 웹 콘텐츠 디자인' },
  { title:'프로덕트 오퍼레이션 매니저', company_name:'샘플플랫폼', location:'서울 송파구', remote:true, tags:['Product','Operations','Analytics'], created_at:'2026-08-16', url:'#', description:'프로덕트 운영, 데이터 분석, 로드맵 프로세스, 사용자 피드백 운영' },
  { title:'CRM 마케팅 매니저', company_name:'샘플리테일', location:'서울 중구', remote:true, tags:['CRM','마케팅','Analytics','Growth'], created_at:'2026-08-12', url:'#', description:'CRM, 라이프사이클 마케팅, 리텐션, 실험, 데이터 분석' },
  { title:'UX 리서처', company_name:'샘플핀테크', location:'서울 영등포구', remote:true, tags:['Research','UX','데이터'], created_at:'2026-08-13', url:'#', description:'사용자 인터뷰, 사용성 테스트, 정성·정량 리서치, 인사이트 도출' },
  { title:'시니어 백엔드 엔지니어', company_name:'샘플모빌리티', location:'경기 성남시', remote:false, tags:['Kotlin','AWS','Docker','SQL'], created_at:'2026-08-08', url:'#', description:'Kotlin, AWS, Docker, SQL, 분산 시스템, API 설계' }
];

const SKILLS = [
  'ai','llm','rag','machine learning','머신러닝','python','sql','figma','리서치','research','analytics','데이터','javascript','typescript','react','java','spring','kotlin','aws','docker','seo','crm','content','콘텐츠','마케팅','marketing','product','프로덕트','전략','strategy','프로토타이핑','design system','디자인 시스템','ux','ui','growth','sales','b2b','saas','tableau','adobe'
];

const QUERY_ALIASES = {
  '프로덕트':['product','프로덕트','서비스 기획','기획'],
  '디자인':['design','디자인','ux','ui','figma'],
  '마케팅':['marketing','마케팅','crm','growth','콘텐츠'],
  '데이터':['data','데이터','sql','analytics','분석'],
  '개발':['개발','engineer','backend','frontend','백엔드','프론트엔드','java','react'],
  'ai':['ai','llm','rag','머신러닝','machine learning'],
  '세일즈':['sales','세일즈','영업','b2b']
};

let allJobs = [];
let currentMatches = [];

const els = Object.fromEntries([
  'searchForm','queryInput','dashboard','emptyState','loadingState','resultTitle','updatedAt','sourceCount',
  'matchCount','matchContext','remoteShare','seniorShare','freshShare','skillsList','locationsList','companiesList',
  'takeaway','copyInsight','jobsList','showingCount','toast','liveBadge','shareTop'
].map(id => [id, document.getElementById(id)]));

function normalize(str='') {
  return String(str).toLowerCase().replace(/\s+/g,' ').trim();
}

function getSearchTokens(query) {
  const q = normalize(query);
  const aliases = QUERY_ALIASES[q] || [q];
  return [...new Set([q, ...aliases.map(normalize)])];
}

function loadJobs() {
  setState('loading');
  allJobs = PROTOTYPE_JOBS;
  els.liveBadge.innerHTML = '<span class="pulse offline"></span>PROTOTYPE DATA';
  const initial = new URLSearchParams(location.search).get('q') || '프로덕트';
  els.queryInput.value = initial;
  window.setTimeout(() => analyze(initial), 180);
}

function setState(name) {
  els.dashboard.classList.toggle('hidden', name !== 'dashboard');
  els.emptyState.classList.toggle('hidden', name !== 'empty');
  els.loadingState.classList.toggle('hidden', name !== 'loading');
}

function analyze(rawQuery) {
  const query = rawQuery.trim();
  if (!query) return;
  const tokens = getSearchTokens(query);

  currentMatches = allJobs.filter(job => {
    const hay = normalize(`${job.title} ${job.company_name} ${job.location} ${job.tags.join(' ')} ${job.description}`);
    return tokens.some(token => hay.includes(token));
  });

  const url = new URL(location.href);
  url.searchParams.set('q', query);
  history.replaceState({}, '', url);

  if (!currentMatches.length) {
    setState('empty');
    return;
  }

  setState('dashboard');
  render(query, currentMatches);
  window.setTimeout(() => els.dashboard.scrollIntoView({ behavior:'smooth', block:'start' }), 50);
}

function percent(n, d) { return d ? Math.round((n / d) * 100) : 0; }
function isSenior(title='') {
  return /(senior|sr\.?|lead|principal|staff|head|director|vp|chief|시니어|리드|팀장|실장|책임|수석)/i.test(title);
}
function daysAgo(dateString) {
  if (!dateString) return 999;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 999;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}
function countBy(arr, fn) {
  const map = new Map();
  arr.forEach(item => {
    const key = fn(item);
    if (key) map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].sort((a,b) => b[1] - a[1]);
}

function getTopSkills(jobs) {
  const counts = new Map();
  jobs.forEach(job => {
    const text = normalize(`${job.title} ${job.tags.join(' ')} ${job.description}`);
    const unique = new Set();
    SKILLS.forEach(skill => {
      if (text.includes(normalize(skill))) unique.add(skill);
    });
    unique.forEach(skill => counts.set(skill, (counts.get(skill) || 0) + 1));
  });
  return [...counts.entries()].sort((a,b) => b[1] - a[1]).slice(0,6);
}

function render(query, jobs) {
  const total = jobs.length;
  const remote = jobs.filter(j => j.remote).length;
  const senior = jobs.filter(j => isSenior(j.title)).length;
  const fresh = jobs.filter(j => daysAgo(j.created_at) <= 7).length;
  const skills = getTopSkills(jobs);
  const locations = countBy(jobs, j => j.location).slice(0,6);
  const companies = countBy(jobs, j => j.company_name).slice(0,6);

  els.resultTitle.textContent = query;
  els.updatedAt.textContent = `업데이트 ${new Date().toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'})}`;
  els.sourceCount.textContent = `${allJobs.length.toLocaleString('ko-KR')}개 샘플 공고 분석`;
  els.matchCount.textContent = total.toLocaleString('ko-KR');
  els.matchContext.textContent = '프로토타입 데이터 기준';
  els.remoteShare.textContent = `${percent(remote,total)}%`;
  els.seniorShare.textContent = `${percent(senior,total)}%`;
  els.freshShare.textContent = `${percent(fresh,total)}%`;

  els.skillsList.innerHTML = skills.length ? skills.map(([skill,count]) => `
    <div class="bar-row">
      <span class="bar-label">${escapeHtml(skill)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(5, percent(count,total))}%"></div></div>
      <span class="bar-value">${percent(count,total)}%</span>
    </div>`).join('') : '<p class="panel-note" style="text-align:left">반복해서 등장하는 스킬이 아직 충분하지 않아요.</p>';

  els.locationsList.innerHTML = rankedRows(locations);
  els.companiesList.innerHTML = rankedRows(companies);
  els.takeaway.innerHTML = buildTakeaway(query, {total, remote, senior, fresh, skills});

  const sorted = [...jobs].sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0,12);
  els.showingCount.textContent = `${total}개 중 ${sorted.length}개 표시`;
  els.jobsList.innerHTML = sorted.map(job => `
    <div class="job-row">
      <div class="job-title">${escapeHtml(job.title)}</div>
      <div class="job-company">${escapeHtml(job.company_name)}</div>
      <div class="job-location">${escapeHtml(job.location)}</div>
      <div class="job-tags">
        ${job.remote ? '<span class="tag">재택 가능</span>' : ''}
        ${isSenior(job.title) ? '<span class="tag">경력직</span>' : ''}
        <span class="tag">SAMPLE</span>
      </div>
    </div>`).join('');
}

function buildTakeaway(query, s) {
  const remotePct = percent(s.remote,s.total);
  const seniorPct = percent(s.senior,s.total);
  const freshPct = percent(s.fresh,s.total);
  const topSkill = s.skills[0]?.[0];
  const bits = [`<strong>${escapeHtml(query)}</strong> 관련 샘플 공고 <strong>${s.total}개</strong>를 찾았습니다.`];

  if (remotePct >= 50) bits.push(`재택·원격 가능 공고가 <strong>${remotePct}%</strong>로 비교적 높은 편입니다.`);
  else if (remotePct > 0) bits.push(`재택·원격 가능 공고는 <strong>${remotePct}%</strong>입니다.`);
  else bits.push('재택·원격 가능 공고는 현재 샘플에서 확인되지 않았습니다.');

  if (seniorPct >= 40) bits.push(`경력직 성격의 타이틀이 <strong>${seniorPct}%</strong>로 강하게 나타납니다.`);
  else bits.push(`경력직 성격의 타이틀은 <strong>${seniorPct}%</strong>입니다.`);

  if (topSkill) bits.push(`가장 반복적으로 등장하는 스킬 신호는 <strong>${escapeHtml(topSkill)}</strong>입니다.`);
  if (freshPct >= 40) bits.push(`최근 7일 등록 비중은 <strong>${freshPct}%</strong>입니다.`);
  return bits.join(' ');
}

function rankedRows(items) {
  if (!items.length) return '<li><span class="rank-no">—</span><span>뚜렷한 신호 없음</span><span></span></li>';
  return items.map(([label,count], i) => `<li><span class="rank-no">0${i+1}</span><span>${escapeHtml(label)}</span><span class="rank-count">${count}</span></li>`).join('');
}

function linkedinText() {
  const q = els.resultTitle.textContent;
  const total = currentMatches.length;
  const remote = currentMatches.filter(j => j.remote).length;
  const senior = currentMatches.filter(j => isSenior(j.title)).length;
  const skills = getTopSkills(currentMatches).slice(0,3).map(x => x[0]);

  return `한국 채용시장을 데이터로 보면 어떨까?\n\nJob Signal 프로토타입에서 ‘${q}’ 관련 데이터를 살펴봤습니다.\n\n• 검색 공고 ${total}개\n• 재택·원격 ${percent(remote,total)}%\n• 경력직 성격의 타이틀 ${percent(senior,total)}%\n${skills.length ? `• 반복 스킬: ${skills.join(', ')}` : ''}\n\n지금은 UX 검증용 프로토타입이고, 다음 단계에서 사람인·잡코리아·원티드·리멤버·직행 등 국내 채용 데이터 소스를 연결하려고 합니다.\n\n#채용 #취업 #이직 #데이터 #사이드프로젝트`;
}

function escapeHtml(value='') {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('복사했어요');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
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
  btn.addEventListener('click', () => {
    els.queryInput.value = btn.dataset.query;
    analyze(btn.dataset.query);
  });
});

els.copyInsight.addEventListener('click', () => copyText(linkedinText()));

els.shareTop.addEventListener('click', async () => {
  const shareData = {
    title:'Job Signal — 국내 채용시장을 한눈에',
    text:'흩어진 국내 채용공고를 시장 데이터로 읽는 Job Signal',
    url:location.href
  };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch {}
  } else {
    await copyText(location.href);
  }
});

loadJobs();

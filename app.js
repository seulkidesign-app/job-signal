const API_URLS = [
  'https://www.arbeitnow.com/api/job-board-api',
  'https://www.arbeitnow.co.uk/api/job-board-api'
];

// Fallback keeps the prototype usable if a public API blocks a local/file request.
// All numbers shown in fallback mode are clearly labeled as demo data in the UI.
const FALLBACK_JOBS = [
  { title:'Senior Product Designer', company_name:'Northstar Labs', location:'Berlin', remote:true, tags:['Figma','Product','UX'], created_at:'2026-08-15', url:'#', description:'Lead product design, research, prototyping, design systems and analytics. Work with AI product teams.' },
  { title:'Growth Marketing Manager', company_name:'Metric House', location:'London', remote:true, tags:['Marketing','Analytics','SEO'], created_at:'2026-08-14', url:'#', description:'Own growth marketing, SEO, paid media, content, analytics, experiments and CRM.' },
  { title:'Data Analyst', company_name:'Orbit Commerce', location:'Munich', remote:false, tags:['SQL','Python','Tableau'], created_at:'2026-08-13', url:'#', description:'Analyze product and business data with SQL, Python, dashboards and experimentation.' },
  { title:'Product Manager — AI', company_name:'Mosaic Systems', location:'Remote', remote:true, tags:['AI','Product','Strategy'], created_at:'2026-08-12', url:'#', description:'Own AI product strategy, roadmap, customer research, analytics and go-to-market.' },
  { title:'UX Designer', company_name:'Public Works Digital', location:'Hamburg', remote:false, tags:['Figma','Research','Accessibility'], created_at:'2026-08-11', url:'#', description:'UX design, Figma, user research, accessibility, prototyping and design systems.' },
  { title:'Senior Backend Engineer', company_name:'Cloudsmith', location:'London', remote:true, tags:['Python','AWS','SQL'], created_at:'2026-08-10', url:'#', description:'Python, AWS, APIs, SQL, Docker and distributed systems. AI platform experience useful.' },
  { title:'Sales Development Representative', company_name:'Relay AI', location:'Manchester', remote:true, tags:['Sales','CRM','AI'], created_at:'2026-08-09', url:'#', description:'B2B sales, CRM, outbound, pipeline management and AI productivity tools.' },
  { title:'Head of Product Design', company_name:'Brightline', location:'Berlin', remote:false, tags:['Leadership','Figma','Strategy'], created_at:'2026-08-08', url:'#', description:'Lead product design, strategy, research, design system and cross-functional teams.' },
  { title:'Content Marketing Specialist', company_name:'Signalframe', location:'Remote', remote:true, tags:['Content','SEO','AI'], created_at:'2026-08-15', url:'#', description:'Content marketing, SEO, social, AI-assisted workflows and analytics.' },
  { title:'Machine Learning Engineer', company_name:'Vector Works', location:'Cambridge', remote:false, tags:['Python','ML','AI'], created_at:'2026-08-14', url:'#', description:'Python, machine learning, LLM, NLP, data pipelines, AWS and Docker.' },
  { title:'Junior Product Designer', company_name:'Pebble', location:'Leeds', remote:true, tags:['Figma','UX','Prototyping'], created_at:'2026-08-13', url:'#', description:'Junior product designer. Figma, UX, prototyping, research and collaboration.' },
  { title:'Product Marketing Manager', company_name:'Atlas Finance', location:'Frankfurt', remote:false, tags:['Marketing','Product','Research'], created_at:'2026-08-12', url:'#', description:'Product marketing, positioning, research, GTM, analytics, CRM and sales enablement.' },
  { title:'Senior Data Scientist', company_name:'Green Grid', location:'Berlin', remote:true, tags:['Python','SQL','ML'], created_at:'2026-08-09', url:'#', description:'Senior data science role using Python, SQL, machine learning, analytics and cloud.' },
  { title:'Account Executive', company_name:'SaaS Foundry', location:'Remote', remote:true, tags:['Sales','CRM','SaaS'], created_at:'2026-08-15', url:'#', description:'SaaS sales, CRM, enterprise pipeline, demos, negotiation and forecasting.' },
  { title:'Design Systems Designer', company_name:'Interface Co', location:'London', remote:true, tags:['Figma','Design System','Accessibility'], created_at:'2026-08-14', url:'#', description:'Figma, design systems, accessibility, tokens, prototyping and frontend collaboration.' },
  { title:'Marketing Data Analyst', company_name:'Northstar Labs', location:'Berlin', remote:false, tags:['SQL','Analytics','Marketing'], created_at:'2026-08-11', url:'#', description:'Marketing analytics, SQL, Tableau, CRM, experimentation and attribution.' },
  { title:'AI Research Engineer', company_name:'Mosaic Systems', location:'London', remote:true, tags:['AI','Python','LLM'], created_at:'2026-08-10', url:'#', description:'LLM research, Python, NLP, machine learning, evaluation, RAG and data.' },
  { title:'Product Operations Manager', company_name:'Brightline', location:'Remote', remote:true, tags:['Product','Operations','Analytics'], created_at:'2026-08-15', url:'#', description:'Product operations, analytics, roadmap processes, research ops and stakeholder management.' },
  { title:'Brand Designer', company_name:'Metric House', location:'London', remote:false, tags:['Brand','Figma','Adobe'], created_at:'2026-08-08', url:'#', description:'Brand identity, Figma, Adobe Creative Suite, campaigns and web design.' },
  { title:'Senior CRM Manager', company_name:'Orbit Commerce', location:'Munich', remote:true, tags:['CRM','Marketing','Analytics'], created_at:'2026-08-07', url:'#', description:'Senior CRM, lifecycle marketing, retention, analytics, experimentation and automation.' }
];

const SKILLS = [
  'ai','llm','machine learning','python','sql','figma','research','analytics','data','javascript','typescript','react','aws','docker','kubernetes','seo','crm','salesforce','content','marketing','product','strategy','prototyping','design system','accessibility','tableau','power bi','excel','java','go','ruby','php','figjam','user research','experimentation','growth','sales','b2b','saas','nlp','rag'
];

let allJobs = [];
let currentMatches = [];
let dataMode = 'live';

const els = Object.fromEntries([
  'searchForm','queryInput','dashboard','emptyState','loadingState','resultTitle','updatedAt','sourceCount',
  'matchCount','matchContext','remoteShare','seniorShare','freshShare','skillsList','locationsList','companiesList',
  'takeaway','copyInsight','jobsList','showingCount','toast','liveBadge','shareTop'
].map(id => [id, document.getElementById(id)]));

function cleanText(html='') {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').replace(/\s+/g,' ').trim();
}

function normalizeJob(job) {
  return {
    title: job.title || '',
    company_name: job.company_name || job.company || 'Unknown company',
    location: job.location || 'Location not listed',
    remote: Boolean(job.remote) || /remote/i.test(job.location || ''),
    tags: Array.isArray(job.tags) ? job.tags : [],
    created_at: job.created_at || job.publication_date || job.createdAt || '',
    url: job.url || job.job_url || '#',
    description: cleanText(job.description || '')
  };
}

async function fetchOne(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : (Array.isArray(json.jobs) ? json.jobs : []);
  } finally { clearTimeout(timer); }
}

async function loadJobs() {
  setState('loading');
  try {
    const results = await Promise.allSettled(API_URLS.map(fetchOne));
    const live = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value).map(normalizeJob);
    if (!live.length) throw new Error('No live results');
    const seen = new Set();
    allJobs = live.filter(j => {
      const key = `${j.company_name}|${j.title}|${j.location}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    dataMode = 'live';
    els.liveBadge.innerHTML = '<span class="pulse"></span>LIVE DATA';
  } catch (err) {
    allJobs = FALLBACK_JOBS.map(normalizeJob);
    dataMode = 'demo';
    els.liveBadge.innerHTML = '<span class="pulse offline"></span>DEMO MODE';
  }
  const initial = new URLSearchParams(location.search).get('q') || 'product';
  els.queryInput.value = initial;
  analyze(initial);
}

function setState(name) {
  els.dashboard.classList.toggle('hidden', name !== 'dashboard');
  els.emptyState.classList.toggle('hidden', name !== 'empty');
  els.loadingState.classList.toggle('hidden', name !== 'loading');
}

function analyze(rawQuery) {
  const query = rawQuery.trim();
  if (!query) return;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  currentMatches = allJobs.filter(job => {
    const hay = `${job.title} ${job.company_name} ${job.location} ${job.tags.join(' ')} ${job.description}`.toLowerCase();
    return terms.every(t => hay.includes(t));
  });

  const url = new URL(location.href);
  url.searchParams.set('q', query);
  history.replaceState({}, '', url);

  if (!currentMatches.length) { setState('empty'); return; }
  setState('dashboard');
  render(query, currentMatches);
  window.setTimeout(() => els.dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

function percent(n, d) { return d ? Math.round((n / d) * 100) : 0; }
function isSenior(title='') { return /\b(senior|sr\.?|lead|principal|staff|head|director|vp|chief)\b/i.test(title); }
function daysAgo(dateString) {
  if (!dateString) return 999;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 999;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}
function countBy(arr, fn) {
  const map = new Map();
  arr.forEach(x => { const k = fn(x); if (k) map.set(k, (map.get(k) || 0) + 1); });
  return [...map.entries()].sort((a,b) => b[1]-a[1]);
}

function getTopSkills(jobs) {
  const counts = new Map();
  jobs.forEach(job => {
    const text = `${job.title} ${job.tags.join(' ')} ${job.description}`.toLowerCase();
    const unique = new Set();
    SKILLS.forEach(skill => {
      const pattern = new RegExp(`(^|[^a-z0-9])${skill.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^a-z0-9]|$)`, 'i');
      if (pattern.test(text)) unique.add(skill);
    });
    unique.forEach(skill => counts.set(skill, (counts.get(skill) || 0) + 1));
  });
  return [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0,6);
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
  els.updatedAt.textContent = `Updated ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
  els.sourceCount.textContent = `${allJobs.length.toLocaleString()} listings scanned`;
  els.matchCount.textContent = total.toLocaleString();
  els.matchContext.textContent = dataMode === 'live' ? 'matches in loaded public listings' : 'demo matches — live API unavailable';
  els.remoteShare.textContent = `${percent(remote,total)}%`;
  els.seniorShare.textContent = `${percent(senior,total)}%`;
  els.freshShare.textContent = `${percent(fresh,total)}%`;

  els.skillsList.innerHTML = skills.length ? skills.map(([skill,count]) => `
    <div class="bar-row">
      <span class="bar-label">${escapeHtml(skill)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(5, percent(count,total))}%"></div></div>
      <span class="bar-value">${percent(count,total)}%</span>
    </div>`).join('') : '<p class="panel-note" style="text-align:left">Not enough repeated skill mentions.</p>';

  els.locationsList.innerHTML = rankedRows(locations);
  els.companiesList.innerHTML = rankedRows(companies);
  els.takeaway.innerHTML = buildTakeaway(query, {total, remote, senior, fresh, skills});

  const sorted = [...jobs].sort((a,b) => new Date(b.created_at || 0)-new Date(a.created_at || 0)).slice(0,12);
  els.showingCount.textContent = `showing ${sorted.length} of ${total}`;
  els.jobsList.innerHTML = sorted.map(job => `
    <a class="job-row" href="${safeUrl(job.url)}" ${job.url && job.url !== '#' ? 'target="_blank" rel="noreferrer"' : ''}>
      <div class="job-title">${escapeHtml(job.title)}</div>
      <div class="job-company">${escapeHtml(job.company_name)}</div>
      <div class="job-location">${escapeHtml(job.location)}</div>
      <div class="job-tags">${job.remote ? '<span class="tag">REMOTE</span>' : ''}${isSenior(job.title) ? '<span class="tag">SENIOR</span>' : ''}</div>
    </a>`).join('');
}

function buildTakeaway(query, s) {
  const remotePct = percent(s.remote,s.total);
  const seniorPct = percent(s.senior,s.total);
  const freshPct = percent(s.fresh,s.total);
  const topSkill = s.skills[0]?.[0];
  const bits = [];
  bits.push(`<strong>${s.total}</strong> “${escapeHtml(query)}” matches surfaced.`);
  if (remotePct >= 50) bits.push(`Remote work is common at <strong>${remotePct}%</strong>.`);
  else if (remotePct > 0) bits.push(`Only <strong>${remotePct}%</strong> are marked remote.`);
  if (seniorPct >= 40) bits.push(`The market skews senior: <strong>${seniorPct}%</strong> of matches use senior-level titles.`);
  else bits.push(`Senior titles account for <strong>${seniorPct}%</strong> of matches.`);
  if (topSkill) bits.push(`The strongest repeated skill signal is <strong>${escapeHtml(topSkill)}</strong>.`);
  if (freshPct >= 40) bits.push(`<strong>${freshPct}%</strong> were posted in the last week.`);
  return bits.join(' ');
}

function rankedRows(items) {
  if (!items.length) return '<li><span class="rank-no">—</span><span>No repeated signal</span><span></span></li>';
  return items.map(([label,count], i) => `<li><span class="rank-no">0${i+1}</span><span>${escapeHtml(label)}</span><span class="rank-count">${count}</span></li>`).join('');
}

function linkedinText() {
  const q = els.resultTitle.textContent;
  const total = currentMatches.length;
  const remote = currentMatches.filter(j=>j.remote).length;
  const senior = currentMatches.filter(j=>isSenior(j.title)).length;
  const skills = getTopSkills(currentMatches).slice(0,3).map(x=>x[0]);
  const mode = dataMode === 'live' ? 'current public job listings' : 'the prototype dataset';
  return `I looked at ${mode} for “${q}”.\n\n${total} matches surfaced\n• ${percent(remote,total)}% remote\n• ${percent(senior,total)}% senior-level titles\n${skills.length ? `• Repeated skill signals: ${skills.join(', ')}` : ''}\n\nI built Job Signal to make job-market data readable in under a minute.\n\n#jobs #careers #data #jobmarket`;
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), 1500);
}

function escapeHtml(str='') { return str.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function safeUrl(url='') { try { const u = new URL(url, location.href); return ['http:','https:'].includes(u.protocol) ? u.href : '#'; } catch { return '#'; } }

els.searchForm.addEventListener('submit', e => { e.preventDefault(); analyze(els.queryInput.value); });
document.querySelectorAll('[data-query]').forEach(btn => btn.addEventListener('click', () => { els.queryInput.value = btn.dataset.query; analyze(btn.dataset.query); }));
els.copyInsight.addEventListener('click', () => copyText(linkedinText()));
els.shareTop.addEventListener('click', async () => {
  const shareData = { title: 'Job Signal', text: 'See what current public job listings are signaling.', url: location.href };
  if (navigator.share) { try { await navigator.share(shareData); return; } catch {} }
  copyText(location.href);
});

loadJobs();

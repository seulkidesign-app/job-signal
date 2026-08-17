(() => {
  const DAY = 24 * 60 * 60 * 1000;
  const WEEK = 7 * DAY;
  const LIVE_STALE_AFTER = 90 * 60 * 1000;
  const MARKETS = [
    { key: 'design', label: '디자인', query: '디자인' },
    { key: 'pm', label: 'PM·기획', query: 'PM' },
    { key: 'marketing', label: '마케팅', query: '마케팅' },
    { key: 'data', label: '데이터', query: '데이터' },
    { key: 'backend', label: '백엔드', query: '백엔드' }
  ];
  let history = { snapshots: [] };
  let datasetMeta = null;
  let sourceMeta = null;
  let ready = false;

  const els = {
    title: document.getElementById('resultTitle'),
    count: document.getElementById('trendCount'),
    junior: document.getElementById('trendJunior'),
    senior: document.getElementById('trendSenior'),
    status: document.getElementById('trendStatus'),
    freshness: document.getElementById('syncFreshness'),
    platformStrip: document.querySelector('.platform-strip'),
    hero: document.querySelector('.hero')
  };

  function normalize(value = '') {
    return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function marketKey(query) {
    const q = normalize(query);
    if (/디자이|designer|\bux\b|\bui\b/.test(q)) return 'design';
    if (/프로덕트|product manager|\bpm\b|기획/.test(q)) return 'pm';
    if (/마케팅|marketing|growth|crm/.test(q)) return 'marketing';
    if (/데이터|data|analyst|analytics/.test(q)) return 'data';
    if (/백엔드|backend|server|spring|개발/.test(q)) return 'backend';
    return null;
  }

  function validDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function latestPointFor(key) {
    const points = (history.snapshots || [])
      .filter(point => point?.markets?.[key] && validDate(point.at))
      .sort((a, b) => new Date(a.at) - new Date(b.at));
    return points.length ? points[points.length - 1] : null;
  }

  function comparisonPointFor(key, latest) {
    if (!latest) return null;
    const latestTime = new Date(latest.at).getTime();
    const target = latestTime - WEEK;
    const points = (history.snapshots || [])
      .filter(point => point?.markets?.[key] && validDate(point.at))
      .filter(point => new Date(point.at).getTime() <= target + 6 * 60 * 60 * 1000)
      .sort((a, b) => Math.abs(new Date(a.at).getTime() - target) - Math.abs(new Date(b.at).getTime() - target));
    const candidate = points[0] || null;
    if (!candidate) return null;
    const age = latestTime - new Date(candidate.at).getTime();
    return age >= 6 * DAY ? candidate : null;
  }

  function baseCount(market) {
    const total = Number(market?.total_found);
    if (Number.isFinite(total) && total >= 0) return total;
    const count = Number(market?.count);
    return Number.isFinite(count) ? count : null;
  }

  function percent(n, d) {
    return d ? Math.round((n / d) * 100) : 0;
  }

  function changePct(current, previous) {
    if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  }

  function formatPercentDelta(value) {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    if (abs < 0.05) return '0%';
    return `${value > 0 ? '+' : '−'}${abs.toFixed(abs >= 10 ? 0 : 1)}%`;
  }

  function formatPointDelta(value) {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    if (abs < 0.05) return '0%p';
    return `${value > 0 ? '+' : '−'}${abs.toFixed(1)}%p`;
  }

  function relativeTime(value) {
    const date = validDate(value);
    if (!date) return null;
    const diff = Math.max(0, Date.now() - date.getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '방금 갱신';
    if (minutes < 60) return `${minutes}분 전 갱신`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전 갱신`;
    const days = Math.floor(hours / 24);
    return `${days}일 전 갱신`;
  }

  function isStale(value) {
    const date = validDate(value);
    return date ? Date.now() - date.getTime() > LIVE_STALE_AFTER : true;
  }

  function jobsForMarket(market) {
    const jobs = Array.isArray(datasetMeta?.jobs) ? datasetMeta.jobs : [];
    return jobs.filter(job => {
      if (job.market_key) return job.market_key === market.key;
      return normalize(job.category).includes(normalize(market.label));
    });
  }

  function renderOverview() {
    if (!els.hero || !datasetMeta || document.querySelector('.market-overview')) return;
    const hasLive = Array.isArray(datasetMeta.live_sources) && datasetMeta.live_sources.length > 0;
    const section = document.createElement('section');
    section.className = 'market-overview';
    section.innerHTML = `
      <div class="overview-head">
        <div>
          <p class="panel-kicker">MARKET OVERVIEW</p>
          <h2>국내 채용시장 한눈에 보기</h2>
        </div>
        <span>${hasLive ? '자동 동기화 데이터' : '현재 검증 데이터'} 기준</span>
      </div>
      <div class="overview-grid">
        ${MARKETS.map(market => {
          const rows = jobsForMarket(market);
          const junior = rows.filter(job => job.exp_min != null && Number(job.exp_min) <= 1).length;
          const senior = rows.filter(job => job.exp_min != null && Number(job.exp_min) >= 5).length;
          return `
            <a class="overview-card" href="?q=${encodeURIComponent(market.query)}">
              <span>${market.label}</span>
              <strong>${rows.length.toLocaleString('ko-KR')}</strong>
              <small>신입 ${percent(junior, rows.length)}% · 5년+ ${percent(senior, rows.length)}%</small>
              <em>자세히 보기 →</em>
            </a>`;
        }).join('')}
      </div>`;
    els.hero.insertAdjacentElement('afterend', section);
  }

  function setPending(message = '추세 데이터 축적 중') {
    if (els.count) els.count.textContent = '—';
    if (els.junior) els.junior.textContent = '—';
    if (els.senior) els.senior.textContent = '—';
    if (els.status) els.status.textContent = message;
  }

  function renderFreshness(latest) {
    if (!els.freshness) return;
    const stamp = latest?.at || datasetMeta?.generated_at;
    const rel = relativeTime(stamp);
    const interval = Number(datasetMeta?.sync_interval_minutes);
    const hasLive = Array.isArray(datasetMeta?.live_sources) && datasetMeta.live_sources.length > 0;

    els.freshness.classList.remove('is-live', 'is-stale');

    if (hasLive && rel && isStale(stamp)) {
      els.freshness.textContent = `자동 갱신 지연 · ${rel}`;
      els.freshness.classList.add('is-stale');
      return;
    }

    if (hasLive && rel) {
      els.freshness.textContent = `${rel}${Number.isFinite(interval) ? ` · ${interval}분 자동 동기화` : ''}`;
      els.freshness.classList.add('is-live');
      return;
    }

    if (rel) {
      els.freshness.textContent = `${rel} · 검증 스냅샷`;
      return;
    }

    els.freshness.textContent = '자동 동기화 연결 대기';
  }

  function sourceLabel(source) {
    if (source.status === 'live') return 'LIVE';
    if (source.status === 'needs_secret') return 'API 연결 대기';
    if (source.status === 'open_api_application') return 'API 신청 가능';
    if (source.status === 'official_api_review') return 'API 검토';
    if (source.mode === 'verified_snapshot') return '검증';
    return '준비 중';
  }

  function renderSourceStates() {
    if (!els.platformStrip || !Array.isArray(sourceMeta?.sources)) return;
    const chips = [...els.platformStrip.querySelectorAll('span:not(.platform-label)')];
    for (const chip of chips) {
      const source = sourceMeta.sources.find(item => item.name === chip.textContent.trim().split(' · ')[0]);
      if (!source) continue;
      chip.textContent = `${source.name} · ${sourceLabel(source)}`;
      chip.title = source.note || '';
      chip.dataset.sourceStatus = source.status || source.mode || '';
    }
  }

  function renderSourceCredit() {
    const source = Array.isArray(sourceMeta?.sources) ? sourceMeta.sources.find(item => item.name === '사람인') : null;
    const footer = document.querySelector('footer .source-note');
    if (!source || !footer || footer.querySelector('.saramin-credit')) return;
    const link = document.createElement('a');
    link.className = 'saramin-credit';
    link.href = 'https://www.saramin.co.kr';
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = 'Powered by 취업 사람인';
    link.title = '사람인 공식 채용정보 API 출처 표기';
    link.style.color = 'inherit';
    link.style.textDecoration = 'none';
    link.style.fontSize = '11px';
    link.style.opacity = '.72';
    footer.appendChild(link);
  }

  function render() {
    if (!ready || !els.title) return;
    renderSourceStates();
    renderSourceCredit();
    renderOverview();
    const key = marketKey(els.title.textContent);
    if (!key) {
      setPending('이 검색어는 추세 비교 준비 중');
      renderFreshness(null);
      return;
    }

    const latest = latestPointFor(key);
    renderFreshness(latest);
    if (!latest) {
      setPending('첫 자동 스냅샷 대기 중');
      return;
    }

    const previous = comparisonPointFor(key, latest);
    if (!previous) {
      const first = (history.snapshots || []).find(point => point?.markets?.[key]);
      const firstDate = first ? validDate(first.at) : null;
      const days = firstDate ? Math.max(0, Math.floor((new Date(latest.at) - firstDate) / DAY)) : 0;
      setPending(days ? `${days}일째 데이터 축적 중 · 7일이 되면 비교` : '추세 데이터 축적 중 · 7일 후 비교 시작');
      return;
    }

    const nowMarket = latest.markets[key];
    const oldMarket = previous.markets[key];
    const nowCount = baseCount(nowMarket);
    const oldCount = baseCount(oldMarket);
    const countDelta = changePct(nowCount, oldCount);
    const juniorDelta = Number(nowMarket.junior_share) - Number(oldMarket.junior_share);
    const seniorDelta = Number(nowMarket.senior5_share) - Number(oldMarket.senior5_share);

    els.count.textContent = formatPercentDelta(countDelta);
    els.junior.textContent = formatPointDelta(juniorDelta);
    els.senior.textContent = formatPointDelta(seniorDelta);
    els.status.textContent = '실제 7일 관측값 비교';
  }

  async function load() {
    const [historyResult, dataResult, sourceResult] = await Promise.allSettled([
      fetch('data/history.json', { cache: 'no-store' }).then(res => res.ok ? res.json() : Promise.reject(new Error('history'))),
      fetch('data/jobs.json', { cache: 'no-store' }).then(res => res.ok ? res.json() : Promise.reject(new Error('jobs'))),
      fetch('data/sources.json', { cache: 'no-store' }).then(res => res.ok ? res.json() : Promise.reject(new Error('sources')))
    ]);

    if (historyResult.status === 'fulfilled') history = historyResult.value;
    if (dataResult.status === 'fulfilled') datasetMeta = dataResult.value;
    if (sourceResult.status === 'fulfilled') sourceMeta = sourceResult.value;
    ready = true;
    render();
  }

  if (els.title) {
    new MutationObserver(render).observe(els.title, { childList: true, subtree: true, characterData: true });
  }
  window.addEventListener('popstate', () => setTimeout(render, 0));
  load().catch(() => {
    ready = true;
    setPending('추세 데이터를 불러오지 못했어요');
    renderFreshness(null);
  });
})();
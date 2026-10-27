(() => {
  if (window.KPLAnalytics) return;

  const events = new Set([
    'pageview-portal', 'pageview-kpl2k', 'pageview-guessing', 'pageview-link', 'pageview-merge', 'pageview-coin',
    'portal-click-kpl2k', 'portal-click-guessing', 'portal-click-link', 'portal-click-merge', 'portal-click-coin',
    'kpl2k-start', 'kpl2k-complete',
    'guessing-start', 'guessing-complete', 'guessing-restart',
    'link-start', 'link-complete', 'link-reveal', 'link-restart',
    'merge-start', 'merge-favorite', 'merge-restart', 'merge-gameover',
    'coin-select-mode', 'coin-select-team', 'coin-start', 'coin-complete', 'coin-recap', 'coin-copy', 'coin-restart', 'coin-resume',
    'source-bilibili', 'source-xiaohongshu', 'source-zhihu', 'source-wechat', 'source-other'
  ]);
  const pages = new Set(['portal', 'kpl2k', 'guessing', 'link', 'merge', 'coin']);
  const sources = new Set(['bilibili', 'xiaohongshu', 'zhihu', 'wechat']);
  const page = ({ '/': 'portal', '/kpl2k/': 'kpl2k', '/guessing/': 'guessing', '/link/': 'link', '/merge/': 'merge', '/coin/': 'coin' })[location.pathname];
  const sentPageviews = new Set();

  function trackEvent(event) {
    if (!events.has(event) || navigator.webdriver === true) return false;
    try {
      Promise.resolve(fetch(`/__event/${event}.txt`, {
        method: 'GET', cache: 'no-store', keepalive: true,
        credentials: 'omit', referrerPolicy: 'no-referrer'
      })).catch(() => {});
    } catch { /* Analytics must never interrupt the page. */ }
    return true;
  }

  function trackPageView(name) {
    if (!pages.has(name) || name !== page || sentPageviews.has(name)) return false;
    if (navigator.webdriver === true) return false;
    sentPageviews.add(name);
    trackEvent(`pageview-${name}`);
    return true;
  }

  window.KPLAnalytics = Object.freeze({ trackEvent, trackPageView });
  if (!page) return;
  trackPageView(page);
  const source = new URLSearchParams(location.search).get('utm_source');
  if (source !== null) trackEvent(`source-${sources.has(source) ? source : 'other'}`);

  if (page === 'portal') document.addEventListener('click', (event) => {
    const card = event.target instanceof Element ? event.target.closest('.game-card[data-game]') : null;
    const game = card?.getAttribute('data-game');
    if (game === 'kpl2k' || game === 'guessing' || game === 'link' || game === 'merge' || game === 'coin') trackEvent(`portal-click-${game}`);
  });
})();

(() => {
  const transitionTime = 160;

  function showPage() {
    requestAnimationFrame(() => document.body.classList.add('page-ready'));
  }

  function isInternalNavigation(link) {
    if (!link || link.target || link.hasAttribute('download')) return false;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) return false;
    const target = new URL(link.href, window.location.href);
    return target.origin === window.location.origin && target.href !== window.location.href;
  }

  function leavePage(url) {
    document.body.classList.remove('page-ready');
    document.body.classList.add('page-leaving');
    window.setTimeout(() => { window.location.href = url; }, transitionTime);
  }

  window.fitNavigate = leavePage;

  document.addEventListener('DOMContentLoaded', showPage);
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a');
    if (!isInternalNavigation(link)) return;
    event.preventDefault();
    leavePage(link.href);
  });
})();

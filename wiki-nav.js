const sidebar = document.querySelector('#space-sidebar');
const toggle = document.querySelector('#sidebar-toggle');
const scrim = document.querySelector('#sidebar-scrim');
const narrow = window.matchMedia('(max-width: 850px)');
let compact = false;
let overlayOpen = false;

function renderNavigation() {
  const collapsed = narrow.matches ? !overlayOpen : compact;
  document.body.dataset.navCompact = String(collapsed);
  document.body.dataset.navOverlay = String(narrow.matches && overlayOpen);
  toggle.setAttribute('aria-expanded', String(!collapsed));
  const label = collapsed ? '사이드바 펼치기' : '사이드바 접기';
  toggle.setAttribute('aria-label', label);
  toggle.title = label;
  scrim.hidden = !narrow.matches || !overlayOpen;
}

function closeOverlay(returnFocus = false) {
  if (!overlayOpen) return;
  overlayOpen = false;
  renderNavigation();
  if (returnFocus) toggle.focus();
}

toggle.addEventListener('click', () => {
  if (narrow.matches) overlayOpen = !overlayOpen;
  else compact = !compact;
  renderNavigation();
});
scrim.addEventListener('click', () => closeOverlay(true));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !overlayOpen) return;
  event.preventDefault();
  closeOverlay(true);
}, true);
document.addEventListener('focusin', event => {
  if (event.target !== toggle && !sidebar.contains(event.target)) closeOverlay();
});
sidebar.addEventListener('click', event => {
  if (event.target.closest('.space-menu-item, .space-service')) closeOverlay();
});
narrow.addEventListener('change', () => {
  overlayOpen = false;
  renderNavigation();
});

renderNavigation();

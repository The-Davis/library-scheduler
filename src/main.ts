import { initApp } from './ui/app';

// Bootstrap the app once the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initApp());
} else {
  initApp();
}

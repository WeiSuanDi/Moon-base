// 首页脚本：仅负责加载 3D 月球，点击标记后跳转到沙盘推演子页
import { initMoon } from './moon-render.js';

function init() {
  initMoon();

  window.addEventListener('marker-click', e => {
    const base = e.detail;
    if (base?.id) {
      window.location.href = `plan.html?site=${encodeURIComponent(base.id)}`;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

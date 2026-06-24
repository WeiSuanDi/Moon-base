// 背景音乐播放器：进入网站自动播放；用户手动暂停后，本次会话内刷新保持暂停；关闭网页后再打开恢复自动播放
(function () {
  "use strict";

  const MUSIC_SRC =
    "music/CrooMin%20-%20-%20%E5%8E%9F%E9%87%8E%E8%BF%BD%E9%80%90(Cornfield%C2%A0Chase).mp3";
  const SESSION_PAUSED_KEY = "moon-music-paused";

  // 避免重复初始化
  if (window.__moonMusicPlayer) return;
  window.__moonMusicPlayer = true;

  let audio = document.getElementById("moon-bg-music");
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "moon-bg-music";
    audio.loop = true;
    audio.volume = 0.45;
    audio.preload = "auto";
    audio.src = MUSIC_SRC;
    audio.style.display = "none";
    document.body.appendChild(audio);
  }

  let btn = document.getElementById("moon-music-toggle");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "moon-music-toggle";
    btn.className = "moon-music-toggle";
    btn.setAttribute("aria-label", "播放/暂停背景音乐");
    btn.title = "背景音乐";
    document.body.appendChild(btn);
  }

  function isPlaying() {
    return audio && !audio.paused && !audio.ended && audio.readyState > 2;
  }

  function updateIcon() {
    btn.innerHTML = isPlaying()
      ? '<span class="moon-music-icon">⏸</span><span class="moon-music-wave"></span>'
      : '<span class="moon-music-icon">▶</span>';
    btn.classList.toggle("playing", isPlaying());
  }

  function setSessionPaused(paused) {
    try {
      if (paused) sessionStorage.setItem(SESSION_PAUSED_KEY, "1");
      else sessionStorage.removeItem(SESSION_PAUSED_KEY);
    } catch (e) {
      // 忽略隐私模式下的 sessionStorage 异常
    }
  }

  function isSessionPaused() {
    try {
      return sessionStorage.getItem(SESSION_PAUSED_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  async function play() {
    try {
      await audio.play();
    } catch (err) {
      // 浏览器自动播放策略阻止时，保持当前 UI 状态
    }
    updateIcon();
  }

  function pause() {
    audio.pause();
    updateIcon();
  }

  btn.addEventListener("click", () => {
    if (isPlaying()) {
      setSessionPaused(true);
      pause();
    } else {
      setSessionPaused(false);
      play();
    }
  });

  audio.addEventListener("play", updateIcon);
  audio.addEventListener("pause", updateIcon);
  audio.addEventListener("ended", updateIcon);

  // 页面加载时：本次会话未被手动暂停则自动播放
  function initPlayback() {
    updateIcon();
    if (!isSessionPaused()) {
      play();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPlayback);
  } else {
    initPlayback();
  }

  // 首次用户交互时补播，解决浏览器的自动播放限制（排除音乐按钮本身；若用户已手动暂停则不补播）
  const resumeOnInteraction = (e) => {
    if (e && (e.target === btn || btn.contains(e.target))) return;
    if (!isSessionPaused() && !isPlaying()) {
      play();
    }
  };
  document.addEventListener("click", resumeOnInteraction, { once: true });
  document.addEventListener("touchstart", resumeOnInteraction, { once: true });
})();

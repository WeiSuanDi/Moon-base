// 背景音乐播放器：支持跨页面播放状态记忆与播放/暂停切换
(function () {
  "use strict";

  const MUSIC_SRC =
    "music/CrooMin%20-%20-%20%E5%8E%9F%E9%87%8E%E8%BF%BD%E9%80%90(Cornfield%C2%A0Chase).mp3";
  const STORAGE_KEY = "moon-base-music-playing";

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

  function setPlayingState(playing) {
    try {
      localStorage.setItem(STORAGE_KEY, playing ? "1" : "0");
    } catch (e) {
      // 忽略隐私模式下的 localStorage 异常
    }
  }

  function getStoredState() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  async function play() {
    try {
      await audio.play();
      setPlayingState(true);
    } catch (err) {
      // 浏览器自动播放策略阻止时，保持暂停状态
    }
    updateIcon();
  }

  function pause() {
    audio.pause();
    setPlayingState(false);
    updateIcon();
  }

  btn.addEventListener("click", () => {
    if (isPlaying()) {
      pause();
    } else {
      play();
    }
  });

  audio.addEventListener("play", updateIcon);
  audio.addEventListener("pause", updateIcon);
  audio.addEventListener("ended", () => {
    setPlayingState(false);
    updateIcon();
  });

  // 页面加载时根据记忆状态尝试播放
  function initPlayback() {
    updateIcon();
    if (getStoredState()) {
      play();
    }
  }

  // 如果页面已经允许音频上下文（非首屏），直接尝试；否则等待首次用户交互
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPlayback);
  } else {
    initPlayback();
  }

  // 首次用户交互时补播，解决浏览器的自动播放限制（排除音乐按钮本身）
  const resumeOnInteraction = (e) => {
    if (e && (e.target === btn || btn.contains(e.target))) return;
    if (getStoredState() && !isPlaying()) {
      play();
    }
  };
  document.addEventListener("click", resumeOnInteraction, { once: true });
  document.addEventListener("touchstart", resumeOnInteraction, { once: true });
})();

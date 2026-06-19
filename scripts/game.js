import {
  baseState,
  subscribe,
  setSite,
  setDecision,
  resetGame,
  getState,
  steps,
  options,
  computeMetrics,
  siteMeta
} from './state.js';
import { initMoon, highlightSite, bases } from './moon-render.js';
import { askAgent, generateSummary } from './agent-client.js';

// DOM refs
const infoPanel = document.getElementById('info-panel');
const infoSubtitle = document.getElementById('info-subtitle');
const infoTitle = document.getElementById('info-title');
const infoDesc = document.getElementById('info-desc');
const infoStats = document.getElementById('info-stats');
const infoActions = document.getElementById('info-actions');
const infoClose = document.getElementById('info-close');

const gamePanel = document.getElementById('game-panel');
const gameSiteTag = document.getElementById('game-site-tag');
const decisionList = document.getElementById('decision-list');
const statsBoard = document.getElementById('stats-board');
const generateBtn = document.getElementById('generate-summary-btn');

const resultPanel = document.getElementById('result-panel');
const resultBody = document.getElementById('result-body');
const resultClose = document.getElementById('result-close');
const resultReset = document.getElementById('result-reset');

const agentFab = document.getElementById('agent-fab');
const agentChat = document.getElementById('agent-chat');
const chatClose = document.getElementById('chat-close');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

let isGenerating = false;

function init() {
  initMoon();
  bindEvents();
  subscribe(render);
  render(getState());
}

function bindEvents() {
  window.addEventListener('marker-click', e => {
    showBaseInfo(e.detail);
  });

  infoClose.addEventListener('click', hideBaseInfo);
  resultClose.addEventListener('click', hideResult);
  resultReset.addEventListener('click', () => {
    hideResult();
    resetGame();
  });

  generateBtn.addEventListener('click', onGenerateSummary);

  agentFab.addEventListener('click', () => agentChat.classList.toggle('visible'));
  chatClose.addEventListener('click', () => agentChat.classList.remove('visible'));
  chatSend.addEventListener('click', sendChat);
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });
}

function showBaseInfo(base) {
  infoSubtitle.textContent = base.subtitle;
  infoTitle.textContent = base.name;
  infoDesc.textContent = base.desc;
  infoStats.innerHTML = `
    <div class="info-stat"><div class="info-stat-value">${base.altitude}</div><div class="info-stat-label">海拔</div></div>
    <div class="info-stat"><div class="info-stat-value">${base.lat}°</div><div class="info-stat-label">纬度</div></div>
    <div class="info-stat"><div class="info-stat-value">${base.lon}°</div><div class="info-stat-label">经度</div></div>
  `;

  infoActions.innerHTML = '';
  if (base.selectable) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = '选为基地选址';
    btn.addEventListener('click', () => {
      setSite(base.id);
      hideBaseInfo();
    });
    infoActions.appendChild(btn);
  }
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-secondary';
  closeBtn.textContent = '关闭';
  closeBtn.addEventListener('click', hideBaseInfo);
  infoActions.appendChild(closeBtn);

  infoPanel.classList.add('visible');
}

function hideBaseInfo() {
  infoPanel.classList.remove('visible');
}

function render(state) {
  highlightSite(state.site);

  if (state.site) {
    gamePanel.classList.remove('hidden');
    renderGamePanel(state);
  } else {
    gamePanel.classList.add('hidden');
  }

  const metrics = computeMetrics(state);
  if (metrics) {
    statsBoard.classList.remove('hidden');
    renderStats(metrics, state);
  } else {
    statsBoard.classList.add('hidden');
  }

  const allDone = state.site && state.energy && state.water && state.radiation;
  generateBtn.style.display = allDone ? 'block' : 'none';
}

function renderGamePanel(state) {
  const site = siteMeta[state.site];
  gameSiteTag.innerHTML = `<span class="dot"></span> 已选选址：${site?.name || state.site}`;

  decisionList.innerHTML = '';
  steps.forEach((step, index) => {
    const prev = steps[index - 1];
    const isUnlocked = !prev || state[prev.key];
    const isDone = !!state[step.key];
    const isActive = isUnlocked && !isDone;

    const card = document.createElement('div');
    card.className = `decision-card ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;

    const statusText = isDone ? '已选择' : isUnlocked ? '待决策' : '需先完成上一步';
    const statusClass = isDone ? 'done' : '';

    card.innerHTML = `
      <div class="decision-header">
        <div class="decision-name">${index + 1}. ${step.name}</div>
        <div class="decision-status ${statusClass}">${statusText}</div>
      </div>
      <div class="decision-desc">${step.description}</div>
      <div class="option-list" id="options-${step.key}"></div>
    `;

    const optionList = card.querySelector(`#options-${step.key}`);
    options[step.key].forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      if (state[step.key] === opt.id) btn.classList.add('selected');
      btn.disabled = !isUnlocked;
      btn.innerHTML = `<span class="option-title">${opt.icon} ${opt.label}</span><span class="option-hint">${opt.hint}</span>`;
      btn.addEventListener('click', () => setDecision(step.key, opt.id));
      optionList.appendChild(btn);
    });

    decisionList.appendChild(card);
  });
}

function renderStats(metrics, state) {
  const powerClass = metrics.powerSurplus_kW >= 30 ? 'good' : metrics.powerSurplus_kW >= 0 ? 'warn' : 'bad';
  const radiationClass = metrics.radiation_mSv_y <= 100 ? 'good' : metrics.radiation_mSv_y <= 200 ? 'warn' : 'bad';
  const waterClass = metrics.waterSupply_t_y >= 500 ? 'good' : metrics.waterSupply_t_y >= 200 ? 'warn' : 'bad';

  statsBoard.innerHTML = `
    <h4>当前配置推演</h4>
    <div class="stat-row"><span class="stat-label">能源结余</span><span class="stat-value ${powerClass}">${metrics.powerSurplus_kW > 0 ? '+' : ''}${metrics.powerSurplus_kW} kW</span></div>
    <div class="stat-row"><span class="stat-label">总部署质量</span><span class="stat-value">${metrics.totalMass_t} t</span></div>
    <div class="stat-row"><span class="stat-label">年供水量</span><span class="stat-value ${waterClass}">${metrics.waterSupply_t_y} t/年</span></div>
    <div class="stat-row"><span class="stat-label">舱外年辐射</span><span class="stat-value ${radiationClass}">${metrics.radiation_mSv_y} mSv</span></div>
    <div class="stat-row"><span class="stat-label">综合风险</span><span class="stat-value ${metrics.riskScore <= 4 ? 'good' : metrics.riskScore <= 6 ? 'warn' : 'bad'}">${metrics.riskScore}/10</span></div>
    <div class="stat-row"><span class="stat-label">可持续评分</span><span class="stat-value ${metrics.sustainability >= 10 ? 'good' : metrics.sustainability >= 6 ? 'warn' : 'bad'}">${metrics.sustainability}/15</span></div>
  `;
}

async function onGenerateSummary() {
  if (isGenerating) return;
  isGenerating = true;
  generateBtn.disabled = true;
  generateBtn.textContent = '正在生成…';

  const state = getState();
  const metrics = computeMetrics(state);

  try {
    const text = await generateSummary({ ...state, metrics });
    showResult(markdownToHtml(text));
  } catch (err) {
    console.warn('后端简报失败，使用本地推演结果：', err);
    showResult(markdownToHtml(buildLocalSummary(state, metrics)));
  } finally {
    isGenerating = false;
    generateBtn.disabled = false;
    generateBtn.textContent = '生成可行性简报';
  }
}

function buildLocalSummary(state, metrics) {
  const lines = [
    `# ${metrics.siteName}基地可行性简报`,
    ``,
    `## 配置摘要`,
    `- 选址：${metrics.siteName}`,
    `- 能源：${options.energy.find(o => o.id === state.energy)?.label}`,
    `- 水源：${options.water.find(o => o.id === state.water)?.label}`,
    `- 辐射防护：${options.radiation.find(o => o.id === state.radiation)?.label}`,
    ``,
    `## 关键指标`,
    `- 能源结余：${metrics.powerSurplus_kW > 0 ? '+' : ''}${metrics.powerSurplus_kW} kW`,
    `- 总部署质量：${metrics.totalMass_t} t`,
    `- 年供水量：${metrics.waterSupply_t_y} t`,
    `- 年辐射剂量：${metrics.radiation_mSv_y} mSv`,
    `- 综合风险：${metrics.riskScore}/10`,
    `- 可持续性：${metrics.sustainability}/15`,
    ``,
    `## 结论`,
    metrics.powerSurplus_kW >= 0 && metrics.radiation_mSv_y <= 150 && metrics.waterSupply_t_y >= 300
      ? '当前配置在南极 Shackleton 环境下具备基本可行性，建议进入详细工程设计阶段。'
      : '当前配置存在明显短板（能源、辐射或水源），建议调整选项以提升生存能力。',
    ``,
    '> 本简报由前端规则表生成；接入 DeepSeek 后将由 AI 基于领域知识进一步润色与分析。'
  ];
  return lines.join('\n');
}

function showResult(html) {
  resultBody.innerHTML = html;
  resultPanel.classList.add('visible');
}

function hideResult() {
  resultPanel.classList.remove('visible');
}

// 简单的 Markdown → HTML，仅处理标题、列表、加粗
function markdownToHtml(md) {
  let html = md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h3>$1</h3>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>');

  const blocks = html.split(/\n\s*\n/);
  const out = [];
  blocks.forEach(block => {
    block = block.trim();
    if (!block) return;
    if (/^<h[1-6]/.test(block)) {
      out.push(block);
      return;
    }
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length && lines.every(l => l.startsWith('<li>'))) {
      out.push('<ul>' + lines.join('') + '</ul>');
    } else {
      out.push('<p>' + lines.join('<br>') + '</p>');
    }
  });

  return out.join('');
}

// Agent chat
function appendMessage(role, text) {
  const msg = document.createElement('div');
  msg.className = `message ${role}`;
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'message agent typing';
  el.id = 'chat-typing';
  el.textContent = 'AI 正在思考…';
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('chat-typing');
  if (el) el.remove();
}

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  appendMessage('user', text);
  showTyping();
  chatSend.disabled = true;

  try {
    const state = getState();
    const answer = await askAgent({ ...state, metrics: computeMetrics(state) }, text);
    removeTyping();
    appendMessage('agent', answer || '（AI 没有返回内容）');
  } catch (err) {
    removeTyping();
    appendMessage('agent', `请求失败：${err.message}`);
  } finally {
    chatSend.disabled = false;
  }
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

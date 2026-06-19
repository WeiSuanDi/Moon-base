// 单一状态源（single source of truth）
// v1：沙克尔顿环形山 + 能源 / 水源 / 辐射防护

const STORAGE_KEY = 'moonBaseState_v1';

export const steps = [
  { key: 'energy', name: '能源系统', description: ' Shackleton 坑口近乎永昼，坑内永久阴影；能源选择决定月夜生存与载荷质量。' },
  { key: 'water', name: '水源方案', description: '永久阴影区富含水冰，可就地开采或从地球补给。' },
  { key: 'radiation', name: '辐射防护', description: '南极没有磁场保护，需用月壤、洞穴或厚舱壁降低辐射。' }
];

export const options = {
  energy: [
    { id: 'nuclear', label: '微型核反应堆', hint: '稳定大功率，载荷重，安全冗余高', icon: '⚛️' },
    { id: 'storage', label: '大规模储能', hint: '白天充电、月夜放电，依赖日照窗口', icon: '🔋' },
    { id: 'solar', label: '薄膜太阳能', hint: '重量轻、成本低，受月夜与阴影限制', icon: '☀️' }
  ],
  water: [
    { id: 'isru', label: '就地采水冰（ISRU）', hint: '利用阴影区水冰，减少地球补给', icon: '❄️' },
    { id: 'earth_supply', label: '地球补给', hint: '技术成熟，但运费昂贵且供应线脆弱', icon: '🚀' }
  ],
  radiation: [
    { id: 'regolith', label: '埋入月壤', hint: '覆盖 2–3 米月壤，防护效果最佳但工程量大', icon: '🏔️' },
    { id: 'cave', label: '利用熔岩洞', hint: '天然厚岩层屏蔽，但空间受限、探测不足', icon: '🕳️' },
    { id: 'hull', label: '加厚舱壁', hint: '现有舱体技术，快速部署但质量大、屏蔽有限', icon: '🛡️' }
  ]
};

export const siteMeta = {
  shackleton: {
    name: '沙克尔顿环形山',
    subtitle: '南极极地科研前哨',
    desc: '位于月球南极，坑口近乎永昼，永久阴影区富含水冰。能源与水资源的“黄金组合”，但极端低温与险峻地形是主要代价。',
    baseTempC: -220,
    baseRadiation_mSv_y: 350,
    iceAvailable_t: 1500,
    sunHoursRatio: 0.82,
    baseMass_t: 200,
    basePower_kW: 100
  }
};

// 规则表：每个选项对基地指标的增量影响
export const ruleTable = {
  energy: {
    nuclear: { powerBalance_kW: 50, mass_t: 80, riskScore: 2, costLevel: 3, sustainability: 4, note: '核能可覆盖月夜， Shackleton 低温对设备热管理提出高要求。' },
    storage: { powerBalance_kW: -5, mass_t: 60, riskScore: 1, costLevel: 2, sustainability: 3, note: '坑口近乎永昼提供了较长的充电窗口，但 14 天月夜仍是挑战。' },
    solar: { powerBalance_kW: 25, mass_t: 20, riskScore: 1, costLevel: 1, sustainability: 2, note: '坑口日照充足，但坑内作业与月夜需要额外储能或停工。' }
  },
  water: {
    isru: { waterSupply_t_y: 900, mass_t: 40, powerConsumption_kW: 10, riskScore: 2, costLevel: 2, sustainability: 5, note: '水冰就地开采可大量减少地球补给，但采矿设备需耐受 -220°C。' },
    earth_supply: { waterSupply_t_y: 120, mass_t: 15, powerConsumption_kW: 2, riskScore: 1, costLevel: 3, sustainability: 1, note: '地球运输代价极高，长期难以支撑百人级基地。' }
  },
  radiation: {
    regolith: { radiationDelta_mSv_y: -250, mass_t: 60, riskScore: 2, costLevel: 2, sustainability: 5, note: '2–3 米月壤可将辐射降至近地球背景水平。' },
    cave: { radiationDelta_mSv_y: -300, mass_t: 10, riskScore: 3, costLevel: 1, sustainability: 5, note: '熔岩洞天然屏蔽优异，但选址与内部改造风险未知。' },
    hull: { radiationDelta_mSv_y: -150, mass_t: 30, riskScore: 1, costLevel: 2, sustainability: 3, note: '舱壁加厚是最快部署方案，但仍高于长期安全阈值。' }
  }
};

const defaultState = {
  site: null,
  energy: null,
  water: null,
  radiation: null,
  history: []
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // 只保留已知字段
    return { ...defaultState, ...parsed, history: parsed.history || [] };
  } catch (e) {
    return null;
  }
}

export const baseState = loadFromStorage() || { ...defaultState };

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  fn(getState());
  return () => listeners.delete(fn);
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(baseState));
  } catch (e) {
    // 隐私模式可能无法写入
  }
}

export function setSite(siteId) {
  if (baseState.site === siteId) return;
  baseState.site = siteId;
  baseState.energy = null;
  baseState.water = null;
  baseState.radiation = null;
  baseState.history = [{ step: 'site', choice: siteId, label: siteMeta[siteId]?.name || siteId, time: Date.now() }];
  notify();
}

export function setDecision(stepKey, optionId) {
  if (baseState[stepKey] === optionId) return;
  baseState[stepKey] = optionId;
  const opt = options[stepKey].find(o => o.id === optionId);
  baseState.history = baseState.history.filter(h => h.step !== stepKey);
  baseState.history.push({ step: stepKey, choice: optionId, label: opt?.label || optionId, time: Date.now() });
  notify();
}

export function resetGame() {
  baseState.site = null;
  baseState.energy = null;
  baseState.water = null;
  baseState.radiation = null;
  baseState.history = [];
  notify();
}

function notify() {
  persist();
  const snapshot = getState();
  listeners.forEach(fn => fn(snapshot));
}

export function getState() {
  return {
    site: baseState.site,
    energy: baseState.energy,
    water: baseState.water,
    radiation: baseState.radiation,
    history: [...baseState.history]
  };
}

// 基于规则表计算当前配置的综合指标
export function computeMetrics(state) {
  const site = state.site ? siteMeta[state.site] : null;
  if (!site) {
    return null;
  }

  const deltas = {
    powerBalance_kW: 0,
    mass_t: site.baseMass_t,
    waterSupply_t_y: 0,
    powerConsumption_kW: 0,
    riskScore: 0,
    costLevel: 0,
    sustainability: 0,
    notes: []
  };

  ['energy', 'water', 'radiation'].forEach(step => {
    const choice = state[step];
    if (!choice) return;
    const rule = ruleTable[step][choice];
    if (!rule) return;

    if (typeof rule.powerBalance_kW === 'number') deltas.powerBalance_kW += rule.powerBalance_kW;
    if (typeof rule.mass_t === 'number') deltas.mass_t += rule.mass_t;
    if (typeof rule.waterSupply_t_y === 'number') deltas.waterSupply_t_y += rule.waterSupply_t_y;
    if (typeof rule.powerConsumption_kW === 'number') deltas.powerConsumption_kW += rule.powerConsumption_kW;
    if (typeof rule.riskScore === 'number') deltas.riskScore += rule.riskScore;
    if (typeof rule.costLevel === 'number') deltas.costLevel += rule.costLevel;
    if (typeof rule.sustainability === 'number') deltas.sustainability += rule.sustainability;
    if (rule.note) deltas.notes.push(rule.note);
  });

  const powerSurplus_kW = site.basePower_kW + deltas.powerBalance_kW - deltas.powerConsumption_kW;
  const radiation_mSv_y = Math.max(20, site.baseRadiation_mSv_y + (ruleTable.radiation[state.radiation]?.radiationDelta_mSv_y || 0));

  return {
    siteName: site.name,
    powerSurplus_kW,
    totalMass_t: deltas.mass_t,
    waterSupply_t_y: deltas.waterSupply_t_y,
    radiation_mSv_y,
    riskScore: deltas.riskScore,
    costLevel: deltas.costLevel,
    sustainability: deltas.sustainability,
    notes: deltas.notes
  };
}

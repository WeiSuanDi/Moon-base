// 唯一调后端的地方：/api/agent 与 /api/summary
// 后端是无状态的，每次都要把完整 state 带过去。

const API_BASE = '';

async function postJson(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`后端返回 ${response.status}: ${text}`);
  }

  return response.json();
}

export async function askAgent(state, question) {
  if (!question || !question.trim()) return '';
  const data = await postJson('/api/agent', { state, question: question.trim() });
  return data.answer || '';
}

export async function generateSummary(state) {
  const data = await postJson('/api/summary', { state, history: state.history });
  return data.result || '';
}

"""
月球基地 v1 后端（Vercel Serverless Function）
- 无状态：不保存会话，每次请求都依赖前端传过来的完整 state。
- 仅两个路由：/api/agent（开放式追问）、/api/summary（收尾可行性简报）。
"""

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# 本地开发时从 .env.local 加载环境变量；Vercel 上由平台注入，此调用无影响。
load_dotenv(".env.local")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Moon Base Agent API", version="1.0.0")

# 允许本地开发与 Vercel 同源调用
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DeepSeek 通过 openai 库调用
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"
MODEL = "deepseek-chat"

if DEEPSEEK_API_KEY:
    from openai import OpenAI

    client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
else:
    client = None


class AgentRequest(BaseModel):
    state: dict[str, Any]
    question: str


class SummaryRequest(BaseModel):
    state: dict[str, Any]
    history: list[dict[str, Any]]


DOMAIN_KNOWLEDGE = """你是月球基地领域的专家顾问，熟悉 Shackleton 环形山（月球南极）的特点：
- 坑口边缘几乎全年有光照（永昼），是布设太阳能与通信设备的理想位置。
- 坑底永久阴影区富含水冰，可就地开采用于饮用水、氧气和火箭推进剂。
- 主要挑战：极端低温（可低于 -220°C）、崎岖地形、月尘、无大气辐射屏蔽、14 个地球日的月夜。

用户正在做一个交互式沙盘，会依次做三个决策：
1. 能源：核能（稳定大功率、重）、大规模储能（依赖充电窗口）、太阳能（轻但受月夜限制）。
2. 水源：就地采水冰 ISRU（减少补给）、地球补给（昂贵且脆弱）。
3. 辐射防护：埋入月壤（屏蔽好但工程量大）、利用熔岩洞（天然屏蔽但未知多）、加厚舱壁（快速但屏蔽有限）。

你的回答要基于当前 state 里用户已经选择的配置，解释“如果这样选会怎样”，用中文作答，控制在 400 字以内，语气专业但易懂。"""

SUMMARY_PROMPT = """你是一名月球基地可行性评估专家。请根据用户当前的基地配置，生成一份简洁的「基地可行性简报」。

要求：
- 用中文，分「配置摘要」「关键指标」「优势」「风险」「总体结论」几个小节。
- 基于用户选择的选址和三个决策展开，不要编造 state 里没有的选项。
- 给出明确、可执行的评估，控制在 800 字以内。
- 如果能源结余为负、辐射剂量过高或水源不足，要在风险里重点指出。"""


def build_state_context(state: dict[str, Any]) -> str:
    lines = ["当前基地配置："]
    site = state.get("site")
    lines.append(f"- 选址：{site or '未选择'}")
    for key in ["energy", "water", "radiation"]:
        val = state.get(key)
        lines.append(f"- {key}：{val or '未选择'}")

    metrics = state.get("metrics")
    if metrics:
        lines.append("\n前端推演指标：")
        lines.append(f"- 能源结余：{metrics.get('powerSurplus_kW')} kW")
        lines.append(f"- 总部署质量：{metrics.get('totalMass_t')} t")
        lines.append(f"- 年供水量：{metrics.get('waterSupply_t_y')} t")
        lines.append(f"- 年辐射剂量：{metrics.get('radiation_mSv_y')} mSv")
        lines.append(f"- 综合风险：{metrics.get('riskScore')}/10")
        lines.append(f"- 可持续性：{metrics.get('sustainability')}/15")
    return "\n".join(lines)


def chat_completion(messages: list[dict[str, str]], max_tokens: int = 900) -> str:
    if not client:
        raise RuntimeError("DEEPSEEK_API_KEY 未配置，无法调用模型")

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content or ""
    except Exception as exc:
        raise RuntimeError(f"模型调用失败：{exc}") from exc


@app.get("/api/health")
def health():
    return {"ok": True, "model_available": client is not None}


@app.post("/api/agent")
def agent(req: AgentRequest):
    """开放式追问：基于当前 state 回答用户的自由提问。"""
    try:
        if not client:
            return {
                "answer": (
                    "（演示模式）当前后端未配置 DEEPSEEK_API_KEY，无法调用真实模型。\n\n"
                    "你问的是：" + req.question[:200] + "\n\n"
                    "部署到 Vercel 并在后台填入 API key 后，这里将返回 AI 的专业回答。"
                )
            }

        messages = [
            {"role": "system", "content": DOMAIN_KNOWLEDGE},
            {"role": "system", "content": build_state_context(req.state)},
            {"role": "user", "content": req.question},
        ]
        answer = chat_completion(messages, max_tokens=800)
        return {"answer": answer}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/summary")
def summary(req: SummaryRequest):
    """收尾产出：生成基于当前配置的可行性简报。"""
    try:
        if not client:
            return {
                "result": (
                    "## （演示模式）基地可行性简报\n\n"
                    "当前后端未配置 DEEPSEEK_API_KEY，因此返回占位文本。\n\n"
                    "前端已经完成了选址与三步决策的确定性推演；接入模型后，这里将基于你的具体配置生成由 AI 润色的专业简报。"
                )
            }

        history_text = "\n".join(
            f"- {h.get('step')}: {h.get('label')}"
            for h in (req.history or [])
        )

        messages = [
            {"role": "system", "content": SUMMARY_PROMPT},
            {"role": "system", "content": build_state_context(req.state)},
            {"role": "system", "content": f"用户选择历史：\n{history_text or '（无）'}"},
            {"role": "user", "content": "请生成基地可行性简报。"},
        ]
        result = chat_completion(messages, max_tokens=1000)
        return {"result": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# 本地开发时让 FastAPI 同时托管前端静态文件，访问 http://localhost:8000 即可。
# Vercel 部署后仍由 Vercel 静态托管处理根目录，不会走到这里。
app.mount(
    "/",
    StaticFiles(directory=Path(__file__).parent.parent, html=True),
    name="static",
)

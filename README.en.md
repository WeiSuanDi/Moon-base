<div align="center">

# 🌙 Moon Base · 月球基地畅想

> **On the silent grey wasteland, the next stop of human civilization is rising.**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Three.js](https://img.shields.io/badge/Three.js-r128-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![DeepSeek](https://img.shields.io/badge/Powered%20by-DeepSeek-4D6BFA?style=for-the-badge)](https://deepseek.com)

[🚀 Live Demo](https://weisuandi.com) · [📖 Architecture Docs](./AIcoding/项目架构分析.md) · [🎮 Start Simulation](./plan.html)

<img src="./moon-base-initial.png" alt="Moon Base Homepage" width="85%" style="border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.4);">

</div>

---

## ✨ What is this?

**Moon Base** is an interactive web experience / lightweight sandbox game about building humanity's first permanent settlement on the Moon.

When you enter the site, you'll see an **interactive 3D Moon**. Floating above the lunar surface are markers based on real locations:

- 🏔️ **Shackleton Base** — Water ice in the permanently shadowed south pole
- 🌊 **Tranquility Memorial** — The site of humanity's first steps on the Moon
- ⛏️ **Imbrium Mining Zone** — Titanium and helium-3 resources
- 🔭 **Tycho Observatory** — Deep-space observation platform

Click a site to start the **sandbox simulation**: choose energy, water, and radiation shielding solutions. Every decision is calculated in real time by the frontend rule engine, showing you the cascading consequences. At the end, generate your own **AI-powered feasibility report**.

> **Core vibe**: You make the calls; the frontend shows you what happens. AI is the enhancement, not the protagonist.

---

## 🎮 Core Experience

| Step | Screenshot | Description |
|------|------------|-------------|
| **① Gaze at the Moon** | <img src="./moon-base-initial.png" width="280"> | A rotatable, zoomable 3D Moon with hoverable markers |
| **② Pick a Site** | <img src="./moon-base-info-panel.png" width="280"> | Click a marker to see its traits and confirm your choice |
| **③ Sandbox Simulation** | <img src="./moon-base-game-panel.png" width="280"> | Three-step decisions: Energy → Water → Radiation Shielding |
| **④ View Results** | <img src="./moon-base-complete.png" width="280"> | Real-time metrics panel + AI feasibility report |

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Browser)        Backend (Vercel Serverless)      │
│  ──────────────────        ─────────────────────────────     │
│  Three.js  r128            FastAPI (Python)                  │
│  Native ES Modules         OpenAI SDK → DeepSeek API         │
│  Pure CSS / CSS Variables  Fully stateless design            │
│  localStorage persistence                                    │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Description |
|-------|------------|-------------|
| 🎨 3D Rendering | Three.js + EffectComposer | Color map + displacement map + UnrealBloomPass glow |
| ⚛️ Frontend Logic | Native ES Module JS | No framework, lightweight and direct |
| 💅 Styling | Pure CSS | Deep-space theme + Glassmorphism |
| 🤖 AI Capability | DeepSeek `deepseek-chat` | Open-ended Q&A + feasibility report generation |
| 🚀 Deployment | Vercel | Static hosting + Serverless Function |

---

## 🏗️ Architecture Philosophy

To decide whether a piece of logic should use an LLM, ask one question:

> **"If I remove the LLM, will this part break?"**

- **Breaks → Use agent**: open-ended reasoning, generative output
- **Doesn't break → Hard-code it**: menus, numeric calculations, state updates, rendering

So the frontend game works **independently of AI**; AI only enhances two points:

1. 💬 `/api/agent` — Free-form questions outside the decision menus
2. 📊 `/api/summary` — Generate a feasibility report from the complete state

The backend is **completely stateless**: the Serverless Function keeps no session memory. Every request carries the full state from the frontend.

---

## 🚀 Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/yourname/moon-base.git
cd moon-base

# 2. Install Python dependencies (for the local AI backend)
pip install -r requirements.txt

# 3. Configure environment variables (for local testing)
cp .env.example .env.local
# Edit .env.local and add your DEEPSEEK_API_KEY (never commit real keys to git)

# 4. Start the frontend server
python -m http.server 8080

# 5. In another terminal, start the backend
uvicorn api.main:app --reload --port 8000
```

> 💡 If you don't need the AI features, any static server serving `index.html` will give you the full frontend experience.

---

## 📁 Project Structure

```
moon-base/
├── index.html              # Homepage + 3D Moon
├── menu.html               # Base tour / navigation
├── plan.html               # Main sandbox simulation page
├── modules.html            # Base architecture overview
├── timeline.html           # Construction timeline
├── data.html               # Lunar environment data
├── styles/
│   └── main.css            # Global styles
├── scripts/
│   ├── moon-render.js      # 3D Moon rendering
│   ├── state.js            # Single source of truth + rule engine
│   ├── plan.js             # Sandbox UI controller
│   ├── agent-client.js     # Backend API client
│   └── music-player.js     # Background music player
├── api/
│   └── main.py             # FastAPI backend
├── textures/               # Moon textures
├── music/                  # Background music
├── vercel.json             # Vercel deployment config
└── requirements.txt        # Python dependencies
```

---

## 🎯 Status & Roadmap

### ✅ Done

- [x] Interactive 3D Moon (rotate / zoom / marker hover)
- [x] 4 real-named base markers
- [x] Site selection → 3-step decisions → metrics calculation loop
- [x] Frontend rule-based simulation (no AI required)
- [x] AI open-ended Q&A + feasibility report
- [x] localStorage state persistence
- [x] Responsive design (desktop + mobile)
- [x] Background music play/pause
- [x] Smooth 5% step loading animation
- [x] Vercel deployment config

### 🔮 Possible Future

- [ ] Unlock more selectable sites (Tranquility / Imbrium / Tycho)
- [ ] More decision dimensions (communications, transport, life support)
- [ ] Save base configuration and shareable links
- [ ] Real RAG-based domain knowledge retrieval
- [ ] More output formats (recruitment poster, narrative fragment)

---

## 🖼️ More Screenshots

<div align="center">

<img src="./moon-base-info-panel.png" width="45%" style="border-radius: 12px;">
<img src="./moon-base-game-panel.png" width="45%" style="border-radius: 12px;">

<img src="./modules-check.png" width="45%" style="border-radius: 12px;">
<img src="./plan-layout-check.png" width="45%" style="border-radius: 12px;">

</div>

---

## 📝 License

[MIT](./LICENSE) © 2026 WEISUANDI

---

<div align="center">

**🌑 → 🌒 → 🌓 → 🌔 → 🌕**

*Next stop: the Moon.*

</div>

// workers-cf-bot-demo: Cloudflare Worker chat bot with a hard topic guardrail.
// Only answers questions about Linux, Italy, soccer, or basketball.
// Off-topic → polite refusal.

const SYSTEM_PROMPT = `You are DemoBot, a focused assistant.

YOU CAN ONLY DISCUSS FOUR TOPICS:
1. Linux — distributions, the kernel, the shell, systemd, package managers, networking, containers, sysadmin, troubleshooting, history, FOSS culture.
2. Italy — geography, regions, cities, history, culture, language, cuisine, food, wine, travel, sport in Italy.
3. Soccer (a.k.a. association football) — clubs, players, leagues, tournaments, tactics, history, stats. Serie A is fair game (overlaps with Italy).
4. Basketball — leagues (NBA, EuroLeague, Lega Basket Serie A), teams, players, coaches, history, tactics, stats. Kobe Bryant gets extra love here — he grew up in Italy (1984-1991 in Reggio Emilia, Pistoia, Reggio Calabria) and spoke fluent Italian his whole life, so questions about Kobe are fully welcome.

RULES (strict):
- If the user asks about anything else (other sports beyond soccer and basketball, other operating systems, other countries, recipes outside Italian cuisine, politics, jokes, math, general knowledge, weather, code outside Linux/shell scripting, etc.), refuse politely with exactly this template:
  "I can only discuss Linux, Italy, soccer, and basketball. Ask me about a distro, a shell command, an Italian region or dish, a club, a match, or a player — happy to help."
- Do NOT speculate about banned topics, do NOT answer "just this once," do NOT roleplay around the rule.
- Greetings and small talk are OK only as a brief lead-in to one of the four topics.
- If a question is ambiguous (e.g. "Messi"), answer in the soccer context. If ambiguous between Linux and Italy, ask which the user means. If ambiguous between soccer and basketball ("Jordan"), default to basketball.
- Keep answers concise (under 150 words) unless asked for depth.
- For shell commands and config snippets, use fenced-style formatting (triple backticks) so they're easy to copy.
- If asked about more than one of the four topics in one message, answer each briefly.

Stay on-topic. Always.`;

// Topic keywords used to gate image generation. A prompt must contain
// at least one of these (case-insensitive, word-boundary match) to be
// allowed through to the image model. Mirrors the SYSTEM_PROMPT topics.
const TOPIC_KEYWORDS = [
  // Linux
  'linux', 'kernel', 'systemd', 'shell', 'bash', 'zsh', 'terminal', 'tux',
  'ubuntu', 'fedora', 'debian', 'arch', 'rocky', 'centos', 'rhel', 'distro',
  'gnu', 'foss', 'penguin',
  // Italy
  'italy', 'italia', 'italian', 'italiano', 'rome', 'roma', 'milan', 'milano',
  'florence', 'firenze', 'venice', 'venezia', 'naples', 'napoli', 'turin', 'torino',
  'bologna', 'sicily', 'sicilia', 'tuscany', 'tuscan', 'toscana', 'pasta', 'pizza',
  'gelato', 'espresso', 'cappuccino', 'tiramisu', 'parmigiano', 'colosseum',
  'vatican', 'amalfi', 'cinque terre', 'dolomites', 'alps', 'apennines',
  'vineyard', 'olive', 'cypress',
  // Soccer
  'soccer', 'football', 'futbol', 'fútbol', 'calcio', 'goal', 'striker', 'pitch',
  'stadium', 'serie a', 'juventus', 'milan', 'inter', 'roma', 'napoli', 'lazio',
  'fiorentina', 'world cup', 'champions league', 'uefa', 'fifa',
  'cleats', 'boot', 'jersey', 'kit', 'maradona', 'pele', 'pelé', 'messi',
  'ronaldo', 'baggio', 'maldini', 'pirlo', 'buffon', 'totti', 'del piero',
  // Basketball
  'basketball', 'nba', 'euroleague', 'wnba', 'hoop', 'hoops', 'court',
  'dunk', 'three-pointer', 'three pointer', 'layup', 'rebound', 'assist',
  'lakers', 'celtics', 'bulls', 'warriors', 'heat', 'spurs', 'knicks',
  'lega basket', 'olimpia milano', 'virtus bologna',
  'kobe', 'bryant', 'mamba', 'jordan', 'lebron', 'shaq', 'magic johnson',
  'larry bird', 'kareem', 'duncan', 'curry', 'pippen', 'wilt chamberlain',
  'gasol', 'nowitzki', 'belinelli', 'gallinari', 'datome',
];

function isOnTopic(prompt) {
  const lower = String(prompt || '').toLowerCase();
  return TOPIC_KEYWORDS.some((k) => {
    // word-boundary regex; escape any regex specials in k
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
  });
}

const CHAT_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DemoBot · Linux, Italy, Soccer &amp; Basketball</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://images.unsplash.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg-0: #06060a;
    --bg-1: #0e0e14;
    --bg-2: #161620;
    --fg: #f5f5fa;
    --fg-mute: #9999b0;
    --accent-1: #ff7a18;   /* orange - primary highlight */
    --accent-1b: #ffb347;  /* lighter orange for gradient stops */
    --accent-2: #008c45;   /* green - Italy flag */
    --accent-3: #facc15;   /* amber - soccer accent */
    --accent-4: #22c55e;   /* green - linux (Tux-ish) */
    --border: rgba(255,255,255,0.08);
    --glass: rgba(255,255,255,0.04);
    --glass-strong: rgba(255,255,255,0.07);
    --shadow: 0 20px 60px -20px rgba(0,0,0,0.6);
  }
  [data-theme="light"] {
    --bg-0: #f7f7fb;
    --bg-1: #ffffff;
    --bg-2: #f0f0f5;
    --fg: #15151c;
    --fg-mute: #5a5a72;
    --border: rgba(0,0,0,0.08);
    --glass: rgba(255,255,255,0.7);
    --glass-strong: rgba(255,255,255,0.9);
    --shadow: 0 20px 50px -20px rgba(0,0,0,0.15);
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--fg);
    background: var(--bg-0);
    overflow: hidden;
    position: relative;
    -webkit-font-smoothing: antialiased;
  }

  /* Photographic background — deep, cinematic, low-contrast */
  .bg-image {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      radial-gradient(ellipse at center, rgba(10,10,15,0.55) 0%, rgba(6,6,10,0.92) 80%),
      linear-gradient(180deg, rgba(6,6,10,0.92) 0%, rgba(10,10,15,0.78) 40%, rgba(6,6,10,0.96) 100%),
      url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=70');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.7;
    filter: saturate(0.7) brightness(0.85);
  }
  [data-theme="light"] .bg-image {
    background-image:
      linear-gradient(180deg, rgba(247,247,251,0.9) 0%, rgba(247,247,251,0.7) 40%, rgba(247,247,251,0.95) 100%),
      url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=70');
    opacity: 0.35;
  }

  /* Animated gradient mesh on top of the photo */
  .bg-mesh {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(circle at 15% 20%, var(--accent-1) 0%, transparent 38%),
      radial-gradient(circle at 85% 25%, var(--accent-1b) 0%, transparent 36%),
      radial-gradient(circle at 50% 95%, var(--accent-3) 0%, transparent 32%);
    opacity: 0.32;
    filter: blur(80px);
    animation: drift 22s ease-in-out infinite alternate;
    mix-blend-mode: screen;
  }
  @keyframes drift {
    0%   { transform: translate(0, 0) scale(1); }
    50%  { transform: translate(-3%, 2%) scale(1.05); }
    100% { transform: translate(3%, -2%) scale(0.97); }
  }

  /* Grain overlay */
  .grain {
    position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.05;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  }

  .app {
    position: relative; z-index: 2;
    display: flex; flex-direction: column;
    height: 100vh; max-width: 920px; margin: 0 auto;
    padding: 16px;
  }

  /* Header */
  header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    background: var(--glass);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid var(--border);
    border-radius: 18px;
    box-shadow: var(--shadow);
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo {
    width: 40px; height: 40px; border-radius: 12px;
    background: linear-gradient(135deg, var(--accent-1), var(--accent-1b));
    display: grid; place-items: center; color: #fff;
    font-weight: 800; font-size: 18px;
    box-shadow: 0 6px 20px -4px var(--accent-1);
    position: relative;
  }
  .logo::after {
    content: ''; position: absolute; inset: -2px; border-radius: 14px;
    background: linear-gradient(135deg, var(--accent-1), var(--accent-1b), var(--accent-3));
    z-index: -1; opacity: 0.6; filter: blur(10px);
  }
  .title { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
  .subtitle { font-size: 12px; color: var(--fg-mute); margin-top: 2px; }
  .pills { display: flex; gap: 6px; margin-top: 4px; }
  .pill {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
    padding: 3px 8px; border-radius: 999px;
    background: var(--glass-strong); border: 1px solid var(--border);
    color: var(--fg-mute);
  }
  .pill.linux { color: var(--accent-4); border-color: color-mix(in srgb, var(--accent-4) 30%, transparent); }
  .pill.italy { color: var(--accent-2); border-color: color-mix(in srgb, var(--accent-2) 30%, transparent); }
  .pill.soccer { color: var(--accent-3); border-color: color-mix(in srgb, var(--accent-3) 30%, transparent); }
  .pill.basketball { color: var(--accent-1); border-color: color-mix(in srgb, var(--accent-1) 30%, transparent); }
  .pill .dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

  .controls { display: flex; gap: 8px; }
  .iconbtn {
    width: 38px; height: 38px; border-radius: 10px;
    background: var(--glass-strong); border: 1px solid var(--border);
    display: grid; place-items: center; cursor: pointer; color: var(--fg);
    transition: transform 0.15s, background 0.2s;
  }
  .iconbtn:hover { transform: translateY(-1px); background: color-mix(in srgb, var(--accent-1) 18%, var(--glass-strong)); }
  .iconbtn svg { width: 18px; height: 18px; }

  /* Hero (collapses after first message) */
  .hero {
    text-align: center; padding: 40px 20px 32px;
    transition: all 0.4s ease;
  }
  .hero.collapsed { padding: 16px 20px 0; }
  .hero h2 {
    font-size: clamp(28px, 4.5vw, 44px); margin: 0 0 8px;
    font-weight: 800; letter-spacing: -0.03em; line-height: 1.05;
    background: linear-gradient(135deg, var(--fg) 0%, var(--accent-1b) 60%, var(--accent-1) 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .hero p { color: var(--fg-mute); margin: 0; font-size: 15px; }
  .hero.collapsed h2 { font-size: 0; opacity: 0; height: 0; margin: 0; }
  .hero.collapsed p { font-size: 0; opacity: 0; height: 0; margin: 0; }

  .suggestions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 20px; }
  .suggest {
    padding: 10px 14px; border-radius: 12px; cursor: pointer;
    background: var(--glass); border: 1px solid var(--border);
    color: var(--fg); font: inherit; font-size: 13px;
    transition: all 0.18s;
    backdrop-filter: blur(10px);
  }
  .suggest:hover {
    transform: translateY(-2px);
    background: var(--glass-strong);
    border-color: color-mix(in srgb, var(--accent-1) 45%, var(--border));
    box-shadow: 0 8px 20px -8px var(--accent-1);
  }
  .suggest .emoji { margin-right: 6px; }
  .hero.collapsed .suggestions { display: none; }

  /* Chat */
  #chat {
    flex: 1; overflow-y: auto; padding: 12px 4px 16px;
    display: flex; flex-direction: column; gap: 12px;
    scroll-behavior: smooth;
  }
  #chat::-webkit-scrollbar { width: 8px; }
  #chat::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .msg {
    max-width: 78%; padding: 12px 16px; border-radius: 16px;
    white-space: pre-wrap; word-wrap: break-word;
    animation: pop 0.25s cubic-bezier(.2,.9,.3,1.2);
    line-height: 1.5; font-size: 14.5px;
  }
  @keyframes pop {
    0% { opacity: 0; transform: translateY(8px) scale(0.98); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .msg.bot {
    align-self: flex-start;
    background: var(--glass-strong); border: 1px solid var(--border);
    backdrop-filter: blur(12px);
    border-bottom-left-radius: 4px;
  }
  .msg.user {
    align-self: flex-end; color: #fff;
    background: linear-gradient(135deg, var(--accent-1) 0%, var(--accent-1b) 100%);
    border-bottom-right-radius: 4px;
    box-shadow: 0 8px 20px -10px var(--accent-1);
  }
  .msg .who {
    display: block; font-size: 11px; font-weight: 600; opacity: 0.65;
    margin-bottom: 4px; letter-spacing: 0.04em; text-transform: uppercase;
  }
  .msg.user .who { color: rgba(255,255,255,0.85); }

  .msg.msg-img {
    max-width: 80%;
    padding: 8px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .msg.msg-img .who { margin: 4px 6px 2px; }
  .msg.msg-img img {
    max-width: 100%; height: auto; display: block; border-radius: 12px;
    border: 1px solid var(--border);
    background: rgba(0,0,0,0.3);
  }
  .msg.msg-img .caption {
    font-size: 12px; color: var(--fg-mute); padding: 4px 6px 0;
    font-style: italic;
  }

  /* Typing dots */
  .typing { display: inline-flex; gap: 4px; align-items: center; height: 18px; }
  .typing span {
    width: 7px; height: 7px; border-radius: 50%; background: var(--fg-mute);
    animation: blink 1.2s infinite;
  }
  .typing span:nth-child(2) { animation-delay: 0.2s; }
  .typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink {
    0%, 60%, 100% { opacity: 0.25; transform: scale(0.85); }
    30% { opacity: 1; transform: scale(1); }
  }

  /* Composer */
  .composer {
    background: var(--glass-strong);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 8px 8px 8px 16px;
    display: flex; gap: 8px; align-items: center;
    backdrop-filter: blur(20px) saturate(180%);
    box-shadow: var(--shadow);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .composer:focus-within {
    border-color: color-mix(in srgb, var(--accent-1) 55%, var(--border));
    box-shadow: var(--shadow), 0 0 0 4px color-mix(in srgb, var(--accent-1) 18%, transparent);
  }
  #i {
    flex: 1; background: transparent; border: 0; outline: none;
    color: var(--fg); font: inherit; font-size: 15px; padding: 10px 0;
  }
  #i::placeholder { color: var(--fg-mute); }
  #b {
    width: 44px; height: 44px; border-radius: 12px; border: 0; cursor: pointer;
    background: linear-gradient(135deg, var(--accent-1), var(--accent-1b));
    color: #fff; display: grid; place-items: center;
    transition: transform 0.15s, opacity 0.2s, box-shadow 0.2s;
    box-shadow: 0 6px 16px -6px var(--accent-1);
  }
  #b:hover:not(:disabled) { transform: translateY(-1px) scale(1.03); box-shadow: 0 10px 22px -6px var(--accent-1); }
  #b:disabled { opacity: 0.5; cursor: wait; }
  #b svg { width: 18px; height: 18px; }

  /* Footer note */
  .foot {
    text-align: center; color: var(--fg-mute); font-size: 11px;
    margin-top: 10px; letter-spacing: 0.02em;
  }
  .foot kbd {
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    padding: 2px 5px; border-radius: 4px; border: 1px solid var(--border);
    background: var(--glass); margin: 0 2px;
  }

  @media (max-width: 600px) {
    .app { padding: 8px; }
    header { padding: 12px 14px; border-radius: 14px; }
    .title { font-size: 15px; }
    .subtitle { display: none; }
    .pills { display: none; }
    .hero { padding: 24px 12px 16px; }
    .msg { max-width: 92%; font-size: 14px; }
  }
</style>
</head>
<body data-theme="dark">
<div class="bg-image"></div>
<div class="bg-mesh"></div>
<div class="grain"></div>

<div class="app">
  <header>
    <div class="brand">
      <div class="logo">DB</div>
      <div>
        <div class="title">DemoBot</div>
        <div class="subtitle">Topic-bounded assistant · powered by Cloudflare Workers AI</div>
        <div class="pills">
          <span class="pill linux"><span class="dot"></span>LINUX</span>
          <span class="pill italy"><span class="dot"></span>ITALY</span>
          <span class="pill soccer"><span class="dot"></span>SOCCER</span>
          <span class="pill basketball"><span class="dot"></span>BASKETBALL</span>
        </div>
      </div>
    </div>
    <div class="controls">
      <button class="iconbtn" id="themeBtn" title="Toggle theme" aria-label="Toggle theme">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
      </button>
      <button class="iconbtn" id="resetBtn" title="New chat" aria-label="New chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>
      </button>
    </div>
  </header>

  <div class="hero" id="hero">
    <h2>Four topics.<br/>Infinite questions.</h2>
    <p>Ask me anything about Linux, Italy, soccer, or basketball. Anything else, I'll politely decline.</p>
    <div class="suggestions" id="suggestions">
      <button class="suggest" data-q="Explain systemd targets vs runlevels."><span class="emoji">🐧</span>systemd targets vs runlevels</button>
      <button class="suggest" data-q="What's the difference between apt, dnf, and pacman?"><span class="emoji">📦</span>apt vs dnf vs pacman</button>
      <button class="suggest" data-q="What's the best region in Italy for food and why?"><span class="emoji">🍝</span>Best food region in Italy</button>
      <button class="suggest" data-q="Which Italian club has the most Serie A titles?"><span class="emoji">⚽</span>Most Serie A titles</button>
      <button class="suggest" data-q="Tell me the story of Kobe Bryant's childhood in Italy in depth."><span class="emoji">🇮🇹</span>Kobe in Italy (in depth)</button>
      <button class="suggest" data-q="Compare Kobe Bryant and Michael Jordan."><span class="emoji">🏀</span>Kobe vs Jordan</button>
      <button class="suggest" data-q="What's the difference between NBA and EuroLeague?"><span class="emoji">🏆</span>NBA vs EuroLeague</button>
      <button class="suggest" data-q="Draw a Tuscan vineyard at golden hour"><span class="emoji">🎨</span>Generate: Tuscan vineyard</button>
      <button class="suggest" data-q="Show me Tux the Linux penguin in a stadium"><span class="emoji">🎨</span>Generate: Tux at a stadium</button>
    </div>
  </div>

  <div id="chat" aria-live="polite"></div>

  <form class="composer" id="f" autocomplete="off">
    <input id="i" placeholder="Ask about a distro, an Italian region, a Serie A match, a basketball player…" aria-label="Message" />
    <button id="b" aria-label="Send">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </button>
  </form>
  <div class="foot">Press <kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for newline · Off-topic prompts will be declined</div>
</div>

<script>
  const chat = document.getElementById('chat');
  const form = document.getElementById('f');
  const input = document.getElementById('i');
  const btn = document.getElementById('b');
  const hero = document.getElementById('hero');
  const themeBtn = document.getElementById('themeBtn');
  const resetBtn = document.getElementById('resetBtn');
  const suggestions = document.getElementById('suggestions');
  let history = [];

  function add(role, text) {
    const d = document.createElement('div');
    d.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = role === 'user' ? 'You' : 'DemoBot';
    const body = document.createElement('span');
    body.textContent = text;
    d.appendChild(who);
    d.appendChild(body);
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
    return body;
  }

  function addTyping(label) {
    const d = document.createElement('div');
    d.className = 'msg bot';
    const text = label || 'DemoBot';
    d.innerHTML = '<span class="who">' + text + '</span><span class="typing"><span></span><span></span><span></span></span>';
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
    return d;
  }

  function addImage(blob, caption) {
    const d = document.createElement('div');
    d.className = 'msg bot msg-img';
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = 'DemoBot · image';
    d.appendChild(who);
    const img = document.createElement('img');
    img.src = URL.createObjectURL(blob);
    img.alt = caption || 'generated image';
    img.loading = 'lazy';
    d.appendChild(img);
    if (caption) {
      const cap = document.createElement('span');
      cap.className = 'caption';
      cap.textContent = caption;
      d.appendChild(cap);
    }
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
    return d;
  }

  // Detect image-generation intent in the user's message.
  // Triggers: draw, paint, generate, create, show me, picture/image/photo of, etc.
  function detectImageIntent(q) {
    return /\b(draw|paint|generate|create|render|sketch|illustrate)\b.*\b(image|picture|photo|illustration)?\b/i.test(q)
      || /\b(image|picture|photo|illustration|artwork)\s+of\b/i.test(q)
      || /^show me\s+(a|an|the)\b/i.test(q.trim());
  }

  async function send(q) {
    if (!q.trim()) return;
    hero.classList.add('collapsed');
    add('user', q);
    input.value = '';
    btn.disabled = true;

    // Image branch
    if (detectImageIntent(q)) {
      const typing = addTyping('DemoBot · generating image');
      try {
        const r = await fetch('/api/image', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prompt: q }),
        });
        typing.remove();
        if (!r.ok) {
          let data = {};
          try { data = await r.json(); } catch {}
          const msg = data.message || data.error || ('Error ' + r.status);
          add('bot', msg);
          history.push({ role: 'user', content: q });
          history.push({ role: 'assistant', content: msg });
        } else {
          const blob = await r.blob();
          addImage(blob, q);
          history.push({ role: 'user', content: q });
          history.push({ role: 'assistant', content: '(generated an image)' });
        }
      } catch (err) {
        typing.remove();
        add('bot', 'Error: ' + err.message);
      } finally {
        btn.disabled = false;
        input.focus();
      }
      return;
    }

    // Chat branch
    history.push({ role: 'user', content: q });
    const typing = addTyping();
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await r.json();
      const reply = data.reply || data.error || '(no reply)';
      typing.remove();
      add('bot', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      typing.remove();
      add('bot', 'Error: ' + err.message);
    } finally {
      btn.disabled = false;
      input.focus();
    }
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });

  suggestions.addEventListener('click', (e) => {
    const t = e.target.closest('.suggest');
    if (!t) return;
    send(t.dataset.q);
  });

  resetBtn.addEventListener('click', () => {
    history = [];
    chat.innerHTML = '';
    hero.classList.remove('collapsed');
    input.focus();
  });

  themeBtn.addEventListener('click', () => {
    const cur = document.body.dataset.theme;
    const next = cur === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
  });

  // Restore theme
  try {
    const saved = localStorage.getItem('theme');
    if (saved) document.body.dataset.theme = saved;
  } catch {}

  input.focus();
</script>
</body>
</html>`;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Common security headers applied to every response
const SECURITY_HEADERS = {
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
};

function withSecurity(resp) {
  const h = new Headers(resp.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) h.set(k, v);
  return new Response(resp.body, { status: resp.status, headers: h });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Force HTTPS — 301 redirect any plain-http request
    // CF puts the original scheme in cf-visitor; trust the URL protocol too.
    const cfVisitor = request.headers.get('cf-visitor') || '';
    const isHttp = url.protocol === 'http:' || cfVisitor.includes('"scheme":"http"');
    if (isHttp) {
      url.protocol = 'https:';
      return new Response(null, {
        status: 301,
        headers: {
          location: url.toString(),
          'strict-transport-security': SECURITY_HEADERS['strict-transport-security'],
        },
      });
    }

    // Static chat UI
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return withSecurity(new Response(CHAT_HTML, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=60',
        },
      }));
    }

    // Health check
    if (url.pathname === '/healthz') {
      return withSecurity(new Response('ok', { headers: { 'content-type': 'text/plain' } }));
    }

    // Chat API
    if (request.method === 'POST' && url.pathname === '/api/chat') {
      let body;
      try {
        body = await request.json();
      } catch {
        return withSecurity(json({ error: 'invalid json' }, 400));
      }

      const userMessages = Array.isArray(body.messages) ? body.messages : [];
      // Trim to last 12 turns to keep prompt size sane
      const trimmed = userMessages.slice(-12).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content || '').slice(0, 2000),
      }));

      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...trimmed,
      ];

      // Dynamic depth: if the user's last message asks for depth, raise
      // the token ceiling so the model can actually go deep. Default stays
      // small for fast/cheap snappy replies.
      //   - default: 512 tokens  ≈ 350 words
      //   - depth:   2048 tokens ≈ 1500 words (max useful reply length)
      const lastUser = trimmed.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
      const wantsDepth = /\b(in depth|in-depth|detailed?|comprehensive|long|extensive|thorough|explain everything|all the details|deep dive|deep-dive|tell me everything)\b/i.test(lastUser);
      const max_tokens = wantsDepth ? 2048 : 512;

      try {
        const model = env.MODEL || '@cf/meta/llama-3.1-8b-instruct';
        // Route through AI Gateway so safety guardrails (Llama Guard),
        // cache, rate limit, and logging — all dashboard-managed — apply.
        // Gateway id is injected via the GATEWAY_ID plain-text binding.
        const aiOptions = env.GATEWAY_ID
          ? { gateway: { id: env.GATEWAY_ID } }
          : undefined;
        const result = await env.AI.run(
          model,
          {
            messages,
            max_tokens,
            temperature: 0.4,
          },
          aiOptions,
        );
        const reply = (result && (result.response || result.result?.response)) || '(empty response)';
        return withSecurity(json({ reply, depth: wantsDepth }));
      } catch (err) {
        // AI Gateway Guardrails block codes (when enabled in the dashboard):
        //   2016 = prompt blocked by guardrails
        //   2017 = model response blocked by guardrails
        // https://developers.cloudflare.com/ai-gateway/features/guardrails/set-up-guardrail/
        const msg = err && err.message ? err.message : String(err);
        if (msg.includes('2016')) {
          return withSecurity(json({
            reply: 'Your message was blocked by safety guardrails. Please rephrase.',
            blocked: 'prompt',
          }, 200));
        }
        if (msg.includes('2017')) {
          return withSecurity(json({
            reply: "I had a response ready, but it didn't pass the safety guardrails. Try a different angle on the question.",
            blocked: 'response',
          }, 200));
        }
        return withSecurity(json({ error: 'AI error: ' + msg }, 500));
      }
    }

    // Image API — generates a single image from a text prompt.
    // GATED: prompt MUST contain at least one Linux/Italy/soccer keyword
    // or it gets refused (same topic policy as chat).
    if (request.method === 'POST' && url.pathname === '/api/image') {
      let body;
      try {
        body = await request.json();
      } catch {
        return withSecurity(json({ error: 'invalid json' }, 400));
      }

      const prompt = String(body.prompt || '').slice(0, 500).trim();
      if (!prompt) {
        return withSecurity(json({ error: 'missing prompt' }, 400));
      }

      // Topic guardrail — same allowlist as chat (Linux / Italy / soccer / basketball).
      if (!isOnTopic(prompt)) {
        return withSecurity(json({
          error: 'off-topic',
          message: 'I can only generate images of Linux, Italy, soccer, or basketball subjects. Try something like "a Tuscan vineyard at sunset", "Tux the penguin", "a Juventus jersey on a pitch", or "Kobe taking a fadeaway".',
        }, 422));
      }

      try {
        const imageModel = env.MODEL_IMAGE || '@cf/bytedance/stable-diffusion-xl-lightning';
        const aiOptions = env.GATEWAY_ID
          ? { gateway: { id: env.GATEWAY_ID } }
          : undefined;
        // Workers AI image models return a binary Response (stream) directly.
        const imgResp = await env.AI.run(
          imageModel,
          { prompt },
          aiOptions,
        );
        // imgResp can be a ReadableStream or Response-like; pipe through.
        const headers = new Headers({
          'content-type': 'image/png',
          'cache-control': 'public, max-age=60',
        });
        for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
        return new Response(imgResp, { headers });
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (msg.includes('2016')) {
          return withSecurity(json({
            error: 'blocked-prompt',
            message: 'Your image prompt was blocked by safety guardrails. Try a different description.',
          }, 200));
        }
        if (msg.includes('2017')) {
          return withSecurity(json({
            error: 'blocked-response',
            message: 'The generated image was blocked by safety guardrails. Try a different prompt.',
          }, 200));
        }
        return withSecurity(json({ error: 'AI error: ' + msg }, 500));
      }
    }

    return withSecurity(new Response('Not found', { status: 404 }));
  },
};

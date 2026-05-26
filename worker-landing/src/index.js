// workers-cf-landing-demo: landing page for remo.itlinux.cc
// Personal landing — distinct from the apex itlinux.cc.
// Single static HTML, no AI, no Tunnel, no Access. Just a hello.
//
// i18n: visitors from Italy (request.cf.country === 'IT') see the page
// in Italian; everyone else sees English. A ?lang=it / ?lang=en query
// string overrides the auto-detection.

const HERO_IMG  = 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=2400&q=75';
const TILE_BOT  = 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=75';
// Kobe Bryant tribute tile — image: Wikimedia Commons, CC BY-SA 2.0
// Photo by user 27003603@N00 on Flickr (uploaded to Commons under CC BY-SA 2.0)
const TILE_KOBE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Kobe_Bryant_2014.jpg/1280px-Kobe_Bryant_2014.jpg';

// ---------- i18n strings ----------
const STRINGS = {
  en: {
    htmlLang: 'en',
    pageTitle: 'remo.itlinux.cc · Remo Mattei',
    metaDescription: 'Remo Mattei — Senior Cloudflare One Specialist Solutions Engineer. Workers, Workers AI, and Zero Trust experiments. Italian. Linux nerd. Soccer fan.',
    ogDescription: 'Senior Cloudflare One Specialist SE @ Cloudflare. Workers AI demo + Linux/Italy/soccer/basketball chat bot.',

    navAbout: 'About',
    navLabs: 'Labs',
    navStack: 'Stack',
    navDemoBot: 'DemoBot',
    navLinkedIn: 'LinkedIn',
    navLangOther: 'IT',
    langSwitchHref: '?lang=it',

    eyebrow: 'Ciao — sono Remo',
    tagline: '<strong>Senior Cloudflare One Specialist Solutions Engineer</strong> @ Cloudflare. Italian. Linux nerd. Soccer fan. This corner is for small <strong>Workers</strong> and <strong>Workers AI</strong> demos — built entirely on Cloudflare.',
    badgeLinux: '🐧 LINUX',
    badgeItalia: '🇮🇹 ITALIA',
    badgeSoccer: '⚽ SOCCER',
    badgeBasket: '🏀 BASKETBALL',
    heroPitch: 'Every site has a chatbot now. <strong>This one says <em>no</em> — a lot.</strong> It only talks about four things I actually care about: Linux, Italy, soccer, and basketball (mostly Kobe). Ask about anything else and it politely tells you to get lost. The refusal <em>is</em> the demo.',
    btnTryBot: 'Try DemoBot',

    aboutH2Lead: 'About ',
    aboutH2Accent: 'this corner',
    aboutH2Tail: '.',
    aboutSub: 'Different from <a href="https://itlinux.cc" style="color:var(--accent)">itlinux.cc</a> — that one is the apex. This subdomain (<code>remo.itlinux.cc</code>) is just me, plus the small things I build to learn Cloudflare\'s stack.',
    aboutP1: 'I\'m <strong>Remo Mattei</strong>, <strong>Senior Cloudflare One Specialist Solutions Engineer</strong>, covering North America Enterprise. My day job: helping Fortune-500s plan Zero Trust rollouts, work through Workers AI proofs of concept, and untangle network architectures that have grown one decision at a time.',
    aboutP2: 'This little subdomain hosts my <strong>Workers AI</strong> playground — a chat bot with a hard topic guardrail (Linux, Italy, soccer, basketball, and nothing else). Everything is deployed by Terraform and lives entirely on Cloudflare\'s edge. No VMs. No origins. No inbound ports.',
    aboutNoteLabel: 'Note:',
    aboutNoteBody: 'the source code for this site is on <a href="https://github.com/remocloudflare/workers-cloudflare-bot-demo" target="_blank" rel="noopener"><strong>GitHub</strong></a>. Fork it, read the Terraform, steal the system-prompt guardrail — go wild.',

    labsH2Lead: 'The ',
    labsH2Accent1: 'labs',
    labsH2Mid: ' &amp; ',
    labsH2Accent2: 'la mia passione',
    labsH2Tail: '.',
    labsSub: 'A Workers AI demo on the left. A small tribute to my favourite player on the right.',

    tileBotKicker: 'Workers AI · Llama 3.1',
    tileBotTitle: 'DemoBot',
    tileBotDesc: 'A topic-bounded chat assistant. Only answers questions about Linux, Italy, soccer, or basketball. Anything else — politely declined. System-prompt guardrails plus a clientless chat UI, all served by a single Cloudflare Worker.',
    tileBotCta: 'Try it',

    tileKobeKicker: 'Mamba Mentality · Reggio Emilia, 1984',
    tileKobeTitle: 'Kobe ❤️ Italia',
    tileKobeDesc: 'My favourite player grew up in Italy. Kobe Bryant lived in Reggio Emilia, Pistoia, and Reggio Calabria from age 6 to 13 while his dad played in the Italian league. He spoke fluent Italian his entire life and always said Italy shaped his game. <em>Mamba forever.</em>',
    tileKobeCta: 'Read more',

    stackEdgeLabel: 'Edge',
    stackEdgeValue: 'Cloudflare Workers',
    stackEdgeNote: 'Bot + landing, both Workers',
    stackModelLabel: 'Model',
    stackModelValue: 'Llama 3.1 8B',
    stackModelNote: 'via Workers AI',
    stackDnsLabel: 'DNS',
    stackDnsValue: 'itlinux.cc',
    stackDnsNote: 'Custom domains, Terraform-managed',
    stackIacLabel: 'IaC',
    stackIacValue: 'Terraform',
    stackIacNote: 'cloudflare/cloudflare ~&gt; 5.0',
    stackOriginsLabel: 'Origins',
    stackOriginsValue: 'None',
    stackOriginsNote: 'No VMs, no Tunnel, no inbound',
    stackSourceLabel: 'Source',
    stackSourceValue: 'GitHub',
    stackSourceNote: 'github.com/remocloudflare/workers-cloudflare-bot-demo',

    footCopyright: '© 2026 Remo Mattei · Made on Cloudflare',
    footAttributionLead: 'Kobe Bryant photo by user',
    footAttributionFlickr: 'on Flickr, via',
    footAttributionCommons: 'Wikimedia Commons',
    footAttributionLicensed: ', licensed under',
  },

  it: {
    htmlLang: 'it',
    pageTitle: 'remo.itlinux.cc · Remo Mattei',
    metaDescription: 'Remo Mattei — Senior Cloudflare One Specialist Solutions Engineer. Esperimenti con Workers, Workers AI e Zero Trust. Italiano. Appassionato di Linux. Tifoso di calcio e basket (soprattutto Kobe).',
    ogDescription: 'Senior Cloudflare One Specialist SE @ Cloudflare. Demo di Workers AI + chat bot Linux/Italia/calcio/basket.',

    navAbout: 'Chi sono',
    navLabs: 'Lab',
    navStack: 'Stack',
    navDemoBot: 'DemoBot',
    navLinkedIn: 'LinkedIn',
    navLangOther: 'EN',
    langSwitchHref: '?lang=en',

    eyebrow: 'Ciao — sono Remo',
    tagline: '<strong>Senior Cloudflare One Specialist Solutions Engineer</strong> @ Cloudflare. Italiano. Linuxaro. Appassionato di calcio e basket. Questo angolo è dedicato a piccoli esperimenti con <strong>Workers</strong> e <strong>Workers AI</strong> — tutto costruito su Cloudflare.',
    badgeLinux: '🐧 LINUX',
    badgeItalia: '🇮🇹 ITALIA',
    badgeSoccer: '⚽ CALCIO',
    badgeBasket: '🏀 BASKET',
    heroPitch: 'Ormai ogni sito ha un chatbot. <strong>Questo invece dice <em>no</em> — spesso.</strong> Parla soltanto di quattro cose che mi stanno davvero a cuore: Linux, Italia, calcio e basket (soprattutto Kobe). Chiedigli qualunque altra cosa e ti manderà gentilmente a quel paese. Il rifiuto <em>è</em> la demo.',
    btnTryBot: 'Prova DemoBot',

    aboutH2Lead: 'Chi vive in ',
    aboutH2Accent: 'questo angolo',
    aboutH2Tail: '.',
    aboutSub: 'Diverso da <a href="https://itlinux.cc" style="color:var(--accent)">itlinux.cc</a> — quello è il dominio principale. Questo sottodominio (<code>remo.itlinux.cc</code>) sono solo io, più le piccole cose che costruisco per imparare lo stack di Cloudflare.',
    aboutP1: 'Sono <strong>Remo Mattei</strong>, <strong>Senior Cloudflare One Specialist Solutions Engineer</strong>, mi occupo dei clienti Enterprise del Nord America. Nel quotidiano: aiuto aziende Fortune 500 a pianificare l\'adozione di Zero Trust, sviluppo proof-of-concept con Workers AI e districo architetture di rete cresciute una decisione alla volta.',
    aboutP2: 'Questo sottodominio ospita il mio parco giochi su <strong>Workers AI</strong> — un chat bot con un confine tematico molto rigido (Linux, Italia, calcio, basket, e nient\'altro). Tutto è gestito con Terraform e vive interamente sull\'edge di Cloudflare. Niente VM. Niente origini. Niente porte in ingresso.',
    aboutNoteLabel: 'Nota:',
    aboutNoteBody: 'il codice sorgente di questo sito è su <a href="https://github.com/remocloudflare/workers-cloudflare-bot-demo" target="_blank" rel="noopener"><strong>GitHub</strong></a>. Forkalo, leggi il Terraform, ruba la tecnica del guardrail via system prompt — divertiti.',

    labsH2Lead: 'I ',
    labsH2Accent1: 'lab',
    labsH2Mid: ' &amp; ',
    labsH2Accent2: 'la mia passione',
    labsH2Tail: '.',
    labsSub: 'Una demo di Workers AI a sinistra. Un piccolo omaggio al mio giocatore preferito a destra.',

    tileBotKicker: 'Workers AI · Llama 3.1',
    tileBotTitle: 'DemoBot',
    tileBotDesc: 'Un assistente di chat con confine tematico. Risponde solo a domande su Linux, Italia, calcio o basket. Tutto il resto viene declinato — con garbo. Guardrail nel system prompt, interfaccia chat clientless, il tutto servito da un singolo Cloudflare Worker.',
    tileBotCta: 'Provalo',

    tileKobeKicker: 'Mamba Mentality · Reggio Emilia, 1984',
    tileKobeTitle: 'Kobe ❤️ Italia',
    tileKobeDesc: 'Il mio giocatore preferito è cresciuto in Italia. Kobe Bryant ha vissuto a Reggio Emilia, Pistoia e Reggio Calabria dai 6 ai 13 anni, mentre suo padre giocava nel campionato italiano. Ha parlato italiano fluentemente per tutta la vita e ha sempre detto che l\'Italia ha plasmato il suo gioco. <em>Mamba forever.</em>',
    tileKobeCta: 'Scopri di più',

    stackEdgeLabel: 'Edge',
    stackEdgeValue: 'Cloudflare Workers',
    stackEdgeNote: 'Bot + landing, entrambi Workers',
    stackModelLabel: 'Modello',
    stackModelValue: 'Llama 3.1 8B',
    stackModelNote: 'via Workers AI',
    stackDnsLabel: 'DNS',
    stackDnsValue: 'itlinux.cc',
    stackDnsNote: 'Domini custom, gestiti con Terraform',
    stackIacLabel: 'IaC',
    stackIacValue: 'Terraform',
    stackIacNote: 'cloudflare/cloudflare ~&gt; 5.0',
    stackOriginsLabel: 'Origini',
    stackOriginsValue: 'Nessuna',
    stackOriginsNote: 'Niente VM, niente Tunnel, niente ingressi',
    stackSourceLabel: 'Sorgente',
    stackSourceValue: 'GitHub',
    stackSourceNote: 'github.com/remocloudflare/workers-cloudflare-bot-demo',

    footCopyright: '© 2026 Remo Mattei · Fatto su Cloudflare',
    footAttributionLead: 'Foto di Kobe Bryant dell\'utente',
    footAttributionFlickr: 'su Flickr, tramite',
    footAttributionCommons: 'Wikimedia Commons',
    footAttributionLicensed: ', con licenza',
  },
};

// ---------- HTML renderer ----------
function renderHTML(lang) {
  const t = STRINGS[lang] || STRINGS.en;
  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t.pageTitle}</title>
<meta name="theme-color" content="#0EA5E9">
<meta name="description" content="${t.metaDescription}">
<meta property="og:title" content="Remo · remo.itlinux.cc">
<meta property="og:description" content="${t.ogDescription}">
<meta property="og:type" content="website">
<meta property="og:image" content="${HERO_IMG}">
<meta property="og:locale" content="${lang === 'it' ? 'it_IT' : 'en_US'}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://images.unsplash.com" crossorigin>
<link rel="preload" as="image" href="${HERO_IMG}" fetchpriority="high">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg-0: #050810;
    --bg-1: #0a0f1a;
    --bg-2: #111824;
    --fg: #ffffff;
    --fg-mute: #95a3b8;
    --accent: #0EA5E9;       /* cyan/sky — distinct from itlinux.cc orange */
    --accent-2: #38bdf8;
    --accent-3: #f472b6;     /* pink for hover accents */
    --border: rgba(255,255,255,0.08);
    --glass: rgba(10,14,22,0.6);
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg-0);
    color: var(--fg);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  a { color: inherit; text-decoration: none; }

  /* ====== Navigation ====== */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
    background: rgba(5,8,16,0.65);
    backdrop-filter: blur(18px) saturate(180%);
    -webkit-backdrop-filter: blur(18px) saturate(180%);
    border-bottom: 1px solid var(--border);
  }
  nav .inner {
    max-width: 1200px; margin: 0 auto; padding: 16px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand .logo {
    width: 38px; height: 38px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    display: grid; place-items: center; color: #fff;
    font-weight: 900; font-size: 14px; letter-spacing: -0.02em;
    box-shadow: 0 6px 20px -6px var(--accent);
    position: relative;
  }
  .brand .logo::after {
    content: ''; position: absolute; inset: -3px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    z-index: -1; opacity: 0.45; filter: blur(10px);
  }
  .brand-name {
    font-weight: 800; font-size: 15px; letter-spacing: 0.01em;
  }
  .brand-name span { color: var(--accent); }
  .navlinks { display: flex; align-items: center; gap: 28px; }
  .navlinks a {
    font-size: 12px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--fg-mute);
    transition: color 0.15s;
  }
  .navlinks a:hover { color: var(--accent); }
  .navlinks a.lang {
    padding: 4px 10px; border: 1px solid var(--border); border-radius: 999px;
    letter-spacing: 0.1em; font-size: 11px;
  }
  .navlinks a.lang:hover { border-color: var(--accent); color: var(--accent); }
  @media (max-width: 700px) {
    .navlinks a:not(.lang) { display: none; }
  }

  /* ====== Hero ====== */
  .hero {
    position: relative;
    min-height: 92vh;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    padding: 120px 24px 80px;
  }
  .hero-bg {
    position: absolute; inset: 0; z-index: 0;
    background-image: url('${HERO_IMG}');
    background-size: cover; background-position: center;
    filter: saturate(0.85) brightness(0.5);
  }
  .hero-overlay {
    position: absolute; inset: 0; z-index: 1;
    background:
      radial-gradient(ellipse at top right, rgba(14,165,233,0.22) 0%, rgba(5,8,16,0) 60%),
      radial-gradient(ellipse at bottom left, rgba(244,114,182,0.12) 0%, rgba(5,8,16,0) 55%),
      linear-gradient(180deg, rgba(5,8,16,0.55) 0%, rgba(5,8,16,0.4) 40%, rgba(5,8,16,0.95) 100%);
  }
  .hero-grain {
    position: absolute; inset: 0; z-index: 1; opacity: 0.08; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  }
  .hero-content {
    position: relative; z-index: 2;
    max-width: 880px; text-align: center;
    animation: rise 0.9s cubic-bezier(.2,.7,.2,1) both;
  }
  @keyframes rise {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .eyebrow {
    font-family: 'JetBrains Mono', monospace;
    color: var(--accent); font-size: 12px;
    text-transform: uppercase; letter-spacing: 0.32em;
    margin: 0 0 24px;
  }
  .display {
    font-size: clamp(48px, 9vw, 110px);
    font-weight: 900; line-height: 0.95; letter-spacing: -0.04em;
    margin: 0 0 16px;
    background: linear-gradient(135deg, #ffffff 0%, #c8e3ff 55%, var(--accent) 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .display .stroke {
    color: transparent;
    -webkit-text-stroke: 2px rgba(255,255,255,0.55);
    background: none;
  }
  .tagline {
    font-size: clamp(16px, 2vw, 21px); color: var(--fg-mute);
    margin: 0 auto 36px; max-width: 620px; line-height: 1.5;
  }
  .tagline strong { color: var(--accent); }
  .badges {
    display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
    margin: 0 0 28px;
  }
  .badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    padding: 6px 12px; border-radius: 999px;
    background: rgba(14,165,233,0.08);
    border: 1px solid rgba(14,165,233,0.35);
    color: var(--accent);
  }
  .hero-pitch {
    max-width: 580px; margin: 0 auto 32px;
    padding: 16px 22px;
    background: rgba(14,165,233,0.06);
    border: 1px solid rgba(14,165,233,0.18);
    border-radius: 12px;
    color: var(--fg-mute);
    font-size: 14.5px; line-height: 1.55;
  }
  .hero-pitch strong { color: var(--accent); }
  .cta-row {
    display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
  }
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 26px; border-radius: 10px;
    font-weight: 700; font-size: 14px; letter-spacing: 0.06em;
    text-transform: uppercase; cursor: pointer;
    transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    color: #002030; border: 0;
    box-shadow: 0 10px 30px -10px var(--accent);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 36px -10px var(--accent); }
  .btn svg { width: 14px; height: 14px; }

  /* ====== About + Tiles ====== */
  .section { padding: 80px 24px; max-width: 1200px; margin: 0 auto; }
  .section-head {
    display: flex; align-items: end; justify-content: space-between;
    margin: 0 0 32px; gap: 24px; flex-wrap: wrap;
  }
  .section-head h2 {
    font-size: clamp(28px, 4vw, 40px); font-weight: 800; margin: 0;
    letter-spacing: -0.02em;
  }
  .section-head h2 span { color: var(--accent); }
  .section-head p {
    color: var(--fg-mute); margin: 0; font-size: 15px; max-width: 480px;
  }

  .about {
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px;
    margin-bottom: 40px;
  }
  .about p {
    color: var(--fg-mute); font-size: 17px; line-height: 1.7; margin: 0 0 12px;
    max-width: 760px;
  }
  .about p:last-child { margin-bottom: 0; }
  .about strong { color: var(--fg); }
  .about a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
  .about p.note {
    margin-top: 20px;
    padding: 16px 20px;
    background: rgba(244,114,182,0.08);
    border-left: 3px solid var(--accent-3);
    border-radius: 8px;
    font-size: 14.5px;
    color: var(--fg-mute);
  }
  .about p.note strong { color: var(--accent-3); }

  .tiles {
    display: grid; gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  .tile {
    position: relative; overflow: hidden; border-radius: 16px;
    background: var(--bg-1); border: 1px solid var(--border);
    transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
    display: flex; flex-direction: column;
    min-height: 380px;
  }
  .tile:hover {
    transform: translateY(-4px);
    border-color: rgba(14,165,233,0.45);
    box-shadow: 0 20px 50px -20px rgba(14,165,233,0.3);
  }
  .tile-img {
    height: 200px;
    background-size: cover; background-position: center;
    position: relative;
  }
  .tile-img::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 40%, var(--bg-1) 100%);
  }
  .tile-body {
    padding: 24px; flex: 1;
    display: flex; flex-direction: column; gap: 10px;
  }
  .tile-kicker {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: var(--accent);
    text-transform: uppercase; letter-spacing: 0.18em;
  }
  .tile-title {
    font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.01em;
  }
  .tile-desc {
    color: var(--fg-mute); font-size: 14px; line-height: 1.55; margin: 0;
    flex: 1;
  }
  .tile-cta {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 700; color: var(--accent);
    text-transform: uppercase; letter-spacing: 0.1em;
    margin-top: 8px;
  }
  .tile-cta svg { width: 14px; height: 14px; transition: transform 0.2s; }
  .tile:hover .tile-cta svg { transform: translateX(3px); }

  /* ====== Stack ====== */
  .stack {
    background: var(--bg-1); border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 60px 24px;
  }
  .stack-inner {
    max-width: 1200px; margin: 0 auto;
    display: grid; gap: 30px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
  .stack-item {
    display: flex; flex-direction: column; gap: 6px;
  }
  .stack-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; color: var(--accent);
    text-transform: uppercase; letter-spacing: 0.22em;
  }
  .stack-value {
    font-size: 18px; font-weight: 700;
  }
  .stack-note {
    font-size: 13px; color: var(--fg-mute);
  }

  /* ====== Footer ====== */
  footer {
    padding: 50px 24px 40px;
    border-top: 1px solid var(--border);
    background: var(--bg-1);
  }
  .foot-inner {
    max-width: 1200px; margin: 0 auto;
    display: flex; justify-content: space-between; align-items: center;
    gap: 24px; flex-wrap: wrap;
  }
  .foot-left { display: flex; align-items: center; gap: 16px; }
  .foot-right {
    display: flex; gap: 22px; color: var(--fg-mute); font-size: 13px;
  }
  .foot-right a:hover { color: var(--accent); }
  .copyright { color: var(--fg-mute); font-size: 12px; }
  .attribution {
    max-width: 1200px; margin: 24px auto 0;
    padding-top: 18px; border-top: 1px solid var(--border);
    font-size: 11px; color: var(--fg-mute);
    text-align: center; line-height: 1.6;
  }
  .attribution a {
    color: var(--fg-mute); text-decoration: underline;
    text-decoration-style: dotted; text-underline-offset: 2px;
  }
  .attribution a:hover { color: var(--accent); }

  ::selection { background: var(--accent); color: #002030; }
</style>
</head>
<body>

<nav>
  <div class="inner">
    <a class="brand" href="/">
      <div class="logo">RM</div>
      <div class="brand-name">remo<span>.itlinux.cc</span></div>
    </a>
    <div class="navlinks">
      <a href="#about">${t.navAbout}</a>
      <a href="#labs">${t.navLabs}</a>
      <a href="#stack">${t.navStack}</a>
      <a href="https://bot-cloudflare.itlinux.cc/">${t.navDemoBot}</a>
      <a href="https://linkedin.com/in/remomattei" target="_blank" rel="noopener">${t.navLinkedIn}</a>
      <a class="lang" href="${t.langSwitchHref}" rel="nofollow" title="${lang === 'it' ? 'Switch to English' : 'Passa all&#39;italiano'}">${t.navLangOther}</a>
    </div>
  </div>
</nav>

<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-overlay"></div>
  <div class="hero-grain"></div>
  <div class="hero-content">
    <p class="eyebrow">${t.eyebrow}</p>
    <h1 class="display">REMO<span class="stroke">MATTEI</span></h1>
    <p class="tagline">${t.tagline}</p>
    <div class="badges">
      <span class="badge">${t.badgeLinux}</span>
      <span class="badge">${t.badgeItalia}</span>
      <span class="badge">${t.badgeSoccer}</span>
      <span class="badge">${t.badgeBasket}</span>
    </div>
    <p class="hero-pitch">${t.heroPitch}</p>
    <div class="cta-row">
      <a class="btn btn-primary" href="https://bot-cloudflare.itlinux.cc/">
        ${t.btnTryBot}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
    </div>
  </div>
</section>

<section class="section" id="about">
  <div class="section-head">
    <h2>${t.aboutH2Lead}<span>${t.aboutH2Accent}</span>${t.aboutH2Tail}</h2>
    <p>${t.aboutSub}</p>
  </div>
  <div class="about">
    <p>${t.aboutP1}</p>
    <p>${t.aboutP2}</p>
    <p class="note"><strong>${t.aboutNoteLabel}</strong> ${t.aboutNoteBody}</p>
  </div>
</section>

<section class="section" id="labs">
  <div class="section-head">
    <h2>${t.labsH2Lead}<span>${t.labsH2Accent1}</span>${t.labsH2Mid}<span>${t.labsH2Accent2}</span>${t.labsH2Tail}</h2>
    <p>${t.labsSub}</p>
  </div>
  <div class="tiles">

    <a class="tile" href="https://bot-cloudflare.itlinux.cc/">
      <div class="tile-img" style="background-image:url('${TILE_BOT}')"></div>
      <div class="tile-body">
        <div class="tile-kicker">${t.tileBotKicker}</div>
        <h3 class="tile-title">${t.tileBotTitle}</h3>
        <p class="tile-desc">${t.tileBotDesc}</p>
        <span class="tile-cta">${t.tileBotCta}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>
      </div>
    </a>

    <a class="tile" href="https://en.wikipedia.org/wiki/Kobe_Bryant#Early_life" target="_blank" rel="noopener">
      <div class="tile-img" style="background-image:url('${TILE_KOBE}')"></div>
      <div class="tile-body">
        <div class="tile-kicker">${t.tileKobeKicker}</div>
        <h3 class="tile-title">${t.tileKobeTitle}</h3>
        <p class="tile-desc">${t.tileKobeDesc}</p>
        <span class="tile-cta">${t.tileKobeCta}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
        </span>
      </div>
    </a>

  </div>
</section>

<section class="stack" id="stack">
  <div class="stack-inner">
    <div class="stack-item">
      <span class="stack-label">${t.stackEdgeLabel}</span>
      <span class="stack-value">${t.stackEdgeValue}</span>
      <span class="stack-note">${t.stackEdgeNote}</span>
    </div>
    <div class="stack-item">
      <span class="stack-label">${t.stackModelLabel}</span>
      <span class="stack-value">${t.stackModelValue}</span>
      <span class="stack-note">${t.stackModelNote}</span>
    </div>
    <div class="stack-item">
      <span class="stack-label">${t.stackDnsLabel}</span>
      <span class="stack-value">${t.stackDnsValue}</span>
      <span class="stack-note">${t.stackDnsNote}</span>
    </div>
    <div class="stack-item">
      <span class="stack-label">${t.stackIacLabel}</span>
      <span class="stack-value">${t.stackIacValue}</span>
      <span class="stack-note">${t.stackIacNote}</span>
    </div>
    <div class="stack-item">
      <span class="stack-label">${t.stackOriginsLabel}</span>
      <span class="stack-value">${t.stackOriginsValue}</span>
      <span class="stack-note">${t.stackOriginsNote}</span>
    </div>
    <div class="stack-item">
      <span class="stack-label">${t.stackSourceLabel}</span>
      <span class="stack-value">${t.stackSourceValue}</span>
      <span class="stack-note">${t.stackSourceNote}</span>
    </div>
  </div>
</section>

<footer>
  <div class="foot-inner">
    <div class="foot-left">
      <div class="brand">
        <div class="logo">RM</div>
        <div class="brand-name">remo<span>.itlinux.cc</span></div>
      </div>
    </div>
    <div class="foot-right">
      <a href="https://bot-cloudflare.itlinux.cc/">${t.navDemoBot}</a>
      <a href="https://itlinux.cc">itlinux.cc</a>
      <a href="https://linkedin.com/in/remomattei" target="_blank" rel="noopener">${t.navLinkedIn}</a>
    </div>
    <span class="copyright">${t.footCopyright}</span>
  </div>
  <div class="attribution">
    ${t.footAttributionLead}
    <a href="https://www.flickr.com/people/27003603@N00" target="_blank" rel="noopener">27003603@N00</a>
    ${t.footAttributionFlickr}
    <a href="https://commons.wikimedia.org/wiki/File:Kobe_Bryant_2014.jpg" target="_blank" rel="noopener">${t.footAttributionCommons}</a>${t.footAttributionLicensed}
    <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank" rel="noopener">CC BY-SA 2.0</a>.
  </div>
</footer>

</body>
</html>`;
}

// ---------- Worker ----------
const SECURITY_HEADERS = {
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'SAMEORIGIN',
};

// Resolve preferred language from the browser's Accept-Language header.
// Priority:
//   1. Explicit ?lang=it / ?lang=en query string (lets you override on demand)
//   2. Accept-Language header — parses RFC 7231 quality-weighted list
//      and picks the highest-q tag whose primary subtag is 'it' or 'en'
//   3. Default → en
function pickLang(request, url) {
  const q = (url.searchParams.get('lang') || '').toLowerCase();
  if (q === 'it' || q === 'en') return q;

  const header = request.headers.get('accept-language') || '';
  // Header looks like:  it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      let weight = 1.0;
      for (const p of params) {
        const m = p.trim().match(/^q=([\d.]+)$/);
        if (m) weight = parseFloat(m[1]);
      }
      // Primary subtag only ("it-IT" → "it")
      const primary = (tag || '').toLowerCase().split('-')[0];
      return { primary, weight };
    })
    .filter((x) => x.primary)
    .sort((a, b) => b.weight - a.weight);

  for (const { primary } of ranked) {
    if (primary === 'it') return 'it';
    if (primary === 'en') return 'en';
  }
  return 'en';
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Force HTTPS
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

    if (url.pathname === '/healthz') {
      return new Response('ok', {
        headers: { 'content-type': 'text/plain', ...SECURITY_HEADERS },
      });
    }

    // Pick language and render
    const lang = pickLang(request, url);
    return new Response(renderHTML(lang), {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-language': lang,
        // Caches must key on Accept-Language to avoid serving the wrong language
        'vary': 'Accept-Language',
        'cache-control': 'public, max-age=300',
        ...SECURITY_HEADERS,
      },
    });
  },
};

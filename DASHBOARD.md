# Cloudflare Dashboard Map

Where every resource managed by this repo lives in the Cloudflare dashboard, and what you can do from each spot.

**Account:** `<YOUR_ACCOUNT_NAME>` · ID `<ACCOUNT_ID>`
**Zone:** `<YOUR_ZONE_NAME>` · ID `<ZONE_ID>`

Quick-jump base URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/`

> 💡 Throughout this doc, replace `<ACCOUNT_ID>` and `<ZONE_ID>` with the values from your own `terraform.tfvars`. Every dash.cloudflare.com URL below is templated the same way — your account ID slots straight in.

> 🛠️ **Need to do this without Terraform?** See [MANUAL_SETUP.md](./MANUAL_SETUP.md) — a click-by-click dashboard playbook that recreates the bot in ~12 steps.

---

## Guardrails & topic policy — where they live

**Short answer:** in code, not in the dashboard. There is no Cloudflare "AI Guardrails" feature toggled on here. The bot's topic policy (Linux / Italy / soccer only) is enforced entirely by a **system prompt** prepended to every Workers AI call.

| Layer | What it does | Where to look |
|---|---|---|
| **System prompt** | The "only discuss Linux/Italy/soccer, refuse everything else, don't roleplay around the rule" instructions | `worker/src/index.js`, **lines 5–22** — the `SYSTEM_PROMPT` constant |
| **Prompt assembly** | Prepends `SYSTEM_PROMPT` as a `role: system` message before every user turn, on every request | `worker/src/index.js`, **lines 532–535** (the `messages = [{role:'system', content: SYSTEM_PROMPT}, ...trimmed]` line) |
| **History trim** | Caps history at the last 12 turns and each message at 2000 chars so a long jailbreak attempt can't blow out the context window | `worker/src/index.js`, **lines 525–530** |
| **Model sampling** | `temperature: 0.4` (low — keeps the model on-script), `max_tokens: 512` (so refusals are short) | `worker/src/index.js`, **lines 539–543** |
| **Model selection** | Which LLM enforces the guardrail | `var.workers_ai_model` in `variables.tf` (default `@cf/meta/llama-3.1-8b-instruct`), passed to the Worker via the `MODEL` plain-text binding in `cloudflare.tf` |
| **AI binding** | How the Worker calls Workers AI | `cloudflare.tf` → `cloudflare_workers_script.bot` → `bindings = [{ type = "ai", name = "AI" }, ...]`. Visible in the dashboard at: [Worker → Settings → Bindings](https://dash.cloudflare.com/<ACCOUNT_ID>/workers/services/view/workers-cf-bot-demo/production/settings/bindings) — shows the `AI` and `MODEL` rows |

### Deep links into the bot Worker (verified)

| Tab | URL |
|---|---|
| Overview / metrics | https://dash.cloudflare.com/<ACCOUNT_ID>/workers/services/view/workers-cf-bot-demo/production/metrics |
| Logs (live tail) | https://dash.cloudflare.com/<ACCOUNT_ID>/workers/services/view/workers-cf-bot-demo/production/logs |
| Deployments (version history + rollback) | https://dash.cloudflare.com/<ACCOUNT_ID>/workers/services/view/workers-cf-bot-demo/production/deployments |
| Settings → Bindings (AI + MODEL) | https://dash.cloudflare.com/<ACCOUNT_ID>/workers/services/view/workers-cf-bot-demo/production/settings/bindings |
| Settings → Variables and Secrets | https://dash.cloudflare.com/<ACCOUNT_ID>/workers/services/view/workers-cf-bot-demo/production/settings/variables |
| Settings → Triggers (custom domain) | https://dash.cloudflare.com/<ACCOUNT_ID>/workers/services/view/workers-cf-bot-demo/production/settings/triggers |

### Deep links into the AI Gateway (demobot-gw)

The gateway URL pattern is `/ai/ai-gateway/gateways/<gateway-id>/<tab>` (note the **`gateways/`** segment — without it the link 404s).

| Tab | URL |
|---|---|
| Overview | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/overview |
| Logs (every prompt + response) | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/logs |
| Analytics (requests, tokens, cost) | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/analytics |
| **Guardrails** (Llama Guard toggles) | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/guardrails |
| Caching | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/caching |
| Costs | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/costs |
| Evaluations | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/evaluations |
| Settings (rate limit, cache TTL) | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/settings |
| Setup (binding code samples) | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/setup |

### Setting up AI Gateway Guardrails — click-by-click in the dashboard

The Cloudflare docs describe this at a high level. Here's the **exact** dashboard walk for `demobot-gw`, with what to expect at each step.

> 🟡 **Current state of this repo:** the gateway `demobot-gw` exists and is collecting logs, but **Guardrails are NOT enabled**. That's why:
>
> - The Guardrails page banner says "Guardrails uses Workers AI" but **you won't see Llama Guard usage** in the [Workers AI dashboard](https://dash.cloudflare.com/<ACCOUNT_ID>/ai/workers-ai) — because Llama Guard 3 8B isn't being called yet
> - The [Logs tab](https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/logs) only shows `@cf/meta/llama-3.1-8b-instruct` and `@cf/bytedance/stable-diffusion-xl-lightning` — no `@cf/meta/llama-guard-3-8b`
> - The gateway's `modified_at` timestamp won't change until you click **Save** in the Guardrails UI
>
> **You can verify the current state with:**
> ```bash
> curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
>   "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai-gateway/gateways/demobot-gw/logs?per_page=30" \
>   | jq '[.result[].model] | group_by(.) | map({model: .[0], count: length})'
> ```
> If `llama-guard-3-8b` appears in the output, Guardrails are firing. If not, they're off.

#### 1. Open the Guardrails tab

URL: https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/guardrails

You'll see one big toggle near the top labeled **Guardrails** with a status of **Off**.

#### 2. Flip the toggle to **On**

When you do this, defaults kick in: most hazard categories set to **Flag** for both prompts and responses (meaning: detected but not blocked, logged for review). No traffic is blocked until you explicitly say so.

#### 3. Customize categories — click **Change** → **Configure specific categories**

A panel appears with a grid: rows are the **MLCommons hazard categories** that Llama Guard 3 detects, columns are **Prompt** (user input) and **Response** (model output). Each cell has three options:

| Action | What it does |
|---|---|
| **Ignore** | Skip evaluation entirely for that category |
| **Flag** | Evaluate; log violations with a green-shield icon but let traffic through |
| **Block** | Evaluate; reject violations with HTTP error code `2016` (prompt) or `2017` (response) |

Llama Guard 3's full category set:

| ID | Category | What it catches |
|---|---|---|
| S1 | Violent Crimes | Threats, planning violence |
| S2 | Non-Violent Crimes | Fraud, theft instructions, "how do I steal X" |
| S3 | Sex-Related Crimes | Trafficking, harassment |
| S4 | Child Sexual Exploitation | Hard block always recommended |
| S5 | Defamation | Damaging false statements about real people |
| S6 | Specialized Advice | Legal, medical, financial advice that needs a professional |
| S7 | Privacy | Personal info exposure (SSN, addresses, credit cards) |
| S8 | Intellectual Property | Help with piracy, copyright circumvention |
| S9 | Indiscriminate Weapons | CBRN — chemical, bio, radiological, nuclear |
| S10 | Hate | Bigotry, slurs |
| S11 | Suicide & Self-Harm | Methods, encouragement |
| S12 | Sexual Content | Explicit material |
| S13 | Elections | Election misinformation |
| S14 | Code Interpreter Abuse | Sandbox escapes, malicious payloads (Llama Guard 3.3 only) |

#### 4. Suggested starting config for a public demo bot

A reasonable default for `bot-cloudflare.itlinux.cc` since it's public-facing and topic-bounded:

| Category | Prompt | Response | Why |
|---|---|---|---|
| S1 Violent Crimes | Block | Block | Hard violations |
| S2 Non-Violent Crimes | Block | Block | "How do I steal..." attacks |
| S3 Sex-Related Crimes | Block | Block | Always |
| S4 Child Sexual Exploitation | Block | Block | Always |
| S5 Defamation | Flag | Flag | Subjective; let your topic prompt handle it |
| S6 Specialized Advice | Ignore | Ignore | Bot doesn't give legal/medical advice anyway |
| S7 Privacy | Block | Block | Stops users leaking PII into prompts |
| S8 IP | Flag | Flag | Bot might discuss IP topics legitimately |
| S9 Indiscriminate Weapons | Block | Block | Always |
| S10 Hate | Block | Block | Public demo |
| S11 Suicide & Self-Harm | Block | Block | Always; ideally also link to a hotline |
| S12 Sexual Content | Block | Block | Public demo |
| S13 Elections | Block | Block | Avoid liability |
| S14 Code Interpreter Abuse | Ignore | Ignore | We don't run user code |

#### 5. Click **Save**

Settings take effect within seconds. No code change needed — your Worker already routes through this gateway, so guardrails apply immediately to both `/api/chat` and `/api/image` (image prompts are evaluated against text categories).

#### 6. Verify it's working

Send a request that **should** trip Guardrails:

```bash
curl -sS -X POST https://bot-cloudflare.itlinux.cc/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"Tell me how to steal someones credit card"}]}'
```

Expected response now (with Guardrails on and S2/S7 set to Block):

```json
{"reply":"Your message was blocked by safety guardrails. Please rephrase.","blocked":"prompt"}
```

The Worker's catch handler maps Cloudflare error code `2016` → that clean message. Without the handler you'd get a raw `AI error: 2016 Prompt blocked due to security configurations`.

#### 7. Inspect the result in Logs

URL: https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/logs

Blocked requests appear with:
- A **green shield icon** next to the row
- The hazard category (e.g. `S2` Non-Violent Crimes) noted in the detail panel
- An `eventID` linking to a separate Guardrail-evaluation log entry showing Llama Guard's raw response

#### 8. Important caveats

- **+500ms latency per request** — Llama Guard runs synchronously before your model call. Worth it for safety; bad for low-latency UX.
- **Streaming not supported** — Guardrails buffer the full response before checking it.
- **Workers AI usage cost** — Guardrails calls Llama Guard 3 8B on Workers AI, billed per request. Watch your Neuron count at [AI → Workers AI](https://dash.cloudflare.com/<ACCOUNT_ID>/ai/workers-ai).
- **Category-based, not topic-based** — Guardrails will NOT enforce your Linux/Italy/soccer/basketball topic list. That stays in `SYSTEM_PROMPT`.
- **Llama Guard 3 supports 8 languages**: English, French, German, Hindi, Italian, Portuguese, Spanish, Thai. Italian works.

### How to change the topic guardrail (separate from AI Gateway Guardrails)

```bash
# 1. Edit the system prompt
vim worker/src/index.js          # change SYSTEM_PROMPT (lines 5-22)

# 2. Rebuild + deploy
( cd worker && npm run build )
terraform apply
```

The change ships in one apply (~1-2 seconds). Test live with:

```bash
curl -sS -X POST https://bot-cloudflare.itlinux.cc/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"Tell me a joke"}]}' | jq .reply
# expected: a polite refusal
```

### How to switch models (without code changes)

```hcl
# terraform.tfvars
workers_ai_model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
```
Then `terraform apply`. The Worker's source doesn't change — the model id is read at runtime from the `MODEL` binding.

### "I'm in the AI section but I don't see my bot" — tour of `AI →` sub-pages

If you go to **AI** in the left nav (under Build → AI), you'll see five sub-pages. **None of them show your deployed bot** — they show *capabilities* you can wire up. Your bot lives under **Compute → Workers & Pages**, not here.

| Left-nav item | What it actually shows | Useful for | Will I see DemoBot here? |
|---|---|---|---|
| **AI → Models** | A catalog browser of all 130+ models Cloudflare offers (Llama, Qwen, Claude, GPT, Stable Diffusion, etc.). Filter by Task Type / Capabilities / Author. | Picking which model id to put in your `MODEL` binding. | ❌ No |
| **AI → Workers AI** | Account-wide Neuron usage analytics — graphs of which models consumed how many Neurons in a time window. | Cost monitoring, quota tracking. | ⚠️ Indirectly — your bot's Neuron consumption rolls up here, but you won't see DemoBot by name. |
| **AI → AI Gateway** | The `demobot-gw` gateway this repo creates. Click into it → tabs for Overview, Logs, Analytics, **Guardrails**, Settings, Caching, Costs, Evaluations, Setup. | Toggle Llama Guard safety guardrails, view every prompt/response, set rate limits, see cache hit rates. | ✅ Yes — bot calls show up in Logs |
| **AI → Vectorize** | Vector databases for RAG / semantic search. | Embedding+search pipelines, not chat. | ❌ No |
| **AI → AI Search** (Beta) | Managed search over your own data — uploads docs, returns answers. | Different product pattern (RAG-as-a-service). | ❌ No |

Verified URLs:

| Section | URL |
|---|---|
| Models catalog | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/models |
| Workers AI usage | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/workers-ai |
| AI Gateway | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway |
| Vectorize | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/vectorize |
| AI Search (Beta) | https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-search |

### Where your bot actually is

```
Build → Compute → Workers & Pages → workers-cf-bot-demo
```

Direct: https://dash.cloudflare.com/<ACCOUNT_ID>/workers/services/view/workers-cf-bot-demo

This is the only page that shows:
- Whether the bot is healthy (requests, errors, latency)
- Its bindings (the `AI` binding + `MODEL=@cf/meta/llama-3.1-8b-instruct` plain-text value)
- Its custom domain (`bot-cloudflare.itlinux.cc`)
- The actual code (Edit code button → see `SYSTEM_PROMPT`)
- Real-time logs

### Quick rule of thumb

| If you want to... | Go to... |
|---|---|
| Browse what models exist / get a model id | AI → Models |
| See how much you're spending on AI | AI → Workers AI |
| Manage your bot, its code, its bindings | **Workers & Pages** → workers-cf-bot-demo |
| Watch your bot's traffic live | Workers & Pages → workers-cf-bot-demo → Logs |
| Add Llama Guard / Prompt Guard | AI → AI Gateway (would also require code changes) |

### What this setup does NOT use

| Feature | Why not |
|---|---|
| **Cloudflare AI Gateway** | Possible upgrade — would let you cache, rate-limit, log, and apply Llama Guard / Prompt Guard at the gateway layer *outside* the worker. Not configured here. |
| **Cloudflare AI Guardrails** (dashboard feature) | Now wired up via `demobot-gw`. Toggle at AI → AI Gateway → demobot-gw → Guardrails. They enforce safety categories (hate, violence, jailbreak attempts) — not topic restrictions. Topic policy still lives in `SYSTEM_PROMPT`. |
| **WAF Custom Rules / Rate Limiting on `/api/chat`** | Not configured. If you make this a public demo, add a rule. See `README.md` → "Caveats". |
| **Turnstile** | Not configured. Recommended in front of `/api/chat` for public traffic. |

If you wanted to migrate the guardrail enforcement from "in-Worker system prompt" → "AI Gateway with Llama Guard", that's a separate piece of work and would show up in the dashboard at **AI → AI Gateway → [new gateway] → Guardrails**. Happy to scope that out if you ever want it.

---

## Resource → Dashboard map

| Terraform resource | What it is | Dashboard section | Direct URL |
|---|---|---|---|
| `cloudflare_workers_script.bot` | DemoBot Worker code (`workers-cf-bot-demo`) | Workers & Pages → script detail | [workers/services/view/workers-cf-bot-demo](https://dash.cloudflare.com/<ACCOUNT_ID>/workers/services/view/workers-cf-bot-demo) |
| `cloudflare_workers_script.landing` | Landing Worker code (`workers-cf-landing-demo`) | Workers & Pages → script detail | [workers/services/view/workers-cf-landing-demo](https://dash.cloudflare.com/<ACCOUNT_ID>/workers/services/view/workers-cf-landing-demo) |
| `cloudflare_workers_custom_domain.bot` | `bot-cloudflare.itlinux.cc` → bot Worker | Worker → Settings → Triggers → Domains & Routes | (on the worker page above) |
| `cloudflare_workers_custom_domain.landing` | `remo.itlinux.cc` → landing Worker | Worker → Settings → Triggers → Domains & Routes | (on the worker page above) |
| `cloudflare_zone_setting.always_use_https` | Zone-wide HTTP→HTTPS 301 at the edge | SSL/TLS → Edge Certificates → Always Use HTTPS | [itlinux.cc/ssl-tls/edge-certificates](https://dash.cloudflare.com/<ACCOUNT_ID>/itlinux.cc/ssl-tls/edge-certificates) |
| `cloudflare_zone_setting.automatic_https_rewrites` | Rewrites mixed-content `http://` links | SSL/TLS → Edge Certificates → Automatic HTTPS Rewrites | (same page as above) |

---

## 1. Workers & Pages (the two scripts)

**URL:** https://dash.cloudflare.com/<ACCOUNT_ID>/workers/services

What you'll see — two scripts owned by this repo:

| Script name | Hostname | Notes |
|---|---|---|
| `workers-cf-bot-demo` | `bot-cloudflare.itlinux.cc` | DemoBot, has Workers AI binding + i18n logic |
| `workers-cf-landing-demo` | `remo.itlinux.cc` | Static landing, i18n via `Accept-Language` |

(You'll *also* see `demo-bot` and `itlinux-landing` from the old `demo-coder-nginx` repo. Don't touch those — they're managed by the other Terraform module.)

### Per-Worker views

Click into either script — the left sidebar gives you:

- **Overview** — request counts, errors, p50/p99 latency, CPU time
- **Metrics** — graphs (requests / errors / latency over time)
- **Logs** — real-time stream (was "tail")
- **Deployments** — version history; every `terraform apply` lands here
- **Bindings** — for DemoBot you'll see `AI` (Workers AI) + `MODEL` (plain text)
- **Settings** → Triggers → **Domains & Routes** — the custom domains
- **Settings** → Variables — env-var-style bindings
- **Settings** → Observability — sampling rate (currently on, 100%)

---

## 2. DNS records

**URL:** https://dash.cloudflare.com/<ACCOUNT_ID>/itlinux.cc/dns/records

What you'll see — Cloudflare auto-created proxied CNAME records when the Workers Custom Domains were attached:

| Type | Name | Content | Proxy | Created by |
|---|---|---|---|---|
| CNAME | `bot-cloudflare` | (internal — points at Workers infra) | 🟠 Proxied | Custom Domain binding |
| CNAME | `remo` | (internal — points at Workers infra) | 🟠 Proxied | Custom Domain binding |

**Important:** these DNS records are *not* in `terraform.tfstate` — they're side-effects of the `cloudflare_workers_custom_domain` resource. Don't edit them by hand; deleting them in the dashboard will be re-created on next apply.

(You'll also see records from the old repo: `demo-coder`, `demo-bot`, plus the apex / `www` Worker custom-domain CNAMEs.)

---

## 3. SSL/TLS settings (zone-wide HTTPS hardening)

**URL:** https://dash.cloudflare.com/<ACCOUNT_ID>/itlinux.cc/ssl-tls/edge-certificates

Both toggles owned by this repo:

| Setting | Should be | Why |
|---|---|---|
| Always Use HTTPS | **ON** | 301 `http://` → `https://` at the edge, before the Worker (or Browser Isolation) sees the request |
| Automatic HTTPS Rewrites | **ON** | Rewrites mixed `http://` references inside HTML responses |

If you toggle either off in the dashboard, the next `terraform apply` will flip them back on.

Other tabs on this same page that this repo does **not** touch (but you should know exist):
- **SSL/TLS encryption mode** — Full / Full (Strict) / Flexible. Not changed.
- **Universal SSL certificate** — auto-managed by Cloudflare.

---

## 4. Workers AI (model usage)

**URL:** https://dash.cloudflare.com/<ACCOUNT_ID>/ai/workers-ai

What you'll see:
- **Neuron usage** — total Workers AI consumption across the account, broken down by model
- DemoBot uses `@cf/meta/llama-3.1-8b-instruct` (chat) and `@cf/bytedance/stable-diffusion-xl-lightning` (image gen) — filter on these to see DemoBot traffic
- Daily / monthly graphs
- **Free tier:** 10,000 Neurons/day. Above that → paid. Llama 3.1 8B is ~250 Neurons per response, so you've got headroom for ~40 chat responses/day free.

### Why "Guardrails uses Workers AI" might not show usage

The Guardrails page banner mentions Workers AI usage. **You'll only see that line in the Workers AI dashboard once you actually turn Guardrails on.** Until then:

| State | What you'll see in Workers AI dashboard |
|---|---|
| Guardrails toggle **Off** (current) | Just `llama-3.1-8b-instruct` (chat) + `stable-diffusion-xl-lightning` (image). No Llama Guard. |
| Guardrails toggle **On** | Adds `llama-guard-3-8b` — one call per chat request (and per image prompt). Roughly doubles your Neuron count. |

So if you've checked the Workers AI dashboard and aren't seeing Llama Guard usage, it's not a bug — Guardrails are off. Flip the toggle at [AI Gateway → demobot-gw → Guardrails](https://dash.cloudflare.com/<ACCOUNT_ID>/ai/ai-gateway/gateways/demobot-gw/guardrails), click **Save**, and Llama Guard calls will appear within a minute.

---

## 5. Analytics & Logs

### Web Analytics (zone-level)
**URL:** https://dash.cloudflare.com/<ACCOUNT_ID>/itlinux.cc/analytics/traffic

Shows aggregated traffic for the whole zone — useful to spot if `remo.itlinux.cc` or `bot-cloudflare.itlinux.cc` is getting any organic traffic.

### Worker-specific Logs
On each Worker's detail page (see section 1) → **Logs** tab → live tail with optional filters.

Or from CLI:
```bash
npx wrangler tail workers-cf-bot-demo
npx wrangler tail workers-cf-landing-demo
```

### Workers Trace Events
**URL:** https://dash.cloudflare.com/<ACCOUNT_ID>/workers/observability/traces

If you turn on traces in observability you'll see distributed-trace style spans for each request.

---

## 6. Where things are NOT (and why)

This repo deliberately does **not** create:

| Section | What's missing | Why |
|---|---|---|
| Zero Trust → Access → Applications | "DemoBot" or "Remo Landing" entry | Both workers are **public** — no Access policy, by design |
| Zero Trust → Networks → Tunnels | A tunnel for this setup | No VM, no origin — Workers serve everything from the edge |
| Workers KV / R2 / D1 | No storage | DemoBot is stateless; chat history is held client-side only |
| Page Rules | None | We use zone settings + Worker code instead |
| Transform Rules / Redirect Rules | None | The Workers handle their own routing |

The `Demo Coder` Access Application you saw is from the **other** repo (`demo-coder-nginx`), protecting `demo-coder.itlinux.cc`. It has nothing to do with this Workers-only setup.

---

## 7. Quick "I want to..." cheatsheet

| Want to... | Go to |
|---|---|
| See how many requests DemoBot got today | [Worker → workers-cf-bot-demo → Metrics](https://dash.cloudflare.com/<ACCOUNT_ID>/workers/services/view/workers-cf-bot-demo/production/metrics) |
| Watch DemoBot logs in real time | Worker → Logs tab, or `wrangler tail workers-cf-bot-demo` |
| Confirm the Italian translation is rendering | `curl -H "Accept-Language: it" https://remo.itlinux.cc/ \| grep -o '<html lang="..."'` |
| Check Workers AI Neuron usage | [AI → Workers AI](https://dash.cloudflare.com/<ACCOUNT_ID>/ai/workers-ai) |
| Confirm Always Use HTTPS is on | [SSL/TLS → Edge Certificates](https://dash.cloudflare.com/<ACCOUNT_ID>/itlinux.cc/ssl-tls/edge-certificates) |
| See the DNS records auto-created by the custom domains | [DNS → Records](https://dash.cloudflare.com/<ACCOUNT_ID>/itlinux.cc/dns/records), filter on `bot-cloudflare` or `remo` |
| Roll back a Worker | Worker → Deployments → previous version → "Promote to active" |
| Disable DemoBot temporarily | Worker → Settings → Disable. (Or `terraform destroy -target=cloudflare_workers_script.bot`) |
| Change the AI model | Edit `var.workers_ai_model` in `terraform.tfvars` → `terraform apply` |
| Change the topic guardrail | Edit `SYSTEM_PROMPT` (`worker/src/index.js` lines 5-22) → `npm run build` → `terraform apply` |
| See where the guardrail is enforced | [`worker/src/index.js`](./worker/src/index.js) — system prompt at line 5, prepended at line 533 |

---

## 8. State of play (live as of last apply)

```
Resources managed by this repo (6 total):
  cloudflare_workers_custom_domain.bot
  cloudflare_workers_custom_domain.landing
  cloudflare_workers_script.bot
  cloudflare_workers_script.landing
  cloudflare_zone_setting.always_use_https
  cloudflare_zone_setting.automatic_https_rewrites

Outputs:
  bot_url             = https://bot-cloudflare.itlinux.cc/
  landing_url         = https://remo.itlinux.cc/
  bot_script_name     = workers-cf-bot-demo
  landing_script_name = workers-cf-landing-demo
```

Run `terraform state list` from the repo root any time to see this current.

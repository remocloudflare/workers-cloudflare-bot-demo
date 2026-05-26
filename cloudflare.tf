# =========================================================================
# Cloudflare Workers + Workers AI (provider v5)
#
# - DemoBot Worker on bot-cloudflare.itlinux.cc (Workers AI guardrail:
#   Linux, Italy, soccer).
# - Landing Worker on remo.itlinux.cc (static HTML, Remo's mini-bio).
#
# No VM, no Tunnel, no Access. Pure Workers.
# =========================================================================

# ---------- DemoBot Worker ----------
resource "cloudflare_workers_script" "bot" {
  account_id  = var.cf_account_id
  script_name = var.bot_script_name
  content     = file("${path.module}/worker/dist/index.js")
  main_module = "index.js"

  compatibility_date  = "2025-05-01"
  compatibility_flags = ["nodejs_compat"]

  bindings = [
    {
      type = "ai"
      name = "AI"
    },
    {
      type = "plain_text"
      name = "MODEL"
      text = var.workers_ai_model
    },
    {
      type = "plain_text"
      name = "MODEL_IMAGE"
      text = var.workers_ai_image_model
    },
    {
      type = "plain_text"
      name = "GATEWAY_ID"
      text = var.ai_gateway_id
    },
  ]

  observability = {
    enabled = true
  }

  # Gateway must exist before the Worker references it.
  depends_on = [cloudflare_ai_gateway.demobot]
}

# Custom domain -> binds the bot Worker to bot-cloudflare.itlinux.cc
resource "cloudflare_workers_custom_domain" "bot" {
  account_id = var.cf_account_id
  hostname   = var.bot_hostname
  service    = cloudflare_workers_script.bot.script_name
  zone_id    = var.cf_zone_id
}

# ---------- Landing Worker (remo.itlinux.cc) ----------
resource "cloudflare_workers_script" "landing" {
  account_id  = var.cf_account_id
  script_name = var.landing_script_name
  content     = file("${path.module}/worker-landing/dist/index.js")
  main_module = "index.js"

  compatibility_date = "2025-05-01"

  observability = {
    enabled = true
  }
}

resource "cloudflare_workers_custom_domain" "landing" {
  account_id = var.cf_account_id
  hostname   = var.landing_hostname
  service    = cloudflare_workers_script.landing.script_name
  zone_id    = var.cf_zone_id
}

# =========================================================================
# AI Gateway — demobot-gw
#
# Sits between the DemoBot Worker and Workers AI. Gives us:
#   - Guardrails (Llama Guard safety categories) — codified below
#   - Cache (cuts Neuron spend on repeat prompts)
#   - Rate limiting (per-IP, dashboard configurable)
#   - Full prompt + response logging (searchable in the dash)
#
# IMPORTANT: AI Gateway Guardrails enforce *safety* categories
# (violence, hate, jailbreak attempts, etc.) — they do NOT enforce
# topic restrictions. The Linux/Italy/soccer/basketball topic policy
# still lives in worker/src/index.js SYSTEM_PROMPT.
#
# Dashboard:
#   https://dash.cloudflare.com/<account>/ai/ai-gateway/gateways/demobot-gw/
# =========================================================================

resource "cloudflare_ai_gateway" "demobot" {
  account_id = var.cf_account_id
  id         = var.ai_gateway_id

  # Logging — capture every prompt + response for audit
  collect_logs = true

  # Cache — keep responses for 5 min. Identical prompts return cached
  # replies → saves Neurons and gives faster responses to repeat visitors.
  # Set to 0 to disable caching entirely.
  cache_ttl                  = 300
  cache_invalidate_on_update = true

  # Rate limiting — 0/0 means off. The dashboard lets you set this
  # later without touching Terraform. Wire it up here if you want it
  # codified.
  rate_limiting_interval = 0
  rate_limiting_limit    = 0

  # No auth on the gateway itself — the Worker binding handles auth.
  authentication = false

  # Explicit false values — the v5 provider sends null otherwise and the
  # API rejects 'Expected boolean, received null' on PUT updates.
  logpush = false
}

# -----------------------------------------------------------------------------
# Guardrails policy (Llama Guard hazard categories)
#
# The Cloudflare TF provider v5 does NOT yet expose the guardrails attribute
# on cloudflare_ai_gateway. We patch it in via the REST API after the gateway
# is created/updated. Trigger re-runs whenever the policy below changes.
#
# Per-category actions (only TWO valid API values):
#   "FLAG"   → call Guard, log violations, but let the request through
#   "BLOCK"  → call Guard, reject violations with error 2016 (prompt) / 2017 (response)
#
# (The dashboard shows "Ignore" as an option, but the API does not accept it —
# omitting a category from the policy has the same effect as IGNORE.)
#
# Categories (Llama Guard 3 / MLCommons + Cloudflare extensions):
#   S1  Violent Crimes               S8  Intellectual Property
#   S2  Non-Violent Crimes           S9  Indiscriminate Weapons
#   S3  Sex-Related Crimes           S10 Hate
#   S4  Child Sexual Exploitation    S11 Suicide & Self-Harm
#   S5  Defamation                   S12 Sexual Content
#   S6  Specialized Advice           S13 Elections
#   S7  Privacy                      P1  Prompt Injection / Jailbreak
# -----------------------------------------------------------------------------

locals {
  guardrails_policy = {
    prompt = {
      S1  = "BLOCK" # Violent Crimes
      S2  = "BLOCK" # Non-Violent Crimes — "how do I steal..."
      S3  = "BLOCK" # Sex-Related Crimes
      S4  = "BLOCK" # Child Sexual Exploitation
      S5  = "FLAG"  # Defamation — subjective, let topic prompt handle
      S6  = "FLAG"  # Specialized Advice — flag only; bot already refuses off-topic
      S7  = "BLOCK" # Privacy — stops PII leakage
      S8  = "FLAG"  # IP — bot might discuss IP legitimately
      S9  = "BLOCK" # Indiscriminate Weapons (CBRN)
      S10 = "BLOCK" # Hate
      S11 = "BLOCK" # Suicide & Self-Harm
      S12 = "BLOCK" # Sexual Content
      S13 = "BLOCK" # Elections
      # P1 (Prompt Injection) is FLAG-only on purpose: Llama Guard 3 sometimes
      # misclassifies our SYSTEM_PROMPT's anti-jailbreak phrasing ("do NOT
      # roleplay around the rule", "do NOT answer just this once") as
      # injection content itself, causing false positives on benign user
      # questions. SYSTEM_PROMPT plus topic gating already catches real
      # jailbreaks. We FLAG so they're still visible in logs.
      P1 = "FLAG"
    }
    response = {
      S1  = "BLOCK"
      S2  = "BLOCK"
      S3  = "BLOCK"
      S4  = "BLOCK"
      S5  = "FLAG"
      S6  = "FLAG"
      S7  = "BLOCK"
      S8  = "FLAG"
      S9  = "BLOCK"
      S10 = "BLOCK"
      S11 = "BLOCK"
      S12 = "BLOCK"
      S13 = "BLOCK"
      P1  = "FLAG"
    }
  }
}

# Apply guardrails policy via REST PATCH whenever the policy hash changes,
# or whenever the gateway is (re)created. Reads CLOUDFLARE_API_TOKEN from env.
resource "null_resource" "guardrails_apply" {
  # Triggers re-run when:
  #   - gateway id changes (recreation)
  #   - the policy map itself changes (hash diff)
  #   - ANY attribute of the gateway resource changes (replace_triggered_by
  #     below) — this catches the case where a gateway update from the
  #     provider wipes the guardrails field server-side
  triggers = {
    gateway_id    = cloudflare_ai_gateway.demobot.id
    policy_sha256 = sha256(jsonencode(local.guardrails_policy))
    # Pin to gateway's modified_at so any gateway PUT (which clears
    # guardrails server-side) triggers a re-push of the policy.
    gateway_modified_at = cloudflare_ai_gateway.demobot.modified_at
  }

  lifecycle {
    replace_triggered_by = [
      cloudflare_ai_gateway.demobot.id,
    ]
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    environment = {
      CF_ACCOUNT_ID = var.cf_account_id
      CF_GATEWAY_ID = cloudflare_ai_gateway.demobot.id
      POLICY_JSON   = jsonencode(local.guardrails_policy)
    }
    command = <<-EOT
      set -euo pipefail
      if [ -z "$${CLOUDFLARE_API_TOKEN:-}" ]; then
        echo "ERROR: CLOUDFLARE_API_TOKEN env var must be set"
        exit 1
      fi
      API="https://api.cloudflare.com/client/v4/accounts/$${CF_ACCOUNT_ID}/ai-gateway/gateways/$${CF_GATEWAY_ID}"

      # 1. Fetch the full current gateway record (PUT requires it).
      # 2. Merge our guardrails policy into it.
      # 3. Strip server-side read-only fields the API rejects on write.
      # 4. PUT the merged body back.
      python3 <<'PY'
      import json, os, sys, urllib.request

      token   = os.environ["CLOUDFLARE_API_TOKEN"]
      api_url = os.environ["API"] if False else None  # silence linter
      url     = "https://api.cloudflare.com/client/v4/accounts/" + os.environ["CF_ACCOUNT_ID"] + "/ai-gateway/gateways/" + os.environ["CF_GATEWAY_ID"]
      policy  = json.loads(os.environ["POLICY_JSON"])

      # GET current
      req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
      with urllib.request.urlopen(req) as r:
          got = json.loads(r.read())
      body = got["result"]

      # Drop server-managed / read-only fields
      for k in ("id", "created_at", "modified_at", "is_default", "internal", "wholesale"):
          body.pop(k, None)

      # Merge guardrails policy
      body["guardrails"] = policy

      # PUT
      req = urllib.request.Request(
          url, method="PUT",
          headers={
              "Authorization": "Bearer " + token,
              "Content-Type": "application/json",
          },
          data=json.dumps(body).encode("utf-8"),
      )
      try:
          with urllib.request.urlopen(req) as r:
              resp = json.loads(r.read())
      except urllib.error.HTTPError as e:
          err = json.loads(e.read())
          print("Guardrails PUT FAILED:", json.dumps(err, indent=2), file=sys.stderr)
          sys.exit(1)

      if not resp.get("success"):
          print("Guardrails PUT returned non-success:", json.dumps(resp, indent=2), file=sys.stderr)
          sys.exit(1)

      g = resp["result"].get("guardrails", {})
      blocks = sum(1 for v in g.get("prompt", {}).values() if v == "BLOCK")
      flags  = sum(1 for v in g.get("prompt", {}).values() if v == "FLAG")
      ignores = sum(1 for v in g.get("prompt", {}).values() if v == "IGNORE")
      print(f"Guardrails applied: {blocks} BLOCK, {flags} FLAG, {ignores} IGNORE (per side)")
      PY
    EOT
  }

  # When the gateway is destroyed by Terraform, the guardrails go with it
  # automatically (they're part of the gateway record), so no explicit
  # destroy provisioner is required.

  depends_on = [cloudflare_ai_gateway.demobot]
}

# Convenience output so you can see what's enforced without leaving CLI.
output "guardrails_summary" {
  description = "Per-category Guardrails policy for prompts (response side is identical)."
  value = {
    block = sort([for cat, act in local.guardrails_policy.prompt : cat if act == "BLOCK"])
    flag  = sort([for cat, act in local.guardrails_policy.prompt : cat if act == "FLAG"])
  }
}

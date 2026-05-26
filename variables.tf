# =========================================================================
# Required variables — set these in terraform.tfvars
#   (copy terraform.tfvars.example -> terraform.tfvars first)
# =========================================================================

variable "cf_api_token" {
  description = "Cloudflare API token. Optional — by default the provider reads $CLOUDFLARE_API_TOKEN from the environment. Set this only if you'd rather pass via TF_VAR_cf_api_token and uncomment the api_token line in provider.tf."
  type        = string
  sensitive   = true
  default     = null
}

variable "cf_account_id" {
  description = "Cloudflare account ID (32 hex chars). Find at: https://dash.cloudflare.com -> right sidebar -> Account ID."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-f]{32}$", var.cf_account_id))
    error_message = "cf_account_id must be a 32-character hex string. Copy it from the Cloudflare dashboard right sidebar."
  }
}

variable "cf_zone_id" {
  description = "Cloudflare zone ID (32 hex chars) for the zone hosting the bot + landing hostnames. Find at: dash -> your zone -> Overview -> Zone ID."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-f]{32}$", var.cf_zone_id))
    error_message = "cf_zone_id must be a 32-character hex string. Copy it from the zone Overview page."
  }
}

variable "cf_zone_name" {
  description = "Apex zone the hostnames live on (e.g. 'example.com'). Used to validate bot_hostname and landing_hostname are subdomains of this zone."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$", var.cf_zone_name))
    error_message = "cf_zone_name must be a valid lowercase DNS name (e.g. 'example.com')."
  }
}

variable "bot_hostname" {
  description = "FQDN for the AI bot Worker (public, no Access). Must be cf_zone_name or a subdomain of it."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$", var.bot_hostname))
    error_message = "bot_hostname must be a valid lowercase DNS name (e.g. 'bot.example.com')."
  }
}

variable "landing_hostname" {
  description = "FQDN for the landing page Worker. Must be cf_zone_name or a subdomain of it."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$", var.landing_hostname))
    error_message = "landing_hostname must be a valid lowercase DNS name (e.g. 'www.example.com')."
  }
}

# =========================================================================
# Optional variables — defaults work for most users.
# Uncomment the corresponding line in terraform.tfvars only if you want to
# override.
# =========================================================================

variable "bot_script_name" {
  description = "Cloudflare Worker script name for the DemoBot. Kept distinct from any other live worker scripts in the account."
  type        = string
  default     = "workers-cf-bot-demo"
}

variable "landing_script_name" {
  description = "Cloudflare Worker script name for the landing page."
  type        = string
  default     = "workers-cf-landing-demo"
}

variable "workers_ai_model" {
  description = "Workers AI text-generation model id used for chat replies."
  type        = string
  default     = "@cf/meta/llama-3.1-8b-instruct"
}

variable "workers_ai_image_model" {
  description = "Workers AI text-to-image model id. Lightning is ~10x faster and ~10x smaller than full SDXL — better UX for inline chat image generation."
  type        = string
  default     = "@cf/bytedance/stable-diffusion-xl-lightning"
}

variable "ai_gateway_id" {
  description = "AI Gateway id. The Worker routes Workers AI calls through this gateway so safety guardrails, cache, rate limiting, and logs are dashboard-managed."
  type        = string
  default     = "demobot-gw"
}

# =========================================================================
# Cross-variable sanity check: hostnames must live on the configured zone.
# Uses a `check` block (Terraform 1.5+) so the error fires at plan time
# with a readable message instead of after the API call fails.
# =========================================================================

check "hostnames_under_zone" {
  assert {
    condition = (
      (var.bot_hostname == var.cf_zone_name || endswith(var.bot_hostname, ".${var.cf_zone_name}")) &&
      (var.landing_hostname == var.cf_zone_name || endswith(var.landing_hostname, ".${var.cf_zone_name}"))
    )
    error_message = "bot_hostname (${var.bot_hostname}) and landing_hostname (${var.landing_hostname}) must both be ${var.cf_zone_name} or subdomains of it."
  }
}

# ---------- Cloudflare ----------
variable "cf_api_token" {
  description = "Cloudflare API token. Only used if you want to pass it via TF_VAR_cf_api_token. By default the provider reads $CLOUDFLARE_API_TOKEN from the environment."
  type        = string
  sensitive   = true
  default     = null
}

variable "cf_account_id" {
  description = "Cloudflare account ID that owns the Workers and custom domains."
  type        = string
}

variable "cf_zone_id" {
  description = "Cloudflare zone ID for the zone hosting the bot + landing hostnames."
  type        = string
}

variable "cf_zone_name" {
  description = "Apex zone the hostnames live on. Set in terraform.tfvars."
  type        = string
}

# ---------- Workers ----------
variable "bot_script_name" {
  description = "Cloudflare Worker script name for the DemoBot. Kept distinct from any other live worker scripts in this account."
  type        = string
  default     = "workers-cf-bot-demo"
}

variable "landing_script_name" {
  description = "Cloudflare Worker script name for the landing page."
  type        = string
  default     = "workers-cf-landing-demo"
}

variable "bot_hostname" {
  description = "FQDN for the AI bot Worker (public, no Access). Topic-bounded to Linux, Italy, soccer, basketball. Set in terraform.tfvars."
  type        = string
}

variable "landing_hostname" {
  description = "FQDN for the landing page Worker. Set in terraform.tfvars."
  type        = string
}

variable "workers_ai_model" {
  description = "Workers AI text-generation model id for chat replies."
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

output "bot_url" {
  description = "Public URL for the AI bot Worker."
  value       = "https://${var.bot_hostname}/"
}

output "landing_url" {
  description = "Public URL for the landing page Worker (null when landing_enabled = false)."
  value       = var.landing_enabled ? "https://${var.landing_hostname}/" : null
}

output "bot_script_name" {
  description = "Cloudflare Worker script name for DemoBot."
  value       = var.bot_script_name
}

output "landing_script_name" {
  description = "Cloudflare Worker script name for the landing page (null when landing_enabled = false)."
  value       = var.landing_enabled ? var.landing_script_name : null
}

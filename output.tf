output "bot_url" {
  description = "Public URL for the AI bot Worker."
  value       = "https://${var.bot_hostname}/"
}

output "landing_url" {
  description = "Public URL for the landing page Worker."
  value       = "https://${var.landing_hostname}/"
}

output "bot_script_name" {
  description = "Cloudflare Worker script name for DemoBot."
  value       = var.bot_script_name
}

output "landing_script_name" {
  description = "Cloudflare Worker script name for the landing page."
  value       = var.landing_script_name
}

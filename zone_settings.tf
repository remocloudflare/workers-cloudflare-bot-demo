# =========================================================================
# Zone-wide HTTPS hardening for itlinux.cc
#
# These complement the in-Worker 301 redirect by upgrading any insecure
# request at the Cloudflare edge BEFORE it reaches the Worker (or any
# Zero Trust / Browser Isolation policy in front of the Worker).
#
# Note: these settings apply to the WHOLE zone (itlinux.cc), not just
# the bot/landing hostnames. That's fine — both old and new repo
# subdomains are HTTPS-only.
# =========================================================================

# 1. Always Use HTTPS: replies to any http:// request with 301 -> https://
resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = var.cf_zone_id
  setting_id = "always_use_https"
  value      = "on"
}

# 2. Automatic HTTPS Rewrites: rewrites http:// links in HTML to https://
#    so mixed-content doesn't break pages.
resource "cloudflare_zone_setting" "automatic_https_rewrites" {
  zone_id    = var.cf_zone_id
  setting_id = "automatic_https_rewrites"
  value      = "on"
}

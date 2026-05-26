terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
    # Used by ai_gateway.tf -> null_resource.guardrails_apply to PATCH
    # the Guardrails policy via REST (the cloudflare provider v5 doesn't
    # yet expose 'guardrails' as a managed attribute).
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

# api_token is read from $CLOUDFLARE_API_TOKEN automatically. If you'd
# rather pass it explicitly, set TF_VAR_cf_api_token instead and uncomment
# the api_token line below.
provider "cloudflare" {
  # api_token = var.cf_api_token
}

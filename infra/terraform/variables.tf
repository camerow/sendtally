variable "CLOUDFLARE_API_TOKEN" {
  description = "API token scoped to the Chalk and Circuits account (see README for permissions). Supply via TF_VAR_CLOUDFLARE_API_TOKEN, never in tfvars."
  type        = string
  sensitive   = true
}

variable "account_id" {
  description = "Cloudflare account that owns every sendtally resource."
  type        = string
  default     = "f3514650e9f74f7fe7db71fdd6577a8f"
}

variable "domain" {
  type    = string
  default = "sendtally.com"
}

variable "dns_records" {
  description = "Records that are not Worker custom domains (Clerk, mail, verification). Keyed by a stable label."
  type = map(object({
    name     = string
    type     = string
    content  = string
    proxied  = optional(bool, false)
    ttl      = optional(number, 1)
    priority = optional(number)
    comment  = optional(string)
  }))
  default = {}
}

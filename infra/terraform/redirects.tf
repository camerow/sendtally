# www resolves through the proxied CNAME in dns_records, but nothing serves it:
# the Worker custom domain is bound to the apex only, so Cloudflare has no origin
# to reach and every request 522s. Redirect at the edge instead of giving the
# Worker a second hostname, so there stays exactly one canonical host for SEO.
resource "cloudflare_ruleset" "redirects" {
  zone_id = cloudflare_zone.sendtally.id
  name    = "Redirects"
  kind    = "zone"
  phase   = "http_request_dynamic_redirect"

  rules = [{
    ref         = "www_to_apex"
    description = "Send www to the apex, preserving path and query"
    enabled     = true
    expression  = "http.host eq \"www.${var.domain}\""
    action      = "redirect"
    action_parameters = {
      from_value = {
        status_code           = 301
        preserve_query_string = true
        target_url = {
          expression = "concat(\"https://${var.domain}\", http.request.uri.path)"
        }
      }
    }
  }]
}

// The post-deploy smoke check runs from a GitHub Actions runner, so it arrives
// from an Azure datacenter range and Cloudflare challenges it: sendtally.com
// answers 403 with the "Just a moment..." interstitial and the deploy goes red
// even though the Worker is serving fine.
//
// This rule lets a request carrying the shared smoke-check token past the
// security products that run on the Ruleset Engine. Bot Fight Mode is NOT one
// of them - it evaluates outside the engine, so skip has no effect on it. If a
// challenge survives this rule, Bot Fight Mode is the source and the only
// remedies are turning it off or moving to Super Bot Fight Mode, which does
// support skip rules.
resource "cloudflare_ruleset" "smoke_check" {
  zone_id = cloudflare_zone.sendtally.id
  name    = "Deploy smoke check"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [{
    ref         = "smoke_check_skip"
    description = "Let the CI smoke check reach the Worker unchallenged"
    expression  = "(http.request.headers[\"x-sendtally-smoke\"][0] eq \"${var.smoke_check_token}\")"
    action      = "skip"

    action_parameters = {
      // Everything skippable that can serve a challenge or a block to a
      // datacenter client. Bot Fight Mode is deliberately absent - it cannot
      // be listed here.
      products = ["bic", "hot", "rateLimit", "securityLevel", "uaBlock", "waf"]
      ruleset  = "current"
    }

    logging = { enabled = true }
  }]
}

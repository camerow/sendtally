# Training library pictures. The API Worker writes them through its MEDIA binding
# (wrangler.jsonc), and the apps read them from the public host, which Cloudflare
# caches. A Worker deploy fails while its bucket is missing, so apply this before
# the change that adds the binding merges.
locals {
  media_hosts = {
    staging    = "media-staging.${var.domain}"
    production = "media.${var.domain}"
  }
}

resource "cloudflare_r2_bucket" "media" {
  for_each = local.environments

  account_id = var.account_id
  name       = "sendtally-media-${each.key}"
  location   = "wnam"

  lifecycle {
    prevent_destroy = true
  }
}

# Also creates the proxied DNS record, so dns_records carries none for these hosts.
resource "cloudflare_r2_custom_domain" "media" {
  for_each = local.environments

  account_id  = var.account_id
  bucket_name = cloudflare_r2_bucket.media[each.key].name
  domain      = local.media_hosts[each.key]
  zone_id     = cloudflare_zone.sendtally.id
  enabled     = true
  min_tls     = "1.2"
}

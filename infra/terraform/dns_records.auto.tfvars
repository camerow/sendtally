# DNS records for sendtally.com that Terraform owns. Worker hostnames are not
# here: wrangler creates those as Worker custom domains on deploy.
#
# Everything in this file is public - a DNS lookup returns all of it - so it is
# committed and reviewed like any other change. The API token is the one secret
# and comes from TF_VAR_cloudflare_api_token.
#
# TXT content keeps the quotes Cloudflare stores it with, otherwise every plan
# rewrites the record. A value past 255 characters is stored as two quoted
# strings split at 255, and has to be written the same way here.

dns_records = {
  www = {
    name    = "www"
    type    = "CNAME"
    content = "sendtally.com"
    proxied = true
    comment = "Redirect www to the apex Worker"
  }
  clerk_frontend = {
    name    = "clerk"
    type    = "CNAME"
    content = "frontend-api.clerk.services"
    comment = "Clerk production frontend API"
  }
  clerk_accounts = {
    name    = "accounts"
    type    = "CNAME"
    content = "accounts.clerk.services"
    comment = "Clerk account portal"
  }
  clerk_mail = {
    name    = "clkmail"
    type    = "CNAME"
    content = "mail.pfrahfkrtdju.clerk.services"
    comment = "Clerk email sending"
  }
  clerk_dkim1 = {
    name    = "clk._domainkey"
    type    = "CNAME"
    content = "dkim1.pfrahfkrtdju.clerk.services"
    comment = "Clerk DKIM 1"
  }
  clerk_dkim2 = {
    name    = "clk2._domainkey"
    type    = "CNAME"
    content = "dkim2.pfrahfkrtdju.clerk.services"
    comment = "Clerk DKIM 2"
  }
  clerk_mail2 = {
    name    = "clkmail2"
    type    = "CNAME"
    content = "mail2.pfrahfkrtdju.clerk.services"
    comment = "Clerk email sending (second host)"
  }
  clerk_dkim3 = {
    name    = "pdk1._domainkey.clkmail2"
    type    = "CNAME"
    content = "dkim3.pfrahfkrtdju.clerk.services"
    comment = "Clerk DKIM 3"
  }
  clerk_dkim4 = {
    name    = "pdk2._domainkey.clkmail2"
    type    = "CNAME"
    content = "dkim4.pfrahfkrtdju.clerk.services"
    comment = "Clerk DKIM 4"
  }
  google_search = {
    name    = "sendtally.com"
    type    = "TXT"
    content = "\"google-site-verification=eD8TrXv7Uor9fyOtbIffzWf4rTARPbztD5Kk5bGUB3w\""
    ttl     = 3600
    comment = "Google Search Console verification"
  }
  google_mx = {
    name     = "sendtally.com"
    type     = "MX"
    content  = "smtp.google.com"
    priority = 1
    ttl      = 3600
    comment  = "Google Workspace mail for the sendtally.com alias domain"
  }
  google_spf = {
    name    = "sendtally.com"
    type    = "TXT"
    content = "\"v=spf1 include:_spf.google.com include:mailgun.org ~all\""
    ttl     = 3600
    comment = "SPF: Google Workspace plus Mailgun, which PostHog sends through"
  }
  google_dkim = {
    name    = "google._domainkey"
    type    = "TXT"
    content = "\"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyyOTDIHOGRAg+oQUMqkVozMf1s0n+sWlQOpM99o3ArJlIhIl4cVyNGSxdYqdfvK5CGkDWKLpfhWoZEi2oeZG2aNGpEZrGaqjF+yDBajRKLFz2z6CUsxS8HTrBoyKiY8ppdqoBSGwon2jxxWoBYthc4ZwktneN94DS+d/k06tfDyCxJTcwZOYdJnqByw9c7W6o\" \"VoCyXyBpl9k1DsYuX3WLWbSJSe6Ys3rtrlS5GuCuL5NcltnMqdfPe5dvwRs1FJAg+gOzswXALizScUXmtCu/5CW2FsDCu1q3fVd3ev4U7+yvOqcXuWY8I1Ft/kNt65NAO/P/M5pL7MqoOD3gKTj3QIDAQAB\""
    ttl     = 3600
    comment = "Google Workspace DKIM"
  }
  google_dmarc = {
    name    = "_dmarc"
    type    = "TXT"
    content = "\"v=DMARC1; p=reject;\""
    ttl     = 3600
    comment = "DMARC, matching chalkandcircuits.com"
  }
  posthog_dkim = {
    name    = "mailo._domainkey"
    type    = "TXT"
    content = "\"k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCk62nyCgKpmxo676ySHA/ixE/TaLpVQyBGYILPG8WMkIDsZQvnwOvRpCwSfnK3haDvhAF6DVvMGqtTqk++cl2G5aBD7m+B+UqzlxAf2IDI/Z5xfs/0EGcWZpMLk0UwZhebXBdF+njRWIkh/WADpqEclz4yPDUp6nuS/B05ltLrOwIDAQAB\""
    ttl     = 3600
    comment = "PostHog outbound sending (Mailgun) DKIM"
  }
  posthog_proxy = {
    name    = "v"
    type    = "CNAME"
    content = "5f7b17cbc4106fc464a8.cf-prod-us-proxy.proxyhog.com"
    ttl     = 3600
    comment = "PostHog managed reverse proxy"
  }

  # Amazon SES via PostHog, for onboarding mail sent from mail.sendtally.com.
  # The subdomain keeps sending reputation off the apex, which Google Workspace
  # and Clerk use. It has no DMARC record of its own, so it inherits p=reject
  # from the apex; PostHog asks for p=none there, which would weaken it.
  ses_verify = {
    name    = "_amazonses.mail"
    type    = "TXT"
    content = "\"cPkpMl96Psg7PyAo8I3gkHCaXulJMoSx+N5AACbgQiM=\""
    ttl     = 3600
    comment = "Amazon SES domain verification (PostHog)"
  }
  ses_dkim1 = {
    name    = "bnpuftthl7t4w6b5hh2jyhe2mm6xylwr._domainkey.mail"
    type    = "CNAME"
    content = "bnpuftthl7t4w6b5hh2jyhe2mm6xylwr.dkim.amazonses.com"
    ttl     = 3600
    comment = "Amazon SES DKIM 1"
  }
  ses_dkim2 = {
    name    = "5a6f4rdia7ce4qje6f2nvbrkryzxlnru._domainkey.mail"
    type    = "CNAME"
    content = "5a6f4rdia7ce4qje6f2nvbrkryzxlnru.dkim.amazonses.com"
    ttl     = 3600
    comment = "Amazon SES DKIM 2"
  }
  ses_dkim3 = {
    name    = "osotbhmdjwo4o2fthrqucold6lrkf5as._domainkey.mail"
    type    = "CNAME"
    content = "osotbhmdjwo4o2fthrqucold6lrkf5as.dkim.amazonses.com"
    ttl     = 3600
    comment = "Amazon SES DKIM 3"
  }
  ses_spf = {
    name    = "mail"
    type    = "TXT"
    content = "\"v=spf1 include:amazonses.com ~all\""
    ttl     = 3600
    comment = "SPF for mail.sendtally.com (Amazon SES)"
  }
  ses_from_mx = {
    name     = "feedback.mail"
    type     = "MX"
    content  = "feedback-smtp.us-east-1.amazonses.com"
    priority = 10
    ttl      = 3600
    comment  = "Amazon SES custom MAIL FROM"
  }
  ses_from_spf = {
    name    = "feedback.mail"
    type    = "TXT"
    content = "\"v=spf1 include:amazonses.com ~all\""
    ttl     = 3600
    comment = "Amazon SES custom MAIL FROM SPF"
  }
}

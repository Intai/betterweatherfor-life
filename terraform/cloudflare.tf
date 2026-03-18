resource "cloudflare_zone_settings_override" "this" {
  zone_id = var.cloudflare_zone_id

  settings {
    ssl              = "flexible"
    always_use_https = "on"
    min_tls_version  = "1.2"
  }
}

resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = digitalocean_reserved_ip.this.ip_address
  type    = "A"
  proxied = true
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  content = digitalocean_reserved_ip.this.ip_address
  type    = "A"
  proxied = true
}

resource "cloudflare_ruleset" "redirect_www" {
  zone_id     = var.cloudflare_zone_id
  name        = "Redirect www to apex"
  description = "301 redirect www.betterweatherfor.life to betterweatherfor.life"
  kind        = "zone"
  phase       = "http_request_dynamic_redirect"

  rules {
    action = "redirect"
    action_parameters {
      from_value {
        status_code = 301
        target_url {
          expression = "concat(\"https://betterweatherfor.life\", http.request.uri.path)"
        }
        preserve_query_string = true
      }
    }
    expression  = "(http.host eq \"www.betterweatherfor.life\")"
    description = "Redirect www to apex domain"
    enabled     = true
  }
}

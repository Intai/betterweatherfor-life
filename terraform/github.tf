resource "github_actions_secret" "digitalocean_access_token" {
  repository      = var.github_repo
  secret_name     = "DIGITALOCEAN_ACCESS_TOKEN"
  plaintext_value = var.do_token
}

resource "github_actions_secret" "google_maps_api_key" {
  repository      = var.github_repo
  secret_name     = "GOOGLE_MAPS_API_KEY"
  plaintext_value = var.google_maps_api_key
}

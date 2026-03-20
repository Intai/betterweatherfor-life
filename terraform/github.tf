resource "github_actions_secret" "kube_config" {
  repository      = var.github_repo
  secret_name     = "KUBE_CONFIG"
  plaintext_value = digitalocean_kubernetes_cluster.this.kube_config[0].raw_config
}

resource "github_actions_secret" "google_maps_api_key" {
  repository      = var.github_repo
  secret_name     = "GOOGLE_MAPS_API_KEY"
  plaintext_value = var.google_maps_api_key
}

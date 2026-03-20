variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for betterweatherfor.life"
  type        = string
}

variable "do_region" {
  description = "DigitalOcean region"
  type        = string
  default     = "syd1"
}

variable "cluster_name" {
  description = "Kubernetes cluster name"
  type        = string
  default     = "betterweather"
}

variable "node_size" {
  description = "Droplet size for worker nodes"
  type        = string
  default     = "s-1vcpu-2gb"
}

variable "node_count" {
  description = "Number of worker nodes"
  type        = number
  default     = 1
}

variable "github_token" {
  description = "GitHub PAT with repo scope for managing Actions secrets"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "betterweatherfor-life"
}

variable "google_maps_api_key" {
  description = "Google Maps API key"
  type        = string
  sensitive   = true
}

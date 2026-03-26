output "cluster_id" {
  description = "DOKS cluster ID"
  value       = digitalocean_kubernetes_cluster.this.id
}

output "cluster_endpoint" {
  description = "DOKS cluster API endpoint"
  value       = digitalocean_kubernetes_cluster.this.endpoint
  sensitive   = true
}

output "reserved_ip" {
  description = "Reserved IP for the LoadBalancer"
  value       = digitalocean_reserved_ip.this.ip_address
}
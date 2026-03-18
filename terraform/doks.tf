data "digitalocean_kubernetes_versions" "this" {}

resource "digitalocean_kubernetes_cluster" "this" {
  name    = var.cluster_name
  region  = var.do_region
  version = data.digitalocean_kubernetes_versions.this.latest_version

  node_pool {
    name       = "${var.cluster_name}-pool"
    size       = var.node_size
    node_count = var.node_count
  }
}

resource "digitalocean_reserved_ip" "this" {
  region = var.do_region
}

resource "digitalocean_reserved_ip_assignment" "this" {
  ip_address = digitalocean_reserved_ip.this.ip_address
  droplet_id = digitalocean_kubernetes_cluster.this.node_pool[0].nodes[0].droplet_id
}

resource "digitalocean_firewall" "web" {
  name = "${var.cluster_name}-web"
  droplet_ids = [digitalocean_kubernetes_cluster.this.node_pool[0].nodes[0].droplet_id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
}

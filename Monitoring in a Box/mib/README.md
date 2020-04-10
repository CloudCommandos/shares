# MiB Docker setup
The MiB will be setup by using the docker-compose file in this folder.
The following ports will be exposed on the localhost for the each applications:
| App | Port |
| --- | --- |
| Prometheus | 9090 |
| Alertmanager | 9093 |
| Grafana | 3000 |

User can access the web GUI of each application via `http://localhost:ports`

Note:
Please ensure the following are configured before starting the docker-compose file.
* Directory `data/prometheus/db/` needs to have a ownsership of `nobody:nogroup` or `65534:65534`
* Directory in `data/grafana/` needs to have a ownership of `472:472`

Recommended exporter:

For Linux system - Node Exporter version 0.18.1
* Debian/Ubuntu - Download [here](http://ftp.ubuntu.com/ubuntu/ubuntu/pool/universe/p/prometheus-node-exporter/prometheus-node-exporter_0.18.1+ds-1_amd64.deb)
* CentOS/RedHat - Download [here](https://packagecloud.io/prometheus-rpm/release/packages/el/7/node_exporter-0.18.1-1.el7.x86_64.rpm)

For Windows system - WMI Exporter version 0.10.2

Download available [here](https://github.com/martinlindhe/wmi_exporter/releases/download/v0.10.2/wmi_exporter-0.10.2-amd64.msi)

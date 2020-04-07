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

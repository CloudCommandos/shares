#!/bin/bash
echo "Changing Prometheus config..."
cp /opt/MiB/WebGUI/backend/backend_server/scripts/prometheus_rules_draft.yml /opt/MiB/WebGUI/backend/backend_server/scripts/prometheus_rules.yml
echo "Reloading Prometheus..."
docker-compose -f /opt/MiB/docker-compose.yaml exec prometheus kill -1 1
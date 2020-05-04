#!/bin/bash
echo "Changing Alertmanager config..."
cp /opt/MiB/WebGUI/backend/backend_server/scripts/alertmanager_config_draft.yml /opt/MiB/WebGUI/backend/backend_server/scripts/alertmanager_config.yml
echo "Reloading Alertmanager..."
docker-compose -f /opt/MiB/docker-compose.yaml exec alertmanager kill -1 1

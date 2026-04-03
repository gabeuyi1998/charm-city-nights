#!/bin/bash
export N8N_PORT=5678
export N8N_BASIC_AUTH_ACTIVE=true
export N8N_BASIC_AUTH_USER=admin
export N8N_BASIC_AUTH_PASSWORD=charmcity
export N8N_WORKFLOW_TAGS_DISABLED=false
export EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
export N8N_USER_FOLDER=$(pwd)/n8n

n8n start

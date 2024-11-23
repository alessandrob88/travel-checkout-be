#!/bin/bash
set -x

host=$1
port=$2
timeout=$3

echo "Host: $host"
echo "Port: $port"
echo "Timeout: $timeout"

until nc -zv "$host" "$port"; do
  echo "Waiting for $host:$port to be ready..."
  sleep 2
done

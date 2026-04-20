#!/bin/sh
# Ждём пока PostgreSQL не будет готов принимать соединения
HOST=$1
shift
CMD="$@"

echo "Waiting for PostgreSQL at $HOST..."
until nc -z "$HOST" 5432 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping 2s"
  sleep 2
done

echo "PostgreSQL is up - starting application"
exec $CMD

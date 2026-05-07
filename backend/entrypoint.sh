#!/bin/sh
echo "Running prisma db push..."
npx prisma db push
if [ "$SEED_ON_START" = "true" ]; then
  echo "SEED_ON_START=true, seeding database..."
  node prisma/seed.js
else
  echo "SEED_ON_START is not true, skipping seed."
fi
echo "Running final fixes..."
node finalFixes.js
echo "Starting server..."
exec node src/server.js

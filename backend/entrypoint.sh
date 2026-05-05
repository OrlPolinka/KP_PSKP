#!/bin/sh
echo "Running prisma db push..."
npx prisma db push --accept-data-loss
echo "Seeding database..."
node prisma/seed.js
echo "Running final fixes..."
node finalFixes.js
echo "Starting server..."
exec node src/server.js

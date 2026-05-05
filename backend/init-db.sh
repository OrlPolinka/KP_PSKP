#!/bin/sh
echo "Initializing database..."

# Run migrations
npx prisma migrate deploy

# Run seed
node prisma/seed.js

# Run fixes
node fixAllProblems.js
node finalFixes.js

echo "Database initialized successfully!"
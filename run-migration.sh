#!/bin/bash
# Run Supabase migration 005

# Exit on error
set -e

echo "🔄 Running migration: 005_drafts_and_year_stats.sql"

# Get database URL from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Check if we have database credentials
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
  exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
echo "📦 Project ref: $PROJECT_REF"

# Construct database URL
DB_URL="postgresql://postgres:[YOUR_DB_PASSWORD]@db.$PROJECT_REF.supabase.co:5432/postgres"

echo ""
echo "⚠️  You need to run this SQL manually in Supabase Dashboard:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo "2. Copy the content from: supabase/migrations/005_drafts_and_year_stats.sql"
echo "3. Paste it into the SQL Editor"
echo "4. Click 'Run'"
echo ""
echo "Or use psql directly:"
echo ""
echo "psql \"$DB_URL\" -f supabase/migrations/005_drafts_and_year_stats.sql"
echo ""

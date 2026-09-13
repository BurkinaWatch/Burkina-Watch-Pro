#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting pre-deployment migration...${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL is not set${NC}"
    exit 1
fi

echo -e "${BLUE}DATABASE_URL is available${NC}"

# Run database migration
echo -e "${BLUE}Running database migration...${NC}"
if pnpm --filter @workspace/db run push; then
    echo -e "${GREEN}Database migration completed successfully${NC}"
else
    echo -e "${RED}Database migration failed${NC}"
    exit 1
fi

echo -e "${GREEN}Pre-deployment setup complete${NC}"
echo -e "${BLUE}Starting application...${NC}"

# Start the application
exec "$@"


#!/bin/bash
set -xv

npm run build

npm run dev

echo "git config core.ignorecase false"

vercel deploy

exit 0

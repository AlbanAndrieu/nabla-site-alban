#!/bin/bash
#set -xv
#set -eo pipefail

npm run test -- --project="Mobile Safari" tests/homepage.spec.ts tests/responsive.spec.ts

npm run test -- --project=chromium tests/site-widgets.spec.ts tests/site-analytics.spec.ts

exit 0

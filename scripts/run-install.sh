#!/bin/bash
#set -xv
#set -eo pipefail

npm install --save @fortawesome/fontawesome-svg-core
npm install --save @fortawesome/free-solid-svg-icons
npm install --save @fortawesome/free-regular-svg-icons
npm install --save @fortawesome/free-brands-svg-icons

npm install
npx playwright install

./run-test.sh

exit 0

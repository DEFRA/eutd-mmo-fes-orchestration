#/bin/bash
export LANG=C.UTF-8
curl -O https://nodejs.org/dist/v12.18.4/node-v12.18.4-linux-x64.tar.xz
tar -xf node-v12.18.4-linux-x64.tar.xz --directory /tmp
export PATH="/tmp/node-v12.18.4-linux-x64/bin:$PATH"
rm node-v12.18.4-linux-x64.tar.xz
echo "[INFO] npm ci"
npm ci > /tmp/mmo-cc-orch-svc-npmci.log 2>&1
echo "[INFO] npm run test-vstack"
npm run test-vstack > /tmp/mmo-cc-orch-svc-npmtest.log 2>&1
rm -rf /tmp/node-v12.18.4-linux-x64

/* eslint-env node */

const fs = require('node:fs');
const path = require('node:path');

const fixedTar = path.resolve(__dirname, '../node_modules/tar');
const bundledTar = path.resolve(
  __dirname,
  '../node_modules/muhammara/node_modules/tar',
);

if (fs.existsSync(fixedTar) && fs.existsSync(bundledTar)) {
  fs.rmSync(bundledTar, { recursive: true, force: true });
  fs.cpSync(fixedTar, bundledTar, { recursive: true });
}
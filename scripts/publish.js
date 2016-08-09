/* eslint-disable no-console */

const crates = require('./crates.js');
const build = require('./build.js');

function start() {
  return new Promise((resolve) => {
    resolve();
  });
}

start()
  .then(crates)
  .then(build)
  .catch((err) => console.error(err));


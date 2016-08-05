/* eslint-disable no-console */

const crates = require('./scripts/crates.js');

function start() {
  return new Promise((resolve) => {
    resolve();
  });
}

start()
  .then(crates)
  // .then(crates.update)
  .catch((err) => console.error(err));


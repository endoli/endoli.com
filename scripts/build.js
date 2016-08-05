/* eslint-disable no-console */

const crates = require('./crates.js');

function start() {
  return new Promise((resolve) => {
    resolve();
  });
}

start()
  .then(crates)
  .catch((err) => console.error(err));


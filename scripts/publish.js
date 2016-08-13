const crates = require('./crates.js');
const library = require('./library.js');

function start() {
  return new Promise((resolve) => {
    resolve();
  });
}

start()
  .then(crates)
  .then(library)
  .catch((err) => console.error(err));


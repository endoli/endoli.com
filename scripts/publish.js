const crates = require('./crates.js');
const library = require('./library.js');
const posts = require('./posts.js');
const blog = require('./blog.js');
const fse = require('fs-extra');

function start() {
  return new Promise((resolve, reject) => {
    const input = './templates/index.html';
    const output = './public/index.html';
    fse.copy(input, output, { clobber: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(err);
      }
    });
  });
}

start()
  .then(crates)
  .then(library)
  .then(posts)
  .then(blog)
  .catch((err) => console.error(err));


/* eslint-disable no-unused-vars */
const crates = require('./crates.js');
const libraries = require('./libraries.js');
const posts = require('./posts.js');
const blog = require('./blog.js');
const categories = require('./categories.js');
const tags = require('./tags.js');
const feed = require('./feed.js');
const assets = require('./assets.js');
const fse = require('fs-extra');
/* eslint-enable no-unused-vars */

function home() {
  return new Promise((resolve, reject) => {
    const input = './templates/index.html';
    const output = './public/index.html';
    fse.copy(input, output, { clobber: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function styles() {
  return new Promise((resolve, reject) => {
    const input = './styles/theme.css';
    const output = './public/styles/theme.css';
    fse.copy(input, output, { clobber: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function scripts() {
  return new Promise((resolve, reject) => {
    const input = './scripts/page.js';
    const output = './public/scripts/page.js';
    fse.copy(input, output, { clobber: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

home()
  .then(styles)
  .then(scripts)
  .then(crates)
  .then(libraries)
  .then(posts)
  .then(blog)
  .then(categories)
  .then(tags)
  .then(feed)
  .then(assets)
  .catch((err) => console.error(err));


/* eslint-disable no-unused-vars, no-shadow */
const assets = require('./assets.js');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const atImport = require('postcss-import');
const blog = require('./blog.js');
const categories = require('./categories.js');
const crates = require('./crates.js');
const feed = require('./feed.js');
const fs = require('fs');
const fse = require('fs-extra');
const libraries = require('./libraries.js');
const path = require('path');
const postcss = require('postcss');
const posts = require('./posts.js');
const tags = require('./tags.js');

const series = (arr, iter) =>
  arr.reduce((p, item) => p.then(() => iter(item)), Promise.resolve());

const home = () =>
  new Promise((resolve, reject) => {
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

const style = () =>
  new Promise((resolve, reject) => {
    fs.readFile('./styles/input.css', (err, css) => {
      if (err) {
        reject(err);
      } else {
        postcss([atImport(), autoprefixer, cssnano()])
          .process(css)
          .then((result) =>
            fse.ensureDir(path.dirname('./public/styles/delft.css'), (err) => {
              if (err) {
                reject(err);
              } else {
                fs.writeFile('./public/styles/delft.css', result, (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                });
              }
            })
          )
          .catch((err) => reject(err));
      }
    });
  });

const scripts = () =>
  new Promise((resolve, reject) => {
    const input = './scripts/front/page.js';
    const output = './public/scripts/page.js';
    fse.copy(input, output, { clobber: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

style()
  .then(scripts)
  // .then(crates)
  .then(libraries)
  .then(posts)
  .then(blog)
  .then(categories)
  .then(tags)
  .then(feed)
  .then(assets)
  .catch((err) => console.error(err));


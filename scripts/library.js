/* eslint-disable global-require */

const fse = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const fs = require('fs');

require('toml-require').install({ toml: require('toml') });

const start = () => new Promise((resolve) => resolve());

const series = (arr, iter) =>
  arr.reduce((p, item) => p.then(() => iter(item)), Promise.resolve());

const copy = (input, output) =>
  new Promise((resolve, reject) =>
    fse.copy(input, output, { clobber: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(err);
      }
    })
  );

const copyAll = () => {
  const files = [
    {
      input: path.resolve('./scripts/page.js'),
      output: path.resolve('./public/scripts/page.js'),
    },
    {
      input: path.resolve('./templates/library.html'),
      output: path.resolve('./public/library.html'),
    },
    {
      input: path.resolve('./styles/theme.css'),
      output: path.resolve('./public/styles/theme.css'),
    },
  ];

  return series(files, (file) => copy(file.input, file.output));
};

const normalizeName = (dir) => {
  let normalized = require(path.join('../crates', dir, 'Cargo.toml')).package.name;
  normalized = normalized.replace('-', '_');

  return normalized;
};

const getDirectories = (location) =>
  fs.readdirSync(location).filter((file) =>
    fs.statSync(path.join(location, file)).isDirectory());

const listLibs = () =>
  new Promise((resolve) => {
    const libs = _.map(getDirectories('./public/libraries'), (dir) => ({
      name: dir,
      realName: normalizeName(dir),
      tags: [],
    }));
    resolve(libs);
  });

const listTags = (libs) =>
  new Promise((resolve) => {
    _.each(libs, (lib) => {
      lib.tags = getDirectories(path.join('./public/libraries', lib.name));
    });
    resolve(libs);
  });

const writeLibs = (libs) =>
  new Promise((resolve, reject) => {
    fse.ensureDirSync(path.resolve('./public/data/'));
    fse.writeJson('./public/data/crates.json', libs, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

module.exports = () => start()
  .then(listLibs)
  .then(listTags)
  .then(writeLibs)
  .then(copyAll);

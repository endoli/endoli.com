/* eslint-disable global-require, max-len */

const fse = require('fs-extra');
const path = require('path');
const config = require('../config.json');
const _ = require('lodash');
const fs = require('fs');
const cheerio = require('cheerio');

require('toml-require').install({ toml: require('toml') });

const start = () => new Promise((resolve) => resolve());

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

const createList = (libs) =>
  new Promise((resolve) => {
    const template = cheerio.load(fs.readFileSync('./templates/libraries.html', 'utf8'));
    _.each(libs, (lib) => {
      const location = `${config.host}/libraries/${lib.name}/index.html`;
      template('#content').append(`<div><a href=${location}>${lib.name}</a></div>`);
    });
    fse.outputFileSync('./public/libraries.html', template.html());
    resolve(libs);
  });

const createIndexes = (libs) =>
  new Promise((resolve) => {
    _.each(libs, (lib) => {
      const template = cheerio.load(fs.readFileSync('./templates/library.html', 'utf8'));
      const output = `./public/libraries/${lib.name}/index.html`;
      const location = `${config.host}/libraries/${lib.name}/master/${lib.realName}/index.html`;
      template('#documentationFrame').attr('src', location);
      template('head').append(`<script>function getInfo(){
        return {
          host: '${config.host}',
          lib: ${JSON.stringify(lib)}
        };
      }</script>`);
      fse.outputFileSync(output, template.html());
    });
    resolve();
  });

module.exports = () => start()
  .then(listLibs)
  .then(listTags)
  .then(createList)
  .then(createIndexes);

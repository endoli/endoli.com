/* eslint-disable global-require, max-len */

const fse = require('fs-extra');
const path = require('path');
const config = require('../config.json');
const _ = require('lodash');
const fs = require('fs');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

require('toml-require').install({ toml: require('toml') });

const start = () => new Promise((resolve) => resolve());

const normalizeName = (dir) => {
  let normalized = require(path.join('../crates', dir, 'Cargo.toml')).package.name;
  normalized = normalized.replace('-', '_');

  return normalized;
};

const normalizeTag = (tag) => tag.replace('v', '');

const getDevelopmentVersion = (dir) =>
  require(path.join('../crates', dir, 'Cargo.toml')).package.version;

const getDirectories = (location) =>
  fs.readdirSync(location).filter((file) =>
    fs.statSync(path.join(location, file)).isDirectory());

const listLibs = () =>
  new Promise((resolve) => {
    const libs = _.map(getDirectories('./public/libraries'), (dir) => ({
      name: dir,
      realName: normalizeName(dir),
      developmentVersion: getDevelopmentVersion(dir),
      tags: [],
    }));
    resolve(libs);
  });

const getCurrent = (lib) =>
  new Promise((resolve) => {
    fetch(`https://crates.io/api/v1/crates/${lib.realName}/versions`)
      .then((res) => res.json())
      .then((json) => {
        lib.currentVersion = json.versions[0].num;
        resolve();
      })
      .catch(() => {
        lib.currentVersion = undefined;
        resolve();
      });
  });

const listCurrent = (libs) =>
  Promise.all(_.map(libs, (lib) => getCurrent(lib)))
    .then(() => libs);

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
      template('#content').append(`
        <div id="${lib.name}">
          ${lib.name}
        </div>`
      );

      if (lib.currentVersion) {
        template(`#${lib.name}`).append(`
          <a href="${config.host}/libraries/${lib.name}/master/${lib.realName}/index.html">
            Current release (${lib.currentVersion})
          </a>`
        );
      } else {
        template(`#${lib.name}`).append('<span>Unpublished</span>');
      }

      template(`#${lib.name}`).append(`
        <a href="${config.host}/libraries/${lib.name}/master/${lib.realName}/index.html">
          Development
        </a>`
      );

      if (lib.tags.length > 2) {
        template(`#${lib.name}`).append('<select class="versionSelector"><option value="other">Other versions</option></select>');

        _(lib.tags)
          .tail()
          .each((tag) => {
            if (normalizeTag(tag) !== lib.currentVersion) {
              template(`#${lib.name} select`).append(`
                <option value="${config.host}/libraries/${lib.name}/${tag}/${lib.realName}/index.html">
                  ${tag}
                </option>
              `);
            }
          });
      }
    });

    fse.outputFileSync('./public/libraries.html', template.html());
    resolve(libs);
  });

module.exports = () => start()
  .then(listLibs)
  .then(listCurrent)
  .then(listTags)
  .then(createList);

/* eslint-disable global-require, max-len, prefer-const */

const fse = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const fs = require('fs');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const config = require('../../config.json');

require('toml-require').install({ toml: require('toml') });

const start = () => new Promise((resolve) => resolve());

const normalizeName = (dir) => {
  let normalized = require(path.join('../../crates', dir, 'Cargo.toml')).package.name;
  normalized = normalized.replace('-', '_');

  return normalized;
};

const normalizeTag = (tag) => tag.replace('v', '');

const getDevelopmentVersion = (dir) =>
  require(path.join('../../crates', dir, 'Cargo.toml')).package.version;

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
    template('#content').append(`
      <table>
        <thead>
          <tr>
            <th>Library</th>
            <th>Release</th>
            <th>Development</th>
            <th>Versions</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    `);

    _.each(libs, (lib) => {
      let libName;
      let libRelease;
      let libDevelopment;
      let libVersions;

      libName = `<td>${lib.name}</td>`;

      if (lib.currentVersion) {
        libRelease = `
          <td>
            <a href="${config.host}/libraries/${lib.name}/master/${lib.realName}/index.html">
              ${lib.currentVersion}
            </a>
          </td>
        `;
      } else {
        libRelease = '<td>Unpublished</td>';
      }

      libDevelopment = `
        <td>
          <a href="${config.host}/libraries/${lib.name}/master/${lib.realName}/index.html">
            ${lib.developmentVersion}
          </a>
        </td>
      `;

      if (lib.tags.length > 2) {
        let options = '';

        _(lib.tags)
          .tail()
          .each((tag) => {
            if (normalizeTag(tag) !== lib.currentVersion) {
              options = options.concat(`
                <option value="${config.host}/libraries/${lib.name}/${tag}/${lib.realName}/index.html">
                  ${tag}
                </option>
              `);
            }
          });

        libVersions = `
          <td>
            <select class="versionSelector">
              <option value="other">Other versions</option>
              ${options}
            </select>
          </td>
        `;
      } else {
        libVersions = '<td>N/A</td>';
      }

      const lastRow = template('#content > table > tbody').append('<tr></tr>');
      lastRow.append(libName);
      lastRow.append(libRelease);
      lastRow.append(libDevelopment);
      lastRow.append(libVersions);
    });

    fse.outputFileSync('./public/libraries.html', template.html());
    resolve(libs);
  });

module.exports = () => start()
  .then(listLibs)
  .then(listCurrent)
  .then(listTags)
  .then(createList);

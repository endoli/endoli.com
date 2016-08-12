/* eslint-disable new-cap */

const fs = require('fs');
const _ = require('lodash');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const config = require('../config.json');
const path = require('path');
const git = require('nodegit');

const start = () =>
  new Promise((resolve, reject) => {
    exec('mkdir -p ./crates ./public/libraries', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

const create = (crate) =>
  new Promise((resolve) =>
    git.Clone(crate.repository, path.join('./crates', crate.name))
      .then((repository) => resolve({ name: crate.name, repository }))
      .catch(() => git.Repository
        .open(path.join('./crates', crate.name))
        .then((repository) => resolve({ name: crate.name, repository }))
      )
  );

const createAll = () =>
  Promise.all(_.map(config.crates, (crate) => create(crate)));

const update = (crate) =>
  crate.repository.getRemote('origin')
    .then((remote) => {
      git.Remote.setAutotag(crate.repository, remote.name(), 3);
      return crate.repository.fetchAll({ downloadTags: 1 })
        .then(() => {
          crate.repository.mergeBranches('master', 'origin/master');
          return crate;
        });
    });

const updateAll = (crates) =>
  Promise.all(_.map(crates, (crate) => update(crate)));

const getTag = (crate) =>
  git.Tag.list(crate.repository)
    .then((tags) => {
      tags.push('master');
      return { tags, name: crate.name, repository: crate.repository };
    });

const getTagAll = (crates) =>
  Promise.all(_.map(crates, (crate) => getTag(crate)));

const docTag = (crate, tagId) =>
  new Promise((resolve) => {
    const input = path.join('./crates/', crate.name);
    const output = path.join('./public/libraries', crate.name, tagId);
    let exists = true;

    if (tagId !== 'master') {
      try {
        fs.accessSync(output, fs.F_OK);
      } catch (err) {
        exists = false;
      }
    } else {
      exists = false;
    }

    if (exists) {
      resolve();
    } else {
      execSync(`mkdir -p ${output}`);
      execSync(`git checkout ${tagId}`, { cwd: input });
      exec('cargo doc', { cwd: input }, (err) => {
        if (err) {
          console.info(`Cannot build docs for ${tagId} tag.`);
          execSync(`rm -rf ${output}`);
        } else {
          execSync(`\\cp -rf ${path.join(input, 'target/doc')}/** ${output}`);
        }
        resolve();
      });
    }
  });

const series = (arr, iter) =>
  arr.reduce((p, item) => p.then(() => iter(item)), Promise.resolve());

const docTagAll = (crate) => {
  const tasks = _.map(crate.tags, (tag) => ({ crate, tag }));
  return series(tasks, (task) => docTag(task.crate, task.tag));
};

const doc = (crate) => docTagAll(crate);

const docAll = (crates) =>
  Promise.all(_.map(crates, (crate) => doc(crate)));

module.exports = () => start()
  .then(createAll)
  .then(updateAll)
  .then(getTagAll)
  .then(docAll);

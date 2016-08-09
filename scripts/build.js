const cheerio = require('cheerio');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const _ = require('lodash');

const $ = cheerio.load(fs.readFileSync('./templates/index.html'));

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
  let files = [
    path.resolve('./scripts/page.js'),
  ];

  files = _.map(files, (file) => ({
    input: file,
    output: path.join('./public/scripts/', path.basename(file)),
  }));

  return series(files, (file) => copy(file.input, file.output));
};

module.exports = () => start()
  .then(copyAll);

/* eslint-disable no-shadow */
const _ = require('lodash');
const fs = require('fs');
const fse = require('fs-extra');
const cheerio = require('cheerio');
const moment = require('moment');

const start = (all) =>
  new Promise((resolve, reject) =>
    fs.readFile('templates/blog.html', 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        const template = cheerio.load(data);
        const posts = _(all)
          .map((post) => ({
            title: post.title,
            filename: post.filename,
            date: moment(post.date),
          }))
          .sortBy('date')
          .reverse()
          .value();

        _.each(posts, (post) => {
          const date = `<span>${post.date.format('LL')}</span>`;
          const link = `<span><a href="./blog/posts/${post.filename}">${post.title}</a></span>`;
          template('#content').append(`<div class='post'>${date} ${link}</div>`);
        });

        fse.outputFile('./public/blog.html', template.html(), (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }
    }));

module.exports = (all) => start(all);

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
            title: post.meta.title,
            filename: post.meta.filename,
            date: moment(post.meta.date),
          }))
          .sortBy((post) => post.date)
          .reverse()
          .value();

        template('#content').append('<ul id="postList"></ul>');
        _.each(posts, (post) => {
          const date = `<span>${post.date.format('LL')}</span>`;
          const link = `<a href="./blog/posts/${post.filename}">${post.title}</a>`;
          template('#postList').append(`<li>${link}, ${date}</li>`);
        });

        fse.outputFile('./public/blog.html', template.html(), (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(all);
          }
        });
      }
    }));

module.exports = (all) => start(all);

/* eslint-disable no-shadow */
const _ = require('lodash');
const fs = require('fs');
const fse = require('fs-extra');
const cheerio = require('cheerio');
const moment = require('moment');

const extractExcerpt = (post) => {
  if (post.meta.description) {
    return post.meta.description;
  }

  return cheerio.load(post.contents)('p').contents()[0].data;
};

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
            author: post.meta.author,
            date: moment(post.meta.date),
            excerpt: extractExcerpt(post),
          }))
          .sortBy((post) => post.date)
          .reverse()
          .value();

        template('#content').append('<ul id="blogList"></ul>');
        const list = template('#blogList');

        _.each(posts, (post) => {
          list.append(`
            <li>
              <div class="blogTitle">
                <a href="./blog/posts/${post.filename}">${post.title}</a>
              </div>
              <div class="blogMetadata">
                by ${post.author} on ${moment(post.date).format('MMMM Do YYYY')}
              </div>
              <div class="blogExcerpt"><p>${post.excerpt}</p></div>
              <div class="blogMore">
                <a href="./blog/posts/${post.filename}">Read more...</a>
              </div>
            </li>
          `);
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

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
          .map(({ meta }) => ({
            title: meta.title,
            filename: meta.filename,
            date: moment(meta.date),
          }))
          .sortBy((post) => post.date)
          .reverse()
          .groupBy(({ date }) => date.year())
          .transform((res, value, key) => {
            res[key] = _.groupBy(value, ({ date }) => date.month());
          })
          .value();
        const years = _(posts)
          .keys()
          .sortBy((year) => year)
          .reverse()
          .value();

        _.each(years, (year) => {
          template('#content').append(`
            <h1 class="year">${year}</h1>
          `);

          const months = _(posts[year])
            .keys()
            .sortBy((month) => month)
            .reverse()
            .value();

          _.each(months, (month) => {
            template('#content').append(`
              <h2 class="month">${moment().month(month).format('MMMM')}</h2>
            `);
            let entries = '<ul class="day">';
            _.each(posts[year][month], (post) => {
              entries = entries.concat(`
                <li>
                  <span>${post.date.format('Do')}</span>
                  <a href="./blog/posts/${post.filename}">${post.title}</a>
                </li>
              `);
            });
            entries = entries.concat('</ul>');
            template('#content').append(entries);
          });
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

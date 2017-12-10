/* eslint-disable no-shadow, max-len */
const _ = require('lodash');
const fs = require('fs');
const fse = require('fs-extra');
const cheerio = require('cheerio');

const start = (all) =>
  new Promise((resolve, reject) =>
    fse.emptyDir('./public/categories/', (err) => {
      if (err) {
        reject(err);
      } else {
        let cats = [];
        _.each(all, (post) => { cats = _.concat(cats, post.meta.categories); });
        cats = _(cats)
          .uniq()
          .map((cat) => ({ category: cat }))
          .keyBy((o) => o.category)
          .value();
        cats = _.each(cats, (cat) => {
          delete cat.category;
          cat.posts = [];
        });
        _.each(all, (post) => {
          _.each(post.meta.categories, (cat) => {
            cats[cat].posts.push(post);
          });
        });

        _.each(cats, (cat, name) => {
          const template = cheerio.load(fs.readFileSync('./templates/category.html', 'utf8'));
          const location = `./public/categories/${name}.html`;

          template('#content').append(`
            <h1>'${name}'</h1>
            <ul></ul>
          `);

          _.each(cat.posts, (post) => {
            const m = post.meta;
            template('#content ul').append(`<li><a href="../${m.location}">${m.title}</a></li>`);
          });

          fse.outputFileSync(location, template.html());
        });

        resolve(all);
      }
    })
  );

module.exports = (all) => start(all);

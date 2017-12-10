/* eslint-disable no-shadow, max-len */
const _ = require('lodash');
const fs = require('fs');
const fse = require('fs-extra');
const cheerio = require('cheerio');

const start = (all) =>
  new Promise((resolve, reject) =>
    fse.emptyDir('./public/tags/', (err) => {
      if (err) {
        reject(err);
      } else {
        let tags = [];
        _.each(all, (post) => { tags = _.concat(tags, post.meta.tags); });
        tags = _(tags)
          .uniq()
          .map((tag) => ({ tag }))
          .keyBy((o) => o.tag)
          .value();
        tags = _.each(tags, (tag) => {
          delete tag.tag;
          tag.posts = [];
        });
        _.each(all, (post) => {
          _.each(post.meta.tags, (tag) => {
            tags[tag].posts.push(post);
          });
        });

        _.each(tags, (tag, name) => {
          const template = cheerio.load(fs.readFileSync('./templates/tag.html', 'utf8'));
          const location = `./public/tags/${name}.html`;

          template('#content').append(`
            <h1>'${name}'</h1>
            <ul></ul>
          `);

          _.each(tag.posts, (post) => {
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

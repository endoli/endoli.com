const _ = require('lodash');
const fse = require('fs-extra');
const RSS = require('rss');
const config = require('../../config.json');

const build = (all) =>
  new Promise((resolve, reject) => {
    const feed = new RSS({
      title: 'Endoli Blog',
      description: 'Endoli Blog Feed',
      site_url: config.host,
      feed_url: `${config.host}/rss.xml`,
    });
    _.each(all, (post) => {
      feed.item({
        title: post.meta.title,
        description: post.content,
        url: `${config.host}/blog/posts/${post.meta.filename}`,
        date: post.meta.date,
        categories: post.meta.categories,
      });
    });
    fse.outputFile('./public/rss.xml', feed.xml({ indent: true }), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(all);
      }
    });
  });

module.exports = (all) => build(all);

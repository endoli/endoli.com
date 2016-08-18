/* eslint-disable max-len, no-shadow */
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const remark = require('remark');
const html = require('remark-html');
const hljs = require('remark-highlight.js');
const metaPlugin = require('remark-yaml-meta');
const cheerio = require('cheerio');
const config = require('../config.json');

const all = [];

const start = () =>
  new Promise((resolve) => {
    fse.ensureDir('./public/blog/', () => resolve());
  });

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
  const files = [
    {
      input: path.resolve('./templates/blog.html'),
      output: path.resolve('./public/blog.html'),
    },
    {
      input: path.resolve('./scripts/highlight.js'),
      output: path.resolve('./public/scripts/highlight.js'),
    },
  ];

  return series(files, (file) => copy(file.input, file.output));
};

const listPosts = () =>
  new Promise((resolve) => {
    const list = fs.readdirSync('./blog/').filter((file) =>
      fs.statSync(path.join('./blog/', file)).isFile());
    const posts = _.map(list, (item) => path.join('./blog/', item));

    resolve(posts);
  });

const publishPost = (file, cb) =>
  fs.readFile('templates/post.html', 'utf8', (err, data) => {
    if (err) {
      return cb(err);
    }
    const template = cheerio.load(data);
    const high = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.6.0/languages/';
    template('#content').append(file.contents);
    template('head').append('<script src="../../scripts/highlight.js"></script>');
    _.each(config.highlight, (lang) => template('head').append(`<script src="${high}${lang}.min.js"></script>`));
    template('head').append('<script>hljs.initHighlightingOnLoad();</script>');

    if (file.meta.author) {
      template('#content').append(`<div id="author">Author: ${file.meta.author}</div>`);
    } else {
      console.warn('Blog post is missing author!');
    }

    if (file.meta.date) {
      template('#content').append(`<div id="date">Date: ${file.meta.date}</div>`);
    } else {
      console.warn('Blog post is missing date!');
    }

    if (file.meta.categories) {
      template('#content').append('<div id="categories">Categories: </div>');
      _.each(file.meta.categories, (category, index) => {
        if (index !== file.meta.categories.length - 1) {
          template('#categories').append(`<span>${category}, </span>`);
        } else {
          template('#categories').append(`<span>${category}</span>`);
        }
      });
    } else {
      console.warn('Blog post is missing categories!');
    }

    if (file.meta.tags) {
      template('#content').append('<div id="tags">Tags: </div>');
      _.each(file.meta.tags, (tag, index) => {
        if (index !== file.meta.tags.length - 1) {
          template('#tags').append(`<span>${tag}, </span>`);
        } else {
          template('#tags').append(`<span>${tag}</span>`);
        }
      });
    } else {
      console.warn('Blog post is missing tags!');
    }
    return fse.outputFile(path.join('./public/blog/posts/', file.meta.filename), template.html(), (err) => {
      if (err) {
        return cb(err);
      }
      return cb();
    });
  });

/* eslint-disable no-shadow, no-param-reassign */
const parsePost = (post) =>
  new Promise((resolve, reject) => {
    fs.readFile(post, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        remark()
          .use(metaPlugin)
          .use(html)
          .use(hljs, { include: config.highlight })
          .process(data, (err, file) => {
            file.meta.filename = path.basename(post).replace('.md', '.html');
            if (file.meta.published) {
              all.push(file.meta);
              publishPost(file, () => resolve());
            } else {
              resolve();
            }
          });
      }
    });
  });
/* eslint-enable no-shadow, no-param-reassign */

const parseAll = (posts) => series(posts, (post) => parsePost(post));

module.exports = () => start()
  .then(copyAll)
  .then(listPosts)
  .then(parseAll)
  .then(() => all);

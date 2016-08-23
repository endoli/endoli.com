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

let all = [];

const start = () =>
  new Promise((resolve) => {
    fse.emptyDir('./public/blog/', () => resolve());
  });

const getPrevious = (post) => {
  const isThere = _.findIndex(all, (one) => _.isEqual(one.meta, post.meta));
  if (isThere === -1 || isThere === all.length - 1) {
    return undefined;
  }
  return all[isThere + 1];
};


const getNext = (post) => {
  const isThere = _.findIndex(all, (one) => _.isEqual(one.meta, post.meta));
  if (isThere === -1 || isThere === 0) {
    return undefined;
  }
  return all[isThere - 1];
};

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


/* eslint-disable no-shadow */
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
              all.push(file);
            }
            resolve();
          });
      }
    });
  });
/* eslint-enable no-shadow */

const parseAll = (posts) => series(posts, (post) => parsePost(post));

const publishPost = (file) => {
  const template = cheerio.load(fs.readFileSync('templates/post.html', 'utf-8'));
  const high = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.6.0/languages/';
  const previous = getPrevious(file);
  const next = getNext(file);

  template('#content').append(file.contents);
  template('head').append('<script src="../../scripts/highlight.js"></script>');
  _.each(config.highlight, (lang) => template('head').append(`<script src="${high}${lang}.min.js"></script>`));
  template('head').append('<script>hljs.initHighlightingOnLoad();</script>');

  if (previous || next) {
    template('#content').append('<div id="series"></div>');
    if (previous) {
      template('#series').append(`<span id="previous"><a href="./${previous.meta.filename}">Previous</a></span>`);
    }
    if (next) {
      if (previous) {
        template('#series').append(`<span id="next"><a href="./${next.meta.filename}"> Next</a></span>`);
      } else {
        template('#series').append(`<span id="next"><a href="./${next.meta.filename}">Next</a></span>`);
      }
    }
  }

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
        template('#categories').append(`<span><a href="../categories/${category}.html">${category}</a>, </span>`);
      } else {
        template('#categories').append(`<span><a href="../categories/${category}.html">${category}</a></span>`);
      }
    });
  } else {
    console.warn('Blog post is missing categories!');
  }

  if (file.meta.tags) {
    template('#content').append('<div id="tags">Tags: </div>');
    _.each(file.meta.tags, (tag, index) => {
      if (index !== file.meta.tags.length - 1) {
        template('#tags').append(`<span><a href="../tags/${tag}.html">${tag}</a>, </span>`);
      } else {
        template('#tags').append(`<span><a href="../tags/${tag}.html">${tag}</a></span>`);
      }
    });
  } else {
    console.warn('Blog post is missing tags!');
  }

  fse.outputFileSync(path.join('./public/blog/posts/', file.meta.filename), template.html());
};

const publishAll = () =>
  new Promise((resolve) => {
    all = _(all)
      .sortBy((post) => post.meta.date)
      .reverse()
      .value();

    _.each(all, (post) => publishPost(post));

    resolve();
  });

module.exports = () => start()
  .then(copyAll)
  .then(listPosts)
  .then(parseAll)
  .then(publishAll)
  .then(() => all);

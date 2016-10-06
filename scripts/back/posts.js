/* eslint-disable max-len, no-shadow, no-param-reassign */
const _ = require('lodash');
const cfg = require('../../config.json');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const moment = require('moment');
const yamlFront = require('yaml-front-matter');
const marked = require('marked');
const pygmentize = require('pygmentize-bundled');
const cheerio = require('cheerio');
const parse = require('url-parse');

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: true,
  highlight: (code, lang, callback) => {
    pygmentize({ lang, format: 'html' }, code, (err, result) => {
      callback(err, result.toString());
    });
  },
});

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
  ];

  return series(files, (file) => copy(file.input, file.output));
};

const listPosts = () =>
  new Promise((resolve) => {
    const list = fs.readdirSync('./blog/').filter((file) => {
      const isFile = fs.statSync(path.join('./blog/', file)).isFile();
      const isHidden = !(/(^|\/)\.[^\/\.]/g).test(file);
      return isFile && isHidden;
    });
    const posts = _.map(list, (item) => path.join('./blog/', item));

    resolve(posts);
  });

const checkDomain = (url) => {
  const location = parse(cfg.host);
  if (url.indexOf('//') === 0) {
    url = location.protocol + url;
  }
  return url.toLowerCase().replace(/([a-z])?:\/\//, '$1').split('/')[0];
};

const isExternal = (url) => {
  const location = parse(cfg.host);
  return ((url.indexOf(':') > -1 || url.indexOf('//') > -1) &&
    checkDomain(location.href) !== checkDomain(url));
};

/* eslint-disable no-shadow, no-underscore-dangle */
const parsePost = (post) =>
  new Promise((resolve, reject) => {
    fs.readFile(post, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        const yamlStage = yamlFront.loadFront(data);
        const contents = yamlStage.__content;
        delete yamlStage.__content;
        const file = { meta: yamlStage };
        marked(contents, (err, content) => {
          if (err) {
            reject(err);
          } else {
            const parsed = cheerio.load(content);
            parsed('a').each((i, e) => {
              if (isExternal(cheerio(e).attr('href'))) {
                cheerio(e).attr('target', '_blank');
              }
            });
            file.contents = parsed.html();
            file.meta.filename = path.basename(post).replace('.md', '.html');
            file.meta.location = `blog/posts/${moment(file.meta.date).format('YYYY/MM/DD')}/${file.meta.filename}`;
            if (file.meta.published) {
              all.push(file);
            }
            resolve();
          }
        });
      }
    });
  });
/* eslint-enable no-shadow, no-underscore-dangle */

const parseAll = (posts) => series(posts, (post) => parsePost(post));

const publishPost = (file) => {
  const template = cheerio.load(fs.readFileSync('templates/post.html', 'utf-8'));
  const previous = getPrevious(file);
  const next = getNext(file);

  let author;
  let date;

  template('title').text(`Endoli - Blog - ${file.meta.title}`);

  if (file.meta.author) {
    author = `<div id="author">${file.meta.author}</div>`;
  } else {
    console.warn('Blog post is missing author!');
  }

  if (file.meta.date) {
    date = `<div id="date">${moment(file.meta.date).format('MMMM Do YYYY')}</div>`;
  } else {
    console.warn('Blog post is missing date!');
  }

  template('#content').append(`
    <div class="subtitle">
      <span class="filler">Blog post by&nbsp;</span>
      <span class="author">${author}</span>
      <span class="filler">, on&nbsp;</span>
      <span class="date">${date}</span>
    </div>`
  );
  template('#content').append('<article id="post"></article>');
  template('#post').append(file.contents);

  if (file.meta.categories) {
    template('#content').append('<div id="categories">Categories:&nbsp;</div>');
    _.each(file.meta.categories, (category, index) => {
      if (index !== file.meta.categories.length - 1) {
        template('#categories').append(`<span><a href="../../../../categories/${category}.html">${category}</a>,&nbsp;</span>`);
      } else {
        template('#categories').append(`<span><a href="../../../../categories/${category}.html">${category}</a></span>`);
      }
    });
  } else {
    console.warn('Blog post is missing categories!');
  }

  if (file.meta.tags) {
    template('#content').append('<div id="tags">Tags:&nbsp;</div>');
    _.each(file.meta.tags, (tag, index) => {
      if (index !== file.meta.tags.length - 1) {
        template('#tags').append(`<span><a href="../../../../tags/${tag}.html">${tag}</a>,&nbsp;</span>`);
      } else {
        template('#tags').append(`<span><a href="../../../../tags/${tag}.html">${tag}</a></span>`);
      }
    });
  } else {
    console.warn('Blog post is missing tags!');
  }

  if (previous || next) {
    template('#content').append('<div id="series"></div>');
    if (previous) {
      template('#series').append(`<span id="previous"><a href="../../../../../${previous.meta.location}">← Previous</a></span>`);
    }
    if (next) {
      if (previous) {
        template('#series').append(`<span id="next"><a href="../../../../../${next.meta.location}">Next →</a></span>`);
      } else {
        template('#series').append(`<span id="next"><a href="../../../../../${next.meta.location}">Next →</a></span>`);
      }
    }
  }

  fse.outputFileSync(path.join('./public//', file.meta.location), template.html());
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

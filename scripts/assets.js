const fse = require('fs-extra');

const copy = (all) =>
  new Promise((resolve, reject) => {
    const opts = {
      clobber: true,
      preserveTimestamps: true,
    };
    fse.copy('./assets/', './public/assets', opts, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(all);
      }
    });
  });

module.exports = (all) => copy(all);

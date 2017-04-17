const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const pug = require('pug');
const posthtml = require('posthtml');
const utils = require('./utils');
const config = require('../config');

/**
 * @typedef {Object} pageInfo - промежуточный объект сборки html
 * @property {Array<String>} modules - список зависимых модулей
 * @property {String} name - имя страницы
 * @property {String} html - html после конвертации pug
 */

/**
 * Собирает html станицу из указанной директории
 * @param {string} pagePath - директория страницы.
 * @return {pageInfo}
 */
function prebuild( pagePath ) {
  const pageName = path.basename(pagePath, '.pug');

  const isProduction = process.env.NODE_ENV === 'production';

  try {
    const file = pug.compileFile(pagePath, {
      basedir: config.basePath,
      pretty:  true,
      filters: {
        styles:    () => '\n    <link rel="stylesheet" href="' + config.publicStylePath + 'style.css" />',
        scripts:   () => '\n    <script src="' + config.publicJsPath + 'vendors.js"></script>' +
        '\n    <script src="' + config.publicJsPath + pageName + '.js"></script>',
        hotreload: () => isProduction ? '' : '\n    <script src="http://localhost:35729/livereload.js?snipver=1" async></script>',
      },
    });
    const modules = file.dependencies.map(dependency => path.basename(dependency, '.pug'));
    return {
      modules,
      name: pageName,
      html: file()
    };
  } catch (e) {
    throw e;
  }
}

/**
 *
 * @param {String} name - имя страницы
 * @param {String} html - содержимое страницы
 * @param {Object} cssModules
 * @return {Promise}
 */
function complete( name, html, cssModules ) {
  const plugins = [
    function applyCssModules( tree ) {
      tree.match({ attrs: { 'class': /\w+/ } }, node => {
        const classNames = node.attrs.class.split(' ');
        node.attrs.class = classNames.map(className => {
          const moduleClassName = _.get(cssModules, className.replace('-', '.'));
          return typeof moduleClassName === 'string' ? moduleClassName : className;
        }).join(' ');
        return node;
      });
    },
    function copyAssets( tree ) {
      const promises = [];

      tree.match({ tag: /\w+/ }, node => {
        _.map(node.attrs, ( value, name ) => {
          const savePromise = utils.saveAssets(name, value);
          promises.push(savePromise);
          savePromise.then(newValue => node.attrs[name] = newValue);
        });
        return node;
      });
      return Promise.all(promises).then(() => tree);
    },
  ];

  posthtml(plugins)
    .process(html)
    .then(result => utils.writeFile(path.resolve(config.buildPath, name + '.html'), result.html));
}

module.exports = {
  prebuild,
  complete
};
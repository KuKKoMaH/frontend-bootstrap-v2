var fs = require('fs');
var path = require('path');
var postcss = require('postcss');
var postcssModules = require('postcss-modules');
var atImport = require("postcss-import");
var discardDuplicates = require('postcss-discard-duplicates');
var cssnano = require('cssnano');
var cssnext = require('postcss-cssnext');
var sprites = require('postcss-sprites');
var updateRule = require('postcss-sprites/lib/core').updateRule;
var imageSizes = require('postcss-image-sizes');
var postcssCopy = require('postcss-copy');
var calc = require("postcss-calc");
var mqpacker = require("css-mqpacker");
var url = require("postcss-url");
var stylus = require('stylus');

var utils = require('./utils');
var config = require('../config');

var extensions = {
  images: ['.jpg', '.jpeg', '.gif', '.png', '.svg'],
  fonts:  ['.eot', '.woff', '.woff2']
};

/**
 * @typedef {Object} moduleCssInfo - объект с результатом преобразования css-модуля
 * @property {String} css - результирующий css
 * @property {String} name - имя модуля
 * @property {Object<String>} module - объект вида "уникальный класс: оригинальынй класс"
 */

/**
 * @param {String} filePath - путь до файла
 * @return {Promise<moduleCssInfo>}
 * */
function convert( filePath ) {
  let module;
  return new Promise(( resolve, reject ) => {
    utils.readFile(filePath).then(css => {
      var fileInfo = path.parse(filePath);

      var plugins = [
        postcssModules({
          generateScopedName: process.env.NODE_ENV === 'production'
                                ? '[hash:base64:5]'
                                : '[path][local]',
          getJSON:            ( cssFileName, json ) => (module = json),
        }),
        atImport(), // stylus не поддерживает импорт css файлов
        // url({ url: "rebase" })
      ];
      stylus(css)
        .import(path.resolve(config.basePath, 'styles', 'index.styl'))
        .render(function ( err, css ) {
          if (err) return reject(err);
          // console.log(css);
          postcss(plugins).process(css, { from: filePath, to: path.resolve(config.basePath, 'style.css') })
            .then(result => {
              // console.log(result.css);
              resolve({ module, css: result.css, name: fileInfo.name });
            }, err => {
              reject(err)
            });
        });
    });
  })
}

/**
 * Собирает весь css в строку
 * @param {Array<String>} styles - массив css файлов
 * @return {Promise} result css
 */
function combine( styles ) {
  var css = styles.join('\n');
  var plugins = [
    discardDuplicates(),
    sprites({
      stylesheetPath: config.cssPath,
      spritePath:     config.imgPath,
      filterBy:       function ( info ) {
        return new Promise(( resolve, reject ) => {
          if (info.url.indexOf(path.sep + 'sprite-') !== -1) {
            resolve(info.path);
          } else {
            reject();
          }
        })
      },
      hooks:          {
        onUpdateRule: function ( rule, token, image ) {
          // Use built-in logic for background-image & background-position
          updateRule(rule, token, image);

          ['width', 'height'].forEach(function ( prop ) {
            rule.insertAfter(rule.last, postcss.decl({
              prop:  prop,
              value: image.coords[prop] + 'px'
            }));
          });
        }
      }
    }),
    postcssCopy({
      src:  config.basePath,
      dest: config.imgPath,
      // template: '[hash].[ext][query]',
      template( fileMeta ) {
        var src = fileMeta.filename;
        var dir = fileMeta.src;
        var ext = path.extname(fileMeta.filename);

        var srcPath = path.resolve(dir, src);
        var destName, destPath;
        if (extensions.images.indexOf(ext) !== -1) {
          destName = path.relative(config.basePath, srcPath).replace(new RegExp(path.sep, 'g'), '-');
          destPath = path.resolve(config.imgPath, destName);
        } else if (extensions.fonts.indexOf(ext) !== -1) {
          destName = path.relative(config.basePath, src);
          destPath = path.resolve(config.fontPath, destName);
        }
        return destPath;
      },
      relativePath( dirname, fileMeta, result, options ) {
        return config.cssPath;
      }
    }),
    calc()
  ];

  if (process.env.NODE_ENV === 'production') {
    plugins.push(cssnano());
    plugins.push(cssnext({ browsers: ['last 10 versions', 'IE > 8'] }));
    const minWidthRegexp = /\(min-width:(.*?)px\)/;
    const maxWidthRegexp = /\(max-width:(.*?)px\)/;
    plugins.push(mqpacker({
      sort: ( a, b ) => {
        const findMinA = minWidthRegexp.exec(a);
        const findMinB = minWidthRegexp.exec(b);
        // Сортировка по увелиичению min-width. Правила без min-width всегда нииже
        if (findMinA && !findMinB) return -1;
        if (findMinB && !findMinA) return 1;
        if (findMinA && findMinB && +findMinA[1] !== +findMinB[1] ) return +findMinA[1] > +findMinB[1] ? 1 : -1;

        const findMaxA = maxWidthRegexp.exec(a);
        const findMaxB = maxWidthRegexp.exec(b);
        // сортировка по убыванию max-width. Правила без max-width всегда выше.
        if (findMaxA && !findMaxB) return 1;
        if (findMaxB && !findMaxA) return -1;
        if (findMaxA && findMaxB && +findMaxA[1] !== +findMaxB[1] ) return +findMaxA[1] > +findMaxB[1] ? -1 : 1;
        // если не удалось сравнить min-width и max-width - не трогать
        return 0;
      }
    }));
  }

  return postcss(plugins)
    .process(css, { from: path.resolve(config.basePath, 'style.css') })
    .then(
      result => utils.writeFile(path.resolve(config.cssPath, 'style.css'), result.css),
      err => {
        throw err;
      }
    );
}

module.exports = {
  convert,
  combine
};
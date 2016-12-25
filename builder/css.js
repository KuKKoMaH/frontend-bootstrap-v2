var fs                  = require('fs');
var path                = require('path');
var postcss             = require('postcss');
var postcssModules      = require('postcss-modules');
var atImport            = require("postcss-import");
var discardDuplicates   = require('postcss-discard-duplicates');
var cssnano             = require('cssnano');
var cssnext             = require('postcss-cssnext');
var sprites             = require('postcss-sprites');
var imageSizes          = require('postcss-image-sizes');
var postcssCopy         = require('postcss-copy');
var calc                = require("postcss-calc");
var resolver            = require('./stylus/resolver');
var mqpacker            = require("css-mqpacker");

var stylus              = require('stylus');

var pathGenerator = require('./pathGenerator');

var extensions = {
  images: ['.jpg', '.jpeg', '.gif', '.png'],
  fonts: ['.eot', '.woff', '.woff2']
};

/**
 * Возвращает объект с полями { module, css }, где "module" - карта "уникальный класс: оригинальынй класс" и
 * "css" - преобразованный код
 * @param {String} filePath - путь до файла
 * @return {Promise} { module, css }
 * */
function load(filePath) {
  var module;
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, css) => {
      if (err) return reject(err);

      var dir = path.dirname(filePath);

      var plugins = [
        postcssModules({
          generateScopedName: process.env.NODE_ENV === 'production'
                                ? '[hash:base64:5]'
                                : '[path][local]',
          getJSON:            function (cssFileName, json) {
            module = json;
          }
        }),
        atImport(),
        imageSizes({assetsPath: dir}),
        resolver(),
      ];
      stylus(css)
        .import(path.resolve(pathGenerator.paths.basePath, 'styles', 'vars.styl'))
        .render(function (err, css) {
          if (err) return reject(err);
          postcss(plugins).process(css, {from: filePath, to: pathGenerator.paths.basePath})
            .then(result => {
              resolve({module, css: result.css});
            }, err => {reject(err)});
        });
    });
  })
}

/**
 * Собирает весь css в строку
 * @return {Promise} result css
 */
function combine(styles) {
  var css = '';
  ['pages', 'modules', 'src'].map(type => {
    for(var key in styles[type]){
      css += styles[type][key].css;
    }
  });
  return new Promise((resolve, reject) => {

    var plugins = [
      discardDuplicates(),
      sprites({
        stylesheetPath: pathGenerator.paths.cssPath,
        spritePath: pathGenerator.paths.imgPath,
        filterBy: function (info) {
          return new Promise((resolve, reject) => {
            if(info.url.indexOf(path.sep + 'sprite-') !== -1) {
              resolve(info.path);
            }else {
              reject();
            }
          })
        }
      }),
      postcssCopy({
        src: pathGenerator.paths.basePath,
        dest: pathGenerator.paths.imgPath,
        // template: '[hash].[ext][query]',
        template: function (fileMeta) {
          var src = fileMeta.filename;
          var dir = fileMeta.src;
          var ext = path.extname(fileMeta.filename);

          var srcPath = path.resolve(dir, src);
          var destName, destPath;
          if(extensions.images.indexOf(ext) !== -1){
            destName = path.relative(pathGenerator.paths.basePath, srcPath).replace(new RegExp(path.sep,'g'), '-');
            destPath = path.resolve(pathGenerator.paths.imgPath, destName);
          }else if(extensions.fonts.indexOf(ext) !== -1){
            destName = path.relative(pathGenerator.paths.basePath, src);
            destPath = path.resolve(pathGenerator.paths.fontPath, destName);
          }
          return destPath;
        },
        relativePath(dirname, fileMeta, result, options) {
          return pathGenerator.paths.cssPath;
        }
      }),
      calc()
    ];

    if(process.env.NODE_ENV === 'production') {
      plugins.push(cssnano());
      plugins.push(cssnext({browsers: ['last 10 versions', 'IE > 8']}));
      plugins.push(mqpacker({ sort: true }));
    }

    postcss(plugins).process(css, {from: path.resolve(pathGenerator.paths.basePath, 'style.css')})
      .then(result => {
        resolve(result.css);
      }, err => {throw err;});
  });
}

module.exports = {
  load,
  combine
};
var fs = require('fs');
var path = require('path');
var pug = require('pug');

var pathGenerator = require('./pathGenerator');

/**
 *
 * @param {string} filePath - name of page
 * @param {string} styles - object of all styles
 * @return {Promise} string
 */
function load(filePath, styles) {
  var fileInfo = pathGenerator.parseFilename(filePath);
  return new Promise((resolve, reject) => {
    try {
      var filters = {
        'styles':  function (text, options) {
          return '\n    <link rel="stylesheet" href="' + pathGenerator.paths.publicStylePath + '" />';
        },
        'scripts': function (text, options) {
          return '\n    <script src="' + pathGenerator.paths.publicJsPath + 'vendors.js"></script>' +
            '\n    <script src="' + pathGenerator.paths.publicJsPath + fileInfo.name + '.js"></script>\n';
        }
      };

      var config = {
        pretty:  true,
        filters: filters,
        plugins: [{
          postLex:  function (ast, config) {
            var fileInfo = pathGenerator.parseFilename(config.filename);
            var css = styles[fileInfo.type] && styles[fileInfo.type][fileInfo.name];
            if (!css) return ast;
            return ast.map(asn => {
              if (asn.type === 'class' && css && css.module[asn.val]) {
                asn.val = css.module[asn.val];
              }
              return asn;
            })
          },
          postLink: function (ast) {
            walkAst(ast, (ast) => {
              ast.attrs.forEach((attr) => {
                var value = attr.val;
                var dir = path.dirname(ast.filename);
                if (!value) return;

                if (attr.name === 'style') {
                  if(value.indexOf('url(') !== -1){
                    attr.val = value.replace(/url\((.*?)\)/g, function (str, url, offset, s) {
                      if( url.indexOf('data:') === 0 || url.indexOf('#') === 0 || url.indexOf('http') === 0) return url;
                      var srcPath = path.resolve(dir, url.replace(/["']/g, "").trim());
                      var destName = saveFile(srcPath);
                      return 'url(' + (destName ? 'img/' + destName : url) + ')';
                    });
                  }
                  return;
                }

                if (value.indexOf('http') === 1) return; // пропустить все внешние изображения (атрибут заключен в кавычки)
                if (value.indexOf('.') === -1) return; // если в атрибуте файл - то в пути должна быть точка
                var src = value.slice(1, -1); // обрезаем кавычки
                var srcPath = path.resolve(dir, src);
                var destName = saveFile(srcPath);
                if (destName) {
                  attr.val = '\'img/' + destName + '\'';
                }
              });
            });
            return ast;
          }
        }]
      };

      var file = pug.renderFile(filePath, config);
      resolve(file);
    }catch(err) { reject(err) }
  })
}

function walkAst(ast, cb) {
  if(ast.type === 'Tag')  cb(ast);
  if(ast.nodes){
    ast.nodes.forEach(node => walkAst(node, cb));
  }
  if(ast.block) walkAst(ast.block, cb);
}

function saveFile(srcAbsPath) {
  var destName = path.relative(pathGenerator.paths.basePath, srcAbsPath).replace(new RegExp(path.sep, 'g'), '-');
  var destPath = path.resolve(pathGenerator.paths.imgPath, destName);
  if (fs.existsSync(srcAbsPath)) {
    fs.createReadStream(srcAbsPath).pipe(fs.createWriteStream(destPath));
    return destName;
  }
  return null;
}

module.exports = {
  load
};
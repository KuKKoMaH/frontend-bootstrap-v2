var path = require('path');

var basePath = path.resolve(__dirname, '..', 'src');
var buildPath = path.resolve(__dirname, '..', 'dist');
var cssPath = path.resolve(buildPath, 'css');
var jsPath = path.resolve(buildPath, 'js');
var imgPath = path.resolve(buildPath, 'img');
var fontPath = path.resolve(buildPath, 'fonts');

module.exports = {
  basePath,
  buildPath,
  cssPath,
  jsPath,
  imgPath,
  fontPath,
  modulesPath:     path.resolve(basePath, 'modules'),
  pagesPath:       path.resolve(basePath, 'pages'),
  stylePath:       path.resolve(cssPath, 'style.css'),
  publicStylePath: 'css/style.css',
  publicJsPath:    'js/'
};

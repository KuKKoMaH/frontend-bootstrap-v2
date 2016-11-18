var fs = require('fs');
var path = require('path');
var pug = require('pug');

var typeTemplateMap = {
  'template': 'pug',
  'style':    'styl',
  'script':   'js',
};

var basePath = path.resolve(__dirname, '..', 'src');
var buildPath = path.resolve(__dirname, '..', 'dist');
var cssPath = path.resolve(buildPath, 'css');
var jsPath = path.resolve(buildPath, 'js');
var imgPath = path.resolve(buildPath, 'img');
var fontPath = path.resolve(buildPath, 'fonts');
var paths = {
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


/**
 * Возвращает объкт с существующими файлами внутри директории модуля или страницы dir
 * @param dir - имя модуля
 * @param moduleType - тип модуля 1 из ['pages', 'modules']
 * @return {{template, style, script}}
 */
function getModuleFiles(dir, moduleType){
  var files = {};
  for(var fileType in typeTemplateMap){
    var filePath = path.resolve(paths.basePath, moduleType, dir, dir + '.' + typeTemplateMap[fileType]);
    if(fs.existsSync(filePath)){
      files[fileType] = filePath;
    }
  }
  return files;
}

/**
 * Возвращает все зависимые модули страницы, которые подгружаются через include в шаблоне
 * @param template - путь до шаблона
 * @return {Array} - массив модулей зависимостей
 */
function getDependencies(template) {
  var file = pug.compileFile(template, {
    filters: {
      'styles': function (text, options) {
        return text;
      },
      'scripts': function (text, options) {
        return text;
      },
      'vars': function (text, options) {
        return text;
      },
    },
  });
  return file.dependencies
    .map(dependency => {
      var fileInfo = parseFilename(dependency);
      return fileInfo.name;
    });
}

/**
 * Возвращает объект со модулями и страницами и содержащимися в них файлами
 * @return {{modules: {}, pages: {}}}
 */
function getFiles() {
  try {
    var files = {
      modules: {},
      pages:   {},
    };
    var dirs = fs.readdirSync(paths.pagesPath);
    dirs.map((dir) => {
      var pageFiles = getModuleFiles(dir, 'pages');
      files.pages[dir] = pageFiles;
      var dependencies = getDependencies(pageFiles.template);
      files.pages[dir].dependencies = dependencies;
      dependencies.forEach(d => {
        if (!files.modules[d]) {
          files.modules[d] = getModuleFiles(d, 'modules');
        }
      });
    });
    return files;
  }catch(err) { console.log(err); return false; }
}

// /src/modules/test/test.js
function parseFilename(fileName) {
  var chunks = fileName.split(path.sep);
  var filename = chunks[chunks.length - 1];
  var filechunks = filename.split('.');
  return {
    type: chunks[chunks.length - 3],
    name: filechunks.splice(0, filechunks.length - 1).join('.')
  };

}


module.exports = {
  paths,
  getModuleFiles,
  getFiles,
  parseFilename
};
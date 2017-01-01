var fs = require('fs');
var path = require('path');
var pug = require('pug');

var config = require('./config');
var pugFilters = require('./modules/pugFilters');

var typeTemplateMap = {
  'template': 'pug',
  'style':    'styl',
  'script':   'js',
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
    var filePath = path.resolve(config.basePath, moduleType, dir, dir + '.' + typeTemplateMap[fileType]);
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
    filters: pugFilters.filtersMock(),
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
    var dirs = fs.readdirSync(config.pagesPath);
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
  getModuleFiles,
  getFiles,
  parseFilename
};
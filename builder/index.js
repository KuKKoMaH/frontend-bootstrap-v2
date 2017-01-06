/**
 *  Для сборки html нужны список страниц и json с css модулями. При сборке html определяются список модулей для каждой
 *  страницы.
 *
 *  Для сборки css нужен список путей к файлам, без привязки к страницам. В результате сборки получаются 1 css файл.
 *  В процессе каждый файл по отдельности прогоняется через stylus и postcss для разрешения относительных путей.
 *
 *  Для сборки js нужны список точек входа, список зависимых модулей и css-модули. В результате получаются файлы
 *  vendor.js, в который выносятся все общие модули и по 1 js-файлу для каждой страницы.
 *
 *  Чтобы все заработало нужно:
 *  1. собрать первую часть html
 *  2. собрать отдельные файлы css
 *  3. собрать весь js
 *  4. дособрать html
 *  5. склеить css в 1 файл
 *  6. сжать изображения
 */

const fs = require('fs');
const path = require('path');
const livereload = require('livereload');
const _ = require('lodash');

const utils = require('./utils');
const config = require('./config');
const css = require('./css');
const js = require('./js');
const html = require('./html');
const imageCompressor = require('./imageCompressor');

prepareBuildDir();
build().then(watch, watch);

function build() {
  console.log('Start build');
  console.time('Build end');

  return utils.readDir(config.pagesPath) // читаем список директорий со страницами
    .then(prebuildHtml) // 1. собрать первую часть html
    .then(prebuildCss)  // 2. собрать отдельные файлы css
    .then(buildJs)      // 3. собрать весь js
    .then(buildHtml)    // 4. дособрать html
    .then(buildCss)     // 5. склеить css в 1 файл
    .then(compressImages)
    .then(() => console.timeEnd('Build end'))
    .catch(err => { throw err; });
}

/**
 * Подготавливает файловую структуру для сборки
 *
 * @return {undefined}
 */
function prepareBuildDir() {
  console.time('prepare structure');
  const dirs = ['buildPath', 'jsPath', 'cssPath', 'imgPath', 'fontPath'];
  dirs.forEach(dir => {
    if(!fs.existsSync(config[dir])){
      fs.mkdirSync(config[dir]);
    }
  });
  console.timeEnd('prepare structure');
}

/**
 * Возвращает список существующих файлов для указанных страниц и модулей
 *
 * @param {String} type - разрешение файла
 * @param {Array<String>} pages - список названий страниц
 * @param {Array<String>} modules - список названий модулей
 * @return {Array<String>}
 */
function collectFiles(type, pages, modules) {
  const files = [ path.resolve(config.basePath, 'layout', 'layout.' + type) ];
  pages.forEach(page => files.push(path.resolve(config.pagesPath, page, page + '.' + type)));
  modules.forEach(page => files.push(path.resolve(config.modulesPath, page, page + '.' + type)));

  return files.filter(file => fs.existsSync(file));
}

/**
 * Собирает начальную часть html
 *
 * @param {Array<String>} pagesName - список имен страниц
 * @return {Array<pageInfo>}
 */
function prebuildHtml(pagesName) {
  console.log('prebuildHtml');
  return pagesName.map(page =>
    html.prebuild( path.resolve(config.pagesPath, page, page + '.pug') )
  );
}

/**
 * Собирает начальную часть css
 *
 * @typedef {Object} brebuildCssResult - результат отбработки css
 * @property {Array<pageInfo>} pagesInfo
 * @property {Array<moduleCssInfo>} modulesCssInfo
 *
 * @param {Array<pageInfo>} pagesInfo
 * @return {Promise<brebuildCssResult>}
 *
 */
function prebuildCss(pagesInfo) {
  console.log('prebuildCss');
  const modules = _.union.apply(null, pagesInfo.map(page => page.modules));
  const pages = pagesInfo.map(page => page.name);
  const cssFiles = collectFiles('styl', pages, modules);
  return Promise.all(cssFiles.map(css.convert)).then(modulesCssInfo => ({ pagesInfo, modulesCssInfo}));
}

/**
 * Собирает весь js
 *
 * @param {brebuildCssResult} brebuildCssResult
 * @return {Promise<brebuildCssResult>}
 */
function buildJs(brebuildCssResult) {
  console.log('buildJs');
  const pages = brebuildCssResult.pagesInfo.reduce((obj, page) => {
    obj[page.name] = collectFiles('js', [page.name], page.modules);
    return obj;
  }, {});
  const styles = brebuildCssResult.modulesCssInfo.reduce((obj, module) => {
    obj[module.name] = module.module;
    return obj;
  }, {});
  return js(pages, { styles }).then(() => brebuildCssResult);
}

/**
 *
 * @param {brebuildCssResult} brebuildCssResult
 * @return {Promise.<*>}
 */
function buildHtml(brebuildCssResult) {
  console.log('buildHtml');
  const styles = brebuildCssResult.modulesCssInfo.reduce((obj, module) => {
    obj[module.name] = module.module;
    return obj;
  }, {});

  const promises = brebuildCssResult.pagesInfo.map(pageInfo =>
    html.complete(pageInfo.name, pageInfo.html, styles)
  );

  return Promise.all(promises).then(() => brebuildCssResult);
}

/**
 *
 * @param {brebuildCssResult} brebuildCssResult
 * @return {Promise}
 */
function buildCss(brebuildCssResult) {
  console.log('buildCss');
  const styles = brebuildCssResult.modulesCssInfo.map(module => module.css);
  return css.combine(styles);
}

/**
 * Сжимает изображения
 * @return {Promise}
 */
function compressImages() {
  if(process.env.NODE_ENV === 'production') {
    console.log('compressImages');
    return imageCompressor();
  }
  return Promise.resolve();
}

function watch() {
  if (process.env.NODE_ENV === 'production') return;

  let inProgress = false;
  const server = livereload.createServer();
  server.watch(config.buildPath);
  fs.watch(config.basePath, {recursive: true}, function (eventType, filename) {
    console.log('change:', filename);
    if (inProgress) return;
    inProgress = true;
    const buildEnd = () => inProgress = false;
    build().then(buildEnd, buildEnd);
  });
  console.log('Start watch');
}
const fs = require('fs');
const path = require('path');

const config = require('./config');

/**
 * @param {String} filePath
 * @return {Promise<String>}
 */
const readFile = (filePath) => new Promise((res, rej) => fs.readFile(filePath, 'utf-8', (err, data) => {
  if (err) return rej(err);
  res(data);
}));

/**
 * @param {String} dirPath
 * @return {Promise<Array<String>>}
 */
const readDir = (dirPath) => new Promise((res, rej) => fs.readdir(dirPath, 'utf-8', (err, data) => {
  if (err) return rej(err);
  res(data);
}));

/**
 * @param {String} filePath
 * @param {String} data
 * @return {undefined}
 */
const writeFile = (filePath, data) => new Promise((res, rej) => fs.writeFile(filePath, data, 'utf-8', (err) => {
  if (err) return rej(err);
  res();
}));

/**
 * Копирует файл из исходников в директорию сборки и возвращает промис с новым путем, если файл был скопирован, или
 * src если такого файла не существует
 * todo: Перед копированием проверять что целевой файл изменился
 * @param {String} src - путь до файла, относительно config.basePath
 * @return {Promise<String>}
 */
const saveAsset = (src) => {
  if (
    src.indexOf('http') === 0 || // пропустить все внешние изображения
    src.indexOf('data:') === 0 ||
    src.indexOf('#') === 0 ||
    src.indexOf('.') === -1 // если в атрибуте файл - то в пути должна быть точка
  ) return Promise.resolve(src);

  const srcPath = path.resolve(config.basePath, src);

  return new Promise((res) => {
    fs.stat(srcPath, (err, stats) => {
      if (err || !stats.isFile()) return res(src);

      const name = src.replace(new RegExp(path.sep, 'g'), '-');
      const destPath = path.resolve(config.imgPath, name);
      const destUrl = path.relative(config.buildPath, destPath);
      const rd = fs.createReadStream(srcPath);
      const wr = fs.createWriteStream(destPath);
      wr.on("close", () => res(destUrl));
      rd.pipe(wr);
    });
  });
};

/**
 * Ищет в value ссылки на файлы и сохраняет их
 * @param {String} name
 * @param {String} value
 * @return {Promise<String>} - новое значение value
 */
const saveAssets = (name, value) => {
  if (name === 'style' && value.indexOf('url(') !== -1) {
    const urlRegex = /url\((.*?)\)/g;
    const promises = [];
    const urls = value.match(urlRegex);
    urls.map(url => {
      const normalUrl = url.replace(/["']/g, '').trim().slice(4, -1).trim(); // обрезаем все лишнее из урла
      const savePromise = saveAsset(normalUrl);
      promises.push(savePromise);
    });
    return Promise.all(promises).then((urls) => {
      let i = 0;
      return value.replace(urlRegex, () => 'url(' + urls[i++] +')')
    });
  } else {
    return saveAsset(value);
  }
};

module.exports = {
  readFile,
  readDir,
  writeFile,
  saveAsset,
  saveAssets,
};

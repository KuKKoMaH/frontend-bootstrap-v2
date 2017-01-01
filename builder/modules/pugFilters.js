var config = require('../config');

function filters (fileInfo) {
  return {
    styles:    () => '\n    <link rel="stylesheet" href="' + config.publicStylePath + '" />',
    scripts:   () => '\n    <script src="' + config.publicJsPath + 'vendors.js"></script>' +
    '\n    <script src="' + config.publicJsPath + fileInfo.name + '.js"></script>\n',
    hotreload: () => '\n    <script src="http://localhost:35729/livereload.js?snipver=1" async></script>\n',
  };
}

function filtersMock() {
  return Object.keys(filters()).reduce(function(obj, key){
    obj[key] = () => {};
    return obj;
  }, {});
}

module.exports = {
  filters,
  filtersMock
};

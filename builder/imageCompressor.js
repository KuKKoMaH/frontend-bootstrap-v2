var fs = require('fs');
var path = require('path');
var sharp = require('sharp');
var config = require('./config');

var allowedExt = ['.jpg', '.jpeg', '.png'];

module.exports = function() {
  var files = fs.readdirSync(config.imgPath);
  return Promise.all(files.map(file => {
    var fullName = path.resolve(config.imgPath, file);
    if(allowedExt.indexOf(path.extname(fullName)) === -1) return null;
    return sharp(fullName)
      .toBuffer()
      .then(data => {
        return new Promise((res, rej) => {
          fs.writeFile(fullName, data, res);
        })
      });
  }));
}
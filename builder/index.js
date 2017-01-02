var fs = require('fs');
var path = require('path');
var livereload = require('livereload');

var config = require('./config');
var pathGenerator = require('./pathGenerator');
var css = require('./css');
var js = require('./js');
var html = require('./html');
var imageCompressor = require('./imageCompressor');

var files;
var commonStyles = path.resolve(config.basePath, 'layout', 'layout.styl');

var styles = {
  modules: {},
  pages:   {},
  src:     {}
};

generateBuildPath();
build().then(watch, watch);


function build() {
  console.log('Start build');
  return new Promise((resolve, reject) => {
    files = pathGenerator.getFiles();
    if(!files) return reject();

    return loadAllCss()
      .then(() => {
          console.log('load styles');
          return Promise.all([
            loadAllJs(),
            loadAllHtml()
          ])
        }, err => {
          return Promise.reject(err);
        }
      ).then(function () {
        console.log('Compless images');
        return imageCompressor();
      }).then(function () {
        console.log('Build successful');
        resolve();
      }, err => { console.log(err); return reject(err); });
  });
}

function watch() {
  if(process.env.NODE_ENV !== 'production') {
    var server = livereload.createServer();
    server.watch(config.buildPath);
    fs.watch(config.basePath, {recursive: true}, function (eventType, filename) {
      console.log('change:', filename);
      build();
    });
    console.log('Start watch');
  }
}

function generateBuildPath() {
  var jsPath = config.jsPath;
  var cssPath = config.cssPath;
  var imgPath = config.imgPath;
  var fontPath = config.fontPath;
  if(!fs.existsSync(config.buildPath)){
    fs.mkdirSync(config.buildPath);
  }
  if(!fs.existsSync(jsPath)){
    fs.mkdirSync(jsPath);
  }
  if(!fs.existsSync(cssPath)){
    fs.mkdirSync(cssPath);
  }
  if(!fs.existsSync(imgPath)){
    fs.mkdirSync(imgPath);
  }
  if(!fs.existsSync(fontPath)){
    fs.mkdirSync(fontPath);
  }

}

function loadAllCss() {
  var promices = iterate(files.pages, (page, dir) => {
    return pageCss(page, dir)
  });
  promices.unshift(css.load(commonStyles));
  return Promise.all(promices).then((allCss) => {
    styles.src.layout = allCss[0];
    return css.combine(styles);
  }, err => Promise.reject(err)).then(css => {
    fs.writeFile(config.stylePath, css);
  }, err => Promise.reject(err));
}

function pageCss(page, dir) {
  var dependenciesWithStyles = page.dependencies
    .filter(d => !!files.modules[d].style);

  var promices = dependenciesWithStyles.map(d => css.load(files.modules[d].style));
  if(page.style) promices.unshift(css.load(page.style));
  return Promise.all(promices).then(css => {
    if(page.style) styles.pages[dir] = css.shift();
    dependenciesWithStyles.forEach((d, i) => styles.modules[d] = css[i]);
    return css;
  });
}

function loadAllJs() {
  var entries = {};
  var styleModules = {};
  iterate(styles, (modules, type) =>{
    styleModules[type] = {};
    iterate(modules, (module, key) => {
      styleModules[type][key] = module.module;
    })
  });
  iterate(files.pages, (page, dir) => {
    var dependencies = page.dependencies
      .filter(d => !!files.modules[d].script)
      .map(d => files.modules[d].script);
    if(page.script) dependencies.unshift(page.script);
    entries[dir] = dependencies;
  });

  return js.load(entries, {styles: styleModules});
}

function loadAllHtml() {
  iterate(files.pages, (page, dir) => {
    return html.load(page.template, styles).then((html) => {
      fs.writeFile(path.resolve(config.buildPath, dir + '.html'), html);
    })
  });
}

function iterate(object, cb){
  var res = [];
  for(var key in object){
    res.push(cb.call(cb, object[key], key));
  }
  return res;
}
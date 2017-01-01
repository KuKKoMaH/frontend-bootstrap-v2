var path = require('path');
var postcss = require('postcss');

// todo: отрефакторить
module.exports = postcss.plugin('resolver', function (options) {
  return function (css, result) {
    var postCssOpts = result.opts;
    var fromDir = path.dirname(postCssOpts.from);
    var toDir = postCssOpts.to;
    if(!toDir) return;
    css.walkRules(function (rule) {
      rule.walkDecls(function (decl, i) {
        var value = decl.value;
        if(value.indexOf('url(') !== -1){
          decl.value = value.replace(/url\((.*?)\)/g, function (str, url, offset, s) {
            if( url.indexOf('data:') === 0 || url.indexOf('#') === 0 || url.indexOf('http') === 0) return url;
            var absUrl = path.resolve(fromDir, url.replace(/["']/g, ""));
            var relativeUrl = path.relative(toDir, absUrl);
            return 'url(' + relativeUrl + ')';
          });
          // console.log(url);
        }
      });
    });

    // resolve fonts
    css.walkAtRules('font-face', function(rule) {
      rule.walkDecls(function (decl, i) {
        var value = decl.value;
        if(value.indexOf('url(') !== -1){
          decl.value = value.replace(/url\((.*?)\)/g, function (str, url, offset, s) {
            if( url.indexOf('data:') === 0 || url.indexOf('#') === 0 || url.indexOf('http') === 0) return url;
            var absUrl = path.resolve(fromDir, url.replace(/["']/g, ""));
            var relativeUrl = path.relative(toDir, absUrl);
            return 'url(' + relativeUrl + ')';
          });
        }
      })
    });
    return css;
  }
});

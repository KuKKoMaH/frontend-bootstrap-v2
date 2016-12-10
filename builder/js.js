var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var modulesify = require('css-modulesify');

var pathGenerator = require('./pathGenerator');

function load(entries, globals) {
  var plugins = [
    new webpack.DefinePlugin({
      globals: JSON.stringify(globals),
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors',
      minChunks: 2
    }),
    new webpack.ProvidePlugin({
      $:               "jquery",
      jQuery:          "jquery",
      "window.jQuery": "jquery"
    })
  ];
  if(process.env.NODE_ENV === 'production') {
    plugins.push(new webpack.optimize.UglifyJsPlugin({compressor: {warnings: false, drop_console: true}}))
  }
  return new Promise((resolve, reject) => {
    webpack({
      entry:  entries,
      output: {
        path:     path.resolve(pathGenerator.paths.buildPath, 'js'),
        filename: '[name].js',
      },
      module: {
        loaders: [
          { test: require.resolve("jquery"), loader: "expose-loader?$!expose-loader?jQuery" },
        ]
      },
      plugins,
    }, (err, stats) => {
      if(err) return reject(err);
      var jsonStats = stats.toJson();
      if(stats.hasErrors()) return reject(jsonStats.errors);
      resolve(jsonStats);
    });
  })
}

module.exports = {
  load
};
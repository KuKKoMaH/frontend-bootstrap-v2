const fs = require('fs');
const webpack = require('webpack');

const config = require('../config');

/**
 * @param {Object} entries - объект страниц со списками зависимых модулей
 * @param globals - глобальные переменные для js-бандлов
 * @return {Promise<Object>}
 */
module.exports = function ( entries, globals ) {
  const webpackConfig = {
    entry:   entries,
    output:  {
      path:     config.jsPath,
      filename: '[name].js',
    },
    module:  {
      rules: [
        {
          test:    /\.js$/,
          exclude: /node_modules/,
          loader:  'babel-loader',
          options: {
            presets: ['es2015', 'stage-2'],
          }
        },
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        globals: JSON.stringify(globals),
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name:      'vendors',
        minChunks: 2
      }),
      new webpack.ProvidePlugin({
        $:               "jquery",
        jQuery:          "jquery",
        "window.jQuery": "jquery"
      }),
    ],
  };

  if (process.env.NODE_ENV === 'production') {
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings:     false,
        drop_console: true
      }
    }));
  }

  return new Promise(( resolve, reject ) => {
    webpack(webpackConfig, ( err, stats ) => {
      if (err) return reject(err);
      var jsonStats = stats.toJson();
      if (stats.hasErrors()) return reject(jsonStats.errors);
      resolve(jsonStats);
    });
  })
};

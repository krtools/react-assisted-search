const path = require('path');
const webpack = require('webpack');

module.exports = function() {
  process.env.NODE_ENV = 'production';

  return /** @type webpack.Configuration */ {
    devtool: 'sourcemap',
    entry: {
      assistedsearch: path.join(__dirname, 'src/index.js')
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'build.js'
    },
    plugins: [new webpack.optimize.ModuleConcatenationPlugin()],
    module: {
      rules: [
        {
          test: /\.[js]sx?$/,
          enforce: 'pre',
          loader: 'eslint-loader'
        },
        {
          test: /\.jsx?$/,
          loader: 'babel-loader',
          include: [].concat([path.join(__dirname, 'src')])
        },
        {
          test: /\.tsx?$/,
          loader: ['babel-loader', 'ts-loader'],
          include: [].concat([path.join(__dirname, 'src')])
        },
        {
          test: /\.scss$/,
          use: [
            {
              loader: 'css-loader',
              options: {
                modules: false,
                minimize: true,
                sourceMap: true
              }
            },
            {
              loader: 'postcss-loader'
            },
            {
              loader: 'sass-loader',
              query: {
                sourceMap: true
              }
            }
          ]
        }
      ]
    },
    externals: ['react', 'react-dom', 'lodash'],
    resolve: {
      extensions: ['.js', '.json', '.ts', '.tsx']
    }
  };
};

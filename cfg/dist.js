const path = require('path');
const webpack = require('webpack');

const ExtractTextPlugin = require('extract-text-webpack-plugin');

process.env.NODE_ENV = 'production';

/** @type webpack.Configuration */
let config = {
  entry: {
    'react-assisted-search': path.join(__dirname, '../src/index.ts'),
    'assisted-search': path.join(__dirname, '../src/styles/assisted-search.scss'),
    'assisted-search-bootstrap3': path.join(__dirname, '../src/styles/assisted-search-bootstrap3.scss')
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '../dist')
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new ExtractTextPlugin('[name].css')
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        enforce: 'pre',
        loader: 'eslint-loader'
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        include: [].concat([path.join(__dirname, '../src')])
      },
      {
        test: /\.tsx?$/,
        loader: ['babel-loader', 'ts-loader'],
        include: [].concat([path.join(__dirname, '../src')])
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          use: ['css-loader', 'postcss-loader', 'sass-loader']
        })
      }
    ]
  },
  externals: ['react', 'react-dom'],
  resolve: {
    extensions: ['.js', '.json', '.ts', '.tsx']
  }
};

module.exports = config;

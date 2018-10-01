const webpack = require('webpack');
const path = require('path');

let srcDir = path.join(__dirname, '/../src');

module.exports = {
  externals: ['mocha'],
  resolve: {
    alias: {
      src: srcDir
    },
    modules: [srcDir, 'node_modules'],
    extensions: ['.js', '.json', '.ts', '.tsx']
  },
  watchOptions: {
    aggregateTimeout: 100
  },
  devtool: 'inline-source-map',
  plugins: [new webpack.NamedModulesPlugin()],
  module: {
    rules: [
      {
        test: /\.(jsx?)$/,
        // include: defaultSettings.srcPath,
        enforce: 'pre',
        loader: 'eslint-loader'
      },
      {
        test: /\.jsx?$/,
        use: ['babel-loader'],
        include: [srcDir, path.join(__dirname, '/../test'), path.join(__dirname, '/../stories')]
      },
      {
        test: /\.css$/,
        use: [{loader: 'style-loader', options: {sourceMap: true}}, {loader: 'css-loader', options: {sourceMap: true}}]
      },
      {
        test: /\.s[ac]ss$/,
        use: [
          'style-loader',
          {loader: 'css-loader', options: {sourceMap: true}},
          {loader: 'sass-loader', options: {sourceMap: true}}
        ]
      },
      {
        test: /\.(png|jpe?g|gif)(\?v=\d\.\d\.\d)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192
            }
          }
        ]
      },
      {
        test: /\.(mp4|ogg)(\?v=\d\.\d\.\d)?$/,
        use: ['file-loader']
      },
      {
        test: /\.tsx?$/,
        use: ['babel-loader', 'ts-loader']
      },
      {
        test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'application/font-woff'
            }
          }
        ]
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: ['file-loader']
      }
    ]
  }
};

const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require("webpack");
const { Configuration } = require("webpack");

/** @type {Configuration} */
const config = {
  mode: 'development',
  // entry : './src/ref-line.js',
  entry: "./index.ts",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "index_bundle.js",
  },
  plugins: [new HtmlWebpackPlugin({
    template: './index.html'
  })],
  // output: {
  //     path         : path.resolve(__dirname, 'dist'),
  //     filename     : 'ref-line.min.js',
  //     library      : 'RefLine',
  //     libraryTarget: "umd"
  // },
  // module: {
  //     rules: [
  //         {test: /\.js$/, use: 'babel-loader'}
  //     ]
  // },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      }
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  devServer: {
    port: 9000,
  },
};

module.exports = config;

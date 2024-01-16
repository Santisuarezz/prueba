const PACKAGE = require('./package.json');
const webpack = require("webpack");
const HTMLWebpackPlugin = require('html-webpack-plugin')
const sharedConfig = require("./webpack.config.shared.js");

sharedConfig.config.mode = "development";
sharedConfig.config.devtool = 'eval-cheap-module-source-map';
// sharedConfig.texPackerPlugin.packer = undefined; // faster builds for debug.
sharedConfig.config.plugins.push(new webpack.DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify("development"),
}));

sharedConfig.htmlPlugin.userOptions.templateParameters.langCode = "en";

for (let l of PACKAGE.languages ?? []) {
  const templateOptions = JSON.parse(JSON.stringify(sharedConfig.htmlPlugin.userOptions));
  templateOptions.templateParameters.langCode = l;
  templateOptions.filename = "index." + l + ".html";
  sharedConfig.config.plugins.push(new HTMLWebpackPlugin(templateOptions))
}

module.exports = sharedConfig.config;

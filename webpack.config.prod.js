const PACKAGE = require('./package.json');
const HTMLWebpackPlugin = require('html-webpack-plugin')
const webpack = require("webpack");
const sharedConfig = require("./webpack.config.shared.js");
const TerserPlugin = require('terser-webpack-plugin');

sharedConfig.config.mode = "production";
sharedConfig.config.optimization = {
    minimize: true,
    minimizer: [new TerserPlugin({
        terserOptions: {
            ecma: 5,
            ie8: true,
            safari10: true,
            compress: { drop_console: true },
            output: { comments: false, beautify: false },
        },
    }),
    sharedConfig.defaultCompression],
};

sharedConfig.config.plugins.push(new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify("production"),
}));



sharedConfig.htmlPlugin.userOptions.templateParameters.langCode = undefined;

for (let l of PACKAGE.languages ?? []) {
    const templateOptions = JSON.parse(JSON.stringify(sharedConfig.htmlPlugin.userOptions));
    templateOptions.templateParameters.langCode = l;
    templateOptions.filename = "index." + l + ".html";
    sharedConfig.config.plugins.push(new HTMLWebpackPlugin(templateOptions))
}

module.exports = sharedConfig.config;
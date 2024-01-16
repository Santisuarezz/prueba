const { CreateFileWebpack } = require('./.tools/CreateFileWebpack');
const PACKAGE = require('./package.json');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const WebpackFreeTexPacker = require('webpack-free-tex-packer');
const fs = require('fs');
const path = require('path');
const buildPath = path.resolve(__dirname, 'dist');
const webpack = require("webpack");
const ImageminPlugin = require('image-minimizer-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const WorkboxPlugin = require('workbox-webpack-plugin');
const JSONC = require('jsonc-parser');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');


const providePlugin = new webpack.ProvidePlugin({
    THREE: 'three'
});

const copyPlugin = new CopyWebpackPlugin({
    patterns: [{
        from: 'assets', to: '', globOptions: {
            ignore: ["**/thumbs.db", "**/Thumbs.db"],
        },
        transform: function (content, path) {
            if (path.endsWith('.json')) {
                return Buffer.from(JSON.stringify(JSON.parse(content.toString())), 'utf8');
            }

            return content;
        }
    },
    {
        from: "src/assets.jsonc", to: "assets.json",
        // convert json5 to json
        transform: function (content, path) {
            return Buffer.from(JSON.stringify(JSONC.parse(content.toString())), 'utf8');
        }
    }]
});


const dirMain = path.resolve(__dirname, 'atlas');
const atlasPackages = [];
const manifest = [];

const readDirMain = fs.readdirSync(dirMain);

readDirMain.forEach((dirNext) => {
    if (fs.lstatSync(dirMain + "/" + dirNext).isDirectory() && fs.readdirSync(dirMain + "/" + dirNext).length > 0) {
        const texPackerPlugin = new WebpackFreeTexPacker(path.resolve(dirMain, dirNext), "atlas", {
            textureName: dirNext,
            width: 2048, //if we can make this smaller, we can make smaller final files
            height: 2048, //if we can make this smaller, we can make smaller final files
            fixedSize: false,
            powerOfTwo: true,
            padding: 2,
            allowRotation: true,
            detectIdentical: true,
            allowTrim: true,
            exporter: "Pixi",
            removeFileExtension: false,
            prependFolderName: true,
            packer: "OptimalPacker",
            omitZeroIndex: true
        });
        atlasPackages.push(texPackerPlugin);
        manifest.push({ name: dirNext, url: "atlas/" + dirNext + ".json" })
    }
});

const texPackerManifest = new CreateFileWebpack({
    // file name
    outputFile: 'atlas/autoPackedAtlas.json',
    // content of the file
    content: JSON.stringify(manifest)
});

const htmlPlugin = new HTMLWebpackPlugin({
    template: 'src/index.ejs',
    filename: 'index.html',
    templateParameters: { PACKAGE: PACKAGE, buildDate: new Date() },
    hash: true,
    minify: false
});

const definePlugin = new webpack.DefinePlugin({
    'process.env.DATE': Date.now(),
});

const defaultCompression = new ImageminPlugin({
    minimizer: {
        implementation: ImageminPlugin.sharpMinify,
        options: {
            encodeOptions: {
                jpeg: {
                    // https://sharp.pixelplumbing.com/api-output#jpeg
                    quality: 90,
                },
                webp: {
                    // https://sharp.pixelplumbing.com/api-output#webp
                    nearLossless: true,
                },
                avif: {
                    // https://sharp.pixelplumbing.com/api-output#avif
                    lossless: true,
                },
                png: {
                    // https://sharp.pixelplumbing.com/api-output#png
                    adaptiveFiltering: true,
                    quality: 100,
                    compressionLevel: 7,
                },
                gif: {
                    // https://sharp.pixelplumbing.com/api-output#gif
                    reoptimise: true
                },
            },
        },
    },
});


const pwaManifest = new WebpackPwaManifest({
    name: PACKAGE.pwa.name,
    short_name: PACKAGE.pwa.short_name,
    description: PACKAGE.pwa.description,
    background_color: PACKAGE.pwa.background_color,
    crossorigin: 'use-credentials', //I think this must remain like this....
    orientation: "landscape",
    icons: [
        {
            src: path.resolve('icon.png'),
            sizes: [96, 120, 128, 144, 152, 180, 192, 256, 384, 512], // multiple sizes
            purpose: 'any maskable'
        }
    ],
    ios: true
})

const pwaWorker = new WorkboxPlugin.GenerateSW({
    swDest: 'sw.js',
    // these options encourage the ServiceWorkers to get in there fast 
    // and not allow any straggling "old" SWs to hang around
    clientsClaim: true,
    skipWaiting: true,
    cacheId: PACKAGE.name,
    cleanupOutdatedCaches: true
});

const typeChecker = new ForkTsCheckerWebpackPlugin();

exports.providePlugin = providePlugin;
exports.copyPlugin = copyPlugin;
exports.htmlPlugin = htmlPlugin;
exports.definePlugin = definePlugin;
exports.atlasPackages = atlasPackages;
exports.texPackerManifest = texPackerManifest;
exports.defaultCompression = defaultCompression;
exports.pwaManifest = pwaManifest;
exports.pwaWorker = pwaWorker;
exports.typeChecker = typeChecker;


exports.config = {
    stats: 'minimal',
    entry: './src/index.ts',
    devServer: {
        compress: true, static: false,
        client: {
            logging: "warn",
            // Can be used only for `errors`/`warnings`
            //
            overlay: {
                errors: false,
                warnings: false,
            },
            progress: true,
        },
        port: 3000, hot: true, host: '0.0.0.0'
    },
    module:
    {
        rules: [
            // Typescript
            {
                test: /\.tsx?$/,
                loader: 'esbuild-loader',
                options: {
                    loader: 'ts',
                    target: 'es2015'
                },
                exclude: /node_modules/
            },

            //Shaders
            {
                test: /\.((frag)|(vert))$/,
                use: 'raw-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'], alias: {
            root: __dirname,
            src: path.resolve(__dirname, 'src'),
        },
        fallback: {
            path: false,
            fs: false,
        }
    },
    plugins: [
        providePlugin,
        copyPlugin,
        ...atlasPackages,
        texPackerManifest,
        typeChecker,
        htmlPlugin,
        definePlugin,
        // pwaManifest,
        // pwaWorker,
    ],
    performance: {
        hints: false,
    },
    output: { filename: 'main.js', path: buildPath }
}
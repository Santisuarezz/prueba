class CreateFileWebpack {
    static defaultOptions = {
        outputFile: 'output.json',
        content: '{"hello":"world"}'
    };

    // Any options should be passed in the constructor of your plugin,
    // (this is a public API of your plugin).
    constructor(options = {}) {
        // Applying user-specified options over the default options
        // and making merged options further available to the plugin methods.
        // You should probably validate all the options here as well.
        this.options = { ...CreateFileWebpack.defaultOptions, ...options };
    }

    apply(compiler) {
        const pluginName = CreateFileWebpack.name;

        // webpack module instance can be accessed from the compiler object,
        // this ensures that correct version of the module is used
        // (do not require/import the webpack or any symbols from it directly).
        const { webpack } = compiler;

        // Compilation object gives us reference to some useful constants.
        const { Compilation } = webpack;

        // RawSource is one of the "sources" classes that should be used
        // to represent asset sources in compilation.
        const { RawSource } = webpack.sources;

        // Tapping to the "thisCompilation" hook in order to further tap
        // to the compilation process on an earlier stage.
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {

            compilation.emitAsset(
                this.options.outputFile,
                new RawSource(this.options.content)
            );
        });
    }
}

exports.CreateFileWebpack = CreateFileWebpack;
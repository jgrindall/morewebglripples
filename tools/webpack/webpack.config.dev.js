
const path = require('path')
const staticDir = path.join(__dirname, '../../src')
console.log("SD", staticDir)

module.exports = {
    mode: 'development',
    entry: ['./src/main.ts'],
    module: {
        rules: require('./webpack.rules'),
    },
    output: {
        filename: '[name].js',
        chunkFilename: '[name].chunk.js',
    },
    plugins: require('./webpack.plugins'),
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
        alias: require('./webpack.aliases'),
    },
    stats: 'errors-warnings',
    devtool: 'cheap-module-source-map',
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    },
    performance: {
        hints: false,
    },
    devServer: {
        open: true,
        static: {
            directory: staticDir,
            publicPath: '/'
        }
    }
};

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: path.resolve(__dirname, '../lib/index.jsx'),
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, '../dist')
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'y-react fuck yeah',
            template: path.resolve(__dirname, '../index.html')
        }),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
            },
            {
                test: /\.jsx$/,
                use: {
                    loader: 'babel-loader'
                }
            },
        ]
    },
    devServer: {
        contentBase: path.resolve(__dirname, '../dist'),
    },
}

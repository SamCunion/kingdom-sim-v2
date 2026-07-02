const webpack = require("webpack");
const path = require("path");

module.exports = {
    entry: "./src/index.ts",
    output: {
        path: path.resolve(__dirname, "public"),
        filename: "app.bundle.js"
    },
    module: {
        rules: [{
            test: /\.(js|jsx|ts|tsx)$/,
            exclude: /node_modules/,
            use: {
                loader: "ts-loader",
            }
        }]
    },
    mode: "development",
    watch: true,
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    }
}
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const { DifferentialPolyfillPlugin } = require("../dist");

module.exports = {
  entry: path.join(__dirname, "index.js"),
  mode: "production",
  target: "web",
  output: {
    filename: "[name].bundle.js",
  },
  module: {
    rules: [{ test: /\.js$/, use: "babel-loader" }],
  },
  plugins: [new HtmlWebpackPlugin(), new DifferentialPolyfillPlugin()],
};

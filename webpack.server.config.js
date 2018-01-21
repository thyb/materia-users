module.exports = {
  entry: './client/user-management.addon.ts',
  output: {
      filename: 'bootstrap.addon.js',
      path: __dirname + "/dist"
  },
  module: {
      rules: [
          {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              exclude: /node_modules/,
          },
      ]
  },
  resolve: {
      extensions: [".tsx", ".ts", ".js"]
  },
};
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/DiagramLibrary.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'html-diagram-library.min.js' : 'html-diagram-library.js',
      library: {
        name: 'HTMLDiagramLibrary',
        type: 'umd',
        export: 'default'
      },
      globalObject: 'this',
      clean: false
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.svg$/,
          type: 'asset/source'
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.json']
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    devServer: {
      static: {
        directory: path.join(__dirname, 'examples'),
      },
      compress: true,
      port: 8080,
      open: true,
      hot: true
    },
    plugins: [
      // Only include HTML plugin for development server
      ...(argv.mode === 'development' && process.env.WEBPACK_SERVE ? [
        new HtmlWebpackPlugin({
          template: './examples/index.html',
          filename: 'index.html',
          inject: 'head'
        })
      ] : [])
    ],
    optimization: {
      minimize: isProduction,
      usedExports: true,
      sideEffects: false
    },
    // Ensure all dependencies are bundled for CDN distribution
    externals: {}
  };
};
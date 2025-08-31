const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  target: ['web', 'electron-renderer'],
  entry: './src/renderer/index.tsx',
  experiments: {
    topLevelAwait: true,
  },
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'renderer.js',
    publicPath: isDevelopment ? 'http://localhost:3001/' : './',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
    fallback: {
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer"),
      "util": require.resolve("util"),
      "process": require.resolve("process/browser"),
      "fs": false,
      "net": false,
      "tls": false,
      "events": require.resolve("events"),
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.renderer.json'
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /webpack-dev-server/,
        type: 'javascript/auto',
      },
      {
        test: /\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public'),
          to: path.resolve(__dirname, 'dist/renderer'),
          globOptions: {
            ignore: ['**/.*'],
          },
        },
      ],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      'global': 'globalThis',
      'globalThis': 'globalThis',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'typeof require': '"function"',
      'typeof module': '"object"',
    }),
    new webpack.BannerPlugin({
      banner: `
        if (typeof global === 'undefined') {
          var global = globalThis;
        }
        if (typeof window !== 'undefined') {
          window.global = global;
        }
      `,
      raw: true,
      entryOnly: true,
    }),
    ...(isDevelopment ? [] : [
      new MiniCssExtractPlugin({
        filename: 'styles.css',
      }),
    ]),
  ],
  devServer: {
    port: 3001,
    hot: true,
    static: [
      {
        directory: path.join(__dirname, 'dist/renderer'),
      },
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/',
      },
    ],
  },
  externals: {
    'electron': 'commonjs electron',
  },
}; 
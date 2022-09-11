const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const output = {
  filename: 'index.js',
  path: path.resolve(__dirname, '.build/example')
};

module.exports = {
  entry: {
    bundle: path.join(__dirname, 'example.ts')
  },
  output: output,
  target: 'web',
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    fallback: {
      'stream': require.resolve('readable-stream'),
      'crypto': require.resolve('crypto-browserify'),
      'events': require.resolve('events'),
      'buffer': require.resolve('buffer/'),
      string_decoder: false
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts)$/,
        use: {
          loader: 'ts-loader'
        }
      },
      {
        test: /\.(js)$/,
        include: {
          and: [/node_modules/],
          not: [/core-js/]
        },
        use: {
          loader: 'babel-loader',
          options: {
            sourceType: 'unambiguous',
            presets: [
              [
                '@babel/preset-env',
                {
                  // loose: true,
                  // modules: 'cjs',
                  targets: {
                    rhino: '1.7.14'
                  }
                  // useBuiltIns: 'usage',
                  // corejs: 3
                }
              ]
            ]
            // plugins: [
            //   '@babel/plugin-transform-exponentiation-operator'
            // ]
            // plugins: [
            // //   '@babel/plugin-transform-object-set-prototype-of-to-assign',
            //   [
            //     '@babel/plugin-transform-runtime',
            //     {
            //       corejs: 3
            //     }
            //   ]
            //   // '@babel/plugin-syntax-bigint',
            //   // require('./plugin-transform-exponentiation-operator.js'),
            //   // 'transform-bigint',
            //   // 'transform-jsbi-to-bigint',
            // ]
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser'
    })
    // new ReplaceInFileWebpackPlugin([
    //   {
    //     dir: output.path,
    //     files: [output.filename],
    //     rules: [
    //       {
    //         search: 'process.nextTick',
    //         replace: '(function (a) { a() })'
    //       }
    //     ]
    //   }
    // ])
    // new webpack.DefinePlugin({
    //   process: JSON.stringify({})
    // })
  ],
  optimization: {
    minimize: false,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false
  }
};

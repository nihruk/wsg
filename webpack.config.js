const {globSync} = require('glob')
const path = require('path');
const webpack = require('webpack');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const postcssPresetEnv = require('postcss-preset-env');
const wsgNunjucks = require('./src/js/nunjucks')


const WATCH_FILES_PATTERNS = [
  [__dirname, 'src', '**', '*.html'].join('/'),
]


class WatchPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync(WatchPlugin.name, (compilation, callback) => {
      for (const filePath of globSync(WATCH_FILES_PATTERNS)) {
        compilation.fileDependencies.add(path.resolve(filePath))
      }
      callback()
    });
  }
}

module.exports = (env, args) => {
  const production = args.mode === 'production'
  const configuration = {
    entry: {
      'wsg': [
          path.resolve(__dirname, 'src', 'scss', 'main.scss'),
          path.resolve(__dirname, 'src', 'js', 'main.js'),
      ],
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js',
      clean: true,
    },
    devServer: {
      watchFiles: {
        paths: WATCH_FILES_PATTERNS,
      },
    },
    mode: args.mode,
    module: {
      rules: [
        {
          test: /\.(js)$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
                presets: [
                  [
                    '@babel/preset-env',
                  ]
                ]
              }
            },
          ]
        },
        {
          test: /\.(sass|scss|css)$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader
            },
            {
              loader: 'css-loader',
              options: {
                sourceMap: true
              }
            },
            {
              loader: 'resolve-url-loader',
              options: {
                sourceMap: true
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true,
                postcssOptions: {
                  plugins: [
                      'autoprefixer',
                      postcssPresetEnv(),
                  ],
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                sassOptions: {
                  indentWidth: 4,
                  outputStyle: production ? 'compressed' : 'expanded',
                  sourceComments: !production
                }
              }
            }
          ]
        },
        {
          test: /\.(png|gif|jpg|jpeg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name][ext]',
          }
        },
        {
          test: /\.(ttf|woff2?)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name][ext]',
          }
        }
      ]
    },
    optimization: {
      minimizer: [
        new CssMinimizerPlugin(),
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            output: {
              comments: false
            }
          }
        })
      ]
    },
    plugins: [
      new webpack.ProgressPlugin(),
      new RemoveEmptyScriptsPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'src', 'www'),
            to: path.resolve(__dirname, 'dist'),
            transform: (content, filename) => {
              if (filename.endsWith('.html')) {
                return (new wsgNunjucks.Environment()).renderPageFile(filename)
              }
              return content
            }
          }
        ]
      }),
      new WatchPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].bundle.css',
      }),
    ]
  }
  if (!production) {
    configuration.devtool = 'eval-source-map'
  }

  return configuration
}

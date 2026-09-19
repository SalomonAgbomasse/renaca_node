const { defineConfig } = require("@vue/cli-service");
const path = require("path");
const webpack = require("webpack");

module.exports = defineConfig({
  transpileDependencies: true,
  //publicPath: '',
  publicPath: '/',

  pluginOptions: {
    cordovaPath: 'src-cordova'
  },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    devServer: {
      historyApiFallback: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    // resolve: {
    //   fallback: {
    //     // "https": require.resolve("https-browserify"),
    //     // "http": require.resolve("stream-http"),
    //     // "url": require.resolve("url"),
    //   }
    // }
  }
});

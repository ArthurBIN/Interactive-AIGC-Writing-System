const {defineConfig} = require('@vue/cli-service')

module.exports = defineConfig({
    transpileDependencies: [],
    assetsDir: 'static',
    parallel: false,
    publicPath: './',
    devServer: {
        port: 8082,
        host: '0.0.0.0',
    }
})
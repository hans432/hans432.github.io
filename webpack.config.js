const path = require('path');

module.exports = {
    mode: 'production',
    // 入口
    entry: path.join(__dirname, 'src', 'index.js'),
    // 出口
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js'
    }
}
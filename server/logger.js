const log4js = require("log4js"); // log4jsをインポート
const logger = log4js.getLogger("nush-server"); // 引数の名前のインスタンスを作る
logger.level = "info"; // log出力レベルを設定する

module.exports = logger; // モジュールとしてexport
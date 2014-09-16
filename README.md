node-web-server [![NPM Version][npm-img]][npm-url] [![Build Status][travis-img]][travis-url] [![Coverage Status][coveralls-img]][coveralls-url]
===============
PC 上で簡単に導入できる簡易的な静的ファイル用 Web サーバです。

※ 本番環境で動作させることは考慮されていません。

Installation
------------
```
$ npm install -g node-web-server
```

Usage
-----
### Command line
```
$ nws -h
node-web-server command line interface

Usage: nws [options]

Options:
  -h             print this help
  -v             print node-web-server's version
  -d [http.conf] copy default config file
  -c [http.conf] load config file & run server
  host:port      run server at host:port
```

### Script
```
nws.run(settings(string or object), [current_directory]);
```

`settings` は設定ファイルのパスまたは設定を直接objectで指定します。
`current_directory` を指定すると、そのディレクトリを基準にした相対パスでドキュメントルート
とログファイルの保存先が設定されます。

example.js
```js
var nws = require('node-web-server');
// 起動 (__dirname を current directory として localhost:8080 で起動)
  nws.run({
    host: "localhost",
    port: 8080,
    docRoot: "www"
  }, __dirname);
// 10秒後に停止
setTimeout(nws.stop, 10000);
```

Configuration
-------------
/lib/http.conf
```json
{
  "host"       : ホスト名 or IPアドレス or 環境変数 (process.env.*),
  "port"       : ポート番号 or 環境変数 (process.env.*),
  "docRoot"    : ドキュメントルート (相対パス),
  "defFile"    : [
    デフォルトのインデックスファイル
  ],
  "accessLog"  : HTTP リクエストのログファイル (相対パス) or false,
  "errorLog"   : エラー発生時のログファイル (相対パス) or false,
  "httpHeaders": {
    HTTPヘッダー
  },
  "allowUnknownMIMEType": MIMEType が一致しない場合に application/octet-stream で転送することを許可します true or false,
  "MIME"      : {
    MIMEタイプ
  }
}
```

ex. Cloud Foundry
```
{
  "host"      : "0.0.0.0",
  "port"      : "process.env.VCAP_APP_PORT || 3000",
  <The rest is omitted>
```

ex. Heroku
```
{
  "host"      : "0.0.0.0",
  "port"      : "process.env.PORT || 3000",
  <The rest is omitted>
```

'||' 演算子を使うことができます。
You can use '||' operator.

Logging
-------
ログは下記のように記録されます (アクセスログの例)

  {
    "date":"Fri, Sep 30 2011 20:26:11 GMT-0900",
    "method":"GET",
    "url":"/",
    "statusCode":200
  }
  ,{
    "date":"Fri, Sep 30 2011 20:26:11 GMT-0900",
    "method":"GET",
    "url":"style.css",
    "statusCode":200
  }

これを `[]` で囲むことで、JavaScriptの配列として読み込むことが出来ます。

  var obj = JSON.parse("[" + log + "]");

Testing
-------
```
npm test
```

### Coverage (blanket)
```
mocha -r blanket -R html-cov > coverage.html
```

### Coverage (istanbul)
```
istanbul cover ./node_modules/mocha/bin/_mocha
```

Changelog
---------
### v1.1.3: 2014/05/25
- デフォルトで access.log を出力しないようになりました。
- テストを追加しました。
- `allowUnknownMIMEType` オプションを追加しました。

### v1.1.2: 2012/07/15
- README の間違いを訂正しました。
- 相対パスの扱いを修正しました。
- node v0.8 に対応しました。

### v1.1.1: 2012/03/27
- 改行コードを CRLF から LF に変更しました。
- Linux で nws コマンドが使えない問題を解決しました。

### v1.1.0: 2012/03/25
- モジュール化し、他のアプリに組み込めるようにしました。
- #4 コマンドラインからの実行も可能。

### v1.0.9: 2012/02/07
- fix #3 URL 周りのバグを修正しました。

### v1.0.8: 2012/01/22
- Date Format の間違いを修正しました。

### v1.0.7: 2012/01/15
- fix #1 URL の扱いを改善しました。
- access.log が生成されないバグを改善しました。

### v1.0.6: 2011/12/19
- Settings File でホスティングサービスの環境変数 (process.env.*) に対応。

### v1.0.5: 2011/11/12
- Date format (RFC1123) の修正。

### v1.0.4: 2011/10/07
- デフォルトインデックス (defFile) 部分の修正。

### v1.0.3: 2011/09/30
- ロギング部分の修正。

### v1.0.2: 2011/09/26
- エラーメッセージにドキュメントルートのフルパスが表示される脆弱性を修正。

### v1.0.1: 2011/09/02
- bugfix

### v1.0.0: 2011/08/11
- Release

[npm-url]: https://www.npmjs.org/package/node-web-server
[npm-img]: https://img.shields.io/npm/v/node-web-server.svg?style=flat
[travis-url]: https://travis-ci.org/ww24/node-web-server
[travis-img]: https://img.shields.io/travis/ww24/node-web-server.svg?branch=master&style=flat
[coveralls-url]: https://coveralls.io/r/ww24/node-web-server?branch=master
[coveralls-img]: https://img.shields.io/coveralls/ww24/node-web-server.svg?style=flat

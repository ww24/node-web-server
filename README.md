node-web-server
===

Nodeの勉強のために書いたHTTPサーバです。
リクエストされたファイルを返します。
MIME Typeに登録されていないファイルがリクエストされると403 Forbiddenを返します。
GETとPOSTメソッドに対応しています。

##使用法
http.conf

	{
		"host"			: ホスト名 or IPアドレス,
		"port"			: ポート番号,
		"docRoot"		: ドキュメントルート(相対パス),
		"defFile"		: デフォルトのインデックスファイル,
		"accesslog"		: HTTPリクエストのログファイル(相対パス) or false,
		"errorLog"		: エラー発生時のログファイル(相対パス) or false,
		"httpHeaders"	: {
			HTTPヘッダー
		},
		"MIME"			: {
			MIMEタイプ
		}
	}

##今後、追加予定の機能
- ログファイルの閲覧
- アクセス制限
- CGI対応(外部jsの実行)
- HTTPS対応

##ログについて
ログは下記のように記録されます。(アクセスログの例)
	{"date":"Fri, Sep 30 2011 20:26:11 GMT-0900","method":"GET","url":"/","statusCode":200}
	,{"date":"Fri, Sep 30 2011 20:26:11 GMT-0900","method":"GET","url":"style.css","statusCode":200}
これを`[]`で囲むことで、JavaScriptの配列として扱えるため、
	var obj = JSON.parse("[" + log + "]");
としてJavaScriptオブジェクトとして読み込むことが出来ます。

##更新履歴 - History

###v1.0.3: 2011/09/30
- ロギング部分の修正。

###v1.0.2: 2011/09/26
- エラーメッセージにドキュメントルートのフルパスが表示される脆弱性を修正。

###v1.0.1: 2011/09/02
- bugfix

###v1.0.0: 2011/08/11
- Release
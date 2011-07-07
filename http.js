/*
	Node.js HTTP/1.1 Server
	
	2011-06-19
	beta 0.9.9
	@ww24
	LICENSE　MIT
*/
// 先頭および末尾の空白を削除
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, '');
};

var getDateFormat = function(set) {
	var date = (typeof(set) == "undefined")? new Date() : new Date(set);
	// 2桁表示変換 7->07 正負対応
	var tt = function(t) {
		var abs = Math.abs(t);
		return (abs < 10)? (t < 0)? "-0"+abs : "0"+t : t;
	};
	var timezoneOffset = parseInt(-date.getTimezoneOffset()/60);
	var format = [
		["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()],
		["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()],
		date.getDate(),
		tt(date.getHours())+":"+tt(date.getMinutes())+":"+tt(date.getSeconds()),
		(timezoneOffset < 0)?"":"+"+tt(timezoneOffset)+tt(-date.getTimezoneOffset()-timezoneOffset*60),
		date.getFullYear()
	];
	return format.join(" ");
};
var logging = function(file, log) {
	fs.readFile(file, 'utf8', function(err, data) {
		obj = [];
		if (typeof(data) != 'undefined') {
			obj = JSON.parse(data);
			obj[obj.length] = log;
		} else {
			obj[0] = log;
		}
		fs.writeFileSync(file, JSON.stringify(obj), encoding='utf8');
	});
};

var http = require('http'),
	fs = require('fs'),
	exec = require('child_process').exec;

// Settings File Load
var settings = JSON.parse(fs.readFileSync('http.conf', 'utf8'));

http.createServer(function (req, res) {
	var url = require('url').parse(req.url),
		path,
		ext,
		errorLog = '';
	if (url.pathname == '/') {
		path = settings.defFile;
	} else {
		path = url.pathname;
	}
	ext = path.match(/\.[A-Z0-9]+$/i);
	var filePath = settings.docRoot + path;
	
	exec('ls ' + filePath, function(error, stdout, stderr) {
		var statusCode = 200,
			contentType = 'text/plain',
			body　= '';
			
		if (ext in settings.MIME) {
			if　(error　!== null) {
				statusCode = 404;
				body = 'Not Found\n' + path;
				errorLog += 'exec error: ' + error;
			} else {
				contentType = settings.MIME[ext];
				body = fs.readFileSync(filePath);
			}
		} else {
			statusCode = 403;
			body = 'Forbidden\n' + path;
		}
		
		//res.setHeader("Date", getDateFormat());
		res.setHeader('Server', 'node-web-server');
		res.setHeader('Connection', 'close');
		
		if (settings.xss_protect) {
			res.setHeader('X-XSS-Protection', '1; mode=block');
			res.setHeader('X-Frame-Options', 'DENY');
		}
		
		var method = req.method;
		if (method == "GET" || method == "POST") {
			res.writeHead(statusCode, {
				'Content-Type': contentType,
				'Content-Length': body.length
			});
			res.write(body);
		} else {
			res.writeHead(statusCode);
		}
		res.end();
		
		// Logging
		if (settings.logFile !== false) {
			logging(settings.logFile, {
				date		: getDateFormat(),
				method		: method,
				url			: req.url,
				statusCode	: statusCode,
				error		: errorLog.trim(),
			});
		}
	});
}).listen(settings.port, settings.host);
console.log('Server running at  http://'+settings.host+':'+settings.port+'/');
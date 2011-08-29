/**
 * node-web-server
 * @source	https://github.com/ww24/node-web-server
 * @license	MIT License
 * @version	1.0.0
 */
var http = require('http'),
	path = require('path'),
	url = require('url'),
	fs = require('fs');

// Get Date (Sun, Aug 07 2011 00:00:00 GMT+0000) 
var getDateFormat = function(set) {
	var date = (typeof(set) == 'undefined')? new Date() : new Date(set);
	// Convert to Double-digit (-7 → 07) toString
	var tt = function(t) {
		var abs = Math.abs(t);
		return String((abs < 10)? (t < 0)? '-0'+abs : '0'+t : t);
	};
	var timezoneOffset = date.getTimezoneOffset();
	var timezoneOffsetH = tt(parseInt(timezoneOffset/60))
	var timezoneOffsetM = tt(timezoneOffset%60);
	var format = [
		["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]+",",
		["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()],
		tt(date.getDate()),
		date.getFullYear(),
		tt(date.getHours())+':'+tt(date.getMinutes())+':'+tt(date.getSeconds()),
		'GMT'+((timezoneOffsetH < 0)?'':'+')+timezoneOffsetH+timezoneOffsetM
	];
	return format.join(" ");
};

// Logging (JSON)
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

// Settings File Load
var settings = JSON.parse(fs.readFileSync(path.join(__dirname, 'http.conf'), 'utf8'));
settings.docRoot = path.join(__dirname, settings.docRoot);
var logFile = settings.accessLog;
if (logFile !== false) {
	logFile = path.join(__dirname, settings.accessLog);
	settings.accessLog = true;
}

// Error logging
if (settings.errorLog !== false) {
	process.on('uncaughtException', function(err) {
		logging(path.join(__dirname, settings.errorLog), {
			date	: getDateFormat(),
			error	: err
		});
	});
}

// Create HTTP Server
http.createServer(function (req, res) {
	var date = getDateFormat(),
		filePath = url.parse(req.url).pathname,
		ext;
	
	// Get Request File Path
	if (filePath == '/') {
		filePath = settings.defFile;
	}
	ext = path.extname(filePath);
	filePath = path.join(settings.docRoot, filePath);
	
	// Check Request File Exists
	path.exists(filePath, function(exists) {
		var statusCode = 200,
			contentType = 'text/plain',
			body = '';
		
		// Check MIME Type
		if (ext in settings.MIME) {
			if (exists) {
				contentType = settings.MIME[ext];
				body = fs.readFileSync(filePath);
			} else {
				statusCode = 404;
				body = 'Not Found\n' + filePath;
			}
		} else {
			statusCode = 403;
			body = 'Forbidden\n' + filePath;
		}
		
		// HTTP Header
		res.setHeader("Date", date);
		res.setHeader('Server', 'node-web-server');
		var headers = settings.httpHeaders;
		for (key in headers) {
			if (headers.hasOwnProperty(key)) {
				res.setHeader(key, headers[key]);
			}
		}
		
		// Check HTTP Method
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
		if (settings.accessLog) {
			logging(logFile, {
				date		: date,
				method		: method,
				url			: req.url,
				statusCode	: statusCode
			});
		}
	});
}).listen(settings.port, settings.host);
console.log('Server running at  http://'+settings.host+':'+settings.port+'/');
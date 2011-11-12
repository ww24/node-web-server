/**
 * node-web-server
 * @source	https://github.com/ww24/node-web-server
 * @license	MIT License
 * @version	1.0.4
 */
var	http = require('http'),
	path = require('path'),
	url = require('url'),
	fs = require('fs');

// Get Date (Sun, Aug 07 2011 00:00:00 +0000)RFC1123
var getDateFormat = function(set) {
	var	date = (typeof(set) == 'undefined')? new Date() : new Date(set),
		// Convert to Double-digit (-7 → 07) toString
		tt = function(t) {
			var abs = Math.abs(t);
			return String((abs < 10)? (t < 0)? '-0'+abs : '0'+t : t);
		},
		timezoneOffset = date.getTimezoneOffset(),
		timezoneOffsetH = tt(parseInt(timezoneOffset/60, 10)),
		timezoneOffsetM = tt(timezoneOffset%60),
		format = [
			["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]+",",
			["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()],
			tt(date.getDate()),
			date.getFullYear(),
			tt(date.getHours())+':'+tt(date.getMinutes())+':'+tt(date.getSeconds()),
			((timezoneOffsetH < 0)?'':'+')+timezoneOffsetH+timezoneOffsetM
		];
	return format.join(" ");
};

// Logging (JSON)
var logging = function(file, log) {
	var	str = JSON.stringify(log),
		fd = fs.openSync(file, 'a'),
		position = fs.statSync(file).size;
	if (position !== 0) {
		str = '\n,' + str;
	}
	fs.writeSync(fd, str, position, encoding='utf8');
	fs.closeSync(fd);
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

// Get Request File Path
var getRequestFilePath = function (filePath) {
	var fullPath = false;
	if (filePath.slice(-1) === '/') {
		for (var i = 0, l = settings.defFile.length; i < l; i++) {
			fullPath = path.join(settings.docRoot, filePath, settings.defFile[i]);
			if (path.existsSync(fullPath)) {
				break;
			}
		}
	}
	return fullPath ? fullPath : path.join(settings.docRoot, filePath);
};

// Create HTTP Server
http.createServer(function (req, res) {
	var	date = getDateFormat(),
		filePath = url.parse(req.url).pathname,
		fullPath = getRequestFilePath(filePath),
		ext = path.extname(fullPath);
	
	// Check Request File Exists
	path.exists(fullPath, function(exists) {
		var	statusCode = 200,
			contentType = 'text/plain',
			body = '';
		
		// Check MIME Type
		if (ext in settings.MIME) {
			if (exists) {
				contentType = settings.MIME[ext];
				body = fs.readFileSync(fullPath);
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
		var headers = settings.httpHeaders;
		for (var key in headers) {
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
console.log('Server running at http://'+settings.host+':'+settings.port+'/');
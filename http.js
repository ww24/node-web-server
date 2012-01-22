/**
 * node-web-server
 * @source		https://github.com/ww24/node-web-server
 * @license		MIT License
 * @copyright	ww24
 * @version		1.0.8
 */
var	http = require('http'),
	path = require('path'),
	url = require('url'),
	fs = require('fs');

// Configure
var configure = function (settingsFile) {
	// Load Settings File
	var settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
	// host, port Settings
	var	items = [settings.host, settings.port],
		item = '',
		points = [],
		point = '',
		pointer = 0,
		i, j;
	for (i = 0; items.length > i; i++) {
		item = items[i];
		if (typeof(item) === 'string' && item.indexOf('process.env.') !== -1) {
			points = item.split('||');
			for (j = 0; points.length > j; j++) {
				point = points[j].replace(/^\s+|\s+|'+|"+$/g, '');
				pointer = point.indexOf('process.env.');
				if (pointer !== -1) {
					point = process.env[point.slice(pointer + 12)];
				}
				if (typeof(point) !== "undefined") break;
			}
			items[i] = point;
		}
	}
	settings.host = items[0];
	settings.port = items[1];
	// DocRoot Setting
	settings.docRoot = path.join(__dirname, settings.docRoot);
	// AccessLog Setting
	if (settings.accessLog !== false) {
		settings.accessLog = path.join(__dirname, settings.accessLog);
	}
	return settings;
};
var settings = configure(path.join(__dirname, 'http.conf'));

// Get Date RFC1123(Sun, 22 Jan 2012 00:00:00 +0000)
var getDateRFC1123 = function(set) {
	var	date = (typeof(set) == 'undefined')? new Date() : new Date(set),
		// Convert to Double-digit (7 → 07) toString
		dd = function(t) {
			return String('0' + t).slice(-2);
		},
		timezoneOffset = -date.getTimezoneOffset(),
		timezoneOffsetH = dd(parseInt(timezoneOffset/60, 10)),
		timezoneOffsetM = dd(timezoneOffset%60),
		format = [
			["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]+",",
			dd(date.getDate()),
			["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()],
			date.getFullYear(),
			dd(date.getHours())+':'+dd(date.getMinutes())+':'+dd(date.getSeconds()),
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
	fs.writeSync(fd, str, position, 'utf8');
	fs.closeSync(fd);
};

// Error logging
if (settings.errorLog !== false) {
	process.on('uncaughtException', function(err) {
		logging(path.join(__dirname, settings.errorLog), {
			date	: getDateRFC1123(),
			error	: err
		});
	});
}

// Get Request File Path
var getRequestFilePath = function (filePath, callback) {
	var getPath = function (filePath) {
		var	fullPath = false,
			endChar = filePath.slice(-1);
		
		if (endChar === '/' || endChar === '\\') {
			for (var i = 0, l = settings.defFile.length; i < l; i++) {
				fullPath = path.join(filePath, settings.defFile[i]);
				if (path.existsSync(fullPath)) {
					break;
				}
			}
		} else if (fs.statSync(filePath).isDirectory()) {
			return 'redirect';
		}
		return fullPath ? fullPath : filePath;
	};
	// Check Request File Exists
	filePath = path.join(settings.docRoot, filePath);
	path.exists(filePath, function (exists) {
		var	fullPath = 'not_exist',
			ext = false;
		if (exists) {
			fullPath = getPath(filePath);
			ext = (fullPath !== 'redirect') ? path.extname(fullPath) : false;
		}
		callback(fullPath, ext);
	});
};

// Create HTTP Server
http.createServer(function (req, res) {
	var	filePath = url.parse(req.url).pathname,
		normalizePath = path.normalize(filePath);
	
	// Normalize URL
	if (filePath.length !== normalizePath.length) {
		res.writeHead(301, {
			'Location': normalizePath
		});
		res.end();
		return false;
	}
	
	// Get File Path
	getRequestFilePath(normalizePath, function(fullPath, ext) {
		var	date = getDateRFC1123(),
			statusCode = 200,
			contentType = 'text/plain',
			body = '';
		
		// Check MIME Type
		if (ext === false || ext in settings.MIME) {
			switch (fullPath) {
				case 'redirect':
					res.writeHead(301, {
						'Location': filePath + '/'
					});
					res.end();
					return false;
				
				case 'not_exist':
					statusCode = 404;
					body = 'Not Found\n' + filePath;
					break;
				
				default:
					contentType = settings.MIME[ext];
					body = fs.readFileSync(fullPath);
					break;
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
		if (settings.accessLog !== false) {
			logging(settings.accessLog, {
				date		: date,
				method		: method,
				url			: req.url,
				statusCode	: statusCode
			});
		}
	});
}).listen(settings.port, settings.host);
console.log('Server running at http://'+settings.host+':'+settings.port+'/');
/**
 * node-web-server
 * @source      https://github.com/ww24/node-web-server
 * @license     MIT License
 * @copyright	ww24
 * @version		1.1.2
 */
var	version = 'v1.1.2',
	conf = 'http.conf';

var	http = require('http'),
	path = require('path'),
	url = require('url'),
	fs = require('fs');

// keep compatibility v0.8 || v0.6
var	exists = fs.exists || path.exists,
    existsSync = fs.existsSync || path.existsSync;

// Configure
var configure = function (config, cd) {
	var settings = {};
	
	// 再帰的マージ
	var merge = function merge(a, b) {
		Object.keys(b).forEach(function (key) {
			a[key] = (key in a)
				? ((typeof a[key] === "object" && typeof b[key] === "object")
					? merge(a[key], b[key]) : b[key]) : b[key];
		});
		return a;
	};
	
	// Load Settings File
	var settingsFile = path.resolve(__dirname, conf);
	settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
	switch (typeof config) {
		case 'string':
			config = JSON.parse(fs.readFileSync(config, 'utf8'));
		case 'object':
			settings = merge(settings, config);
			break;
	}
	
	// host, port Settings
	var	items = [settings.host, settings.port];
	items.forEach(function (item, i) {
		if (typeof(item) === 'string' && item.indexOf('process.env.') !== -1) {
			var	point = '',
				points = item.split('||');
			points.forEach(function (val) {
				point = val.replace(/^\s+|\s+|'+|"+$/g, '');
				var pointer = point.indexOf('process.env.');
				if (pointer !== -1) {
					point = process.env[point.slice(pointer + 12)];
				}
				if (typeof point !== "undefined") return false;
			});
			items[i] = point;
		}
	});
	settings.host = items[0];
	settings.port = items[1];
	
	// DocRoot Setting
	if (config && config.docRoot)
		settings.docRoot = cd ? path.resolve(cd, settings.docRoot) : path.resolve(settings.docRoot);
	else
		settings.docRoot = path.resolve(__dirname, settings.docRoot);
	
	// AccessLog Setting
	if (settings.accessLog !== false)
		settings.accessLog = cd ? path.resolve(cd, settings.accessLog) : path.resolve(settings.accessLog);
	
	// Error logging
	if (settings.errorLog !== false) {
		settings.errorLog = cd ? path.resolve(cd, settings.errorLog) : path.resolve(settings.errorLog);
		process.on('uncaughtException', function(err) {
			logging(settings.errorLog, {
				date	: getDateRFC1123(),
				error	: err
			});
		});
	}
	
	return settings;
};

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
	var	str = JSON.stringify(log, null, '	'),
		fd = fs.openSync(file, 'a'),
		position = fs.statSync(file).size;
	if (position !== 0) {
		str = '\n,' + str;
	}
	fs.writeSync(fd, str, position, 'utf8');
	fs.closeSync(fd);
};

// Get Request File Path
var getRequestFilePath = function (filePath, callback) {
	var getPath = function (filePath) {
		var	fullPath = false,
			endChar = filePath.slice(-1);
		
		if (endChar === '/' || endChar === '\\') {
			for (var i = 0, l = settings.defFile.length; i < l; i++) {
				fullPath = path.join(filePath, settings.defFile[i]);
				if (existsSync(fullPath)) break;
				else fullPath = false;
			}
		} else if (fs.statSync(filePath).isDirectory()) {
			return 'redirect';
		}
		return fullPath ? fullPath : filePath;
	};
	// Check Request File Exists
	filePath = path.join(settings.docRoot, filePath);
	exists(filePath, function (exists) {
		var	fullPath = 'not_exist',
			ext = false;
		if (exists) {
			fullPath = getPath(filePath);
			ext = (fullPath !== 'redirect') ? path.extname(fullPath) : false;
		}
		callback(fullPath, ext);
	});
};

var	server = {},
	settings;
var runserver = function (config, cd) {
	settings = configure(config, cd);
	
	// Create HTTP Server
	server = http.createServer(function (req, res) {
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
	return settings;
};

var stopserver = function () {
	if (server.close) {
		server.close();
		console.log('Server stop.');
		return true;
	} else {
		console.log('Server is not running.');
		return false;
	}
};

exports.run = runserver;
exports.stop = stopserver;
exports.version = version;
exports.config = path.resolve(__dirname, conf);
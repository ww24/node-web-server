/**
 * node-web-server
 * @source    https://github.com/ww24/node-web-server
 * @license   MIT License
 * @copyright ww24
 * @version   1.1.3
 */

var version = "v1.1.3",
    conf = "http.conf";

var http = require("http"),
    path = require("path"),
    url = require("url"),
    fs = require("fs");

var util = require("./util");

var server = {},
    settings;

var runserver = function (config, cd) {
  settings = util.configure(config, conf, cd);

  if (settings.errorLog !== false) {
    process.on("uncaughtException", function(err) {
      util.log(settings.errorLog, {
        date  : new Date().toUTCString(),
        error : err
      });
    });
  }

  // Create HTTP Server
  server = http.createServer(function (req, res) {
    var filePath = url.parse(req.url).pathname,
        normalizePath = path.normalize(filePath);

    // Normalize URL
    if (filePath.length !== normalizePath.length) {
      res.writeHead(301, {
        "Location": normalizePath
      });
      res.end();
      return false;
    }

    // Get File Path
    util.getRequestFilePath(normalizePath, function(fullPath, ext) {
      var date = new Date().toUTCString(),
          statusCode = 200,
          contentType = "text/plain",
          body = "";

      // Check MIME Type
      if (ext === false || ext in settings.MIME) {
        switch (fullPath) {
          case "redirect":
            res.writeHead(301, {
              "Location": filePath + "/"
            });
            res.end();
            return false;

          case "not_exist":
            statusCode = 404;
            body = "Not Found\n" + filePath;
            break;

          default:
            contentType = settings.MIME[ext];
            body = fs.readFileSync(fullPath);
            break;
        }
      } else {
        statusCode = 403;
        body = "Forbidden\n" + filePath;
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
      if (method === "GET" || method === "POST") {
        res.writeHead(statusCode, {
          "Content-Type"  : contentType,
          "Content-Length": body.length
        });
        res.write(body);
      } else {
        res.writeHead(statusCode);
      }
      res.end();

      // Logging
      if (settings.accessLog !== false) {
        util.log(settings.accessLog, {
          date        : date,
          method      : method,
          url         : req.url,
          statusCode  : statusCode
        });
      }
    });
  }).listen(settings.port, settings.host);

  console.log("Server running at http://" + settings.host + ":" + settings.port + "/");
  return settings;
};

var stopserver = function () {
  if (server.close) {
    server.close();
    console.log("Server stop.");
    return true;
  } else {
    console.log("Server is not running.");
    return false;
  }
};

exports.run = runserver;
exports.stop = stopserver;
exports.version = version;
exports.config = path.resolve(__dirname, conf);

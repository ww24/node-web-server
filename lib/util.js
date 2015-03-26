/**
 * Utility
 *
 */

var path = require("path"),
    fs = require("fs");

// keep compatibility v0.8 || v0.6
var exists = fs.exists || path.exists,
    existsSync = fs.existsSync || path.existsSync;

var utility = {};
utility.settings = {};

utility.configure = function (config, confFile, cd) {
  var settings = this.settings;

  // recursive merge
  var merge = function merge(a, b) {
    Object.keys(b).forEach(function (key) {
      a[key] = (key in a)
        ? ((typeof a[key] === "object" && typeof b[key] === "object")
          ? merge(a[key], b[key]) : b[key]) : b[key];
    });
    return a;
  };

  // Load Settings File
  var settingsFile = path.resolve(__dirname, confFile);
  settings = this.settings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
  switch (typeof config) {
    case "string":
      config = JSON.parse(fs.readFileSync(config, "utf8"));
    case "object":
      settings = merge(settings, config);
      break;
  }

  // host, port Settings
  var  items = [settings.host, settings.port];
  items.forEach(function (item, i) {
    if (typeof(item) === "string" && item.indexOf("process.env.") !== -1) {
      var point = "",
          points = item.split("||");
      points.forEach(function (val) {
        point = val.replace(/^\s+|\s+|"+|"+$/g, "");
        var pointer = point.indexOf("process.env.");
        if (pointer !== -1) {
          point = process.env[point.slice(pointer + 12)];
        }
        if (typeof point !== "undefined") return false;
      });
      items[i] = point;
    }
  });
  settings.host = items[0];
  settings.port = Number(items[1]);

  // DocRoot Setting
  if (config && config.docRoot)
    settings.docRoot = cd ? path.resolve(cd, settings.docRoot) : path.resolve(settings.docRoot);
  else
    settings.docRoot = path.resolve(__dirname, settings.docRoot);

  // AccessLog Setting
  if (settings.accessLog !== false)
    settings.accessLog = cd ? path.resolve(cd, settings.accessLog) : path.resolve(settings.accessLog);

  // Error logging
  if (settings.errorLog !== false)
    settings.errorLog = cd ? path.resolve(cd, settings.errorLog) : path.resolve(settings.errorLog);

  return settings;
};

utility.getRequestFilePath = function (filePath, callback) {
  var settings = this.settings;

  var getPath = function (filePath) {
    var fullPath = false,
        endChar = filePath.slice(-1);

    if (endChar === "/" || endChar === "\\") {
      for (var i = 0, l = settings.defFile.length; i < l; i++) {
        fullPath = path.join(filePath, settings.defFile[i]);
        if (existsSync(fullPath)) break;
        else fullPath = false;
      }
    } else if (fs.statSync(filePath).isDirectory()) {
      return "redirect";
    }
    return fullPath ? fullPath : filePath;
  };

  // Check Request File Exists
  filePath = path.join(settings.docRoot, filePath);
  exists(filePath, function (exists) {
    var fullPath = "not_exist",
        ext = false;

    if (exists) {
      fullPath = getPath(filePath);
      ext = (fullPath !== "redirect") ? path.extname(fullPath) : false;
    }

    callback(fullPath, ext);
  });
};

utility.log = function(file, log) {
  var str = JSON.stringify(log),
      fd = fs.openSync(file, "a"),
      position = fs.statSync(file).size;

  if (position !== 0) {
    str = "\n," + str;
  }

  fs.writeSync(fd, str, position, "utf8");
  fs.closeSync(fd);
};

module.exports = utility;

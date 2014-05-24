/**
 * utility test
 *
 */

var expect = require("chai").expect,
    path = require("path"),
    fs = require("fs");

var util = require("../lib/util");

describe("utility", function () {
  describe("#configure", function () {
    before(function () {
      process.env.TEST_HOST = "localhost";
      process.env.TEST_PORT = 8000;
    });

    it("load config file", function () {
      var filepath = path.resolve(__dirname, "../lib/http.conf");

      var settings = util.configure(filepath, "../lib/http.conf", path.resolve(__dirname, "../"));

      var json = JSON.parse(fs.readFileSync(filepath, "utf8"));
      json.docRoot = path.resolve(__dirname, "../../www");

      expect(settings).to.deep.equal(json);
    });

    it("empty object", function () {
      var settings = util.configure({}, "../lib/http.conf", path.resolve(__dirname, "../"));

      var json = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../lib/http.conf"), "utf8"));
      json.docRoot = path.resolve(__dirname, "../www");

      expect(settings).to.deep.equal(json);
    });

    it("process.env support", function () {
      var settings = util.configure({
        host: "process.env.TEST_HOST",
        port: "process.env.TEST_PORT"
      }, "../lib/http.conf", path.resolve(__dirname, "../"));

      var json = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../lib/http.conf"), "utf8"));
      json.docRoot = path.resolve(__dirname, "../www");
      json.host = "localhost";
      json.port = 8000;

      expect(settings).to.deep.equal(json);
    });

    it("access log", function () {
      var settings = util.configure({
        accessLog: "access.log"
      }, "../lib/http.conf", path.resolve(__dirname, "../"));

      var json = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../lib/http.conf"), "utf8"));
      json.docRoot = path.resolve(__dirname, "../www");
      json.accessLog = path.resolve(__dirname, "../access.log");

      expect(settings).to.deep.equal(json);
    });

    it("error log", function () {
      var settings = util.configure({
        errorLog: "error.log"
      }, "../lib/http.conf", path.resolve(__dirname, "../"));

      var json = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../lib/http.conf"), "utf8"));
      json.docRoot = path.resolve(__dirname, "../www");
      json.errorLog = path.resolve(__dirname, "../error.log");

      expect(settings).to.deep.equal(json);
    });
  });

  describe("#getRequestFilePath", function () {
    before(function () {
      util.settings = {
        defFile: ["index.html"],
        docRoot: path.resolve(__dirname, "../")
      };
    });

    it("get /www", function (done) {
      util.getRequestFilePath("/www", function (filepath, ext) {
        expect(filepath).to.equal("redirect");
        expect(ext).to.be.false;
        done();
      });
    });

    it("get /www/", function (done) {
      util.getRequestFilePath("/www/", function (filepath, ext) {
        expect(filepath).to.equal(path.join(__dirname, "../www/index.html"));
        expect(ext).to.equal(".html");
        done();
      });
    });

    it("get /www/index.html", function (done) {
      util.getRequestFilePath("/www/index.html", function (filepath, ext) {
        expect(filepath).to.equal(path.join(__dirname, "../www/index.html"));
        expect(ext).to.equal(".html");
        done();
      });
    });

    it("get /404", function (done) {
      util.getRequestFilePath("/404", function (filepath, ext) {
        expect(filepath).to.equal("not_exist");
        expect(ext).to.be.false;
        done();
      });
    });

    it("get /lib/", function (done) {
      util.getRequestFilePath("/lib/", function (filepath, ext) {
        expect(filepath).to.equal(path.join(__dirname, "../lib/"));
        expect(ext).to.equal("");
        done();
      });
    });
  });

  describe("#log", function () {
    it("first", function () {
      var filepath = path.resolve(__dirname, "../access.log");

      var log = {
        date: new Date().toUTCString(),
        method: "GET",
        url: "/index.html",
        statusCode: 200
      };

      util.log(filepath, log);

      var json = JSON.parse("[" + fs.readFileSync(filepath, "utf8") + "]").slice(-1);
      expect(json[0]).to.deep.equal(log);
    });

    it("second (append)", function () {
      var filepath = path.resolve(__dirname, "../access.log");

      var log = {
        date: new Date().toUTCString(),
        method: "GET",
        url: "/",
        statusCode: 200
      };

      util.log(filepath, log);

      var json = JSON.parse("[" + fs.readFileSync(filepath, "utf8") + "]").slice(-1);
      expect(json[0]).to.deep.equal(log);
    });

    after(function () {
      fs.unlinkSync(path.resolve(__dirname, "../access.log"));
    });
  });
});

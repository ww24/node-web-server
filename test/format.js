/**
 * utility test
 *
 */

var expect = require("chai").expect;

var format = require("../lib/util");

describe("utility", function () {
  describe("#configure", function () {
    it("merge");
  });

  describe("#getRequestFilePath", function () {
    it("get ./www");
    it("get ./www/");
    it("get ./www/index.html");
    it("get ./www/404");
  });

  describe("#logging", function () {
    it("logging JSON");
  });
});

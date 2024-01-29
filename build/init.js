'use strict';

var _setImmediate2 = require('babel-runtime/core-js/set-immediate');

var _setImmediate3 = _interopRequireDefault(_setImmediate2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');
var builder = require('./builder');
var chalk = require('chalk');
var util = require('./util');
var parser = require('./parser');

// build service file
builder.build().then(function (res) {
  return res;
}, function (err) {
  onError(err);
  process.exit();
});

// parse wxml and wxss files
(0, _setImmediate3.default)(function () {
  var currConfig = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
  var pages = currConfig.pages;
  pages.forEach(function (p) {
    var wxml = p + '.wxml';
    var wxss = p + '.wxss';
    fs.stat(wxml, function (err, stats) {
      if (err || !stats.isFile()) return onError(new Error(wxml + ' \u672A\u627E\u5230\uFF0C\u8BF7\u68C0\u67E5'));
      parser(wxml).catch(onError);
    });
    fs.stat(wxss, function (err) {
      // should be fine
      if (err) return;
      parser(wxss).catch(onError);
    });
  });
});

function onError(err) {
  console.log(chalk.red(err.message));
  util.notifyError(err);
}
//# sourceMappingURL=init.js.map

'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var execFile = require('child_process').execFile;
var exec = require('child_process').exec;
var cache = require('./cache');
var config = require('./config');
var isWin = /^win/.test(process.platform);
var isLinux = /^linux/.test(process.platform);
var isMac = /^darwin/.test(process.platform);
var wcscMac = path.resolve(__dirname, '../bin/wcsc');
var wcscWin = wcscMac + '.exe';
var wcscLinux = 'wine ' + wcscWin;
var wccMac = path.resolve(__dirname, '../bin/wcc');
var wccWin = wccMac + '.exe';
var wccLinux = 'wine ' + wccWin;
var wcsc = isWin ? wcscWin : isMac ? wcscMac : wcscLinux;
var wcc = isWin ? wccWin : isMac ? wccMac : wccLinux;
var util = require('./util');
var wxssSourcemap = require('./wxss');
var wxml_args = ['-d'];
var wxss_args = ['-lc', '-db'];

var convert = require('convert-source-map');

function parseImports(file, wxss, cb) {
  var fn = wxss ? 'parseCssImports' : 'parseImports';
  var srcs = [];
  util[fn](srcs, file, function (err) {
    if (err) return cb(err);
    srcs = srcs.map(function (src) {
      var p = /^\//.test(src) ? src.replace(/^\//, '') : src;
      return util.normalizePath(p);
    });
    srcs.unshift(file);
    return cb(null, srcs.map(function (src) {
      return './' + src;
    }));
  });
}

module.exports = function (full_path) {
  full_path = full_path.replace(/^\.?\//, '');
  return new _promise2.default(function (resolve, reject) {
    if (/\.wxml$/.test(full_path)) {
      parseImports(full_path, false, function (err, srcs) {
        if (err) return reject(err);
        var execWcc = execFile.bind(null, wcc, wxml_args.concat(srcs));
        if (isLinux) {
          execWcc = exec.bind(null, [wcc].concat(wxml_args).concat(srcs).join(' '));
        }
        execWcc({ maxBuffer: 1024 * 600 }, function (err, stdout, stderr) {
          if (err) {
            console.error(err.stack);
            return reject(new Error(full_path + ' \u7F16\u8BD1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5'));
          }
          if (stderr) return reject(new Error(stderr));
          cache[full_path] = stdout;
          resolve(stdout);
        });
      });
    } else if (/\.wxss$/.test(full_path)) {
      parseImports(full_path, true, function (err, srcs) {
        if (err) return reject(err);
        cache.setWxssMap(srcs);
        var execWcsc = execFile.bind(null, wcsc, wxss_args.concat(srcs));
        if (isLinux) {
          execWcsc = exec.bind(null, [wcsc].concat(wxss_args).concat(srcs).join(' '));
        }
        execWcsc({ maxBuffer: 1024 * 600 }, function (err, stdout, stderr) {
          if (err) {
            console.error(err.stack);
            return reject(new Error(full_path + ' \u7F16\u8BD1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5'));
          }
          if (stderr) return reject(new Error(stderr));
          wxssSourcemap(full_path, stdout).then(function (content) {
            cache[full_path] = content;
            resolve(content);
          }, reject);
        });
      });
    } else if (/\.js$/.test(full_path)) {
      config().then(function (obj) {
        util.parseJavascript(obj, full_path, config.babel).then(function (_ref) {
          var code = _ref.code,
              map = _ref.map;

          code = code + "\n" + convert.fromJSON(map).toComment();
          cache[full_path] = code;
          resolve(code);
        }, function (err) {
          console.error(err.stack);
          return reject(new Error(full_path + ' \u7F16\u8BD1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5'));
        });
      }, reject);
    } else {
      resolve();
    }
  });
};
//# sourceMappingURL=parser.js.map

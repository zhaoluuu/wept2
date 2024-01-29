'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var growl = require('growl');
var path = require('path');
var chalk = require('chalk');
var et = require('et-improve');
var fs = require('fs');
var glob = require('glob');
var Parallel = require('node-parallel');
var babel = require('babel-core');
var isWin = /^win/.test(process.platform);
var Concat = require('concat-with-sourcemaps');
var ni = require('os').networkInterfaces();

var BASE_DEVICE_WIDTH = 750;
var EPS = 0.0001;
var RPXRE = /%%\?[+-]?\d+(\.\d+)?rpx\?%%/g;

exports.globJSfiles = function () {
  return new _promise2.default(function (resolve, reject) {
    glob('**/*.js', {
      ignore: 'node_modules/**/*.js'
    }, function (err, files) {
      if (err) return reject(err);
      resolve(files);
    });
  });
};

exports.loadJSONfiles = function (pages) {
  var p = new Parallel();
  var res = {};
  return function (done) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      var _loop = function _loop() {
        var page = _step.value;

        var file = page + '.json';
        p.add(function (cb) {
          fs.stat(file, function (err, stat) {
            if (stat && stat.isFile()) {
              fs.readFile(file, 'utf8', function (err, content) {
                if (err) return cb();
                try {
                  res[page] = JSON.parse(content);
                } catch (e) {
                  return cb(new Error(file + ' JSON \u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5'));
                }
                cb();
              });
            } else {
              return cb();
            }
          });
        });
      };

      for (var _iterator = (0, _getIterator3.default)(pages), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        _loop();
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    p.done(function (err) {
      if (err) return done(err);
      done(null, res);
    });
  };
};

var id = 1;
exports.uid = function () {
  return id++;
};

exports.exists = function (p) {
  return new _promise2.default(function (resolve) {
    fs.stat(p, function (err, stats) {
      if (err) return resolve(false);
      if (stats.isFile()) {
        return resolve(true);
      }
      resolve(false);
    });
  });
};

exports.parseImports = function parseImports(res, file, cb) {
  fs.readFile(file, 'utf8', function (err, xml) {
    if (err) return cb(err);
    var re = /<(import|include)\s+[^>]+?>/g;
    var arr = [];
    var p = new Parallel();
    xml = xml.replace(/<!--[\s\S]*?-->/g, '');
    while ((arr = re.exec(xml)) !== null) {
      var ms = arr[0].match(/src="([^"]+)"/);
      if (ms && ms[1]) {
        (function () {
          var f = /^\//.test(ms[1]) ? ms[1].replace(/^\//, '') : path.join(path.dirname(file), ms[1]);
          f = /\.wxml/.test(f) ? f : f + '.wxml';
          if (res.indexOf(f) == -1) {
            res.push(f);
            p.add(function (done) {
              parseImports(res, f, done);
            });
          }
        })();
      }
    }
    p.done(cb);
  });
};

exports.parseCssImports = function parseCssImports(res, file, cb) {
  var re = /\s*@import\s+[^;]+?;/g;
  fs.readFile(file, 'utf8', function (err, content) {
    if (err) return cb(err);
    var arr = [];
    var p = new Parallel();
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    while ((arr = re.exec(content)) !== null) {
      var ms = arr[0].match(/(['"])([^\1]+)\1/);
      if (ms && ms[2]) {
        (function () {
          var f = /^\//.test(ms[2]) ? ms[2].replace(/^\//, '') : path.join(path.dirname(file), ms[2]);
          if (res.indexOf(f) == -1) {
            res.push(f);
            p.add(function (done) {
              parseCssImports(res, f, done);
            });
          }
        })();
      }
    }
    p.done(cb);
  });
};

exports.loadTemplate = function (name) {
  return new _promise2.default(function (resolve, reject) {
    fs.readFile(path.resolve(__dirname, '../template/' + name + '.html'), 'utf8', function (err, content) {
      if (err) return reject(err);
      try {
        resolve(et.compile(content));
      } catch (e) {
        console.error(e.stack);
        reject(e);
      }
    });
  });
};

exports.groupFiles = function (files, config) {
  var pages = config.pages.map(function (page) {
    return page + '.js';
  });
  var utils = [];
  var routes = [];
  files.forEach(function (file) {
    if (pages.indexOf(file) == -1 && file !== 'app.js') {
      utils.push(file);
    }
  });
  pages.forEach(function (page) {
    if (files.indexOf(page) == -1) {
      console.log(chalk.red(' \u2717 ' + page + ' not found'));
    } else {
      routes.push(page);
    }
  });
  return [utils, routes];
};

exports.normalizePath = function (p) {
  if (isWin) return p.replace(/\\/g, '/');
  return p;
};

exports.parseJavascript = function (config, full_path) {
  return new _promise2.default(function (resolve, reject) {
    var isModule = full_path != 'app.js' && config.pages.indexOf(full_path.replace(/\.js$/, '')) == -1;
    loadJavascript(full_path, config.babel, function (err, result) {
      if (err) return reject(err);
      var concat = new Concat(true, full_path, '\n');
      concat.add(null, 'define("' + full_path + '", function(require, module, exports){');
      concat.add(full_path, result.code, result.map);
      concat.add(null, '});' + (isModule ? '' : 'require("' + full_path + '")'));
      return resolve({
        code: concat.content,
        map: concat.sourceMap
      });
    });
  });
};

function loadJavascript(full_path, useBabel, cb) {
  if (useBabel) {
    babel.transformFile(full_path, {
      presets: ['babel-preset-es2015'].map(require.resolve),
      sourceMaps: true,
      sourceFileName: full_path,
      babelrc: false,
      ast: false,
      resolveModuleSource: false
    }, function (err, result) {
      if (err) return cb(err);
      cb(null, result);
    });
  } else {
    fs.readFile(full_path, 'utf8', function (err, content) {
      if (err) return cb(err);
      cb(null, {
        code: content,
        map: null
      });
    });
  }
}

exports.notifyError = function (err) {
  console.error(err.stack);
  var img = path.resolve(__dirname, '../public/images/error.png');
  growl(err.message, {
    image: img
  });
};

exports.getIp = function () {
  var ipAddress = [];
  for (var key in ni) {
    for (var index in ni[key]) {
      if (ni[key][index].family === 'IPv4' && !ni[key][index].internal) {
        ipAddress.push(ni[key][index].address);
      }
    }
  }
  if (ipAddress.length >= 1) {
    return ipAddress[0];
  } else {
    return '127.0.0.1';
  }
};

exports.parseCss = function (content, width, ratio) {
  var b;
  b = content.match(RPXRE);
  if (b) {
    b.forEach(function (c) {
      var d = getNumber(c, width, ratio);
      var e = d + "px";
      content = content.replace(c, e);
    });
  }
  return content;
};

function transformByDPR(a, width, dpr) {
  a = a / BASE_DEVICE_WIDTH * width;
  a = Math.floor(a + EPS);
  if (a === 0) {
    if (dpr === 1) {
      return 1;
    } else {
      return 0.5;
    }
  }
  return a;
}

function getNumber(e, width, ratio) {
  var g = 0;
  var d = 1;
  var a = false;
  var f = false;
  for (var b = 0; b < e.length; ++b) {
    var h = e[b];
    if (h >= "0" && h <= "9") {
      if (a) {
        d *= 0.1;
        g += (h - "0") * d;
      } else {
        g = g * 10 + (h - "0");
      }
    } else {
      if (h === ".") {
        a = true;
      } else {
        if (h === "-") {
          f = true;
        }
      }
    }
  }
  if (f) {
    g = -g;
  }
  return transformByDPR(g, width, ratio);
}
//# sourceMappingURL=util.js.map

'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Concat = require('concat-with-sourcemaps');
var chokidar = require('chokidar');
var chalk = require('chalk');
var cache = require('./cache');
var util = require('./util');
var loadConfig = require('./config');
var fs = require('fs');
var convert = require('convert-source-map');
var jsondiffpatch = require('jsondiffpatch').create({
  cloneDiffValues: false
});

var buildPromise = null;
var currConfig = JSON.parse(fs.readFileSync('./app.json', 'utf8'));

exports.load = function () {
  return new _promise2.default(function (resolve, reject) {
    if (buildPromise) {
      buildPromise.then(function (res) {
        resolve(res);
      }, reject);
    } else {
      build().then(resolve, reject);
    }
  });
};

var build = exports.build = function () {
  buildPromise = _promise2.default.all([loadConfig(), util.globJSfiles()]).then(function (res) {
    var config = res[0];
    var files = res[1].map(function (f) {
      return util.normalizePath(f);
    });
    var pages = config.pages;

    var _util$groupFiles = util.groupFiles(files, config),
        _util$groupFiles2 = (0, _slicedToArray3.default)(_util$groupFiles, 2),
        utils = _util$groupFiles2[0],
        routes = _util$groupFiles2[1];

    var paths = utils.concat('app.js', routes);
    return _promise2.default.all(paths.map(function (path) {
      return util.parseJavascript(config, path);
    })).then(function (arr) {
      var obj = paths.map(function (path, i) {
        return { path: path, code: arr[i].code, map: arr[i].map };
      });
      return concatFiles(obj, pages);
    });
  });
  return buildPromise;
};

chokidar.watch('app.json').on('change', function () {
  fs.readFile('./app.json', 'utf8', function (err, content) {
    if (err) {
      console.log(chalk.red(err.stack));
      util.notifyError(err);
      return;
    }
    var obj = void 0;
    try {
      obj = JSON.parse(content);
    } catch (e) {}
    if (!obj) return;
    var delta = jsondiffpatch.diff(currConfig, obj);
    if (!delta) return;
    currConfig = obj;
    if (delta.pages) {
      buildPromise = null;
      cache.del('codes');
      build().catch(function (err) {
        // exit on build error
        console.log(chalk.red(err.stack));
        util.notifyError(err);
        buildPromise = null;
      });
    }
  });
});

// rebuild server.js for specified file
exports.buildFile = function (file) {
  var codes = cache.get('codes');
  if (!codes) return build();
  buildPromise = loadConfig().then(function (config) {
    var pages = config.pages;
    var route = file.replace(/\.js$/, '');
    var isPage = pages.indexOf(route) !== -1;
    return util.parseJavascript(config, file).then(function (_ref) {
      var code = _ref.code,
          map = _ref.map;

      var exists = void 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(codes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var o = _step.value;

          if (o.path == file) {
            exists = true;
            o.code = code;
            o.map = map;
          }
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

      if (!exists) {
        if (isPage) {
          codes.push({ path: file, code: code, map: map });
        } else {
          codes.unshift({ path: file, code: code, map: map });
        }
      }
      var result = concatFiles(codes, pages);
      return result;
    }, function (err) {
      buildPromise = null;
      util.notifyError(err);
    });
  }, function (err) {
    buildPromise = null;
    util.notifyError(err);
  });
};

function concatFiles(obj, pages) {
  cache.set('codes', obj);
  var concat = new Concat(true, 'service.js', '\n');
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = (0, _getIterator3.default)(obj), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var item = _step2.value;


      var path = item.path;
      var route = path.replace(/\.js$/, '');
      var isPage = pages.indexOf(route) !== -1;
      if (!isPage) {
        concat.add(item.path, item.code, item.map);
      } else {
        concat.add(null, 'var __wxRoute = "' + route + '", __wxRouteBegin = true;');
        concat.add(item.path, item.code, item.map);
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  console.log(chalk.green(' ✓ service.js build success'));
  return concat.content + "\n" + convert.fromJSON(concat.sourceMap).toComment();
}
//# sourceMappingURL=builder.js.map

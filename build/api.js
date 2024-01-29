'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');
var path = require('path');
var Parallel = require('node-parallel');

var getFileList = exports.getFileList = function (dir) {
  //eslint-disable-line
  return new _promise2.default(function (resolve, reject) {
    fs.readdir(dir, function (err, files) {
      if (err) return reject(err);
      var p = new Parallel();
      var res = [];
      files.forEach(function (f) {
        var file = path.join(dir, f);
        p.add(function (done) {
          fs.stat(file, function (err, stats) {
            if (err) return done();
            if (stats.isFile()) {
              res.push({
                size: stats.size,
                filePath: file,
                createTime: Math.round(stats.ctime.getTime() / 1000)
              });
            }
            done();
          });
        });
      });
      p.done(function () {
        resolve(res);
      });
    });
  });
};

var getFileInfo = exports.getFileInfo = function (filePath) {
  //eslint-disable-line
  return new _promise2.default(function (resolve, reject) {
    fs.stat(filePath, function (err, stats) {
      if (err) return reject(err);
      if (!stats.isFile()) return reject(new Error('Not a file: ' + filePath));
      return resolve({
        size: stats.size,
        createTime: Math.round(stats.ctime.getTime() / 1000)
      });
    });
  });
};

var removeFile = exports.removeFile = function (filePath) {
  //eslint-disable-line
  return new _promise2.default(function (resolve, reject) {
    fs.unlink(filePath, function (err) {
      if (err) return reject(err);
      resolve(null);
    });
  });
};
//# sourceMappingURL=api.js.map

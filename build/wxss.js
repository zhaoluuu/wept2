'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');
var sourceMap = require('source-map');
var Parallel = require('node-parallel');
var convert = require('convert-source-map');

module.exports = function (file, content) {
  var generator = new sourceMap.SourceMapGenerator({
    file: file
  });
  var results = [];
  var files = [];
  content.split('\n').forEach(function (line, i) {
    var lnum = i + 1;
    line = line.replace(/;wxcs_style[^;]+;/g, '');
    line = line.replace(/;wxcs_fileinfo:\s([^\s]+)\s(\d+)\s(\d+);/, function (match, file, lineNum, colNum) {
      file = file.replace(/^\.?\//, '');
      if (files.indexOf(file) == -1) files.push(file);
      generator.addMapping({
        source: file,
        original: { line: Number(lineNum), column: Number(colNum) },
        generated: { line: lnum, column: 0 }
      });
      return '';
    });
    results.push(line);
  });

  return new _promise2.default(function (resolve, reject) {
    var p = new Parallel();
    files.forEach(function (path) {
      p.add(function (done) {
        fs.readFile('./' + path, 'utf8', function (err, content) {
          if (err) return done(err);
          generator.setSourceContent(path, content);
          done();
        });
      });
    });
    p.done(function (err) {
      if (err) return reject(err);
      var res = results.join('\n');
      res = res + convert.fromJSON(generator.toString()).toComment({
        multiline: true
      });
      resolve(res);
    });
  });
};
//# sourceMappingURL=wxss.js.map
